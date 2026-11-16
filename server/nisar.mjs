/**
 * Real NISAR L-band GCOV reader.
 *
 * Pipeline:
 *   1. ASF Search API finds NISAR GCOV granules over the study area.
 *   2. Harmony extracts the HHHH/HVHV layers for a small bounding box as GeoTIFFs
 *      (typically ~5–10 MB instead of a ~1.7 GB HDF5 granule).
 *   3. The GeoTIFFs are read with the same `geotiff` package used by the UI.
 *
 * Values are gamma-0 power. We report 10·log10(mean power) in dB, which is the
 * calibrated backscatter convention for GCOV diagonal terms.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { fromArrayBuffer } from 'geotiff';
import { sundarbansSnapshot } from './cache/nisar/sundarbans.mjs';
import { caldorSnapshot } from './cache/nisar/caldor.mjs';
import { sundarbansRgbBase64 } from './cache/nisar/sundarbans-rgb.mjs';
import { caldorRgbBase64 } from './cache/nisar/caldor-rgb.mjs';
import { sundarbansHhBase64 } from './cache/nisar/sundarbans-hh.mjs';
import { caldorHhBase64 } from './cache/nisar/caldor-hh.mjs';

const ASF_SEARCH = 'https://api.daac.asf.alaska.edu/services/search/param';
const HARMONY = 'https://harmony.earthdata.nasa.gov';
const VALIDATED = 'C3622241360-ASF';
const PROVISIONAL = 'C2854338529-ASF';
// Only /tmp is writable on Vercel and most serverless runtimes.
const CACHE_DIR = path.join(os.tmpdir(), 'nisar');
const CACHE_TTL = 6 * 60 * 60 * 1000;
const DEBUG = process.env.DEBUG_REAL === '1';
// Harmony's NISAR extraction can queue indefinitely. Public requests must never
// wait on it: 12 s, then fall back to browse + Sentinel.
const HARMONY_TIMEOUT = Number(process.env.HARMONY_TIMEOUT_SECONDS || 12);
const log = (...args) => {
  if (DEBUG) console.error('[nisar]', ...args);
};

const cache = new Map();
const clamp01 = (value) => Math.max(0, Math.min(1, value));

/**
 * A ~5.5 km window around the study point. Calibrated Harmony subsets are
 * computed for this window instead of the full site bbox: gamma-0 arrays for a
 * 27×22 km box are ~6 M pixels per polarisation and push Harmony past the
 * serverless time budget, while the cards and the Sentinel series describe the
 * 5 km window anyway.
 */
export function calibrationWindow(site) {
  const lat = Number(site?.coords?.lat);
  const lng = Number(site?.coords?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const dLat = 0.025;
  const dLng = 0.025 / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  return [lng - dLng, lat - dLat, lng + dLng, lat + dLat];
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

async function asfSearch({ wkt, start, end }) {
  const url = new URL(ASF_SEARCH);
  url.searchParams.set('dataset', 'NISAR');
  url.searchParams.set('processingLevel', 'GCOV');
  url.searchParams.set('intersectsWith', wkt);
  url.searchParams.set('start', `${start}T00:00:00Z`);
  url.searchParams.set('end', `${end}T23:59:59Z`);
  url.searchParams.set('output', 'json');
  url.searchParams.set('maxResults', '100');
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`ASF HTTP ${response.status}`);
  const payload = await response.json();
  return (Array.isArray(payload) ? payload.flat() : []).filter((item) => item?.granuleName);
}

function collectionId(granule) {
  return /NISAR_L2_GCOV_V1/i.test(granule.downloadUrl || '') ? VALIDATED : PROVISIONAL;
}

function browseUrl(granule) {
  const urls = Array.isArray(granule.browse) ? granule.browse : [];
  return (
    urls.find((url) => /NATIVE_A_HHHH\.png$/i.test(url)) ||
    urls.find((url) => /NATIVE\.png$/i.test(url)) ||
    urls.find((url) => /LATLON\.png$/i.test(url)) ||
    null
  );
}

/** The north-up preview: its pixels sit on a regular lat/lon (Mercator) grid. */
function latlonUrl(granule) {
  const urls = Array.isArray(granule.browse) ? granule.browse : [];
  return urls.find((url) => /LATLON\.png$/i.test(url)) || null;
}

const MERC = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const FROM_RADIANS = 180 / Math.PI;
const mercSpan = (south, north) => (MERC(north) - MERC(south)) * FROM_RADIANS;

/**
 * The LATLON preview is drawn on a north-up lat/lon canvas that spans the
 * granule footprint, so the footprint's bounding box is the georeferencing
 * quad when the KML is out of reach. Without a token this is the only way to
 * crop the browse to the study window instead of showing the whole swath.
 */
function footprintBox(granule) {
  const pairs = [...String(granule?.stringFootprint || '').matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)]
    .map((match) => [Number(match[1]), Number(match[2])])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
  if (pairs.length < 3) return null;
  const lngs = pairs.map(([lng]) => lng);
  const lats = pairs.map(([, lat]) => lat);
  return {
    west: Math.min(...lngs),
    east: Math.max(...lngs),
    south: Math.min(...lats),
    north: Math.max(...lats),
  };
}

/**
 * Every NISAR product ships a `_LATLON.kml` whose GroundOverlay pins the
 * browse PNG to a lat/lon quad. That is the georeferencing ASF does not
 * publish next to the image itself, and it needs an Earthdata token — so the
 * footprint box stands in whenever the KML cannot be read.
 */
async function browseQuad(granule) {
  const token = process.env.EARTHDATA_TOKEN;
  if (!token || !granule?.downloadUrl) return footprintBox(granule);
  const url = `${String(granule.downloadUrl).replace(/\.h5$/i, '')}_LATLON.kml`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    log('kml', response.status, url);
    return footprintBox(granule);
  }
  const match = /<\w*:?LatLonQuad>[\s\S]*?<coordinates>([^<]+)<\/coordinates>/i.exec(await response.text());
  if (!match) return footprintBox(granule);
  const pairs = match[1]
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number));
  if (pairs.length < 4) return footprintBox(granule);
  const lngs = pairs.map(([lng]) => lng);
  const lats = pairs.map(([, lat]) => lat);
  if (![...lngs, ...lats].every(Number.isFinite)) return footprintBox(granule);
  return {
    west: Math.min(...lngs),
    east: Math.max(...lngs),
    south: Math.min(...lats),
    north: Math.max(...lats),
  };
}

