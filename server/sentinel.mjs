/**
 * Real Sentinel-1 GRD reader.
 *
 * Uses the public Earth Search STAC API + the public AWS Open Data
 * `sentinel-s1-l1c` Cloud-Optimized GeoTIFFs. Only a 512×512 window around each
 * study area is downloaded, so no Earthdata login and no multi-GB download.
 *
 * Values are relative amplitude dB (20·log10 of the GRD DN mean), not
 * calibrated σ⁰. The UI labels the source accordingly.
 */
import zlib from 'node:zlib';
import { fromUrl } from 'geotiff';
import {
  buildNisarBrowse,
  buildNisarSite,
  comparisonCrops,
  cropForWindow,
  nisarSnapshotCapabilities,
} from './nisar.mjs';

const STAC_URL = 'https://earth-search.aws.element84.com/v1/search';
const COLLECTION = 'sentinel-1-grd';
const WINDOW = 512;
const CACHE_TTL = 6 * 60 * 60 * 1000;
const cache = new Map();

/* ------------------------------------------------------------------ */
/* Georeferenced scene images                                          */
/* ------------------------------------------------------------------ */

// The before/after cards used to show each granule's own preview PNG. Those are
// the full acquisition footprint, so the same site landed at a different
// position and scale in the two frames — and the two passes can even come from
// different satellites. Instead each card is rendered here from the VV COG over
// one fixed lon/lat window, so both dates show the same ground.
const IMAGE_WIDTH = 560;
const IMAGE_HEIGHT = 370;
const IMAGE_LAT_SPAN = 0.14; // ~15.6 km tall window (~24 km wide at the frame aspect)
// Both dates of a pair share one greyscale scale (see renderPair), so
// brightness stays comparable instead of each frame being normalised alone.
const sceneRefs = new Map();
const imageCache = new Map();

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** 8-bit greyscale PNG — no image library needed on the serverless runtime. */
function pngGray(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 0; // colour type: greyscale
  const stride = width + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < width; x += 1) raw[y * stride + 1 + x] = pixels[y * width + x];
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Pixel window covering one lon/lat rectangle in a north-up STAC COG. Both
 * dates use the same rectangle, which is what makes the pair comparable.
 *
 * The rectangle is built once per pair from the first pass's pixel size and
 * read from both passes as a geographic bbox. Rounding each pass's window to
 * its own pixel grid shifted the second image by up to a pixel, and that shift
 * alone lit up every ridge and field edge in the change map.
 */
function rectForPair(refs) {
  const lonSpan = lonSpanForLat(refs.before.lat);
  return {
    west: refs.before.lng - lonSpan / 2,
    east: refs.before.lng + lonSpan / 2,
    south: refs.before.lat - IMAGE_LAT_SPAN / 2,
    north: refs.before.lat + IMAGE_LAT_SPAN / 2,
  };
}

// Width in degrees that gives the same ground scale as the height. Deriving it
// from the raster's degree-per-pixel aspect instead of cos(lat) made the crop
// ~22 km wide squeezed into 560 px, which shrank every field and channel to a
// few pixels and hid the very change the picture exists to show.
function lonSpanForLat(lat) {
  const cos = Math.cos((lat * Math.PI) / 180) || 1;
  return (IMAGE_LAT_SPAN * (IMAGE_WIDTH / IMAGE_HEIGHT)) / cos;
}

/** Integer pixel window for that rectangle, or null when it leaves the raster. */
function windowForRect(transform, shape, rect) {
  const [a, , c, , e, f] = transform;
  if (!a || !e) return null;
  const xs = [(rect.west - c) / a, (rect.east - c) / a];
  const ys = [(rect.north - f) / e, (rect.south - f) / e];
  const window = [
    Math.floor(Math.min(...xs)),
    Math.floor(Math.min(...ys)),
    Math.ceil(Math.max(...xs)),
    Math.ceil(Math.max(...ys)),
  ];
  if (
    window[0] < 0 ||
    window[1] < 0 ||
    window[2] > shape[1] ||
    window[3] > shape[0] ||
    window[2] - window[0] < 2 ||
    window[3] - window[1] < 2
  ) {
    return null;
  }
  return window;
}

/**
 * Render one pass over the fixed study window as a greyscale PNG.
 * @returns {Promise<Buffer|null>} null when no real pass is registered.
 */
// Single-look SAR pixels are dominated by speckle: without averaging, two
// repeats of the same unchanged ground still differ by several dB and swamp any
// real change. Averaging the linear power over a small box is the standard
// multilook fix; it costs resolution but makes structure and change legible.
function multilookDn(values, width, height, radius = 3) {
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y += 1) {
    let rowSum = 0;
    for (let x = 0; x < width; x += 1) {
      rowSum += Math.max(1, Number(values[y * width + x]) || 1);
      integral[(y + 1) * (width + 1) + (x + 1)] = integral[y * (width + 1) + (x + 1)] + rowSum;
    }
  }
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      const sum =
        integral[(y1 + 1) * (width + 1) + (x1 + 1)] -
        integral[y0 * (width + 1) + (x1 + 1)] -
        integral[(y1 + 1) * (width + 1) + x0] +
        integral[y0 * (width + 1) + x0];
      out[y * width + x] = sum / ((x1 - x0 + 1) * (y1 - y0 + 1));
    }
  }
  return out;
}

async function readWindowDb(ref, rect) {
  const window = windowForRect(ref.transform, ref.shape, rect);
  if (!window) return null;
  const tiff = await fromUrl(ref.href, { allowFullFile: false });
  const image = await tiff.getImage();
  const rasters = await image.readRasters({
    window,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    samples: [0],
    interleave: false,
  });
  const values = multilookDn(rasters[0], IMAGE_WIDTH, IMAGE_HEIGHT);
  const out = new Float32Array(IMAGE_WIDTH * IMAGE_HEIGHT);
  for (let i = 0; i < out.length; i += 1) out[i] = 20 * Math.log10(Math.max(1, values[i]));
  return out;
}

