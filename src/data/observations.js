import { studyAreas } from './sites';

const DAY_MS = 86_400_000;

function monthsSince(date, eventDate) {
  const pass = new Date(`${date}T00:00:00Z`).getTime();
  const event = new Date(`${eventDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(pass) || !Number.isFinite(event)) return null;
  return (pass - event) / (DAY_MS * 30.4375);
}

function recoveryAt(points, month) {
  if (!Array.isArray(points) || points.length === 0 || month == null || month < 0) return null;
  const sorted = [...points].sort((a, b) => a.month - b.month);
  if (month < sorted[0].month) return { pct: sorted[0].pct, projected: Boolean(sorted[0].projected) };
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const left = sorted[index];
    const right = sorted[index + 1];
    if (month >= left.month && month <= right.month) {
      const span = right.month - left.month || 1;
      return {
        pct: left.pct + ((month - left.month) / span) * (right.pct - left.pct),
        projected: Boolean(left.projected || right.projected),
      };
    }
  }
  const last = sorted[sorted.length - 1];
  return { pct: last.pct, projected: Boolean(last.projected) };
}

function statusFor(change, baseline) {
  if (baseline) return 'baseline';
  if (change >= 0.55) return 'change';
  if (change >= 0.2) return 'recovery';
  return 'stable';
}

/**
 * Derive a flat, table-friendly ledger from the existing NISAR series.
 * No new measurements are introduced: cross-pol is VH minus VV, and recovery
 * is linearly interpolated from the existing recovery curve at pass time.
 */
export function buildObservationRows(sites = studyAreas) {
  const rows = [];
  for (const site of sites) {
    for (const point of site.series ?? []) {
      const month = monthsSince(point.date, site.eventDate);
      const baseline = month != null && month < 0;
      const recovery = baseline ? null : recoveryAt(site.recovery?.points, month);
      const crossPol = Number.isFinite(point.vh) && Number.isFinite(point.vv) ? Number((point.vh - point.vv).toFixed(1)) : null;
      rows.push({
        id: `${site.id}-${point.date}`,
        siteId: site.id,
        siteName: site.name,
        date: point.date,
        vv: point.vv,
        vh: point.vh,
        crossPol,
        water: point.water,
        change: point.change,
        recovery: recovery?.pct ?? null,
        projected: Boolean(recovery?.projected),
        status: statusFor(point.change ?? 0, baseline),
        baseline,
      });
    }
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.siteId.localeCompare(b.siteId)));
}
