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
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fromArrayBuffer } from 'geotiff';

const ASF_SEARCH = 'https://api.daac.asf.alaska.edu/services/search/param';
const HARMONY = 'https://harmony.earthdata.nasa.gov';
const VALIDATED = 'C3622241360-ASF';
const PROVISIONAL = 'C2854338529-ASF';
const CACHE_DIR = path.resolve('server/.cache/nisar');
const CACHE_TTL = 6 * 60 * 60 * 1000;
const DEBUG = process.env.DEBUG_REAL === '1';
const log = (...args) => {
  if (DEBUG) console.error('[nisar]', ...args);
};

const cache = new Map();
const clamp01 = (value) => Math.max(0, Math.min(1, value));

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

async function harmonyGeoTiff(granule, bbox, variable) {
  const tag = `${granule.granuleName}_${variable.split('/').pop()}`;
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
      '230',
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

async function readStats(buffer) {
  const bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const tiff = await fromArrayBuffer(bytes);
  const image = await tiff.getImage();
  const [band] = await image.readRasters({ samples: [0] });
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;
  let low = 0;
  for (const raw of band) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) continue;
    if (value < min) min = value;
    if (value > max) max = value;
    sum += value;
    count += 1;
  }
  if (!count) return null;
  const mean = sum / count;
  const threshold = min + (max - min) * 0.25;
  for (const raw of band) {
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0 && value <= threshold) low += 1;
  }
  return {
    mean,
    db: 10 * Math.log10(mean),
    lowFraction: low / count,
    count,
    width: image.getWidth(),
    height: image.getHeight(),
  };
}

async function readGranule(granule, bbox) {
  const [hh, hv] = await Promise.all([
    harmonyGeoTiff(granule, bbox, '/science/LSAR/GCOV/grids/frequencyA/HHHH'),
    harmonyGeoTiff(granule, bbox, '/science/LSAR/GCOV/grids/frequencyA/HVHV'),
  ]);
  const [hhStats, hvStats] = await Promise.all([readStats(hh), readStats(hv)]);
  if (!hhStats || !hvStats) return null;
  return {
    date: (granule.startTime || '').slice(0, 10),
    datetime: granule.startTime || null,
    hhDb: hhStats.db,
    hvDb: hvStats.db,
    crossDb: hvStats.db - hhStats.db,
    lowFraction: hhStats.lowFraction,
    imageUrl: browseUrl(granule),
    granuleName: granule.granuleName,
    track: granule.track,
    frame: granule.frameNumber,
    processingLevel: /NISAR_L2_GCOV_V1/i.test(granule.downloadUrl || '') ? 'validated' : 'provisional',
  };
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
  const side = Math.max(1, Math.floor((max - 2) / 2));
  const extrasBefore = rest
    .filter((item) => new Date(item.startTime).getTime() <= event)
    .slice(-side);
  const extrasAfter = rest.filter((item) => new Date(item.startTime).getTime() > event).slice(0, side);
  picked.push(...extrasBefore, ...extrasAfter);
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
  const shape = (granule) =>
    granule && {
      date: (granule.startTime || '').slice(0, 10),
      datetime: granule.startTime || null,
      imageUrl: browseUrl(granule),
      granuleName: granule.granuleName,
      track: granule.track,
      frame: granule.frameNumber,
      product: 'NISAR GCOV L-band (HH) browse',
    };
  if (!before || !after) return null;
  return { before: shape(before), after: shape(after) };
}

export async function buildNisarSite(site, { start, end, eventDate }) {
  const key = site.id;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.value;
  if (cached?.promise) return cached.promise;

  const promise = (async () => {
    const bbox = site.bbox || bboxFromWkt(site.wkt);
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
      vh: Number(scene.hvDb.toFixed(1)),
      ...(site.id === 'sundarbans'
        ? { water: Number(scene.lowFraction.toFixed(2)) }
        : { burn: Number(scene.lowFraction.toFixed(2)) }),
      change: Number(clamp01(Math.abs(scene.hhDb - baseline) / 12).toFixed(2)),
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
}