/**
 * Fractional crop that puts the same geographic window into the NISAR browse
 * (georeferenced by the KML quad) and the Sentinel-2 quicklook (tile bbox).
 * Both images are north-up Mercator, so a lat/lon window is an axis-aligned
 * rectangle in each. The window keeps the comparison frame's aspect ratio and
 * stays inside both images.
 */
export function comparisonCrops(site, { quad, imageBbox, aspect = 760 / 500 }) {
  const bbox = site?.bbox || bboxFromWkt(site?.wkt);
  if (!bbox || !quad) return null;
  const siteWidth = bbox[2] - bbox[0];
  const siteHeight = mercSpan(bbox[1], bbox[3]);
  let width = Math.max(siteWidth, siteHeight * aspect);
  let height = width / aspect;

  const quadWidth = quad.east - quad.west;
  const quadMinMerc = MERC(quad.south);
  const quadMaxMerc = MERC(quad.north);
  const hasTile = Array.isArray(imageBbox) && imageBbox.length === 4;
  const tileWidth = hasTile ? imageBbox[2] - imageBbox[0] : Infinity;
  const tileHeight = hasTile ? mercSpan(imageBbox[1], imageBbox[3]) : Infinity;

  // The window has to stay inside both images, so clamp it to their overlap and
  // leave a small margin so the crop never touches an image edge.
  const minLng = Math.max(quad.west, hasTile ? imageBbox[0] : -Infinity);
  const maxLng = Math.min(quad.east, hasTile ? imageBbox[2] : Infinity);
  const minMerc = Math.max(quadMinMerc, hasTile ? MERC(imageBbox[1]) : -Infinity);
  const maxMerc = Math.min(quadMaxMerc, hasTile ? MERC(imageBbox[3]) : Infinity);
  const maxWidth = (maxLng - minLng) * 0.98;
  const maxHeight = (maxMerc - minMerc) * FROM_RADIANS * 0.98;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspect;
  }
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }

  const centreLng = (bbox[0] + bbox[2]) / 2;
  const halfHeight = height / 2 / FROM_RADIANS;
  const centreMerc = MERC((bbox[1] + bbox[3]) / 2);

  const west = Math.min(Math.max(centreLng - width / 2, minLng), maxLng - width);
  // The window's top edge must leave room for its full height below it.
  const topMerc = Math.min(Math.max(centreMerc + halfHeight, minMerc + 2 * halfHeight), maxMerc);

  const crop = {
    x: (west - quad.west) / quadWidth,
    w: width / quadWidth,
    y: (quadMaxMerc - topMerc) / (quadMaxMerc - quadMinMerc),
    h: (2 * halfHeight) / (quadMaxMerc - quadMinMerc),
  };

  const opticalCrop = Array.isArray(imageBbox)
    ? {
        x: (west - imageBbox[0]) / tileWidth,
        w: width / tileWidth,
        y: (MERC(imageBbox[3]) - topMerc) / (MERC(imageBbox[3]) - MERC(imageBbox[1])),
        h: (2 * halfHeight * FROM_RADIANS) / tileHeight,
      }
    : null;

  return {
    crop,
    opticalCrop,
    // The window in degrees plus the Mercator edges a crop needs to be
    // re-projected onto another granule's browse canvas.
    window: { west, width, height, topMerc, mercHeight: 2 * halfHeight },
  };
}

/** The same geographic window as a fractional crop of another browse canvas. */
export function cropForWindow(quad, window) {
  if (!quad || !window) return null;
  const quadWidth = quad.east - quad.west;
  const quadMax = MERC(quad.north);
  const quadMin = MERC(quad.south);
  if (!(quadWidth > 0) || !(quadMax > quadMin)) return null;
  const crop = {
    x: (window.west - quad.west) / quadWidth,
    w: window.width / quadWidth,
    y: (quadMax - window.topMerc) / (quadMax - quadMin),
    h: window.mercHeight / (quadMax - quadMin),
  };
  const inside = [crop.x, crop.y, crop.x + crop.w, crop.y + crop.h].every(
    (value) => value >= -0.01 && value <= 1.01
  );
  return inside ? crop : null;
}

async function harmonyGeoTiff(granule, bbox, variable) {
  // The cache key must include the window: a 5 km calibration window and a
  // whole-footprint subset are different rasters of the same granule.
  const tag = `${granule.granuleName}_${variable.split('/').pop()}_${bbox.map((n) => n.toFixed(3)).join('_')}`;
  const file = path.join(CACHE_DIR, `${tag}.tif`);
  try {
    return await fs.readFile(file);
  } catch {
    /* not cached yet */
  }

  const token = process.env.EARTHDATA_TOKEN;
  if (!token) throw new Error('EARTHDATA_TOKEN is not set');

  const url = new URL(
    `${HARMONY}/${collectionId(granule)}/ogc-api-coverages/1.0.0/collections/parameter_vars/coverage/rangeset`
  );
  url.searchParams.set('variable', variable);
  url.searchParams.set('granuleName', granule.granuleName);
  url.searchParams.append('subset', `lat(${bbox[1]}:${bbox[3]})`);
  url.searchParams.append('subset', `lon(${bbox[0]}:${bbox[2]})`);
  url.searchParams.set('format', 'image/tiff');
  url.searchParams.set('maxResults', '1');

  await fs.mkdir(CACHE_DIR, { recursive: true });
  const temp = `${file}.part`;
  const status = await new Promise((resolve, reject) => {
    // curl handles Harmony's 303 → signed-URL redirect reliably; Node fetch can
    // hang on the same request.
    const child = spawn('curl', [
      '-sS',
      '-L',
      '--location-trusted',
      '-H',
      `Authorization: Bearer ${token}`,
      '--max-time',
      String(HARMONY_TIMEOUT),
      '-o',
      temp,
      '-w',
      '%{http_code}',
      url.href,
    ]);
    let out = '';
    let err = '';
    child.stdout.on('data', (chunk) => {
      out += chunk;
    });
    child.stderr.on('data', (chunk) => {
      err += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`curl exit ${code}: ${err.slice(0, 200)}`));
      else resolve(out.trim());
    });
  });
  if (!status.startsWith('2')) {
    await fs.rm(temp, { force: true });
    throw new Error(`Harmony HTTP ${status}`);
  }
  await fs.rename(temp, file);
  return fs.readFile(file);
}

