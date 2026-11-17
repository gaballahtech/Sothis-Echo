/**
 * Sothis Echo — complete local backend.
 *
 * Implements both:
 *   1. The live SAR workflow described in the frontend guide:
 *        search → geotiff → analyze
 *      (GET /health/, POST /api/search/, GET /api/scenes/, GET /api/scenes/:id/,
 *       POST /api/scenes/:id/geotiff/, POST /api/scenes/:id/analyze/)
 *   2. The compatibility contract used by the Sothis Echo UI
 *      (GET /api/study-areas, /api/sites/:id/series, /api/sonification/:id, …).
 *
 * No external dependencies. GeoAI (Hugging Face Gradio Space) is called over
 * its raw HTTP API when GEOAI_BASE_URL is set; otherwise a transparent demo
 * report is returned so the UI works offline.
 *
 * Run:
 *   npm run api
 *   VITE_API_BASE_URL=http://127.0.0.1:3001/api npm run dev
 */
import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { studyAreas } from '../src/data/sites.js';
import { buildRealSite, clearRealCache, renderChangeCrop, renderSceneCrop } from './sentinel.mjs';
import {
  clearNisarCache,
  computeNisarChangeStats,
  nisarSnapshot,
  nisarRecoverySnapshot,
  nisarSnapshotHh,
  nisarSnapshotChange,
  nisarSnapshotRgb,
  probeHarmony,
  renderNisarChange,
  renderNisarCrop,
  renderNisarRgb,
} from './nisar.mjs';

try {
  process.loadEnvFile('.env.local');
} catch {
  /* .env.local is optional */
}

const PORT = Number(process.env.API_PORT || process.env.MOCK_API_PORT || 3001);
const HOST = process.env.API_HOST || process.env.MOCK_API_HOST || '0.0.0.0';
// Origin allow-list. The deployed frontend and Vercel preview URLs must be
// accepted by default, otherwise every browser request dies at the preflight
// even though the API itself answers.
const CORS_ALLOW = (process.env.CORS_ORIGIN ||
  [
    'https://sothisecho.vercel.app',
    'https://*.vercel.app',
    'http://localhost:*',
    'http://127.0.0.1:*',
  ].join(','))
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

function resolveOrigin(req) {
  const origin = req?.headers?.origin;
  if (CORS_ALLOW.includes('*')) return '*';
  if (!origin) return CORS_ALLOW[0];
  const allowed = CORS_ALLOW.some((rule) => {
    if (rule === origin) return true;
    const wildcard = rule.indexOf('*');
    if (wildcard === -1) return false;
    const prefix = rule.slice(0, wildcard);
    const suffix = rule.slice(wildcard + 1);
    return origin.startsWith(prefix) && origin.endsWith(suffix);
  });
  return allowed ? origin : CORS_ALLOW[0];
}
const GEOAI_BASE = (process.env.GEOAI_BASE_URL ?? 'https://mohamed4540-geoai-models.hf.space').replace(/\/+$/, '');
const GEOAI_TIMEOUT = Number(process.env.GEOAI_TIMEOUT || 120000);
const MAX_BYTES = Number(process.env.MAX_GEOTIFF_BYTES || 100 * 1024 * 1024);
const VERSION = 'sothis-echo-backend-2';
const REAL_DATA = process.env.REAL_DATA !== '0';

const MODELS = new Set(['auto', 'gemini_only', 'prithvi', 'sam_hq']);

const round1 = (value) => Math.round(value * 10) / 10;
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const clampPct = (value) => Math.max(0, Math.min(100, value));

/* ------------------------------------------------------------------ */
/* Seed scenes + compatibility fixtures                                */
/* ------------------------------------------------------------------ */

function wktToGeoJSON(wkt) {
  if (typeof wkt !== 'string') return null;
  const match = wkt.match(/POLYGON\s*\(\((.*)\)\)/i);
  if (!match) return null;
  const ring = match[1]
    .split(',')
    .map((pair) => pair.trim().split(/\s+/).map(Number))
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (ring.length < 3) return null;
  return { type: 'Polygon', coordinates: [[...ring, ring[0]]] };
}

let nextSceneId = 1;
const scenes = [];