// Absolute change between the two passes over the same window: brighter means
// the surface returned a different amount of radar energy. This is the picture
// the eye cannot get from two near-identical greyscale frames.
const CHANGE_DB_SPAN = 8;
// Change below this is inside the pass-to-pass noise of the averaged pixels.
const CHANGE_DB_FLOOR = 2.5;

// One shared scale for both dates of a pair, taken from the pair's own 2–98%
// range. The fixed 32–52 dB scale left a tropical window at ~0.77 of full
// brightness with almost no contrast, which is why two genuinely different
// passes looked identical on screen. Sharing the scale keeps the comparison
// fair: a brighter pixel is a brighter surface on both sides.
function percentile(values, fraction) {
  const sorted = Float32Array.from(values).sort();
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round(fraction * (sorted.length - 1)))
  );
  return sorted[index];
}

function stretchPixels(db, lo, hi) {
  const span = Math.max(6, hi - lo);
  const pixels = new Uint8Array(db.length);
  for (let i = 0; i < pixels.length; i += 1) {
    pixels[i] = Math.max(0, Math.min(255, Math.round(((db[i] - lo) / span) * 255)));
  }
  return pixels;
}

async function renderPair(siteId) {
  const cached = imageCache.get(`${siteId}:pair`);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.value;
  const refs = sceneRefs.get(siteId);
  if (!refs?.before || !refs?.after) return null;

  const rect = rectForPair(refs);
  const [before, after] = await Promise.all([
    readWindowDb(refs.before, rect),
    readWindowDb(refs.after, rect),
  ]);
  if (!before || !after) return null;
  const combined = new Float32Array(before.length + after.length);
  combined.set(before, 0);
  combined.set(after, before.length);
  const lo = percentile(combined, 0.02);
  const hi = percentile(combined, 0.98);

  const change = new Uint8Array(before.length);
  for (let i = 0; i < change.length; i += 1) {
    const delta = Math.min(CHANGE_DB_SPAN, Math.abs(after[i] - before[i]));
    const shown = delta <= CHANGE_DB_FLOOR ? 0 : delta;
    change[i] = Math.max(0, Math.min(255, Math.round((shown / CHANGE_DB_SPAN) * 255)));
  }

  const value = {
    before: pngGray(IMAGE_WIDTH, IMAGE_HEIGHT, stretchPixels(before, lo, hi)),
    after: pngGray(IMAGE_WIDTH, IMAGE_HEIGHT, stretchPixels(after, lo, hi)),
    change: pngGray(IMAGE_WIDTH, IMAGE_HEIGHT, change),
  };
  imageCache.set(`${siteId}:pair`, { value, at: Date.now() });
  return value;
}

export async function renderSceneCrop(siteId, side) {
  const pair = await renderPair(siteId);
  if (!pair) return null;
  return side === 'after' ? pair.after : pair.before;
}

export async function renderChangeCrop(siteId) {
  const pair = await renderPair(siteId);
  return pair?.change ?? null;
}

/** Which real pass backs each card — set while a site is built. */
export function sceneRefFor(siteId, side) {
  return sceneRefs.get(siteId)?.[side] ?? null;
}
const DEBUG = process.env.DEBUG_REAL === '1';
const log = (...args) => {
  if (DEBUG) console.error('[real]', ...args);
};

const s3ToHttps = (href) => {
  if (!href) return null;
  if (href.startsWith('s3://')) {
    const [bucket, ...rest] = href.slice('s3://'.length).split('/');
    return `https://${bucket}.s3.amazonaws.com/${rest.join('/')}`;
  }
  return href;
};

// Relative amplitude dB against a 1000-DN full-scale reference. Not calibrated
// σ⁰, but keeps the values in the same negative-dB range the UI expects.
const toDb = (dn) => 20 * Math.log10(Math.max(1, dn) / 1000);

// A pixel counts as "dark" when it is at least this much darker than the pass
// median. Anchoring to the median keeps the number comparable between passes
// and immune to the speckle outliers that made min+25%·range swing the same
// site between 12% and 88%.
const DARK_DROP_DB = 3;

// Change is measured on a coarse grid after multilook. A 5 dB step is large
// enough to survive the pass-to-pass noise that remains even on the same
// satellite and orbit, and small enough to catch a burn scar or flood edge.
const GRID_SIZE = 64;
const CHANGE_DB = 5;