/* ------------------------------------------------------------------ */
/* Verified calibration snapshots (server/cache/nisar)                 */
/* ------------------------------------------------------------------ */

const SNAPSHOTS = new Map(
  [sundarbansSnapshot, caldorSnapshot].map((snapshot) => [snapshot.site, snapshot])
);
const SNAPSHOT_RGB = { sundarbans: sundarbansRgbBase64, caldor: caldorRgbBase64 };
const SNAPSHOT_HH = { sundarbans: sundarbansHhBase64, caldor: caldorHhBase64 };

/** Bundled GCOV telemetry for a site, or null when none was precomputed. */
export function nisarSnapshot(siteId) {
  return SNAPSHOTS.get(siteId) || null;
}

/** Which card sides have a bundled dual-pol composite. */
export function nisarSnapshotCapabilities(siteId) {
  const snapshot = nisarSnapshot(siteId);
  return {
    changeStats: Boolean(snapshot?.changeStats),
    rgb: { before: Boolean(snapshot?.rgb?.before), after: Boolean(snapshot?.rgb?.after) },
    hh: {
      before: Boolean(SNAPSHOT_HH[siteId]?.before),
      after: Boolean(SNAPSHOT_HH[siteId]?.after),
    },
    computedAt: snapshot?.computedAt || null,
  };
}

/** Pre-rendered HH·HV composite bytes, or null when not bundled. */
export function nisarSnapshotRgb(siteId, side) {
  const snapshot = nisarSnapshot(siteId);
  if (!snapshot?.rgb?.[side]) return null;
  const encoded = SNAPSHOT_RGB[siteId]?.[side];
  return encoded ? Buffer.from(encoded, 'base64') : null;
}

/** Pre-rendered calibrated HH bytes from the same window as the RGB. */
export function nisarSnapshotHh(siteId, side) {
  if (!nisarSnapshot(siteId)) return null;
  const encoded = SNAPSHOT_HH[siteId]?.[side];
  return encoded ? Buffer.from(encoded, 'base64') : null;
}

/* ------------------------------------------------------------------ */
/* Calibrated GCOV rasters: NoData-aware stats + bounded array cache   */
/* ------------------------------------------------------------------ */

const HH_PATH = '/science/LSAR/GCOV/grids/frequencyA/HHHH';
const HV_PATH = '/science/LSAR/GCOV/grids/frequencyA/HVHV';
// A 512×512 float32 window is ~1 MB. Twelve windows is a hard ceiling so a
// burst of granules can never grow the function's memory without bound.
const ARRAY_BYTES_LIMIT = Number(process.env.NISAR_ARRAY_CACHE_MB || 96) * 1024 * 1024;
const arrayCache = new Map();
let arrayBytes = 0;

function cacheRaster(key, raster) {
  const bytes = raster.values?.byteLength || 0;
  const previous = arrayCache.get(key);
  if (previous) {
    arrayBytes -= previous.raster.values?.byteLength || 0;
    arrayCache.delete(key);
  }
  arrayCache.set(key, { at: Date.now(), raster });
  arrayBytes += bytes;
  // A 2700×2250 calibrated window is ~24 MB, so cap by bytes, not entries.
  while (arrayBytes > ARRAY_BYTES_LIMIT && arrayCache.size > 1) {
    const oldest = [...arrayCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (!oldest) break;
    arrayBytes -= oldest[1].raster.values?.byteLength || 0;
    arrayCache.delete(oldest[0]);
  }
}

/** Parse one band of a GeoTIFF subset, honouring GDAL NoData / scale / offset. */
async function readRaster(buffer) {
  const bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const tiff = await fromArrayBuffer(bytes);
  const image = await tiff.getImage();
  const [values] = await image.readRasters({ samples: [0] });
  let nodata = null;
  try {
    const raw = image.getGDALNoData();
    if (raw !== null && raw !== undefined && raw !== '') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) nodata = parsed;
    }
  } catch {
    /* no GDAL_NODATA tag in this subset */
  }
  // Harmony can return scaled integers; apply GDAL SCALE/OFFSET when present.
  let scale = 1;
  let offset = 0;
  try {
    const meta = image.getGDALMetadata?.() || {};
    const items = Array.isArray(meta.Item) ? meta.Item : meta.Item ? [meta.Item] : [];
    for (const item of items) {
      const name = String(item?.name || '').toUpperCase();
      if (name === 'SCALE' && Number.isFinite(Number(item.value))) scale = Number(item.value);
      if (name === 'OFFSET' && Number.isFinite(Number(item.value))) offset = Number(item.value);
    }
  } catch {
    /* metadata is optional */
  }
  let transform = null;
  try {
    transform = image.getModelTransformation?.() || image.getGeoTransform?.() || null;
  } catch {
    transform = null;
  }
  return {
    values,
    width: image.getWidth(),
    height: image.getHeight(),
    nodata,
    scale,
    offset,
    transform: Array.isArray(transform) ? [...transform] : null,
  };
}

/** Physical power for one sample, or null when the sample is NoData. */
function powerAt(raster, index) {
  const raw = Number(raster.values[index]);
  if (!Number.isFinite(raw)) return null;
  if (raster.nodata != null && raw === raster.nodata) return null;
  const scaled = raw * raster.scale + raster.offset;
  return Number.isFinite(scaled) ? scaled : null;
}

/**
 * NoData-aware statistics. Dark open water is real data, so a value of zero is
 * kept (clamped only for the logarithm) instead of being dropped the way the
 * previous `value <= 0` filter did. `validPct` says how much of the window is
 * usable, which is the number a reviewer needs next to a mean.
 */