for (const site of studyAreas) {
  const geometry = wktToGeoJSON(site.wkt);
  for (const state of ['before', 'after']) {
    const source = site.states[state];
    const date = source.date;
    scenes.push({
      id: nextSceneId++,
      file_id: `S1A_IW_GRDH_${site.id.toUpperCase()}_${state.toUpperCase()}`,
      scene_name: `${site.id} ${state}`,
      platform: 'Sentinel-1',
      sensor: 'C-SAR',
      processing_level: 'GRD',
      beam_mode: 'IW',
      polarization: 'VV+VH',
      start_time: `${date}T04:12:00Z`,
      stop_time: `${date}T04:12:25Z`,
      flight_direction: 'ASCENDING',
      orbit: 12345 + nextSceneId,
      path_number: 70,
      frame_number: 450,
      file_size_bytes: 987654321,
      download_url: `https://example.invalid/${site.id}/${state}`,
      geometry,
      source_metadata: { site_id: site.id, state, note: 'Fixture scene for the Sothis Echo demo.' },
      local_file: null,
      geotiff_file: null,
      geotiff_band_count: null,
      geotiff_size_bytes: null,
      analysis_report: {},
      created_at: new Date().toISOString(),
      _siteId: site.id,
      _state: state,
    });
  }
}

const sceneById = (id) => scenes.find((scene) => String(scene.id) === String(id));

const publicScene = (scene) => {
  const out = {};
  for (const [key, value] of Object.entries(scene)) {
    if (!key.startsWith('_')) out[key] = value;
  }
  return out;
};

const fixtures = studyAreas.map((site) => {
  // No cosmetic offsets: a fixture is a copy of the bundled illustrative
  // record, and it must be labelled as such instead of mimicking a fresh
  // measurement.
  const vvBefore = round1(site.measurements.vv.before);
  const vvAfter = round1(site.measurements.vv.after);
  const vhBefore = round1(site.measurements.vh.before);
  const vhAfter = round1(site.measurements.vh.after);
  return {
    id: site.id,
    source: 'fixture',
    degraded: true,
    updatedAt: new Date().toISOString(),
    coords: site.coords,
    wkt: site.wkt,
    states: {
      before: { date: site.states.before.date, params: { ...site.states.before.params } },
      after: { date: site.states.after.date, params: { ...site.states.after.params } },
    },
    measurements: {
      vv: { before: vvBefore, after: vvAfter },
      vh: { before: vhBefore, after: vhAfter },
      crossPol: { before: round1(vhBefore - vvBefore), after: round1(vhAfter - vvAfter) },
      dateBefore: site.measurements.dateBefore,
      dateAfter: site.measurements.dateAfter,
      source: 'fixture',
    },
    series: site.series.map((point) => ({ ...point })),
    pulse: site.pulse.map((value) => round1(clamp01(value))),
    stablePulse: site.stablePulse,
    recovery: {
      thresholdDefault: 80,
      points: site.recovery.points.map((point) => ({ ...point, pct: clampPct(point.pct - 5) })),
    },
  };
});

const DAY = 86_400_000;

/**
 * Real Sentinel-1 data first; fall back to the labelled fixtures when the
 * public STAC/COG services are unreachable.
 */
let lastBuild = null;