function stats(values) {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let sumSq = 0;
  let below = 0;
  for (let i = 0; i < values.length; i += 1) {
    const value = Number(values[i]);
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
    sum += value;
    sumSq += value * value;
  }
  const count = values.length || 1;
  const mean = sum / count;
  const variance = Math.max(0, sumSq / count - mean * mean);
  const std = Math.sqrt(variance);
  const finite = [];
  for (let i = 0; i < values.length; i += 1) {
    const value = Number(values[i]);
    if (Number.isFinite(value)) finite.push(value);
  }
  finite.sort((a, b) => a - b);
  const median = finite.length ? finite[Math.floor(finite.length / 2)] : 0;
  const threshold = median / 10 ** (DARK_DROP_DB / 20);
  for (let i = 0; i < finite.length; i += 1) if (finite[i] <= threshold) below += 1;
  return { min, max, mean, std, median, lowFraction: below / count };
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function searchStac({ bbox, start, end }) {
  const response = await fetch(STAC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      collections: [COLLECTION],
      bbox,
      datetime: `${start}T00:00:00Z/${end}T23:59:59Z`,
      limit: 200,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`STAC HTTP ${response.status}`);
  const payload = await response.json();
  return (payload.features || []).filter(
    (item) =>
      item.assets?.vv?.href &&
      item.assets?.vh?.href &&
      (item.properties?.['sar:polarizations'] || []).includes('VV')
  );
}

function pixelWindow(item, lat, lng) {
  const transform = item.properties?.['proj:transform'];
  const shape = item.properties?.['proj:shape'];
  if (!Array.isArray(transform) || !Array.isArray(shape)) return null;
  const [a, , c, , e, f] = transform;
  if (!a || !e) return null;
  const width = shape[1];
  const height = shape[0];
  const cx = (lng - c) / a;
  const cy = (lat - f) / e;
  const half = WINDOW / 2;
  const x0 = Math.max(0, Math.min(width - 2, Math.round(cx - half)));
  const y0 = Math.max(0, Math.min(height - 2, Math.round(cy - half)));
  const x1 = Math.max(x0 + 2, Math.min(width, x0 + WINDOW));
  const y1 = Math.max(y0 + 2, Math.min(height, y0 + WINDOW));
  return [x0, y0, x1, y1];
}

function gridDb(values, width, height) {
  const out = new Float32Array(GRID_SIZE * GRID_SIZE);
  const stepX = width / GRID_SIZE;
  const stepY = height / GRID_SIZE;
  for (let gy = 0; gy < GRID_SIZE; gy += 1) {
    const y0 = Math.floor(gy * stepY);
    const y1 = Math.floor((gy + 1) * stepY);
    for (let gx = 0; gx < GRID_SIZE; gx += 1) {
      const x0 = Math.floor(gx * stepX);
      const x1 = Math.floor((gx + 1) * stepX);
      let sum = 0;
      let count = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          sum += values[y * width + x];
          count += 1;
        }
      }
      out[gy * GRID_SIZE + gx] = toDb(sum / Math.max(1, count));
    }
  }
  return out;
}

function gridChange(a, b, threshold = CHANGE_DB) {
  if (!a || !b || a.length !== b.length) return 0;
  let changed = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (Math.abs(a[i] - b[i]) >= threshold) changed += 1;
  }
  return changed / a.length;
}

