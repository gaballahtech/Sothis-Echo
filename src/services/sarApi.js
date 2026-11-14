import { studyAreas, SITE_DATA_VERSION } from '../data/sites.js';

/**
 * Backend-ready data adapter.
 *
 * With no `VITE_API_BASE_URL`, the app performs ZERO network requests and uses
 * the bundled illustrative dataset (source: "local"). With a base URL, the
 * adapter tries the API first and merges NUMERIC fields into the local
 * narrative. Prose stays in the bundle until the backend ships a CMS; that
 * keeps the UI readable even if an API response is partial.
 *
 * Expected envelope (plain object/array also accepted):
 *   { "data": <payload>, "success": true }
 */

const ENV = import.meta.env || {};
const RAW_BASE = ENV.VITE_API_BASE_URL || '';
export const API_BASE = RAW_BASE.replace(/\/+$/, '');
const TIMEOUT_MS = Number(ENV.VITE_API_TIMEOUT || 60000);

export const isApiConfigured = () => Boolean(API_BASE);

export function getApiConfig() {
  return {
    configured: isApiConfigured(),
    base: API_BASE || null,
    timeoutMs: TIMEOUT_MS,
    version: SITE_DATA_VERSION,
  };
}

async function request(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    return payload?.data ?? payload;
  } finally {
    clearTimeout(timer);
  }
}

async function requestJson(path, { method = 'GET', body, headers = {}, timeout = TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { Accept: 'application/json', ...headers },
      body,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(payload?.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.detail = payload?.detail;
      throw error;
    }
    return payload?.data ?? payload;
  } finally {
    clearTimeout(timer);
  }
}

const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);
const clamp01 = (value, fallback) => {
  const number = toNumber(value);
  return number == null ? fallback : Math.max(0, Math.min(1, number));
};

function mergeParams(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  return {
    water: clamp01(remote.water, local.water),
    emergent: clamp01(remote.emergent, local.emergent),
    burn: clamp01(remote.burn, local.burn),
    cloud: clamp01(remote.cloud, local.cloud),
  };
}

function mergeSceneState(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  const merged = {
    ...local,
    date: typeof remote.date === 'string' && remote.date.length >= 4 ? remote.date : local.date,
    params: mergeParams(local.params, remote.params),
  };
  for (const key of [
    'imageUrl',
    'opticalUrl',
    'opticalDate',
    'opticalCloudCover',
    'opticalPlatform',
    'opticalAttribution',
    'opticalCrop',
    'attribution',
    'acquiredAt',
    'product',
    'notSimulated',
    'nisarImageUrl',
    'nisarCrop',
    'nisarDate',
    'nisarAttribution',
    'nisarAcquiredAt',
    'nisarProduct',
    'nisarGranule',
  ]) {
    if (remote[key] != null) merged[key] = remote[key];
  }
  return merged;
}

function mergeMeasurements(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  const merged = { ...local };
  for (const key of ['vv', 'vh', 'crossPol']) {
    const before = toNumber(remote[key]?.before);
    const after = toNumber(remote[key]?.after);
    if (before != null && after != null) merged[key] = { before, after };
  }
  for (const key of ['dateBefore', 'dateAfter', 'source']) {
    if (typeof remote[key] === 'string') merged[key] = remote[key];
  }
  return merged;
}

function mergeSeries(local, remote) {
  if (!Array.isArray(remote)) return local;
  const cleaned = remote
    .filter((point) => point && typeof point.date === 'string' && toNumber(point.vv) != null && toNumber(point.vh) != null)
    .map((point) => ({
      ...point,
      vv: toNumber(point.vv),
      vh: toNumber(point.vh),
      change: clamp01(point.change, 0),
      ...(point.water != null ? { water: clamp01(point.water, 0) } : {}),
      ...(point.burn != null ? { burn: clamp01(point.burn, 0) } : {}),
    }));
  return cleaned.length >= 2 ? cleaned : local;
}

function mergePulse(local, remote) {
  if (!Array.isArray(remote) || remote.length !== 16) return local;
  const cleaned = remote.map((value) => clamp01(value, 0));
  return cleaned.some((value) => value > 0) ? cleaned : local;
}

function mergeRecovery(local, remote) {
  if (!remote || !Array.isArray(remote.points)) return local;
  const seen = new Set();
  const points = remote.points
    .filter((point) => point && toNumber(point.month) != null && toNumber(point.pct) != null)
    .map((point) => ({
      month: Math.max(0, toNumber(point.month)),
      pct: Math.max(0, Math.min(100, toNumber(point.pct))),
      projected: Boolean(point.projected),
    }))
    .filter((point) => {
      if (seen.has(point.month)) return false;
      seen.add(point.month);
      return true;
    })
    .sort((a, b) => a.month - b.month);
  if (points.length < 2) return local;
  const threshold = toNumber(remote.thresholdDefault);
  return {
    ...local,
    thresholdDefault: threshold != null ? Math.max(50, Math.min(95, threshold)) : local.thresholdDefault,
    points,
  };
}

function mergeSite(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  const lat = toNumber(remote.coords?.lat);
  const lng = toNumber(remote.coords?.lng);
  return {
    ...local,
    coords: lat != null && lng != null ? { lat, lng } : local.coords,
    wkt: typeof remote.wkt === 'string' && remote.wkt.startsWith('POLYGON') ? remote.wkt : local.wkt,
    states: {
      before: mergeSceneState(local.states.before, remote.states?.before),
      after: mergeSceneState(local.states.after, remote.states?.after),
    },
    measurements: mergeMeasurements(local.measurements, remote.measurements),
    series: mergeSeries(local.series, remote.series),
    pulse: mergePulse(local.pulse, remote.pulse),
    stablePulse: mergePulse(local.stablePulse, remote.stablePulse),
    recovery: mergeRecovery(local.recovery, remote.recovery),
    updatedAt: typeof remote.updatedAt === 'string' ? remote.updatedAt : null,
  };
}