function rasterStats(raster) {
  const total = raster.width * raster.height;
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < total; i += 1) {
    const power = powerAt(raster, i);
    if (power == null) continue;
    const value = Math.max(power, 1e-7);
    if (value < min) min = value;
    if (value > max) max = value;
    sum += value;
    count += 1;
  }
  if (!count) return null;
  const mean = sum / count;
  const threshold = min + (max - min) * 0.25;
  let low = 0;
  for (let i = 0; i < total; i += 1) {
    const power = powerAt(raster, i);
    if (power == null) continue;
    if (Math.max(power, 1e-7) <= threshold) low += 1;
  }
  return {
    mean,
    db: 10 * Math.log10(mean),
    lowFraction: low / count,
    validPct: count / total,
    count,
    width: raster.width,
    height: raster.height,
  };
}

function sameGrid(a, b) {
  if (!a || !b) return false;
  if (a.width !== b.width || a.height !== b.height) return false;
  if (!a.transform || !b.transform) return true; // shape match is the best signal available
  return a.transform.every((value, index) => Math.abs(value - b.transform[index]) < 1e-9);
}

/** Nearest-neighbour alignment used only when the two subsets differ by a pixel. */
function alignToRaster(source, target) {
  if (sameGrid(source, target)) return source;
  const values = new Float64Array(target.width * target.height);
  for (let y = 0; y < target.height; y += 1) {
    const sy = Math.min(source.height - 1, Math.floor((y / target.height) * source.height));
    for (let x = 0; x < target.width; x += 1) {
      const sx = Math.min(source.width - 1, Math.floor((x / target.width) * source.width));
      values[y * target.width + x] = source.values[sy * source.width + sx];
    }
  }
  return { ...source, values, width: target.width, height: target.height, transform: target.transform };
}

/** Load (and cache) one calibrated 2-D power array for a granule + window. */
async function loadRaster(granule, bbox, variable) {
  const key = `${granule.granuleName}:${variable.split('/').pop()}:${bbox.map((n) => n.toFixed(3)).join(',')}`;
  const cached = arrayCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.raster;
  const buffer = await harmonyGeoTiff(granule, bbox, variable);
  const raster = await readRaster(buffer);
  cacheRaster(key, raster);
  return raster;
}

async function readGranule(granule, bbox) {
  const [hhRaster, hvRaster] = await Promise.all([
    loadRaster(granule, bbox, HH_PATH),
    loadRaster(granule, bbox, HV_PATH),
  ]);
  const hhStats = rasterStats(hhRaster);
  const hvStats = rasterStats(hvRaster);
  if (!hhStats || !hvStats) return null;
  return {
    date: (granule.startTime || '').slice(0, 10),
    datetime: granule.startTime || null,
    hhDb: hhStats.db,
    hvDb: hvStats.db,
    crossDb: hvStats.db - hhStats.db,
    lowFraction: hhStats.lowFraction,
    validPct: Number((hhStats.validPct * 100).toFixed(1)),
    aligned: sameGrid(hhRaster, hvRaster),
    imageUrl: browseUrl(granule),
    granuleName: granule.granuleName,
    track: granule.track,
    frame: granule.frameNumber,
    processingLevel: /NISAR_L2_GCOV_V1/i.test(granule.downloadUrl || '') ? 'validated' : 'provisional',
  };
}

/** Ground area of one pixel, from the GeoTIFF transform (degrees or metres). */
function pixelAreaM2(raster) {
  const t = raster.transform;
  if (!t) return null;
  // 4×4 model transformation (row-major) or GDAL geotransform (6 values).
  const a = t.length >= 16 ? t[0] : t.length >= 6 ? t[1] : null;
  const e = t.length >= 16 ? t[5] : t.length >= 6 ? t[5] : null;
  if (!Number.isFinite(a) || !Number.isFinite(e)) return null;
  const area = Math.abs(a * e);
  if (Math.abs(a) <= 1.5 && Math.abs(e) <= 1.5) {
    const lat = t.length >= 16 ? t[7] : t.length >= 6 ? t[3] : 0;
    return area * (111320 * Math.cos((lat * Math.PI) / 180)) * 110540;
  }
  return area;
}

/** Find one ASF granule by name (used by the RGB and stats routes). */
async function findGranule(site, granuleName, { start, end }) {
  const granules = await asfSearch({ wkt: site.wkt, start, end });
  return granules.find((item) => item.granuleName === granuleName) || null;
}

/** Pure pixel math for the change statistics (unit-testable without Harmony). */
export function changeStatsFromRasters(beforeRaster, afterRaw, thresholdDb = 3) {
  const after = alignToRaster(afterRaw, beforeRaster);
  const total = beforeRaster.width * beforeRaster.height;
  let valid = 0;
  let changed = 0;
  let sum = 0;
  let sumAbs = 0;
  for (let i = 0; i < total; i += 1) {
    const p0 = powerAt(beforeRaster, i);
    const p1 = powerAt(after, i);
    if (p0 == null || p1 == null) continue;
    const delta = 10 * Math.log10(Math.max(p1, 1e-7)) - 10 * Math.log10(Math.max(p0, 1e-7));
    if (!Number.isFinite(delta)) continue;
    valid += 1;
    sum += delta;
    sumAbs += Math.abs(delta);
    if (Math.abs(delta) >= thresholdDb) changed += 1;
  }
  if (!valid) return null;
  return {
    changedPct: Number(((changed / valid) * 100).toFixed(1)),
    meanDeltaDb: Number((sum / valid).toFixed(2)),
    meanAbsDeltaDb: Number((sumAbs / valid).toFixed(2)),
    validPixels: valid,
    validPct: Number(((valid / total) * 100).toFixed(1)),
    changedPixels: changed,
    totalPixels: total,
    aligned: sameGrid(beforeRaster, afterRaw),
  };
}

/**
 * Pixel-level change between the two NISAR passes around the event.
 * Sign convention: delta = after − before, threshold on |delta| in dB.
 */