async function readBand(item, asset, lat, lng, { grid = false } = {}) {
  const href = s3ToHttps(item.assets?.[asset]?.href);
  if (!href) return null;
  const window = pixelWindow(item, lat, lng);
  if (!window) return null;
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const tiff = await fromUrl(href, { allowFullFile: false });
      const image = await tiff.getImage();
      const rasters = await image.readRasters({
        window,
        width: WINDOW,
        height: WINDOW,
        samples: [0],
        interleave: false,
      });
      const result = stats(rasters[0]);
      if (grid) {
        result.grid = gridDb(multilookDn(rasters[0], WINDOW, WINDOW), WINDOW, WINDOW);
      }
      return result;
    } catch (error) {
      lastError = error;
      log('band failed', asset, href, window, error?.message, error?.cause?.message);
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function findOptical({ bbox, point, targetDate, start, end }) {
  try {
    const response = await fetch(STAC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        collections: ['sentinel-2-l2a'],
        bbox,
        datetime: `${start}T00:00:00Z/${end}T23:59:59Z`,
        query: { 'eo:cloud_cover': { lt: 95 } },
        limit: 40,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const items = payload.features || [];
    if (!items.length) return null;
    const target = new Date(`${targetDate}T00:00:00Z`).getTime();
    // A neighbouring MGRS tile can intersect the study bbox without covering
    // its centre, which yields a picture of somewhere else. Keep the tiles
    // that actually contain the site when any of them exist.
    const covers = (item) =>
      !point || !Array.isArray(item.bbox)
        ? true
        : item.bbox[0] <= point.lng &&
          item.bbox[2] >= point.lng &&
          item.bbox[1] <= point.lat &&
          item.bbox[3] >= point.lat;
    const covering = items.filter(covers);
    const pool = covering.length ? covering : items;
    // Prefer the clearest pass near the radar date: a scene three days closer
    // but 90% clouded shows nothing. Cloud percent dominates, day distance
    // breaks ties.
    const score = (item) => {
      const cloud = Number(item.properties?.['eo:cloud_cover']);
      const days = Math.abs(new Date(item.properties.datetime).getTime() - target) / 86400000;
      return (Number.isFinite(cloud) ? cloud : 100) + 3 * days;
    };
    pool.sort((a, b) => score(a) - score(b));
    const item = pool[0];
    return {
      url: s3ToHttps(item.assets?.thumbnail?.href),
      date: (item.properties?.datetime || '').slice(0, 10),
      cloudCover: item.properties?.['eo:cloud_cover'] ?? null,
      platform: item.properties?.platform || 'Sentinel-2',
      itemId: item.id,
      bbox: item.bbox,
    };
  } catch {
    return null;
  }
}

function sceneFromBands(item, vv, vh = null) {
  const platform = item.properties?.platform || item.properties?.['sar:platform'] || 'Sentinel-1';
  const vvDb = toDb(vv.mean);
  const vhDb = vh ? toDb(vh.mean) : null;
  return {
    date: (item.properties?.datetime || '').slice(0, 10),
    datetime: item.properties?.datetime || null,
    vvDb,
    vhDb,
    // Note: this gap is only comparable between passes over the same window.
    // A coastal window (see the wildfire site, which is half open water) makes
    // it wind-sensitive — sea VV swings by several dB pull while VH stays low.
    crossDb: vh ? vhDb - vvDb : null,
    lowFraction: vv.lowFraction,
    stdDb: 20 * Math.log10(1 + vv.std / Math.max(1, vv.mean)),
    itemId: item.id,
    quicklook: s3ToHttps(item.assets?.thumbnail?.href),
    vvHref: s3ToHttps(item.assets?.vv?.href),
    // Georeferencing of the VV COG, kept so the scene image can be rendered
    // over the same lon/lat window for every pass.
    transform: item.properties?.['proj:transform'] ?? null,
    shape: item.properties?.['proj:shape'] ?? null,
    vhHref: s3ToHttps(item.assets?.vh?.href),
    platform,
    // Absolute dB only compares within one imaging geometry: ascending and
    // descending passes see the site from different look angles, and mixing
    // any of those — or two satellites — made the same site swing several dB
    // on the days after the event.
    orbit: `${platform}|${item.properties?.['sat:orbit_state'] || '?'}/${item.properties?.['sat:relative_orbit'] ?? '?'}`,
    grid: vv.grid,
  };
}

async function readScene(item, site, { vv: givenVv = null, vvOnly = false } = {}) {
  const lat = site.coords.lat;
  const lng = site.coords.lng;
  const vvPromise = givenVv ?? readBand(item, 'vv', lat, lng, { grid: true });
  if (vvOnly) {
    const vvOnlyBand = await vvPromise;
    if (!vvOnlyBand || vvOnlyBand.mean < 5) return null;
    return sceneFromBands(item, vvOnlyBand, null);
  }
  const [vv, vh] = await Promise.all([vvPromise, readBand(item, 'vh', lat, lng)]);
  // A window outside valid data reads as near-zero DN; reject it.
  if (!vv || vv.mean < 5 || !vh || vh.mean < 5) return null;
  return sceneFromBands(item, vv, vh);
}

function bboxFromWkt(wkt) {
  const match = String(wkt || '').match(/POLYGON\s*\(\((.*)\)\)/i);
  if (!match) return null;
  const pairs = match[1]
    .split(',')
    .map((pair) => pair.trim().split(/\s+/).map(Number))
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 3) return null;
  const lngs = pairs.map(([x]) => x);
  const lats = pairs.map(([, y]) => y);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

function sampleEvenly(list, count) {
  if (!list.length || count <= 0) return [];
  if (list.length <= count) return [...list];
  return Array.from({ length: count }, (_, index) => {
    const pos = Math.round((index / Math.max(1, count - 1)) * (list.length - 1));
    return list[pos];
  }).filter((item, index, array) => array.indexOf(item) === index);
}

// A recovery curve needs several post-event passes spread over months, so the
// sampler keeps more of them than the eight that were enough for a before/after
// pair. Sampling evenly over both sides keeps the spread without reading 80 COGs.
function pickScenes(items, eventDate, max = 16) {
  const sorted = [...items].sort(
    (a, b) => new Date(a.properties.datetime) - new Date(b.properties.datetime)
  );
  if (sorted.length <= max) return sorted;
  const time = (item) => new Date(item.properties.datetime).getTime();
  const event = new Date(`${eventDate}T00:00:00Z`).getTime();
  const before = sorted.filter((item) => time(item) <= event);
  const after = sorted.filter((item) => time(item) > event);
  // Evening out the sample alone dropped the flood peak and the first burn pass,
  // which are the two frames the whole story is about. Anchor the closest pass
  // on each side of the event, then spread the rest across the window.
  const anchors = [];
  if (before.length) anchors.push(before[before.length - 1]);
  if (after.length) anchors.push(after[0]);
  const budget = Math.max(0, max - anchors.length);
  const pool = sorted.filter((item) => !anchors.includes(item));
  const sampled = sampleEvenly(pool, budget);
  return [...anchors, ...sampled]
    .filter((item, index, array) => array.indexOf(item) === index)
    .sort((a, b) => time(a) - time(b));
}

const clamp01 = (value) => Math.max(0, Math.min(1, value));

function resample16(values) {
  if (!values.length) return Array(16).fill(0);
  return Array.from({ length: 16 }, (_, i) => {
    const pos = (i / 15) * (values.length - 1);
    const low = Math.floor(pos);
    const high = Math.min(values.length - 1, low + 1);
    const mix = pos - low;
    return clamp01(values[low] * (1 - mix) + values[high] * mix);
  });
}

/**
 * Point the before/after cards at the NISAR browse crop without changing the
 * numeric provenance. On the calibrated path the dates stay those of the GCOV
 * scenes; a browse crop is attached only when it comes from the same granule.
 */
function attachNisarCards(states, site, browse, { calibrated = false } = {}) {
  if (!browse) return;
  for (const side of ['before', 'after']) {
    const nisar = browse[side];
    if (!nisar?.imageUrl) continue;
    const expected = calibrated ? states[side]?.nisarGranule : null;
    if (expected && nisar.granuleName !== expected) continue;
    Object.assign(states[side], {
      sentinelImageUrl: states[side].imageUrl,
      sentinelDate: states[side].date,
      ...(calibrated ? {} : { date: (nisar.datetime || states[side].date || '').slice(0, 10) }),
      imageUrl: `/api/scene-image?site=${site.id}&side=${side}&source=nisar&v=20261116b`,
      attribution: 'NASA NISAR L-band GCOV (HH) browse image — ASF DAAC.',
      ...(calibrated ? {} : { acquiredAt: nisar.datetime }),
      product: nisar.product,
      notSimulated: true,
      nisarImageUrl: nisar.imageUrl,
      nisarCrop: nisar.crop ?? null,
      nisarDate: nisar.date,
      nisarAttribution: 'NASA NISAR L-band GCOV (HH) browse image — ASF DAAC.',
      nisarAcquiredAt: nisar.datetime,
      nisarProduct: nisar.product,
      nisarGranule: nisar.granuleName,
    });
  }
}

/** Explicit per-panel provenance: which sensor feeds the images vs the numbers. */
function buildProvenance(site, states, nisarBrowse) {
  const gcovOn = process.env.NISAR_GCOV === '1';
  // A precomputed GCOV snapshot makes the stats/RGB controls usable even when
  // the Harmony queue is unavailable, so gate the UI on real data, not the env.
  const caps = nisarSnapshotCapabilities(site.id);
  const rgbAvailable = gcovOn && (caps.rgb.after || caps.rgb.before);
  return {
    cards: nisarBrowse
      ? {
          sensor: 'NISAR',
          mission: 'NASA / ISRO',
          band: 'L',
          polarizations: ['HH'],
          product: 'GCOV HH browse (PNG)',
          calibrated: false,
          rgbComposite: rgbAvailable,
          rgbSides: caps.rgb,
          changeStats: gcovOn && caps.changeStats,
          calibrationSnapshot: caps.computedAt,
          granules: {
            before: states.before?.nisarGranule ?? null,
            after: states.after?.nisarGranule ?? null,
          },
        }
      : {
          sensor: 'Sentinel-1',
          mission: 'ESA / Copernicus',
          band: 'C',
          polarizations: ['VV'],
          product: 'GRD quicklook (PNG)',
          calibrated: false,
          rgbComposite: false,
          changeStats: false,
          granules: { before: null, after: null },
        },
    numbers: {
      sensor: 'Sentinel-1',
      mission: 'ESA / Copernicus',
      band: 'C',
      polarizations: ['VV', 'VH'],
      product: 'GRD (AWS COG subset)',
      unit: 'relative_amplitude_db',
      calibration: '20·log10(DN / 1000) — relative amplitude, not calibrated σ⁰',
      calibrated: false,
      source: 'sentinel-1-cog-relative-db',
    },
  };
}

export async function buildRealSite(site, { start, end, eventDate }) {
  const key = site.id;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.value;
  if (cached?.promise) return cached.promise;

  const promise = (async () => {
    const bbox = site.bbox || bboxFromWkt(site.wkt);
    if (!bbox) return null;

    // Real NISAR L-band browse images (public, no Harmony queue). The
    // calibrated HH/HV numbers come from the Harmony path when enabled.
    const nisarBrowse = await buildNisarBrowse(site, { start, end, eventDate }).catch((error) => {
      log(site.id, 'nisar browse failed', error?.message);
      return null;
    });
    // The calibrated path is slower (Harmony queue + subsets). Cap it so a
    // stuck job cannot eat the whole invocation; the browse/Sentinel record is
    // still served and provenance says calibrated:false.
    const budget = Number(process.env.NISAR_GCOV_BUDGET_MS || 15000);
    const nisarCalibrated =
      process.env.NISAR_GCOV === '1'
        ? await Promise.race([
            buildNisarSite(site, { start, end, eventDate }).catch((error) => {
              log(site.id, 'nisar gcov failed', error?.message);
              return null;
            }),
            new Promise((resolve) => setTimeout(() => resolve(null), budget)),
          ])
        : null;
    if (nisarCalibrated) {
      const afterDate = nisarCalibrated.states.after.date;
      const optical = await findOptical({
        bbox,
        point: site.coords,
        targetDate: afterDate,
        start: new Date(new Date(`${afterDate}T00:00:00Z`).getTime() - 20 * 86400000)
          .toISOString()
          .slice(0, 10),
        end: new Date(new Date(`${afterDate}T00:00:00Z`).getTime() + 20 * 86400000)
          .toISOString()
          .slice(0, 10),
      });
      if (optical?.url) {
        Object.assign(nisarCalibrated.states.after, {
          opticalUrl: optical.url,
          opticalDate: optical.date,
          opticalCloudCover: optical.cloudCover,
          opticalPlatform: optical.platform,
          opticalAttribution:
            'Contains modified Copernicus Sentinel-2 data, processed by ESA — AWS Open Data quicklook.',
        });
      }
      attachNisarCards(nisarCalibrated.states, site, nisarBrowse, { calibrated: true });
      return { ...nisarCalibrated, seriesSource: 'nisar-gcov-l-band' };
    }

    // Query both sides of the event so the series always has a real baseline.
    const [pre, post] = await Promise.all([
      searchStac({ bbox, start, end: eventDate }),
      searchStac({ bbox, start: eventDate, end }),
    ]);
    const seenIds = new Set();
    // A granule that only clips the corner of the search box still comes back
    // from STAC. Its pixel window then clamps to the scene edge, so the "same"
    // site is read somewhere else entirely — keep only passes that contain a
    // full study window around the point. Testing the raster extent rather than
    // the coarse STAC bbox matters at swath edges: the 175 orbit over Attica is
    // valid at the site even though its bbox stops ~0.08° short in longitude.
    const coversWindow = (item) => {
      const transform = item.properties?.['proj:transform'];
      const shape = item.properties?.['proj:shape'];
      if (!Array.isArray(transform) || !Array.isArray(shape)) return false;
      const [a, , c, , e, f] = transform;
      if (!a || !e) return false;
      // The pass must contain the whole 6.7 km display window, not just the
      // study point: a clamped crop would silently read different ground on
      // one of the two dates.
      const lonSpan = lonSpanForLat(site.coords.lat);
      return Boolean(
        windowForRect(transform, shape, {
          west: site.coords.lng - lonSpan / 2,
          east: site.coords.lng + lonSpan / 2,
          south: site.coords.lat - IMAGE_LAT_SPAN / 2,
          north: site.coords.lat + IMAGE_LAT_SPAN / 2,
        })
      );
    };
    const items = [...pre, ...post].filter((item) => {
      if (seenIds.has(item.id)) return false;
      if (!coversWindow(item)) return false;
      seenIds.add(item.id);
      return true;
    });
    log(site.id, 'bbox', bbox, 'items', items.length, 'pre', pre.length, 'post', post.length);
    if (!items.length) return null;

    // The same orbit sometimes publishes two granules on one date: one covers
    // the site, the other is all zeros at this window. Keep the granule whose
    // bbox gives the point the most margin; otherwise the zero granule can
    // become the "baseline" and hide the event.
    const groupKeyOf = (item) =>
      `${item.properties?.platform || 'Sentinel-1'}|${item.properties?.['sat:orbit_state'] || '?'}|${item.properties?.['sat:relative_orbit'] ?? '?'}`;
    const byDate = new Map();
    for (const item of items) {
      const date = (item.properties?.datetime || '').slice(0, 10);
      const box = item.bbox;
      const margin =
        Array.isArray(box) && box.length === 4
          ? Math.min(
              site.coords.lng - box[0],
              box[2] - site.coords.lng,
              site.coords.lat - box[1],
              box[3] - site.coords.lat
            )
          : -1;
      const key = `${groupKeyOf(item)}|${date}`;
      const previous = byDate.get(key);
      if (!previous || margin > previous.margin) byDate.set(key, { item, margin });
    }
    const datedItems = [...byDate.values()].map((entry) => entry.item);
    log(site.id, 'dated items', datedItems.length);

    const eventMs = new Date(`${eventDate}T00:00:00Z`).getTime();
    const dayMs = 86400000;
    const timeOf = (item) => new Date(item.properties.datetime).getTime();
    // Two satellites now fly the same relative orbit a few days apart. Their
    // absolute dB levels are not interchangeable, so a comparable time series
    // must stay on one satellite AND one orbit. Mixing Sentinel-1C and -1D here
    // was the source of the fake "change" and the missing recovery curve.
    const byGroup = new Map();
    for (const item of datedItems) {
      const key = groupKeyOf(item);
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(item);
    }
    const groups = [...byGroup.entries()]
      .map(([key, list]) => {
        const sorted = [...list].sort((a, b) => timeOf(a) - timeOf(b));
        const pre = sorted.filter((item) => timeOf(item) <= eventMs);
        const post = sorted.filter((item) => timeOf(item) > eventMs);
        return { key, sorted, pre, post };
      })
      .filter((group) => group.pre.length && group.post.length);
    log(site.id, 'group list', groups.map((group) => `${group.key}:${group.sorted.length}`).join(' '));
    if (!groups.length) return null;

    // Probe a handful of passes per group (two pre, the first post) and score
    // each group by how far its event pair rises above the group's own
    // pass-to-pass noise. This is per-pixel change detection on a 64×64 grid,
    // not a window-mean brightness step: a 20% flood or burn scar barely moves
    // the mean but is obvious block by block.
    // Probe the strongest groups with two passes each: the last pre-event pass
    // and the first post-event pass. The group with the largest same-satellite
    // change wins; its own pre-event passes then supply the noise estimate.
    const probeCache = new Map();
    const probes = [];
    const candidateGroups = [...groups]
      .sort((a, b) => b.sorted.length - a.sorted.length)
      .slice(0, 5);
    for (const group of candidateGroups) {
      const near = group.post.filter((item) => (timeOf(item) - eventMs) / dayMs <= 14);
      const eventItem = (near.length ? near : group.post)[0];
      const probeItems = [group.pre[group.pre.length - 1], eventItem];
      const uniqueProbe = probeItems.filter(
        (item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index
      );
      const probeScenes = (
        await mapLimit(uniqueProbe, 2, async (item) => {
          try {
            const vv = await readBand(item, 'vv', site.coords.lat, site.coords.lng, { grid: true });
            if (!vv || vv.mean < 5) return null;
            probeCache.set(item.id, vv);
            return sceneFromBands(item, vv, null);
          } catch (error) {
            log(site.id, 'probe failed', item.id, error?.message);
            return null;
          }
        })
      ).filter(Boolean);
      const baseline = probeScenes.find(
        (scene) => scene.itemId === group.pre[group.pre.length - 1].id
      );
      const event = probeScenes.find((scene) => scene.itemId === eventItem.id);
      if (!baseline?.grid || !event?.grid) continue;
      const eventChange = gridChange(event.grid, baseline.grid);
      probes.push({
        group,
        baseline,
        event,
        eventItem,
        eventChange,
        baselineVv: baseline.vvDb,
      });
      log(
        site.id,
        'probe',
        group.key,
        'baselineVv',
        baseline.vvDb.toFixed(1),
        'change',
        (eventChange * 100).toFixed(1) + '%'
      );
    }
    if (!probes.length) return null;

    // Reject a broken granule, not a different imaging geometry. Ascending and
    // descending passes read the same ground several dB apart by design, so a
    // tight band around the median dropped the good orbit and left the weakest
    // one. Only a radiometric outlier (off-swath or clipped DN) and a
    // near-total "change" (a fault, not an event) are thrown out here.
    const levels = probes.map((probe) => probe.baselineVv).sort((a, b) => a - b);
    const medianLevel = levels[Math.floor(levels.length / 2)];
    const sane = probes.filter(
      (probe) => Math.abs(probe.baselineVv - medianLevel) <= 15 && probe.eventChange <= 0.9
    );
    const best = [...(sane.length ? sane : probes)].sort(
      (a, b) => b.eventChange - a.eventChange || b.group.sorted.length - a.group.sorted.length
    )[0];
    const chosen = best.group;
    log(
      site.id,
      'groups',
      groups.length,
      'chosen',
      chosen.key,
      'eventChange',
      (best.eventChange * 100).toFixed(1) + '%',
      'passes',
      chosen.sorted.length
    );

    const picked = pickScenes(chosen.sorted, eventDate, 10);
    const scenes = (
      await mapLimit(picked, 4, (item) =>
        readScene(item, site, { vv: probeCache.get(item.id) }).catch((error) => {
          log(site.id, 'scene failed', item.id, error?.message, error?.stack?.split('\n')[1]);
          return null;
        })
      )
    ).filter(Boolean);
    log(site.id, 'picked', picked.length, 'scenes', scenes.length);
    if (scenes.length < 2) return null;
    const unique = [];
    for (const scene of scenes) {
      if (!unique.some((item) => item.date === scene.date)) unique.push(scene);
    }
    // A broken window — off-swath, masked, or clipped at the noise floor — reads
    // as almost identical VV and VH. Real land, water and burn scars always keep
    // VH several dB below VV at C-band, so a gap that closes up is a data fault,
    // not a change. This drops those passes without hiding genuine flood or burn
    // signals, which is what a plain brightness outlier test did.
    const healthy = unique.filter(
      (scene) => scene.vhDb != null && scene.vvDb != null && scene.vhDb - scene.vvDb <= -4
    );
    let samples = healthy.length >= 2 ? healthy : unique;
    // Drop a single radiometric outlier (a clipped edge or calibration fault)
    // that sits >15 dB off the group's own median. Real flood water can darken
    // the window, but not by this much across the whole 5 km footprint.
    const vvLevels = samples.map((scene) => scene.vvDb).sort((a, b) => a - b);
    const vvMedian = vvLevels[Math.floor(vvLevels.length / 2)];
    const radiometric = samples.filter((scene) => Math.abs(scene.vvDb - vvMedian) <= 15);
    if (radiometric.length >= 2) samples = radiometric;
    log(site.id, 'dropped passes', unique.length - samples.length, 'of', unique.length);

    const before = samples.filter((scene) => new Date(`${scene.date}T00:00:00Z`).getTime() <= eventMs);
    const after = samples.filter((scene) => new Date(`${scene.date}T00:00:00Z`).getTime() > eventMs);
    const beforeScene = before[before.length - 1] || samples[0];
    // The event frame is the first post-event pass inside the 14-day probe
    // window (the one that made this group win), not an arbitrary "settled"
    // pass five days later: by then a flood has usually receded.
    const afterScene =
      after.find((scene) => scene.itemId === best.eventItem.id) ||
      after[0] ||
      samples[samples.length - 1];

    const baselineVv = beforeScene.vvDb;
    const baselineVh = beforeScene.vhDb;
    const eventVv = afterScene.vvDb;
    const eventStep = baselineVv - eventVv;
    const spread =
      Math.max(...samples.map((scene) => scene.vvDb)) -
      Math.min(...samples.map((scene) => scene.vvDb));
    const beforeGrid = beforeScene.grid;
    const eventChange =
      beforeGrid && afterScene.grid ? gridChange(afterScene.grid, beforeGrid) : best.eventChange;
    // Use the quietest of the two pre-event passes as the noise floor: one bad
    // earlier pass should not disqualify an otherwise clean event pair.
    const earlierPre = before.slice(-3, -1).filter((scene) => scene.grid);
    const noiseCandidates =
      beforeGrid && earlierPre.length
        ? earlierPre.map((scene) => gridChange(scene.grid, beforeGrid))
        : [];
    const preNoise = noiseCandidates.length ? Math.min(...noiseCandidates) : 0.1;
    const gapDays = Math.max(
      0,
      Math.round((new Date(`${afterScene.date}T00:00:00Z`).getTime() - eventMs) / dayMs)
    );
    const recoveryDenominator = Math.max(0.01, eventChange - preNoise);
    const recoveryFit =
      after.length >= 2 && eventChange >= 0.15 && eventChange - preNoise >= 0.05;

    const series = samples.map((scene) => ({
      date: scene.date,
      vv: Number(scene.vvDb.toFixed(1)),
      vh: Number(scene.vhDb.toFixed(1)),
      ...(site.kind === 'wetland'
        ? { water: Number(scene.lowFraction.toFixed(2)) }
        : { burn: Number(scene.lowFraction.toFixed(2)) }),
      change: Number(clamp01(Math.abs(scene.vvDb - baselineVv) / 12).toFixed(2)),
    }));

    const recoveryPoints = recoveryFit
      ? after.map((scene) => {
          const days = Math.max(
            0,
            (new Date(`${scene.date}T00:00:00Z`).getTime() - eventMs) / dayMs
          );
          const change =
            beforeGrid && scene.grid ? gridChange(scene.grid, beforeGrid) : eventChange;
          const pct = clamp01((eventChange - change) / recoveryDenominator) * 100;
          return {
            day: Math.round(days),
            month: Number((days / 30.44).toFixed(2)),
            pct: Math.round(pct),
            projected: false,
          };
        })
      : [];
    // Ensure strictly increasing time. Fractional months keep short floods and
    // burns from collapsing onto a single "month 0" point.
    const recovery = recoveryPoints.filter(
      (point, index, list) => index === 0 || point.month > list[index - 1].month
    );

    const optical = await findOptical({
      bbox,
      point: site.coords,
      targetDate: afterScene.date,
      start: new Date(new Date(`${afterScene.date}T00:00:00Z`).getTime() - 20 * 86400000)
        .toISOString()
        .slice(0, 10),
      end: new Date(new Date(`${afterScene.date}T00:00:00Z`).getTime() + 20 * 86400000)
        .toISOString()
        .slice(0, 10),
    });

    // Crop both comparison images to one geographic window around the site, so
    // the slider really shows the same place on both sides. Each NISAR pass has
    // its own footprint, so the window is mapped onto each browse separately.
    const anchor = nisarBrowse?.after?.quad ? nisarBrowse.after : nisarBrowse?.before ?? null;
    if (anchor?.quad && optical?.bbox) {
      const crops = comparisonCrops(site, { quad: anchor.quad, imageBbox: optical.bbox });
      if (crops) {
        optical.crop = crops.opticalCrop;
        for (const side of ['before', 'after']) {
          const nisar = nisarBrowse?.[side];
          if (!nisar) continue;
          const crop = cropForWindow(nisar.quad, crops.window);
          if (!crop) continue;
          nisar.crop = crop;
          nisar.imageUrl = nisar.latlonUrl || nisar.imageUrl;
        }
      }
    }
    // Without a cloud-free optical tile there is still a georeferenced NISAR
    // quad, so crop each pass to the study window on its own.
    for (const side of ['before', 'after']) {
      const nisar = nisarBrowse?.[side];
      if (!nisar?.quad || nisar.crop) continue;
      const own = comparisonCrops(site, { quad: nisar.quad, imageBbox: null });
      if (own?.crop) {
        nisar.crop = own.crop;
        nisar.imageUrl = nisar.latlonUrl || nisar.imageUrl;
      }
    }

    const changes = series.map((point) => point.change);
    const stableChanges = changes.slice(0, Math.max(2, Math.floor(changes.length / 2)));

    // Register the real passes behind the two comparison frames.
    sceneRefs.set(site.id, {
      before: beforeScene.transform && beforeScene.shape && beforeScene.vvHref
        ? { href: beforeScene.vvHref, transform: beforeScene.transform, shape: beforeScene.shape, lat: site.coords.lat, lng: site.coords.lng }
        : null,
      after: afterScene.transform && afterScene.shape && afterScene.vvHref
        ? { href: afterScene.vvHref, transform: afterScene.transform, shape: afterScene.shape, lat: site.coords.lat, lng: site.coords.lng }
        : null,
    });
    imageCache.delete(`${site.id}:pair`);
    imageCache.delete(`${site.id}:before`);
    imageCache.delete(`${site.id}:after`);
    imageCache.delete(`${site.id}:change`);

    const states = {
      before: {
        date: beforeScene.date,
        params: { ...site.states.before.params },
        imageUrl: `/api/scene-image?site=${site.id}&side=before`,
        attribution:
          'Contains modified Copernicus Sentinel-1 data, processed by ESA — AWS Open Data COG, VV cropped to the study window.',
        acquiredAt: beforeScene.datetime,
        product: 'Sentinel-1 GRD',
        notSimulated: true,
      },
      after: {
        date: afterScene.date,
        params: { ...site.states.after.params },
        imageUrl: `/api/scene-image?site=${site.id}&side=after`,
        attribution:
          'Contains modified Copernicus Sentinel-1 data, processed by ESA — AWS Open Data COG, VV cropped to the study window.',
        acquiredAt: afterScene.datetime,
        product: 'Sentinel-1 GRD',
        notSimulated: true,
        ...(optical?.url
          ? {
              opticalUrl: optical.url,
              opticalDate: optical.date,
              opticalCloudCover: optical.cloudCover,
              opticalPlatform: optical.platform,
              opticalCrop: optical.crop ?? null,
              opticalAttribution:
                'Contains modified Copernicus Sentinel-2 data, processed by ESA — AWS Open Data quicklook.',
            }
          : {}),
      },
    };

    attachNisarCards(states, site, nisarBrowse);

    return {
      id: site.id,
      source: nisarBrowse ? 'nisar-l-band-browse' : 'sentinel-1-cog',
      updatedAt: new Date().toISOString(),
      coords: site.coords,
      wkt: site.wkt,
      states,
      measurements: {
        vv: { before: Number(beforeScene.vvDb.toFixed(1)), after: Number(afterScene.vvDb.toFixed(1)) },
        vh: { before: Number(beforeScene.vhDb.toFixed(1)), after: Number(afterScene.vhDb.toFixed(1)) },
        crossPol: {
          before: Number(beforeScene.crossDb.toFixed(1)),
          after: Number(afterScene.crossDb.toFixed(1)),
        },
        dateBefore: beforeScene.date,
        dateAfter: afterScene.date,
        source: 'sentinel-1-cog-relative-db',
      },
      provenance: buildProvenance(site, states, nisarBrowse),
      series,
      pulse: resample16(changes),
      stablePulse: resample16(stableChanges),
      // Never emit a curve whose event change is not larger than the window's
      // own pre-event pass-to-pass noise: that curve is noise wearing a trend
      // line. The percentages are the share of the 5 km window that changed by
      // at least 5 dB, measured on same-satellite, same-orbit passes.
      recovery:
        recoveryFit && recovery.length >= 2
          ? {
              thresholdDefault: 80,
              points: recovery,
              eventStep: Number(eventStep.toFixed(1)),
              eventChange: Math.round(eventChange * 100),
              noise: Math.round(preNoise * 100),
              gapDays,
            }
          : {
              thresholdDefault: 80,
              insufficient: true,
              eventStep: Number(eventStep.toFixed(1)),
              scatter: Number(spread.toFixed(1)),
              eventChange: Math.round(eventChange * 100),
              noise: Math.round(preNoise * 100),
              gapDays,
              noPeakPass: site.kind === 'wetland' && gapDays > 2,
            },
      _meta: {
        scenes: scenes.length,
        window: `${WINDOW}×${WINDOW}`,
        note: 'Relative amplitude dB from GRD DN; not calibrated σ⁰.',
      },
    };
  })();

  cache.set(key, { at: Date.now(), promise });
  try {
    const value = await promise;
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch (error) {
    log(site.id, 'build failed', error?.message);
    cache.delete(key);
    return null;
  }
}

export function clearRealCache() {
  cache.clear();
}