/**
 * Load the study areas.
 * @returns {Promise<{sites: typeof studyAreas, source: 'api'|'local', error: string|null}>}
 */
export async function loadStudyAreas() {
  if (!isApiConfigured()) {
    return { sites: studyAreas, source: 'local', error: null };
  }
  try {
    const payload = await request('/study-areas');
    const list = Array.isArray(payload) ? payload : payload?.sites;
    if (!Array.isArray(list) || !list.length) {
      throw new Error('Empty /study-areas payload');
    }
    const sites = studyAreas.map((local) => mergeSite(local, list.find((s) => s.id === local.id)));
    return { sites, source: 'api', error: null };
  } catch (error) {
    return {
      sites: studyAreas,
      source: 'local',
      error: error instanceof Error ? error.message : 'Unknown API error',
    };
  }
}

/** Optional live mission/receiver status for the hero panel. */
export async function loadMissionStatus() {
  if (!isApiConfigured()) return null;
  try {
    return await request('/nisar/status');
  } catch {
    return null;
  }
}

/** Load one study area by id. */
export async function loadSite(id) {
  if (!isApiConfigured()) return null;
  try {
    const payload = await request(`/study-areas/${encodeURIComponent(id)}`);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/** Backscatter time series for one site. */
export async function loadSeries(id, { start, end } = {}) {
  if (!isApiConfigured()) return null;
  try {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const qs = params.toString();
    const payload = await request(`/sites/${encodeURIComponent(id)}/series${qs ? `?${qs}` : ''}`);
    return Array.isArray(payload) ? payload : payload?.series ?? null;
  } catch {
    return null;
  }
}

/** Recovery curve + fit for one site. */
export async function loadRecovery(id, threshold = 80) {
  if (!isApiConfigured()) return null;
  try {
    const payload = await request(`/sites/${encodeURIComponent(id)}/recovery?threshold=${encodeURIComponent(threshold)}`);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/** 16-pass sonification series. */
export async function loadSonification(id) {
  if (!isApiConfigured()) return null;
  try {
    const payload = await request(`/sonification/${encodeURIComponent(id)}`);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/** Optional scene image metadata + attribution. */
export async function loadSceneMeta(id, state) {
  if (!isApiConfigured()) return null;
  try {
    const payload = await request(`/scenes/${encodeURIComponent(id)}/${encodeURIComponent(state)}`);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/** Provenance block. */
export async function loadAttribution(id) {
  if (!isApiConfigured()) return null;
  try {
    const payload = await request(`/attribution/${encodeURIComponent(id)}`);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/** Health check. */
export async function loadHealth() {
  if (!isApiConfigured()) return null;
  try {
    const payload = await request('/health');
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/** Search the live SAR backend for scenes over a WKT polygon. */
export async function searchScenes({ wkt, startDate, endDate, platform = 'SENTINEL-1' } = {}) {
  if (!isApiConfigured() || !wkt) return null;
  try {
    return await requestJson('/search/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wkt, start_date: startDate, end_date: endDate, platform }),
    });
  } catch {
    return null;
  }
}

/** List saved scenes from the live backend. */
export async function loadScenes() {
  if (!isApiConfigured()) return null;
  try {
    const payload = await requestJson('/scenes/');
    return Array.isArray(payload) ? payload : null;
  } catch {
    return null;
  }
}

/** Load one saved scene. */
export async function loadScene(id) {
  if (!isApiConfigured()) return null;
  try {
    return await requestJson(`/scenes/${encodeURIComponent(id)}/`);
  } catch {
    return null;
  }
}

/** Upload VV/VH GeoTIFFs and build a compressed preview. */
export async function buildGeotiff(id, { vvFile, vhFile, maxBytes } = {}) {
  if (!isApiConfigured() || !vvFile) return null;
  const form = new FormData();
  form.append('vv_file', vvFile);
  if (vhFile) form.append('vh_file', vhFile);
  if (maxBytes) form.append('max_bytes', String(maxBytes));
  try {
    return await requestJson(`/scenes/${encodeURIComponent(id)}/geotiff/`, {
      method: 'POST',
      body: form,
      timeout: Math.max(TIMEOUT_MS, 120000),
    });
  } catch {
    return null;
  }
}

/** Send the built preview to GeoAI and return the saved scene + report. */
export async function analyzeScene(id, { prompt, requestedModel = 'auto', point, box } = {}) {
  if (!isApiConfigured() || !prompt) return null;
  try {
    return await requestJson(`/scenes/${encodeURIComponent(id)}/analyze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        requested_model: requestedModel,
        ...(point ? { point } : {}),
        ...(box ? { box } : {}),
      }),
      timeout: Math.max(TIMEOUT_MS, 180000),
    });
  } catch {
    return null;
  }
}

/** Build a CSV export of a site's numeric series + recovery table. */
export function buildSiteCsv(site) {
  const localizedName = site.name?.en ?? site.id;
  const rows = [
    ['site', 'date_or_month', 'vv_db', 'vh_db', 'water_fraction', 'burn_fraction', 'change_index', 'recovery_pct', 'projected'],
  ];
  for (const point of site.series || []) {
    rows.push([
      localizedName,
      point.date,
      point.vv ?? '',
      point.vh ?? '',
      point.water ?? '',
      point.burn ?? '',
      point.change ?? '',
      '',
      '',
    ]);
  }
  for (const point of site.recovery?.points || []) {
    rows.push([localizedName, `month_${point.month}`, '', '', '', '', '', point.pct, point.projected ? 'yes' : 'no']);
  }
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}