export async function computeNisarChangeStats(site, { start, end, eventDate, thresholdDb = 3 }) {
  const bbox = calibrationWindow(site) || site.bbox || bboxFromWkt(site.wkt);
  if (!bbox) return null;
  const granules = await asfSearch({ wkt: site.wkt, start, end });
  const picked = pickGranules(granules, eventDate, 2);
  if (picked.length < 2) return null;
  const event = new Date(`${eventDate}T00:00:00Z`).getTime();
  const beforeG = [...picked]
    .filter((item) => new Date(item.startTime).getTime() <= event)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0];
  const afterG = [...picked]
    .filter((item) => new Date(item.startTime).getTime() > event)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
  if (!beforeG || !afterG) return null;

  const [beforeRaw, afterRaw] = await Promise.all([
    loadRaster(beforeG, bbox, HH_PATH),
    loadRaster(afterG, bbox, HH_PATH),
  ]);
  const stats = changeStatsFromRasters(beforeRaw, afterRaw, thresholdDb);
  if (!stats) return null;

  let area = pixelAreaM2(beforeRaw);
  if (!area) {
    // Harmony subsets carry no geotransform; derive the pixel area from the
    // requested bbox, which is the geographic window the subset represents.
    const latSpan = Math.abs(bbox[3] - bbox[1]);
    const lonSpan = Math.abs(bbox[2] - bbox[0]);
    const centre = ((bbox[1] + bbox[3]) / 2) * (Math.PI / 180);
    const widthM = lonSpan * 111320 * Math.cos(centre);
    const heightM = latSpan * 110540;
    area = (widthM * heightM) / (beforeRaw.width * beforeRaw.height);
  }
  const changedAreaKm2 = area ? (stats.changedPixels * area) / 1e6 : null;

  return {
    site: site.id,
    source: 'nisar-gcov-harmony-db',
    calibrated: true,
    thresholdDb,
    changedPct: stats.changedPct,
    meanDeltaDb: stats.meanDeltaDb,
    meanAbsDeltaDb: stats.meanAbsDeltaDb,
    changedAreaKm2: changedAreaKm2 == null ? null : Number(changedAreaKm2.toFixed(2)),
    validPixels: stats.validPixels,
    validPct: stats.validPct,
    grid: { width: beforeRaw.width, height: beforeRaw.height, aligned: stats.aligned },
    before: { date: (beforeG.startTime || '').slice(0, 10), granule: beforeG.granuleName },
    after: { date: (afterG.startTime || '').slice(0, 10), granule: afterG.granuleName },
    note: `Signed HH change, ${thresholdDb} dB absolute threshold, same track/frame, NISAR L-band gamma-0.`,
  };
}

/* ------------------------------------------------------------------ */
/* Dual-pol intensity composite (R=HH, G=HV, B=HH−HV, 2–98% stretch)   */
/* ------------------------------------------------------------------ */

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[index];
}

function stretch(values, low, high) {
  const span = high - low || 1;
  return Math.max(0, Math.min(255, Math.round(((values - low) / span) * 255)));
}

export async function renderNisarRgb(site, { side = 'after', start, end, eventDate }) {
  const bbox = calibrationWindow(site) || site.bbox || bboxFromWkt(site.wkt);
  const granuleName = site?.states?.[side]?.nisarGranule || null;
  if (!granuleName) return null;
  const granule = await findGranule(site, granuleName, { start, end });
  if (!granule) return null;
  const key = `rgb:${granule.granuleName}:${bbox.map((n) => n.toFixed(3)).join(',')}`;
  const cached = browsePngCache.get(key);
  if (cached && Date.now() - cached.at < BROWSE_TTL) return cached.value;

  const [hhRaster, hvRaster] = await Promise.all([
    loadRaster(granule, bbox, HH_PATH),
    loadRaster(granule, bbox, HV_PATH),
  ]);
  const hv = alignToRaster(hvRaster, hhRaster);

  const hhDb = [];
  const hvDb = [];
  const diff = [];
  const total = hhRaster.width * hhRaster.height;
  for (let i = 0; i < total; i += 1) {
    const p0 = powerAt(hhRaster, i);
    const p1 = powerAt(hv, i);
    if (p0 == null || p1 == null) continue;
    const h = 10 * Math.log10(Math.max(p0, 1e-7));
    const v = 10 * Math.log10(Math.max(p1, 1e-7));
    hhDb.push(h);
    hvDb.push(v);
    diff.push(h - v);
  }
  if (!hhDb.length) return null;

  const stretchFor = (list) => {
    const sorted = [...list].sort((a, b) => a - b);
    return [percentile(sorted, 2), percentile(sorted, 98)];
  };
  const [hhLow, hhHigh] = stretchFor(hhDb);
  const [hvLow, hvHigh] = stretchFor(hvDb);
  const [dLow, dHigh] = stretchFor(diff);

  const out = Buffer.alloc(OUT_WIDTH * OUT_HEIGHT * 3);
  for (let y = 0; y < OUT_HEIGHT; y += 1) {
    const sy = Math.min(hhRaster.height - 1, Math.floor(((y + 0.5) / OUT_HEIGHT) * hhRaster.height));
    for (let x = 0; x < OUT_WIDTH; x += 1) {
      const sx = Math.min(hhRaster.width - 1, Math.floor(((x + 0.5) / OUT_WIDTH) * hhRaster.width));
      const sourceIndex = sy * hhRaster.width + sx;
      const p0 = powerAt(hhRaster, sourceIndex);
      const p1 = powerAt(hv, sourceIndex);
      const o = (y * OUT_WIDTH + x) * 3;
      if (p0 == null || p1 == null) {
        out[o] = 8;
        out[o + 1] = 8;
        out[o + 2] = 8;
        continue;
      }
      const h = 10 * Math.log10(Math.max(p0, 1e-7));
      const v = 10 * Math.log10(Math.max(p1, 1e-7));
      out[o] = stretch(h, hhLow, hhHigh);
      out[o + 1] = stretch(v, hvLow, hvHigh);
      out[o + 2] = stretch(h - v, dLow, dHigh);
    }
  }
  const png = pngRgb(OUT_WIDTH, OUT_HEIGHT, out);
  browsePngCache.set(key, { value: png, at: Date.now() });
  return png;
}

/**
 * Debug-only probe: is the Earthdata token accepted by Harmony, and does one
 * small HH subset come back? Never exposed unless DEBUG_REAL=1.
 */