async function getSites() {
  if (!REAL_DATA) {
    lastBuild = { at: Date.now(), sites: fixtures, degraded: true };
    return fixtures;
  }
  const sites = await Promise.all(
    studyAreas.map(async (site) => {
      const fixture = fixtures.find((item) => item.id === site.id);
      const event = new Date(`${site.eventDate}T00:00:00Z`).getTime();
      const start = new Date(event - 90 * DAY).toISOString().slice(0, 10);
      const end = new Date(event + 120 * DAY).toISOString().slice(0, 10);
      try {
        const real = await buildRealSite(site, { start, end, eventDate: site.eventDate });
        if (!real) {
          console.error('[SOTHIS API] real build empty for', site.id);
          return {...fixture, degradedReason: 'empty real build'};
        }
        const merged = { ...fixture, ...real };
        delete merged.degraded;
        delete merged.degradedReason;
        // Calibrated L-band recovery + measurements + time series from the
        // bundled NISAR GCOV series. Every number (cards, change map, table,
        // recovery) then comes from the same sensor and calibration pipeline.
        const nisarRecovery = nisarRecoverySnapshot(site.id);
        if (nisarRecovery?.points?.length >= 2) {
          merged.recovery = {
            thresholdDefault: nisarRecovery.thresholdDefault ?? 80,
            points: nisarRecovery.points,
            fromApi: true,
            source: nisarRecovery.source,
            calibrated: nisarRecovery.calibrated,
            note: nisarRecovery.note,
          };
          if (nisarRecovery.measurements) merged.measurements = nisarRecovery.measurements;
          if (Array.isArray(nisarRecovery.series)) merged.series = nisarRecovery.series;
          if (Array.isArray(nisarRecovery.pulse)) merged.pulse = nisarRecovery.pulse;
          if (Array.isArray(nisarRecovery.stablePulse)) merged.stablePulse = nisarRecovery.stablePulse;
          if (merged.provenance) {
            merged.provenance = {
              ...merged.provenance,
              numbers: {
                sensor: 'NISAR',
                mission: 'NASA / ISRO',
                band: 'L',
                polarizations: ['HH', 'HV'],
                product: 'GCOV HHHH/HVHV subset (gamma-0)',
                unit: 'gamma0_power_db',
                calibration: '10·log10(gamma-0 power) — calibrated gamma-0',
                calibrated: true,
                source: 'nisar-gcov-asf-h5',
              },
            };
          }
        }
        return merged;
      } catch (error) {
        // Never hide a fallback: the payload says fixture/degraded so the UI
        // cannot label these numbers as live.
        console.error('[SOTHIS API] real build failed for', site.id, error?.message, error?.stack);
        return {...fixture, degradedReason: error?.message || 'build failed'};
      }
    })
  );
  lastBuild = { at: Date.now(), sites, degraded: sites.some((site) => site.degraded) };
  return sites;
}

/** Window used by every NISAR route, derived from the site's event date. */
function siteWindow(site) {
  const event = new Date(`${site.eventDate}T00:00:00Z`).getTime();
  return {
    start: new Date(event - 90 * DAY).toISOString().slice(0, 10),
    end: new Date(event + 120 * DAY).toISOString().slice(0, 10),
  };
}

/* ------------------------------------------------------------------ */
/* HTTP helpers                                                        */
/* ------------------------------------------------------------------ */

function send(res, status, payload, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message, detail) {
  send(res, status, { success: false, error: message, ...(detail ? { detail } : {}) });
}

function readBody(req, limit = MAX_BYTES + 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const body = await readBody(req);
  if (!body.length) return {};
  try {
    return JSON.parse(body.toString('utf8'));
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { status: 400 });
  }
}

/** Minimal multipart/form-data parser (fields + file buffers). */
function parseMultipart(buffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let cursor = buffer.indexOf(delimiter);
  while (cursor !== -1) {
    const next = buffer.indexOf(delimiter, cursor + delimiter.length);
    if (next === -1) break;
    const chunk = buffer.slice(cursor + delimiter.length, next);
    const headerEnd = chunk.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const headerText = chunk.slice(0, headerEnd).toString('utf8');
      let data = chunk.slice(headerEnd + 4);
      if (data.length >= 2 && data[data.length - 2] === 13 && data[data.length - 1] === 10) {
        data = data.slice(0, -2);
      }
      const name = headerText.match(/name="([^"]+)"/)?.[1];
      const filename = headerText.match(/filename="([^"]*)"/)?.[1];
      const contentType = headerText.match(/Content-Type:\s*([^\r\n]+)/i)?.[1];
      if (name) parts.push({ name, filename, contentType, data });
    }
    cursor = next;
  }
  return parts;
}

