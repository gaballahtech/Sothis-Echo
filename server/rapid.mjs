/**
 * "Rapid Response" — turn a site's real change stats into an actionable
 * situation report: extent (km²), population exposed (WorldPop), dominant
 * mechanism, and a one-page shareable PNG.
 *
 * Population comes from the WorldPop API (real 100 m grid). If it is
 * unreachable the report still renders with extent + mechanism and the
 * population field is honestly marked "unavailable".
 */

import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const WORLD_POP = 'https://api.worldpop.org/v3/population';

function bboxPolygon(bbox) {
  const [w, s, e, n] = bbox;
  return { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] };
}

/**
 * Population inside a bbox from WorldPop (real 100 m grid, year 2025).
 * Returns null on any failure — the caller labels it unavailable, never fakes.
 */
export async function populationInBbox(bbox, year = 2025) {
  try {
    const response = await fetch(WORLD_POP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geojson: bboxPolygon(bbox), year }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!Number.isFinite(data?.total_population)) return null;
    return {
      total: Math.round(data.total_population),
      density: Number.isFinite(data.population_density) ? Math.round(data.population_density * 100) / 100 : null,
      year: data.data_year || year,
      source: data.data_source || 'WorldPop',
    };
  } catch {
    return null;
  }
}

/**
 * Build the rapid-response object from a site's change stats + lenses + bbox.
 */
export async function buildRapidResponse({ site, changeStats, lenses, bbox }) {
  const extentKm2 = Number.isFinite(changeStats?.changedAreaKm2) ? changeStats.changedAreaKm2 : null;
  const mechanism = lenses ? explainKind(lenses) : null;
  const population = bbox ? await populationInBbox(bbox) : null;
  const exposed = population && extentKm2 != null && Number.isFinite(population.density)
    ? Math.round(population.density * extentKm2)
    : null;

  return {
    site: site?.id || null,
    extentKm2: extentKm2 != null ? Math.round(extentKm2 * 10) / 10 : null,
    changedPct: changeStats?.changedPct ?? null,
    mechanism,
    population: population
      ? { total: population.total, density: population.density, year: population.year, source: population.source }
      : null,
    populationExposed: exposed,
    populationNote: population ? 'estimate' : 'unavailable',
    bbox,
    generatedAt: new Date().toISOString().slice(0, 10),
    // The decision line is derived from the site's own impact narrative.
    decision: {
      en: site?.impact?.decision?.en || null,
      ar: site?.impact?.decision?.ar || null,
    },
  };
}

/** Minimal dominant-mechanism reuse (kept local to avoid cross-import churn). */
function explainKind(lenses) {
  const a = lenses?.amplitude || {};
  const m = lenses?.mechanism || {};
  const c = lenses?.coherence || {};
  const ch = lenses?.change || {};
  const noPol = !Number.isFinite(a.dHH) && !Number.isFinite(a.dHV) && !Number.isFinite(c.lowCoherencePct);
  if (noPol) {
    if (Number.isFinite(ch.changePct) && ch.changePct >= 10) return 'amplitude-change';
    if (Number.isFinite(ch.changePct)) return 'stable';
  }
  if (Number.isFinite(a.dHV) && a.dHV > 1 && Number.isFinite(m.after?.low) && Number.isFinite(m.before?.low) && m.after.low > m.before.low + 0.03) return 'flood';
  if (Number.isFinite(a.dHH) && a.dHH < -1 && Number.isFinite(m.after?.volume) && Number.isFinite(m.before?.volume) && m.after.volume < m.before.volume - 0.03) return 'fire';
  if (Number.isFinite(c.lowCoherencePct) && c.lowCoherencePct > 20) return 'disturbance';
  if (Number.isFinite(a.dHH) && Math.abs(a.dHH) >= 1) return a.dHH < 0 ? 'smoothing' : 'roughening';
  return 'stable';
}

/**
 * Render a one-page situation report PNG with Python (PIL). Falls back to
 * returning null if rendering fails — the API then serves the JSON summary.
 */
export async function renderSituationReport(report, images) {
  const script = `
import sys, json, base64, io
from PIL import Image, ImageDraw
with open(sys.argv[1], 'r') as f:
    payload = json.load(f)
report = payload['report']
imgs = payload.get('images', {})
W, H = 1000, 700
img = Image.new('RGB', (W, H), (12, 14, 18))
d = ImageDraw.Draw(img)
d.text((30, 24), "SOTHIS ECHO · RAPID RESPONSE", fill=(120, 220, 180))
d.text((30, 56), report.get('site','') + ' · ' + report.get('generatedAt',''), fill=(200,200,200))
y = 110
def line(label, value):
    global y
    d.text((30, y), label, fill=(150,150,150))
    d.text((360, y), str(value), fill=(240,240,240))
    y += 34
line("Extent changed", (str(report.get('extentKm2')) + ' km^2') if report.get('extentKm2') is not None else 'n/a')
line("Changed area", (str(report.get('changedPct')) + '%') if report.get('changedPct') is not None else 'n/a')
line("Dominant mechanism", report.get('mechanism') or 'n/a')
pop = report.get('population') or {}
line("Population (total)", pop.get('total') if pop else 'unavailable')
line("Population exposed (est.)", report.get('populationExposed') if report.get('populationExposed') is not None else 'n/a')
line("Population note", report.get('populationNote'))
if report.get('decision'):
    d.text((30, y+10), "Decision:", fill=(150,150,150))
    d.text((160, y+10), report['decision'][:80], fill=(255,220,120))
y += 60
for key in ('mechanismBefore','mechanismAfter','mechanismChange','coherence'):
    b64 = imgs.get(key)
    if not b64: continue
    try:
        thumb = Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGB')
        thumb.thumbnail((210, 140))
        img.paste(thumb, (30, y))
        d.text((30, y+144), key, fill=(150,150,150))
        y += 170
    except Exception:
        pass
buf = io.BytesIO()
img.save(buf, format='PNG')
sys.stdout.write(base64.b64encode(buf.getvalue()).decode())
`;
  const tmp = path.join(os.tmpdir(), `sothis-report-${Date.now()}.py`);
  const payloadPath = path.join(os.tmpdir(), `sothis-payload-${Date.now()}.json`);
  await writeFile(tmp, script, 'utf8');
  await writeFile(payloadPath, JSON.stringify({ report, images: images || {} }), 'utf8');
  try {
    const out = await new Promise((resolve, reject) => {
      const child = spawn('.venv-nisar/bin/python', [tmp, payloadPath], {
        cwd: process.cwd(),
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      child.on('error', reject);
      child.on('close', (code) => (code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr || `exit ${code}`))));
    });
    return out || null;
  } catch {
    return null;
  } finally {
    try { await import('node:fs/promises').then((fs) => Promise.all([fs.unlink(tmp), fs.unlink(payloadPath)])); } catch { /* ignore */ }
  }
}