export async function probeHarmony(site, { start, end, eventDate }) {
  const started = Date.now();
  const token = process.env.EARTHDATA_TOKEN;
  const result = { token: Boolean(token), tokenLength: token ? token.length : 0 };
  try {
    const granules = await asfSearch({ wkt: site.wkt, start, end });
    result.granules = granules.length;
    const picked = pickGranules(granules, eventDate, 2);
    result.picked = picked.map((item) => item.granuleName);
    if (!picked.length) return { ...result, ok: false, error: 'no granule pair' };
    const bbox = site.bbox || bboxFromWkt(site.wkt);
    const tiny = [bbox[0], bbox[1], bbox[0] + 0.02, bbox[1] + 0.02];
    const buffer = await harmonyGeoTiff(picked[0], tiny, HH_PATH);
    result.bytes = buffer.length;
    result.ok = true;
  } catch (error) {
    result.ok = false;
    result.error = error?.message || String(error);
  }
  result.elapsedMs = Date.now() - started;
  return result;
}

export function clearNisarArrayCache() {
  arrayCache.clear();
  arrayBytes = 0;
}

function groupKey(granule) {
  return `${granule.track ?? granule.relativeOrbit ?? '?'}-${granule.frameNumber ?? '?'}`;
}

function pickGranules(granules, eventDate, max = 4) {
  const event = new Date(`${eventDate}T00:00:00Z`).getTime();
  const groups = new Map();
  for (const granule of granules) {
    if (!/DHDH|QPQP/i.test(granule.granuleName)) continue;
    if (!granule.startTime) continue;
    const key = groupKey(granule);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(granule);
  }

  let best = null;
  for (const [key, list] of groups) {
    const sorted = [...list].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    const before = sorted.filter((item) => new Date(item.startTime).getTime() <= event);
    const after = sorted.filter((item) => new Date(item.startTime).getTime() > event);
    if (!before.length || !after.length) continue;
    const gap =
      event - new Date(before[before.length - 1].startTime).getTime() +
      (new Date(after[0].startTime).getTime() - event);
    const candidate = { key, sorted, before, after, gap };
    if (!best || candidate.gap < best.gap) best = candidate;
  }
  if (!best) return [];

  // Keep the closest pass on each side, then fill evenly up to max.
  const picked = [best.before[best.before.length - 1], best.after[0]];
  const rest = best.sorted.filter((item) => !picked.includes(item));
  const side = Math.max(0, Math.floor((max - 2) / 2));
  if (side > 0) {
    const extrasBefore = rest
      .filter((item) => new Date(item.startTime).getTime() <= event)
      .slice(-side);
    const extrasAfter = rest
      .filter((item) => new Date(item.startTime).getTime() > event)
      .slice(0, side);
    picked.push(...extrasBefore, ...extrasAfter);
  }
  return picked
    .filter((item, index, array) => array.indexOf(item) === index)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
}

function resample16(values) {
  if (!values.length) return Array(16).fill(0);
  return Array.from({ length: 16 }, (_, index) => {
    const pos = (index / 15) * (values.length - 1);
    const low = Math.floor(pos);
    const high = Math.min(values.length - 1, low + 1);
    const mix = pos - low;
    return clamp01(values[low] * (1 - mix) + values[high] * mix);
  });
}

export async function buildNisarBrowse(site, { start, end, eventDate }) {
  const granules = await asfSearch({ wkt: site.wkt, start, end });
  const picked = pickGranules(granules, eventDate, 2);
  if (picked.length < 2) return null;
  const event = new Date(`${eventDate}T00:00:00Z`).getTime();
  const before = [...picked]
    .filter((item) => new Date(item.startTime).getTime() <= event)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0];
  const after = [...picked]
    .filter((item) => new Date(item.startTime).getTime() > event)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
  if (!before || !after) return null;
  // Each pass carries its own footprint, so both sides get their own quad and
  // each browse can be cropped to the same geographic window.
  const [beforeQuad, afterQuad] = await Promise.all(
    [before, after].map((granule) =>
      browseQuad(granule).catch((error) => {
        log('quad failed', error?.message);
        return null;
      })
    )
  );
  const shape = (granule, quad) =>
    granule && {
      date: (granule.startTime || '').slice(0, 10),
      datetime: granule.startTime || null,
      imageUrl: (quad && latlonUrl(granule)) || browseUrl(granule),
      latlonUrl: latlonUrl(granule),
      nativeUrl: browseUrl(granule),
      quad: quad || null,
      granuleName: granule.granuleName,
      track: granule.track,
      frame: granule.frameNumber,
      product: 'NISAR GCOV L-band (HH) browse',
    };
  return { before: shape(before, beforeQuad), after: shape(after, afterQuad) };
}

