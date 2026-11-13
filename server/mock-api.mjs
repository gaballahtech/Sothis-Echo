/**
 * FIXTURE API — not official NISAR data.
 *
 * Implements the contract in BACKEND_API_SPEC.md so the frontend's API mode can
 * be exercised end-to-end. Numbers are deliberately shifted from the bundled
 * demo values to prove the UI consumes the backend, not the local constants.
 *
 *   node server/mock-api.mjs
 *   VITE_API_BASE_URL=http://127.0.0.1:3001/api npm run dev
 */
import http from 'node:http';
import { studyAreas } from '../src/data/sites.js';

const PORT = Number(process.env.MOCK_API_PORT || 3001);
const HOST = process.env.MOCK_API_HOST || '127.0.0.1';
const ORIGIN = process.env.MOCK_API_ORIGIN || '*';

const round1 = (value) => Math.round(value * 10) / 10;
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const clampPct = (value) => Math.max(0, Math.min(100, value));

const fixtures = studyAreas.map((site) => {
  const vvBefore = round1(site.measurements.vv.before + 1.5);
  const vvAfter = round1(site.measurements.vv.after + 1.5);
  const vhBefore = round1(site.measurements.vh.before - 0.5);
  const vhAfter = round1(site.measurements.vh.after - 0.5);

  return {
    id: site.id,
    source: 'fixture',
    updatedAt: new Date().toISOString(),
    coords: site.coords,
    wkt: site.wkt,
    states: {
      before: {
        date: site.states.before.date,
        params: {
          ...site.states.before.params,
          water: clamp01(site.states.before.params.water + 0.03),
        },
      },
      after: {
        date: site.states.after.date,
        params: {
          ...site.states.after.params,
          water: clamp01(site.states.after.params.water + 0.03),
        },
      },
    },
    measurements: {
      vv: { before: vvBefore, after: vvAfter },
      vh: { before: vhBefore, after: vhAfter },
      crossPol: { before: round1(vhBefore - vvBefore), after: round1(vhAfter - vvAfter) },
      dateBefore: site.measurements.dateBefore,
      dateAfter: site.measurements.dateAfter,
      source: 'fixture',
    },
    series: site.series.map((point) => ({
      ...point,
      vv: round1(point.vv + 1.5),
      vh: round1(point.vh - 0.5),
    })),
    pulse: site.pulse.map((value) => round1(clamp01(value * 0.95))),
    stablePulse: site.stablePulse,
    recovery: {
      thresholdDefault: 80,
      points: site.recovery.points.map((point) => ({
        ...point,
        pct: clampPct(point.pct - 5),
      })),
    },
  };
});

const send = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }
  if (req.method !== 'GET') {
    send(res, 405, { success: false, error: 'Method not allowed' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/\/+$/, '');

  if (path === '/api/health') {
    send(res, 200, { data: { status: 'ok', timestamp: new Date().toISOString(), version: 'fixture-1' }, success: true });
    return;
  }

  if (path === '/api/nisar/status') {
    send(res, 200, {
      data: {
        operational: true,
        phase: 'fixture',
        lastAcquisition: new Date(Date.now() - 86_400_000).toISOString(),
        nextAcquisition: new Date(Date.now() + 11 * 86_400_000).toISOString(),
        products: ['fixture'],
      },
      success: true,
    });
    return;
  }

  if (path === '/api/study-areas') {
    send(res, 200, { data: fixtures, success: true });
    return;
  }

  const siteMatch = path.match(/^\/api\/study-areas\/([^/]+)$/);
  if (siteMatch) {
    const site = fixtures.find((item) => item.id === siteMatch[1]);
    if (!site) send(res, 404, { success: false, error: 'Unknown site' });
    else send(res, 200, { data: site, success: true });
    return;
  }

  const seriesMatch = path.match(/^\/api\/sites\/([^/]+)\/series$/);
  if (seriesMatch) {
    const site = fixtures.find((item) => item.id === seriesMatch[1]);
    if (!site) send(res, 404, { success: false, error: 'Unknown site' });
    else send(res, 200, { data: site.series, success: true });
    return;
  }

  const recoveryMatch = path.match(/^\/api\/sites\/([^/]+)\/recovery$/);
  if (recoveryMatch) {
    const site = fixtures.find((item) => item.id === recoveryMatch[1]);
    if (!site) send(res, 404, { success: false, error: 'Unknown site' });
    else send(res, 200, { data: site.recovery, success: true });
    return;
  }

  const soundMatch = path.match(/^\/api\/sonification\/([^/]+)$/);
  if (soundMatch) {
    const site = fixtures.find((item) => item.id === soundMatch[1]);
    if (!site) send(res, 404, { success: false, error: 'Unknown site' });
    else send(res, 200, { data: { pulse: site.pulse, stablePulse: site.stablePulse }, success: true });
    return;
  }

  send(res, 404, { success: false, error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[FIXTURE API] http://${HOST}:${PORT}/api — illustrative values only, not NISAR products`);
});
