/**
 * Recovery-time estimator.
 * Finds the first crossing of a target percentage in a measured/projected
 * recovery curve and interpolates linearly between the two bracketing points.
 */

export function estimateRecovery(points, threshold) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const sorted = [...points]
    .filter((p) => Number.isFinite(p.month) && Number.isFinite(p.pct))
    .sort((a, b) => a.month - b.month);

  if (!sorted.length) return null;

  if (sorted[0].pct >= threshold) {
    return {
      months: 0,
      reached: true,
      projected: Boolean(sorted[0].projected),
      current: sorted[0].pct,
      maxMonth: sorted[sorted.length - 1].month,
    };
  }

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    if (prev.pct < threshold && next.pct >= threshold) {
      const ratio = (threshold - prev.pct) / (next.pct - prev.pct);
      return {
        months: prev.month + ratio * (next.month - prev.month),
        reached: true,
        projected: Boolean(next.projected),
        current: sorted[sorted.length - 1].pct,
        maxMonth: sorted[sorted.length - 1].month,
      };
    }
  }

  return {
    months: null,
    reached: false,
    projected: true,
    current: sorted[sorted.length - 1].pct,
    maxMonth: sorted[sorted.length - 1].month,
  };
}

function formatDays(days, language = 'en') {
  if (language !== 'ar') return days === 1 ? '1 day' : `${days} days`;
  if (days === 1) return 'يوم واحد';
  if (days === 2) return 'يومان';
  if (days >= 3 && days <= 10) return `${days} أيام`;
  return `${days} يومًا`;
}

/** Translate months into a compact, localized duration. */
export function formatMonths(months, language = 'en') {
  if (months == null) return language === 'ar' ? 'خارج الأفق' : 'beyond horizon';
  if (months < 2) {
    const days = Math.max(1, Math.round(months * 30.44));
    if (months < 1 / 30.44) return language === 'ar' ? 'عند الحدث' : 'at the event';
    return formatDays(days, language);
  }
  if (months < 24) {
    const value = Math.round(months);
    if (language !== 'ar') return `${value} months`;
    if (value === 2) return 'شهرين';
    if (value >= 3 && value <= 10) return `${value} أشهر`;
    return `${value} شهرًا`;
  }
  const years = (months / 12).toFixed(1).replace(/\.0$/, '');
  return language === 'ar' ? `${years} سنة` : `${years} years`;
}

/** Time axis ticks: days under a month, months under a year, then years. */
export function formatMonthTick(month, language = 'en') {
  if (month === 0) return '0';
  if (month < 1) {
    const days = Math.max(1, Math.round(month * 30.44));
    return language === 'ar' ? `${days}ي` : `${days}d`;
  }
  if (month < 12) {
    const value = Number.isInteger(month) ? String(month) : month.toFixed(1);
    return language === 'ar' ? `${value}ش` : `${value}m`;
  }
  const years = month / 12;
  const label = Number.isInteger(years) ? String(years) : years.toFixed(1);
  return language === 'ar' ? `${label}س` : `${label}y`;
}