export async function buildNisarSite(site, { start, end, eventDate }) {
  const key = site.id;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.value;
  if (cached?.promise) return cached.promise;

  const promise = (async () => {
    const bbox = calibrationWindow(site) || site.bbox || bboxFromWkt(site.wkt);
    if (!bbox) return null;
    const granules = await asfSearch({ wkt: site.wkt, start, end });
    const picked = pickGranules(granules, eventDate, Number(process.env.NISAR_MAX_SCENES || 4));
    log(site.id, 'granules', granules.length, 'picked', picked.map((item) => item.startTime));
    if (picked.length < 2) return null;

    const scenes = (
      await mapLimit(picked, 2, (granule) =>
        readGranule(granule, bbox).catch((error) => {
          log('granule failed', granule.granuleName, error?.message);
          return null;
        })
      )
    ).filter(Boolean);
    if (scenes.length < 2) return null;

    const event = new Date(`${eventDate}T00:00:00Z`).getTime();
    const unique = [];
    for (const scene of scenes) {
      if (!unique.some((item) => item.date === scene.date)) unique.push(scene);
    }
    const before = unique.filter((scene) => new Date(`${scene.date}T00:00:00Z`).getTime() <= event);
    const after = unique.filter((scene) => new Date(`${scene.date}T00:00:00Z`).getTime() > event);
    const beforeScene = before[before.length - 1] || unique[0];
    const afterScene = after[0] || unique[unique.length - 1];
    if (!beforeScene || !afterScene) return null;

    const baseline = beforeScene.hhDb;
    const eventDb = Math.min(...unique.map((scene) => scene.hhDb));
    const changes = unique.map((scene) => clamp01(Math.abs(scene.hhDb - baseline) / 12));

    const series = unique.map((scene) => ({
      date: scene.date,
      vv: Number(scene.hhDb.toFixed(1)),
      vh: Number(scene.hvDb.toFixed(1)),      change: Number(clamp01(Math.abs(scene.hhDb - baseline) / 12).toFixed(2)),
    }));

    const recovery = after.map((scene) => ({
      month: Math.max(
        0,
        Math.round((new Date(`${scene.date}T00:00:00Z`).getTime() - event) / (30.44 * 24 * 3600 * 1000))
      ),
      pct:
        baseline === eventDb
          ? 100
          : Math.round(clamp01((scene.hhDb - eventDb) / (baseline - eventDb)) * 100),
      projected: false,
    }));

    const baseParams = site.states.after.params;
    return {
      id: site.id,
      source: 'nisar-gcov-l-band',
      updatedAt: new Date().toISOString(),
      coords: site.coords,
      wkt: site.wkt,
      states: {
        before: {
          date: beforeScene.date,
          params: {
            ...site.states.before.params,
            ...(site.id === 'sundarbans'
              ? { water: Number(beforeScene.lowFraction.toFixed(2)) }
              : { burn: Number(beforeScene.lowFraction.toFixed(2)) }),
          },
          imageUrl: beforeScene.imageUrl,
          attribution: 'NASA NISAR L-band GCOV (HH) browse image — ASF DAAC.',
          acquiredAt: beforeScene.datetime,
          product: 'NISAR GCOV L-band (HH/HV)',
          notSimulated: true,
          nisarGranule: beforeScene.granuleName,
          nisarProduct: 'NISAR GCOV L-band (HH/HV)',
        },
        after: {
          date: afterScene.date,
          params: {
            ...baseParams,
            ...(site.id === 'sundarbans'
              ? { water: Number(afterScene.lowFraction.toFixed(2)) }
              : { burn: Number(afterScene.lowFraction.toFixed(2)) }),
          },
          imageUrl: afterScene.imageUrl,
          attribution: 'NASA NISAR L-band GCOV (HH) browse image — ASF DAAC.',
          acquiredAt: afterScene.datetime,
          product: 'NISAR GCOV L-band (HH/HV)',
          notSimulated: true,
          nisarGranule: afterScene.granuleName,
          nisarProduct: 'NISAR GCOV L-band (HH/HV)',
        },
      },
      measurements: {
        vv: { before: Number(beforeScene.hhDb.toFixed(1)), after: Number(afterScene.hhDb.toFixed(1)) },
        vh: { before: Number(beforeScene.hvDb.toFixed(1)), after: Number(afterScene.hvDb.toFixed(1)) },
        crossPol: {
          before: Number(beforeScene.crossDb.toFixed(1)),
          after: Number(afterScene.crossDb.toFixed(1)),
        },
        dateBefore: beforeScene.date,
        dateAfter: afterScene.date,
        source: 'nisar-gcov-harmony-db',
        bands: 'HH/HV',
        unit: 'gamma0_power_db',
        calibration: '10·log10(gamma-0 power), Harmony GCOV subset',
        calibrated: true,
        validPct: Math.min(beforeScene.validPct ?? 100, afterScene.validPct ?? 100),
      },
      provenance: {
        cards: {
          sensor: 'NISAR',
          mission: 'NASA / ISRO',
          band: 'L',
          polarizations: ['HH'],
          product: 'GCOV HH browse (PNG)',
          calibrated: false,
          rgbComposite: process.env.NISAR_GCOV === '1',
          changeStats: process.env.NISAR_GCOV === '1',
          granules: { before: beforeScene.granuleName, after: afterScene.granuleName },
        },
        numbers: {
          sensor: 'NISAR',
          mission: 'NASA / ISRO',
          band: 'L',
          polarizations: ['HH', 'HV'],
          product: 'GCOV HHHH/HVHV subset (Harmony)',
          unit: 'gamma0_power_db',
          calibration: '10·log10(gamma-0 power) — calibrated gamma-0',
          calibrated: true,
          source: 'nisar-gcov-harmony-db',
        },
      },
      series,
      pulse: resample16(changes),
      stablePulse: resample16(changes.slice(0, Math.max(2, Math.floor(changes.length / 2)))),
      recovery: { thresholdDefault: 80, points: recovery.length >= 2 ? recovery : undefined },
      _meta: {
        scenes: unique.length,
        track: beforeScene.track,
        frame: beforeScene.frame,
        processingLevel: beforeScene.processingLevel,
        note: 'Calibrated gamma-0 power from NISAR GCOV HHHH/HVHV, subset via Harmony.',
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

export function clearNisarCache() {
  cache.clear();
  browsePngCache.clear();
  arrayCache.clear();
}

/* ------------------------------------------------------------------ */
/* NISAR browse rendering (server-side crop + change)                  */
/* ------------------------------------------------------------------ */

// The ASF browse products are PNGs: `_LATLON.png` is a north-up image
// georeferenced by the granule KML quad. They are the only NISAR imagery
// available without an Earthdata token, so the before/after/change cards are
// cropped here instead of shipping the full swath to the browser.

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const BROWSE_TTL = 6 * 60 * 60 * 1000;
const browsePngCache = new Map();
const OUT_WIDTH = 560;
const OUT_HEIGHT = 370;

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

/** 8-bit RGB PNG, no image library needed on the serverless runtime. */
function pngRgb(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: truecolour
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * stride] = 0; // filter: none
    pixels.copy(raw, y * stride + 1, y * width * 3, (y + 1) * width * 3);
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const paeth = (left, up, upLeft) => {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  if (pb <= pc) return up;
  return upLeft;
};

/** Minimal PNG decoder for 8-bit, non-interlaced browse imagery. */
function decodePngToRgb(buffer) {
  if (!buffer || buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Not a PNG');
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette = null;
  const idat = [];
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) break;
    const data = buffer.subarray(dataStart, dataEnd);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'PLTE') {
      palette = Buffer.from(data);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset = dataEnd + 4;
  }
  if (!width || !height || !idat.length) throw new Error('Incomplete PNG');
  if (bitDepth !== 8 || interlace !== 0) {
    throw new Error(`Unsupported PNG (depth ${bitDepth}, interlace ${interlace})`);
  }
  const channels =
    colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 3 ? 1 : colorType === 4 ? 2 : colorType === 6 ? 4 : 0;
  if (!channels) throw new Error(`Unsupported PNG colour type ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  if (raw.length < (stride + 1) * height) throw new Error('Truncated PNG data');
  const out = Buffer.alloc(width * height * 3);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    const line = Buffer.from(raw.subarray(rowStart + 1, rowStart + 1 + stride));
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? line[x - channels] : 0;
      const up = prev[x];
      const upLeft = x >= channels ? prev[x - channels] : 0;
      let value = line[x];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += Math.floor((left + up) / 2);
      else if (filter === 4) value += paeth(left, up, upLeft);
      line[x] = value & 0xff;
    }
    for (let x = 0; x < width; x += 1) {
      let r;
      let g;
      let b;
      if (colorType === 0 || colorType === 4) {
        r = g = b = line[x * channels];
      } else if (colorType === 3) {
        const index = line[x];
        if (palette && index * 3 + 2 < palette.length) {
          r = palette[index * 3];
          g = palette[index * 3 + 1];
          b = palette[index * 3 + 2];
        } else {
          r = g = b = 0;
        }
      } else {
        r = line[x * channels];
        g = line[x * channels + 1];
        b = line[x * channels + 2];
      }
      const o = (y * width + x) * 3;
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
    }
    prev = line;
  }
  return { width, height, data: out };
}

function normalizeCrop(crop) {
  if (!crop || typeof crop !== 'object') return null;
  const x = Number(crop.x);
  const y = Number(crop.y);
  const w = Number(crop.w);
  const h = Number(crop.h);
  if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return null;
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
    w: Math.max(0.01, Math.min(1, w)),
    h: Math.max(0.01, Math.min(1, h)),
  };
}

/** Resample one fractional window of a browse PNG to the card frame. */
function sampleCrop(image, crop) {
  const rect = normalizeCrop(crop) || { x: 0, y: 0, w: 1, h: 1 };
  const sx0 = rect.x * image.width;
  const sy0 = rect.y * image.height;
  const sw = Math.max(1, rect.w * image.width);
  const sh = Math.max(1, rect.h * image.height);
  const out = Buffer.alloc(OUT_WIDTH * OUT_HEIGHT * 3);
  for (let y = 0; y < OUT_HEIGHT; y += 1) {
    const sourceY = Math.min(image.height - 1, Math.floor(sy0 + ((y + 0.5) / OUT_HEIGHT) * sh));
    for (let x = 0; x < OUT_WIDTH; x += 1) {
      const sourceX = Math.min(image.width - 1, Math.floor(sx0 + ((x + 0.5) / OUT_WIDTH) * sw));
      const source = (sourceY * image.width + sourceX) * 3;
      const target = (y * OUT_WIDTH + x) * 3;
      out[target] = image.data[source];
      out[target + 1] = image.data[source + 1];
      out[target + 2] = image.data[source + 2];
    }
  }
  return out;
}

async function fetchBrowsePng(url) {
  const cached = browsePngCache.get(url);
  if (cached && Date.now() - cached.at < BROWSE_TTL) return cached.value;
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`Browse HTTP ${response.status}`);
  const value = Buffer.from(await response.arrayBuffer());
  browsePngCache.set(url, { value, at: Date.now() });
  return value;
}

async function loadBrowse(url) {
  return decodePngToRgb(await fetchBrowsePng(url));
}

/** Cropped NISAR L-band browse image for a before/after card. */
export async function renderNisarCrop(url, crop) {
  if (!url) return null;
  const key = `crop:${url}:${JSON.stringify(normalizeCrop(crop))}`;
  const cached = browsePngCache.get(key);
  if (cached && Date.now() - cached.at < BROWSE_TTL) return cached.value;
  const image = await loadBrowse(url);
  const png = pngRgb(OUT_WIDTH, OUT_HEIGHT, sampleCrop(image, crop));
  browsePngCache.set(key, { value: png, at: Date.now() });
  return png;
}

/** Absolute change between two NISAR L-band browse images over one window. */
export async function renderNisarChange({ beforeUrl, beforeCrop, afterUrl, afterCrop }) {
  if (!beforeUrl || !afterUrl) return null;
  const key = `change:${beforeUrl}:${afterUrl}:${JSON.stringify(normalizeCrop(beforeCrop))}:${JSON.stringify(
    normalizeCrop(afterCrop)
  )}`;
  const cached = browsePngCache.get(key);
  if (cached && Date.now() - cached.at < BROWSE_TTL) return cached.value;

  const [beforeImage, afterImage] = await Promise.all([loadBrowse(beforeUrl), loadBrowse(afterUrl)]);
  const before = sampleCrop(beforeImage, beforeCrop);
  const after = sampleCrop(afterImage, afterCrop);
  const out = Buffer.alloc(OUT_WIDTH * OUT_HEIGHT * 3);
  const floor = 8; // browse-image noise floor (0-255)
  const span = 70;
  for (let i = 0; i < OUT_WIDTH * OUT_HEIGHT; i += 1) {
    const index = i * 3;
    const lumBefore = 0.299 * before[index] + 0.587 * before[index + 1] + 0.114 * before[index + 2];
    const lumAfter = 0.299 * after[index] + 0.587 * after[index + 1] + 0.114 * after[index + 2];
    const delta = Math.abs(lumAfter - lumBefore);
    const shown = delta <= floor ? 0 : Math.min(span, delta);
    const value = Math.round((shown / span) * 255);
    out[index] = value;
    out[index + 1] = value;
    out[index + 2] = value;
  }
  const png = pngRgb(OUT_WIDTH, OUT_HEIGHT, out);
  browsePngCache.set(key, { value: png, at: Date.now() });
  return png;
}
