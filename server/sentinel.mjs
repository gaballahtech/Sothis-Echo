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
import { fromUrl } from 'geotiff';
import { buildNisarBrowse, buildNisarSite, comparisonCrops } from './nisar.mjs';

const STAC_URL = 'https://earth-search.aws.element84.com/v1/search';
const COLLECTION = 'sentinel-1-grd';
const WINDOW = 512;
const CACHE_TTL = 6 * 60 * 60 * 1000;
const cache = new Map();
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
      limit: 60,
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

async function readBand(item, asset, lat, lng) {
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
      return stats(rasters[0]);
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

async function readScene(item, site) {
  const lat = site.coords.lat;
  const lng = site.coords.lng;
  const vv = await readBand(item, 'vv', lat, lng);
  const vh = await readBand(item, 'vh', lat, lng);
  if (!vv || !vh) return null;
  // A window outside valid data reads as near-zero DN; reject it.
  if (vv.mean < 5 || vh.mean < 5) return null;
  return {
    date: (item.properties?.datetime || '').slice(0, 10),
    datetime: item.properties?.datetime || null,
    vvDb: toDb(vv.mean),
    vhDb: toDb(vh.mean),
    crossDb: toDb(vh.mean) - toDb(vv.mean),
    lowFraction: vv.lowFraction,
    stdDb: 20 * Math.log10(1 + vv.std / Math.max(1, vv.mean)),
    itemId: item.id,
    quicklook: s3ToHttps(item.assets?.thumbnail?.href),
    vvHref: s3ToHttps(item.assets?.vv?.href),
    vhHref: s3ToHttps(item.assets?.vh?.href),
    platform: item.properties?.platform || item.properties?.['sar:platform'] || 'Sentinel-1',
  };
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

function pickScenes(items, eventDate, max = 8) {
  const sorted = [...items].sort(
    (a, b) => new Date(a.properties.datetime) - new Date(b.properties.datetime)
  );
  if (sorted.length <= max) return sorted;
  const event = new Date(`${eventDate}T00:00:00Z`).getTime();
  const before = sorted.filter((item) => new Date(item.properties.datetime).getTime() <= event);
  const after = sorted.filter((item) => new Date(item.properties.datetime).getTime() > event);
  const perSide = Math.max(1, Math.floor(max / 2));
  const picked = [...sampleEvenly(before, perSide), ...sampleEvenly(after, max - Math.min(perSide, before.length))];
  const remaining = sorted.filter((item) => !picked.includes(item));
  for (const item of remaining) {
    if (picked.length >= max) break;
    picked.push(item);
  }
  return picked
    .filter((item, index, array) => array.indexOf(item) === index)
    .sort((a, b) => new Date(a.properties.datetime) - new Date(b.properties.datetime));
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
    const nisarCalibrated =
      process.env.NISAR_GCOV === '1'
        ? await buildNisarSite(site, { start, end, eventDate }).catch((error) => {
            log(site.id, 'nisar gcov failed', error?.message);
            return null;
          })
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
      return { ...nisarCalibrated, seriesSource: 'nisar-gcov-l-band' };
    }

    // Query both sides of the event so the series always has a real baseline.
    const [pre, post] = await Promise.all([
      searchStac({ bbox, start, end: eventDate }),
      searchStac({ bbox, start: eventDate, end }),
    ]);
    const seenIds = new Set();
    const items = [...pre, ...post].filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
    log(site.id, 'bbox', bbox, 'items', items.length, 'pre', pre.length, 'post', post.length);
    if (!items.length) return null;
    const picked = pickScenes(items, eventDate);
    const scenes = (
      await mapLimit(picked, 2, (item) =>
        readScene(item, site).catch((error) => {
          log(site.id, 'scene failed', item.id, error?.message, error?.stack?.split('\n')[1]);
          return null;
        })
      )
    ).filter(Boolean);
    log(site.id, 'picked', picked.length, 'scenes', scenes.length);
    if (scenes.length < 2) return null;

    const eventMs = new Date(`${eventDate}T00:00:00Z`).getTime();
    const unique = [];
    for (const scene of scenes) {
      if (!unique.some((item) => item.date === scene.date)) unique.push(scene);
    }
    const before = unique.filter((scene) => new Date(`${scene.date}T00:00:00Z`).getTime() <= eventMs);
    const after = unique.filter((scene) => new Date(`${scene.date}T00:00:00Z`).getTime() > eventMs);
    const beforeScene = before[before.length - 1] || unique[0];
    const afterScene = after[0] || unique[unique.length - 1];

    const baselineVv = beforeScene.vvDb;
    const baselineVh = beforeScene.vhDb;
    const eventVv = Math.min(...scenes.map((scene) => scene.vvDb));

    const series = unique.map((scene) => ({
      date: scene.date,
      vv: Number(scene.vvDb.toFixed(1)),
      vh: Number(scene.vhDb.toFixed(1)),
      ...(site.id === 'sundarbans'
        ? { water: Number(scene.lowFraction.toFixed(2)) }
        : { burn: Number(scene.lowFraction.toFixed(2)) }),
      change: Number(clamp01(Math.abs(scene.vvDb - baselineVv) / 12).toFixed(2)),
    }));

    const recoveryPoints = after.map((scene) => {
      const month = Math.max(
        0,
        Math.round(
          (new Date(`${scene.date}T00:00:00Z`).getTime() - eventMs) / (30.44 * 24 * 3600 * 1000)
        )
      );
      const pct =
        baselineVv === eventVv
          ? 100
          : clamp01((scene.vvDb - eventVv) / (baselineVv - eventVv)) * 100;
      return { month, pct: Math.round(pct), projected: false };
    });
    // ensure strictly increasing months
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
    // the slider really shows the same place on both sides.
    if (nisarBrowse?.after?.quad && optical?.bbox) {
      const crops = comparisonCrops(site, { quad: nisarBrowse.after.quad, imageBbox: optical.bbox });
      if (crops) {
        nisarBrowse.after.imageUrl = nisarBrowse.after.latlonUrl || nisarBrowse.after.imageUrl;
        nisarBrowse.after.crop = crops.crop;
        optical.crop = crops.opticalCrop;
      }
    }

    const changes = series.map((point) => point.change);
    const stableChanges = changes.slice(0, Math.max(2, Math.floor(changes.length / 2)));

    const states = {
      before: {
        date: beforeScene.date,
        params: { ...site.states.before.params },
        imageUrl: beforeScene.quicklook,
        attribution:
          'Contains modified Copernicus Sentinel-1 data, processed by ESA — AWS Open Data quicklook.',
        acquiredAt: beforeScene.datetime,
        product: 'Sentinel-1 GRD',
        notSimulated: true,
      },
      after: {
        date: afterScene.date,
        params: { ...site.states.after.params },
        imageUrl: afterScene.quicklook,
        attribution:
          'Contains modified Copernicus Sentinel-1 data, processed by ESA — AWS Open Data quicklook.',
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

    if (nisarBrowse) {
      for (const side of ['before', 'after']) {
        const nisar = nisarBrowse[side];
        if (!nisar?.imageUrl) continue;
        // Keep the site-specific Sentinel-1 quicklook in `imageUrl` (it is
        // reused by the before/after cards and the detective game). NISAR's
        // full-swath browse is exposed separately for the radar/optical
        // comparison, where it is shown once.
        Object.assign(states[side], {
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

    return {
      id: site.id,
      source: nisarBrowse ? 'sentinel-1-cog+nisar-browse' : 'sentinel-1-cog',
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
      series,
      pulse: resample16(changes),
      stablePulse: resample16(stableChanges),
      recovery: { thresholdDefault: 80, points: recovery.length >= 2 ? recovery : undefined },
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