const geoaiReport = ({ prompt, model, siteId, state }) => ({
  route: {
    model: model === 'auto' ? 'prithvi' : model,
    reason:
      model === 'auto'
        ? 'Auto routed to prithvi for surface-water segmentation; no GeoAI base URL configured, so the backend returned its deterministic demo report.'
        : `Requested model ${model}; GeoAI was not reachable, so the backend returned its deterministic demo report.`,
  },
  report: {
    summary: `Demo analysis for ${siteId} (${state}) from the Sothis Echo backend. Prompt: "${prompt}". This is a deterministic placeholder, not an official NISAR product.`,
    observations: [
      'Dark, low-backscatter patches are consistent with open water.',
      'Bright double-bounce returns occur where trunks stand in water.',
      'The VV/VH contrast is strongest near the wetland channels.',
    ],
    uncertainties: [
      'Speckle and terrain shadow are not corrected in this demo.',
      'No tide or acquisition-time metadata was used.',
    ],
    recommended_next_steps: [
      'Upload calibrated VV/VH GeoTIFFs to /geotiff/.',
      'Re-run /analyze/ with requested_model=auto.',
      'Compare against a pre-event baseline pass.',
    ],
    confidence: 0.6,
  },
});

async function callGeoAI({ buffer, filename, contentType, prompt, model, point, box }) {
  if (!GEOAI_BASE) throw new Error('GeoAI is disabled');
  const signal = AbortSignal.timeout(GEOAI_TIMEOUT);

  const form = new FormData();
  form.append('files', new Blob([buffer], { type: contentType || 'application/octet-stream' }), filename || 'scene.tif');
  const upload = await fetch(`${GEOAI_BASE}/gradio_api/upload`, { method: 'POST', body: form, signal });
  if (!upload.ok) throw new Error(`GeoAI upload failed: HTTP ${upload.status}`);
  const uploaded = await upload.json();
  const remotePath = Array.isArray(uploaded) ? uploaded[0] : uploaded?.path;
  if (!remotePath) throw new Error('GeoAI upload returned no path');

  const data = [
    { path: remotePath, meta: { _type: 'gradio.FileData' } },
    prompt,
    model,
    point ? point[0] : null,
    point ? point[1] : null,
    box ? box.join(',') : '',
  ];

  const call = await fetch(`${GEOAI_BASE}/gradio_api/call/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
    signal,
  });
  if (!call.ok) throw new Error(`GeoAI call failed: HTTP ${call.status}`);
  const { event_id: eventId } = await call.json();
  if (!eventId) throw new Error('GeoAI returned no event_id');

  const stream = await fetch(`${GEOAI_BASE}/gradio_api/call/analyze/${eventId}`, { signal });
  if (!stream.ok) throw new Error(`GeoAI stream failed: HTTP ${stream.status}`);
  const text = await stream.text();
  let result = null;
  for (const line of text.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const raw = line.slice(5).trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) result = parsed[0];
      else if (parsed && typeof parsed === 'object') result = parsed;
    } catch {
      /* ignore non-JSON SSE frames */
    }
  }
  if (!result) throw new Error('GeoAI returned no result');
  if (result.error) throw new Error(String(result.error));
  return result;
}

/* ------------------------------------------------------------------ */
/* Server                                                              */
/* ------------------------------------------------------------------ */

/**
 * The whole router. Exported so the same code can be mounted as a Vercel
 * serverless function (`api/[...path].mjs`) as well as a local http server.
 */
export async function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', resolveOrigin(req));
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Max-Age': '600',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  // Vercel only serves one path segment per function file, so every /api/*
  // request is rewritten to the function and carries its real path here.
  const path = (url.searchParams.get('__path') || url.pathname).replace(/\/+$/, '') || '/';
  const method = req.method || 'GET';

  try {
    /* ---------------- live SAR workflow ---------------- */

    if (path === '/health' || path === '/api/health') {
      send(res, 200, { status: 'ok', timestamp: new Date().toISOString(), version: VERSION, realData: REAL_DATA });
      return;
    }

    if (path === '/api/live/refresh' && method === 'POST') {
      // Cache invalidation is an operator action, never an anonymous one.
      const expected = process.env.LIVE_REFRESH_TOKEN;
      const header = req.headers['x-refresh-token'];
      const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const supplied = header || bearer;
      if (!expected || !supplied || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
        sendError(res, 403, 'Forbidden');
        return;
      }
      clearRealCache();
      clearNisarCache();
      send(res, 200, { success: true, message: 'Real-data cache cleared' });
      return;
    }

    if (path === '/api/search' && method === 'POST') {
      const body = await readJson(req);
      const wkt = body.wkt;
      if (typeof wkt !== 'string' || !/POLYGON/i.test(wkt)) {
        sendError(res, 400, 'wkt is required and must be a valid POLYGON');
        return;
      }
      const polygon = wktToGeoJSON(wkt);
      if (!polygon) {
        sendError(res, 400, 'wkt could not be parsed');
        return;
      }
      const platform = (body.platform || 'SENTINEL-1').toLowerCase();
      const matches = scenes.filter((scene) => scene.platform.toLowerCase().includes(platform.replace('sentinel-1', 'sentinel-1')));
      send(res, 200, { count: matches.length, polygon, scenes: matches.map(publicScene) });
      return;
    }

    if (path === '/api/scenes' && method === 'GET') {
      send(res, 200, scenes.map(publicScene));
      return;
    }

    const sceneMatch = path.match(/^\/api\/scenes\/([^/]+)$/);
    if (sceneMatch && method === 'GET') {
      const scene = sceneById(sceneMatch[1]);
      if (!scene) sendError(res, 404, 'Scene not found');
      else send(res, 200, publicScene(scene));
      return;
    }

    const geotiffMatch = path.match(/^\/api\/scenes\/([^/]+)\/geotiff$/);
    if (geotiffMatch && method === 'POST') {
      const scene = sceneById(geotiffMatch[1]);
      if (!scene) {
        sendError(res, 404, 'Scene not found');
        return;
      }
      const contentType = req.headers['content-type'] || '';
      const boundary = contentType.match(/boundary=(.+)$/)?.[1];
      if (!boundary) {
        sendError(res, 400, 'Expected multipart/form-data with vv_file');
        return;
      }
      const body = await readBody(req);
      const parts = parseMultipart(body, boundary.replace(/^"|"$/g, ''));
      const vv = parts.find((part) => part.name === 'vv_file');
      const vh = parts.find((part) => part.name === 'vh_file');
      const maxBytesField = parts.find((part) => part.name === 'max_bytes');
      if (!vv || !vv.data?.length) {
        sendError(res, 400, 'vv_file is required');
        return;
      }
      const limit = Number(maxBytesField?.data?.toString('utf8')) || MAX_BYTES;
      const totalBytes = vv.data.length + (vh?.data?.length || 0);
      if (totalBytes > limit) {
        sendError(res, 422, `GeoTIFF exceeds the ${limit} byte budget`);
        return;
      }
      scene.geotiff_file = vv.filename || `scene-${scene.id}.tif`;
      scene.geotiff_size_bytes = totalBytes;
      scene.geotiff_band_count = vh ? 3 : 3;
      scene.within_budget = totalBytes <= limit;
      scene._vvBuffer = vv.data;
      scene._vvType = vv.contentType;
      if (vh) {
        scene._vhBuffer = vh.data;
        scene._vhType = vh.contentType;
      }
      send(res, 200, { ...publicScene(scene), within_budget: scene.within_budget });
      return;
    }

    const analyzeMatch = path.match(/^\/api\/scenes\/([^/]+)\/analyze$/);
    if (analyzeMatch && method === 'POST') {
      const scene = sceneById(analyzeMatch[1]);
      if (!scene) {
        sendError(res, 404, 'Scene not found');
        return;
      }
      if (!scene.geotiff_file) {
        sendError(res, 400, 'Call /geotiff/ for this scene before /analyze/');
        return;
      }
      const body = await readJson(req);
      const prompt = body.prompt;
      if (typeof prompt !== 'string' || !prompt.trim()) {
        sendError(res, 400, 'prompt is required');
        return;
      }
      const model = body.requested_model || 'auto';
      if (!MODELS.has(model)) {
        sendError(res, 400, `requested_model must be one of: ${[...MODELS].join(', ')}`);
        return;
      }
      const point = Array.isArray(body.point) ? body.point : null;
      const box = Array.isArray(body.box) ? body.box : null;
      if (point && box) {
        sendError(res, 400, 'Send point or box, not both');
        return;
      }
      if (point && (point.length !== 2 || !point.every((value) => Number.isFinite(Number(value))))) {
        sendError(res, 400, 'point must be [x, y]');
        return;
      }
      if (box && (box.length !== 4 || !box.every((value) => Number.isFinite(Number(value))))) {
        sendError(res, 400, 'box must be [x1, y1, x2, y2]');
        return;
      }

      let analysis;
      if (GEOAI_BASE && scene._vvBuffer) {
        try {
          analysis = await callGeoAI({
            buffer: scene._vvBuffer,
            filename: scene.geotiff_file,
            contentType: scene._vvType,
            prompt,
            model,
            point,
            box,
          });
        } catch (error) {
          sendError(res, 502, 'GeoAI analysis failed', error instanceof Error ? error.message : String(error));
          return;
        }
      } else {
        analysis = geoaiReport({ prompt, model, siteId: scene._siteId, state: scene._state });
      }

      scene.analysis_report = {
        route: analysis.route || { model, reason: 'No route returned' },
        report: analysis.report || analysis,
      };
      scene.analyzed_at = new Date().toISOString();
      send(res, 200, publicScene(scene));
      return;
    }

    /* ---------------- Sothis Echo UI contract ---------------- */

    if (path === '/api/nisar/status') {
      const sites = lastBuild?.sites ?? [];
      const gcov = process.env.NISAR_GCOV === '1';
      send(res, 200, {
        data: {
          operational: true,
          phase: 'backend',
          products: sites.length
            ? [...new Set(sites.map((site) => site.source))]
            : REAL_DATA
              ? ['nisar-l-band-browse', 'sentinel-1-cog']
              : ['fixture'],
          realData: sites.length ? sites.some((site) => !site.degraded) : REAL_DATA,
          calibratedBackscatter: gcov,
          capabilities: { changeStats: gcov, rgbComposite: gcov },
          fallbackSites: sites.filter((site) => site.degraded).map((site) => site.id),
          builtAt: lastBuild?.at ? new Date(lastBuild.at).toISOString() : null,
        },
        success: true,
      });
      return;
    }

    if (path === '/api/nisar/diag') {
      if (process.env.DEBUG_REAL !== '1') {
        sendError(res, 404, 'Not found');
        return;
      }
      const siteId = url.searchParams.get('site');
      const site = studyAreas.find((item) => item.id === siteId);
      if (!site) {
        sendError(res, 404, 'Unknown site');
        return;
      }
      const diag = await probeHarmony(site, { ...siteWindow(site), eventDate: site.eventDate });
      send(res, 200, { data: { calibratedFlag: process.env.NISAR_GCOV === '1', ...diag }, success: true });
      return;
    }

    if (path === '/api/nisar/change-stats') {
      const siteId = url.searchParams.get('site');
      const site = studyAreas.find((item) => item.id === siteId);
      if (!site) {
        sendError(res, 404, 'Unknown site');
        return;
      }
      const threshold = Number(url.searchParams.get('threshold') || 3);
      const snapshot = nisarSnapshot(siteId);
      let stats = null;
      // The bundled snapshot answers in milliseconds. Live Harmony is opt-in so
      // a queued job can never stall a page request.
      if (url.searchParams.get('live') === '1') {
        stats = await computeNisarChangeStats(site, {
          ...siteWindow(site),
          eventDate: site.eventDate,
          thresholdDb: Number.isFinite(threshold) ? Math.max(0.5, Math.min(20, threshold)) : 3,
        }).catch((error) => {
          console.error('[SOTHIS API] change stats failed', siteId, error?.message);
          return null;
        });
      }
      if (!stats && snapshot?.changeStats) {
        stats = { ...snapshot.changeStats, snapshot: true, computedAt: snapshot.computedAt };
      }
      if (!stats) {
        sendError(res, 503, 'Calibrated change statistics are not available for this site right now');
        return;
      }
      send(res, 200, { data: stats, success: true });
      return;
    }

    if (path === '/api/study-areas') {
      const sites = await getSites();
      // A cold build walks the archive for a minute or more; without an edge
      // cache every visitor after an idle spell waits it out and the page falls
      // back to the bundled figures. Serve the last build instantly and refresh
      // it in the background instead. A degraded (fixture) build is only cached
      // briefly, so a transient failure self-heals instead of pinning the site
      // to the labelled fallback for half an hour.
      const degraded = sites.some((site) => site.degraded);
      send(res, 200, { data: sites, success: true }, {
        'Cache-Control': degraded
          ? 'public, s-maxage=30, stale-while-revalidate=60'
          : 'public, s-maxage=1800, stale-while-revalidate=86400',
      });
      return;
    }

    if (path === '/api/scene-image') {
      const siteId = url.searchParams.get('site');
      const side = url.searchParams.get('side');
      const source = url.searchParams.get('source');
      if (!siteId || (side !== 'before' && side !== 'after' && side !== 'change')) {
        sendError(res, 400, 'site and side=before|after|change are required');
        return;
      }
      const view = url.searchParams.get('view');
      // The HH browse view and the HH·HV composite are rendered from the same
      // HDF5 array and window, so toggling between them cannot jump spatially.
      if (view !== 'rgb' && source === 'nisar' && url.searchParams.get('live') !== '1') {
        const ready = side === 'change' ? nisarSnapshotChange(siteId) : nisarSnapshotHh(siteId, side);
        if (ready) {
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': ready.length,
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
            'Access-Control-Allow-Origin': resolveOrigin(req),
            'X-Nisar-View': side === 'change' ? 'change-calibrated' : 'hh-calibrated',
            'X-Nisar-Source': 'snapshot',
          });
          res.end(ready);
          return;
        }
      }
      // A bundled composite is answered before any archive/Harmony work.
      if (view === 'rgb' && url.searchParams.get('live') !== '1') {
        const ready = nisarSnapshotRgb(siteId, side === 'before' ? 'before' : 'after');
        if (ready) {
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': ready.length,
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
            'Access-Control-Allow-Origin': resolveOrigin(req),
            'X-Nisar-View': 'dual-pol-intensity-composite',
            'X-Nisar-Source': 'snapshot',
          });
          res.end(ready);
          return;
        }
      }
      // Building the site registers the two real passes this image is drawn
      // from; a cold request pays one build, afterwards the crop is cached.
      const sites = await getSites();
      const site = sites.find((item) => item.id === siteId);
      if (view === 'rgb') {
        if (!site) {
          sendError(res, 404, 'Unknown site');
          return;
        }
        const rgbSide = side === 'before' ? 'before' : 'after';
        const study = studyAreas.find((item) => item.id === siteId);
        if (!study) {
          sendError(res, 404, 'Unknown site');
          return;
        }
        let png = null;
        let source = 'snapshot';
        if (url.searchParams.get('live') === '1') {
          png = await renderNisarRgb(site, {
            ...siteWindow(study),
            side: rgbSide,
            eventDate: study.eventDate,
          }).catch((error) => {
            console.error('[SOTHIS API] NISAR RGB failed', siteId, error?.message);
            return null;
          });
          source = png ? 'live-gcov' : 'snapshot';
        }
        if (!png) png = nisarSnapshotRgb(siteId, rgbSide);
        if (!png) {
          sendError(res, 503, 'RGB composite could not be rendered from calibrated GCOV');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': png.length,
          'Cache-Control': 'public, max-age=300, s-maxage=3600',
          'Access-Control-Allow-Origin': resolveOrigin(req),
          'X-Nisar-View': 'dual-pol-intensity-composite',
          'X-Nisar-Source': source,
        });
        res.end(png);
        return;
      }
      let png = null;
      if (source === 'nisar' && site) {
        try {
          if (side === 'change') {
            const before = site.states?.before;
            const after = site.states?.after;
            png = await renderNisarChange({
              beforeUrl: before?.nisarImageUrl,
              beforeCrop: before?.nisarCrop,
              afterUrl: after?.nisarImageUrl,
              afterCrop: after?.nisarCrop,
            });
          } else {
            const state = site.states?.[side];
            png = await renderNisarCrop(state?.nisarImageUrl, state?.nisarCrop);
          }
        } catch (error) {
          console.error('[SOTHIS API] NISAR browse crop failed', siteId, side, error?.message);
        }
      }
      // Sentinel-1 remains the secondary fallback when no NISAR granule exists.
      if (!png) {
        png = side === 'change' ? await renderChangeCrop(siteId) : await renderSceneCrop(siteId, side);
      }
      if (!png) {
        sendError(res, 404, 'No real pass registered for this site');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': png.length,
        // The window and the passes behind it are historical; the render is
        // rebuilt whenever the site payload is, so a day of caching is safe.
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(png);
      return;
    }

    const siteMatch = path.match(/^\/api\/study-areas\/([^/]+)$/);
    if (siteMatch) {
      const sites = await getSites();
      const site = sites.find((item) => item.id === siteMatch[1]);
      if (!site) sendError(res, 404, 'Unknown site');
      else
        send(res, 200, { data: site, success: true }, {
          'Cache-Control': site.degraded
            ? 'public, s-maxage=30, stale-while-revalidate=60'
            : 'public, s-maxage=1800, stale-while-revalidate=86400',
        });
      return;
    }

    const seriesMatch = path.match(/^\/api\/sites\/([^/]+)\/series$/);
    if (seriesMatch) {
      const site = (await getSites()).find((item) => item.id === seriesMatch[1]);
      if (!site) sendError(res, 404, 'Unknown site');
      else send(res, 200, { data: site.series, success: true });
      return;
    }

    const recoveryMatch = path.match(/^\/api\/sites\/([^/]+)\/recovery$/);
    if (recoveryMatch) {
      const site = (await getSites()).find((item) => item.id === recoveryMatch[1]);
      if (!site) sendError(res, 404, 'Unknown site');
      else send(res, 200, { data: site.recovery, success: true });
      return;
    }

    const soundMatch = path.match(/^\/api\/sonification\/([^/]+)$/);
    if (soundMatch) {
      const site = (await getSites()).find((item) => item.id === soundMatch[1]);
      if (!site) sendError(res, 404, 'Unknown site');
      else send(res, 200, { data: { pulse: site.pulse, stablePulse: site.stablePulse }, success: true });
      return;
    }

    const attributionMatch = path.match(/^\/api\/attribution\/([^/]+)$/);
    if (attributionMatch) {
      const site = (await getSites()).find((item) => item.id === attributionMatch[1]);
      if (!site) {
        sendError(res, 404, 'Unknown site');
        return;
      }
      const state = site.states?.after || {};
      send(res, 200, {
        data: {
          sources: [
            { label: 'NASA NISAR L-band GCOV', href: 'https://nisar.jpl.nasa.gov/' },
            { label: 'ASF DAAC', href: 'https://asf.alaska.edu/' },
          ],
          license: 'Educational prototype',
          product: state.nisarProduct || state.product || 'Sentinel-1 GRD',
          granule: state.nisarGranule || null,
          acquiredAt: state.nisarAcquiredAt || state.acquiredAt || null,
          updatedAt: site.updatedAt,
        },
        success: true,
      });
      return;
    }

    const stateMatch = path.match(/^\/api\/scenes\/([^/]+)\/(before|after)$/);
    if (stateMatch) {
      const site = (await getSites()).find((item) => item.id === stateMatch[1]);
      if (!site) {
        sendError(res, 404, 'Unknown site');
        return;
      }
      const state = site.states[stateMatch[2]];
      send(res, 200, {
        data: {
          imageUrl: state.imageUrl || null,
          opticalUrl: state.opticalUrl || null,
          attribution: state.nisarAttribution || state.attribution || null,
          acquiredAt: state.nisarAcquiredAt || state.acquiredAt || state.date,
          product: state.nisarProduct || state.product || 'illustrative',
          notSimulated: Boolean(state.notSimulated),
          granule: state.nisarGranule || null,
        },
        success: true,
      });
      return;
    }

    sendError(res, 404, 'Not found');
  } catch (error) {
    const status = error?.status || 500;
    sendError(res, status, status === 500 ? 'Internal server error' : error.message, status === 500 ? String(error) : undefined);
  }
}

// Only bind a port when this file is the entry point (npm run api). Under a
// serverless runtime the request handler is imported instead.
const isEntry = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  http.createServer(handleRequest).listen(PORT, HOST, () => {
    console.log(`[SOTHIS API] http://${HOST}:${PORT} — live search/geotiff/analyze + UI contract`);
    console.log(`[SOTHIS API] GeoAI: ${GEOAI_BASE || 'disabled (demo report)'}`);
  });
}
