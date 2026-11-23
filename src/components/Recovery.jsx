import { useMemo, useState } from 'react';
import { Button, ButtonGroup, Callout, Collapse } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { estimateRecovery, evalModel, formatMonthTick, formatMonths, recoveryFromModel } from '../services/recovery';
import { Meter, Panel, SectionHead } from './ui';

const CHART = { width: 680, height: 280, left: 46, right: 18, top: 20, bottom: 40 };

// When there are too few passes to fit a recovery curve, the measured passes
// are still real data — plot them directly in dB instead of leaving the panel
// empty. No fitted trend is drawn, because none is warranted.
function PassChart({ series, eventDate, language }) {
  const { t } = useTranslation();
  const points = (series || [])
    .map((pass) => ({
      date: pass?.date,
      vv: Number(pass?.vv),
      at: pass?.date ? new Date(`${pass.date}T00:00:00Z`).getTime() : NaN,
    }))
    .filter((pass) => Number.isFinite(pass.vv) && Number.isFinite(pass.at))
    .sort((a, b) => a.at - b.at);
  if (points.length < 2) return null;

  const eventAt = eventDate ? new Date(`${eventDate}T00:00:00Z`).getTime() : points[0].at;
  const values = points.map((pass) => pass.vv);
  const lo = Math.floor(Math.min(...values) - 1);
  const hi = Math.ceil(Math.max(...values) + 1);
  const span = Math.max(1, hi - lo);
  const first = Math.min(points[0].at, eventAt);
  const last = Math.max(points[points.length - 1].at, eventAt);
  const width = 720;
  const height = 260;
  const pad = { top: 18, right: 24, bottom: 34, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const x = (at) => pad.left + ((at - first) / Math.max(1, last - first)) * innerW;
  const y = (db) => pad.top + ((hi - db) / span) * innerH;
  const fmt = (at) => new Date(at).toISOString().slice(0, 10);
  const label = t('recovery.chartLabelPass');
  const eventLabel = t('recovery.eventLabel');
  const summary = t('recovery.summaryPasses', {
    start: fmt(points[0].at),
    end: fmt(points[points.length - 1].at),
    lo,
    hi,
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="recovery-chart" role="img" aria-label={summary} dir="ltr">
      <title>{label}</title>
      <desc>{summary}</desc>
      {[lo, Math.round((lo + hi) / 2), hi].map((value, index) => (
        <g key={value}>
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={y(value)}
            y2={y(value)}
            stroke="var(--bp-surface-border-color-default)"
            strokeWidth="1"
            strokeDasharray={index === 0 ? '' : '2 4'}
          />
          <text x={pad.left - 8} y={y(value) + 3} textAnchor="end" fontSize="9" fill="var(--bp-typography-color-muted)">
            {value}
          </text>
        </g>
      ))}
      <line
        x1={x(eventAt)}
        x2={x(eventAt)}
        y1={pad.top}
        y2={height - pad.bottom}
        stroke="var(--bp-intent-warning-color, #c58b3a)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <text x={x(eventAt) + 4} y={pad.top + 8} fontSize="9" fill="var(--bp-typography-color-muted)">
        {eventLabel} {fmt(eventAt)}
      </text>
      <polyline
        points={points.map((pass) => `${x(pass.at)},${y(pass.vv)}`).join(' ')}
        fill="none"
        stroke="var(--bp-intent-primary-color, #2d72d9)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {points.map((pass) => (
        <circle key={pass.date} cx={x(pass.at)} cy={y(pass.vv)} r="3.5" fill="var(--bp-intent-primary-color, #2d72d9)">
          <title>{`${pass.date} · ${pass.vv.toFixed(1)} dB`}</title>
        </circle>
      ))}
      <text x={pad.left} y={height - 10} fontSize="9" fill="var(--bp-typography-color-muted)">
        {fmt(points[0].at)}
      </text>
      <text x={width - pad.right} y={height - 10} textAnchor="end" fontSize="9" fill="var(--bp-typography-color-muted)">
        {fmt(points[points.length - 1].at)}
      </text>
      <text x={width - pad.right} y={pad.top - 6} textAnchor="end" fontSize="9" fill="var(--bp-typography-color-muted)">
        {label}
      </text>
    </svg>
  );
}

function RecoveryChart({ points, threshold, language, title, yLabel, xLabel, targetLabel, rtl, model, sigma }) {
  const { t } = useTranslation();
  const maxMonth = Math.max(...points.map((p) => p.month));
  const measured = points.filter((p) => !p.projected);
  const projectedPoints = points.filter((p) => p.projected);
  const projectedLine = projectedPoints.length ? [measured[measured.length - 1], ...projectedPoints] : [];
  const estimate = estimateRecovery(points, threshold);

  // Fitted parametric curve (sampled) — drawn as a smooth line when a model exists.
  const modelCurve = (() => {
    if (!model || !Array.isArray(model.params)) return null;
    const steps = 40;
    const pts = [];
    for (let i = 0; i <= steps; i += 1) {
      const m = (i / steps) * maxMonth;
      const v = evalModel(model, m);
      if (Number.isFinite(v)) pts.push({ month: m, pct: v });
    }
    return pts.length ? pts : null;
  })();

  const innerW = CHART.width - CHART.left - CHART.right;
  const innerH = CHART.height - CHART.top - CHART.bottom;
  // Arabic reads right to left, so the time axis runs the other way too.
  const x = (month) => {
    const offset = (month / Math.max(1, maxMonth)) * innerW;
    return rtl ? CHART.left + innerW - offset : CHART.left + offset;
  };
  const y = (pct) => CHART.top + ((100 - pct) / 100) * innerH;
  const polyline = (list) => list.map((p) => `${x(p.month)},${y(p.pct)}`).join(' ');

  // A flood can recover in days and a burn in weeks; a 12-month tick grid would
  // collapse those points onto "0". Use half-month ticks for short records.
  const tickStep = maxMonth <= 2 ? 0.5 : maxMonth <= 6 ? 1 : maxMonth > 48 ? 24 : 12;
  const ticks = [];
  for (let month = 0; month <= maxMonth + 1e-9; month += tickStep) {
    ticks.push(Number(month.toFixed(2)));
  }

  const crossingX = estimate?.months != null ? x(estimate.months) : null;
  const crossingY = y(threshold);

  const summary = t('recovery.summaryCurve', {
    threshold,
    months:
      estimate?.months != null
        ? `${formatMonths(estimate.months, language)}.`
        : language === 'ar'
          ? 'لم يتحقق داخل النافذة.'
          : 'Not reached inside the window.',
  });

  return (
    <svg
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      className="recovery-chart"
      role="img"
      aria-label={summary}
      dir="ltr"
    >
      <title>{title}</title>
      <desc>{summary}</desc>

      {[0, 25, 50, 75, 100].map((value) => (
        <g key={value}>
          <line
            x1={CHART.left}
            x2={CHART.width - CHART.right}
            y1={y(value)}
            y2={y(value)}
            stroke="var(--bp-surface-border-color-default)"
            strokeWidth="1"
            strokeDasharray={value === 0 ? '' : '2 4'}
          />
          <text
            x={rtl ? CHART.width - CHART.right + 8 : CHART.left - 8}
            y={y(value) + 3}
            textAnchor={rtl ? 'start' : 'end'}
            fontSize="9"
            fill="var(--bp-typography-color-muted)"
          >
            {value}
          </text>
        </g>
      ))}

      {ticks.map((month) => (
        <g key={month}>
          <line x1={x(month)} x2={x(month)} y1={CHART.top} y2={CHART.height - CHART.bottom} stroke="var(--bp-surface-border-color-default)" strokeWidth="1" />
          <text x={x(month)} y={CHART.height - CHART.bottom + 14} textAnchor="middle" fontSize="9" fill="var(--bp-typography-color-muted)">
            {formatMonthTick(month, language)}
          </text>
        </g>
      ))}

      <line
        x1={CHART.left}
        x2={CHART.width - CHART.right}
        y1={y(threshold)}
        y2={y(threshold)}
        stroke="var(--bp-intent-warning-rest)"
        strokeWidth="1"
        strokeDasharray="5 4"
      />
      <text
        x={rtl ? CHART.left : CHART.width - CHART.right}
        y={y(threshold) - 5}
        textAnchor={rtl ? 'start' : 'end'}
        fontSize="9"
        fill="var(--bp-intent-warning-rest)"
      >
        {String(targetLabel).toUpperCase()} {threshold}%
      </text>
      <line
        x1={CHART.left}
        x2={CHART.width - CHART.right}
        y1={y(100)}
        y2={y(100)}
        stroke="var(--bp-intent-success-rest)"
        strokeOpacity="0.5"
        strokeWidth="1"
      />

      <polyline points={polyline(measured)} fill="none" stroke="var(--bp-intent-primary-rest)" strokeWidth="2" strokeLinejoin="round" />
      {modelCurve ? (
        <polyline points={polyline(modelCurve)} fill="none" stroke="var(--bp-intent-success-rest)" strokeWidth="2.4" strokeLinejoin="round" opacity="0.9" />
      ) : null}
      {projectedLine.length ? (
        <polyline
          points={polyline(projectedLine)}
          fill="none"
          stroke="var(--bp-intent-warning-rest)"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />
      ) : null}

      {measured.map((point) => (
        <g key={`m-${point.month}`}>
          {Number.isFinite(sigma) && sigma > 0 ? (
            <line
              x1={x(point.month)}
              x2={x(point.month)}
              y1={y(Math.min(100, point.pct + sigma))}
              y2={y(Math.max(0, point.pct - sigma))}
              stroke="var(--bp-intent-primary-rest)"
              strokeWidth="1"
              opacity="0.45"
            />
          ) : null}
          <circle cx={x(point.month)} cy={y(point.pct)} r="2.6" fill="var(--bp-intent-primary-rest)" />
        </g>
      ))}
      {projectedPoints.map((point) => (
        <circle
          key={`p-${point.month}`}
          cx={x(point.month)}
          cy={y(point.pct)}
          r="2.4"
          fill="var(--bp-surface-background-color-default-rest)"
          stroke="var(--bp-intent-warning-rest)"
          strokeWidth="1.5"
        />
      ))}

      {crossingX != null ? (
        <g>
          <line
            x1={crossingX}
            x2={crossingX}
            y1={crossingY}
            y2={CHART.height - CHART.bottom}
            stroke="var(--bp-intent-warning-rest)"
            strokeDasharray="3 3"
            strokeOpacity="0.7"
          />
          <rect x={crossingX - 3} y={crossingY - 3} width="6" height="6" fill="var(--bp-surface-background-color-default-rest)" stroke="var(--bp-intent-warning-rest)" strokeWidth="1.5" />
          <text
            x={crossingX + (rtl ? -5 : 5)}
            y={crossingY - 7}
            textAnchor={rtl ? 'end' : 'start'}
            fontSize="9"
            fill="var(--bp-intent-warning-rest)"
          >
            {formatMonths(estimate.months, language)}
          </text>
        </g>
      ) : null}

      <text x={CHART.width / 2} y={CHART.height - 5} textAnchor="middle" fontSize="9" fill="var(--bp-typography-color-muted)">
        {xLabel}
      </text>
      <text
        x={rtl ? CHART.width - CHART.right : CHART.left}
        y={12}
        textAnchor={rtl ? 'end' : 'start'}
        fontSize="9"
        fill="var(--bp-typography-color-muted)"
      >
        {yLabel}
      </text>
    </svg>
  );
}

export default function Recovery() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, loading } = useSiteData();
  const [siteId, setSiteId] = useState(() => sites[0]?.id);
  const site = sites.find((item) => item.id === siteId) ?? sites[0];
  const [infoOpen, setInfoOpen] = useState(false);
  const [threshold, setThreshold] = useState(() => site?.recovery?.thresholdDefault ?? 80);

  const estimate = useMemo(
    () => (site ? estimateRecovery(site.recovery.points, threshold) : null),
    [site, threshold]
  );
  // Model-based estimate (physics-informed fit) when a parametric model exists.
  const modelResult = useMemo(
    () => (site?.recovery?.model ? recoveryFromModel(site.recovery.model, threshold) : null),
    [site, threshold]
  );

  if (!site || !estimate) return null;

  const L = (value) => localized(value, language);
  const measuredPoints = site.recovery.points.filter((point) => !point.projected);
  const current = measuredPoints[measuredPoints.length - 1]?.pct ?? site.recovery.points[0].pct;
  const siteName = L(site.name);
  const estimateTone = estimate.months == null ? 'danger' : estimate.projected ? 'warning' : 'primary';
  const estimateClass = estimateTone === 'warning' ? 'warning' : estimateTone === 'danger' ? 'danger' : '';

  return (
    <section id="recovery" className="content-section chapter chapter--sky" aria-labelledby="recovery-title">
      <div className="section-inner">
        <SectionHead title={t('recovery.title')} subtitle={t('recovery.subtitle')} id="recovery-title" />

        <div className="row site-choice-row" role="group" aria-label={t('common.sitePicker')}>
          <span className="site-choice-label">{t('common.sitePicker')}</span>
          <ButtonGroup className="site-choice">
            {sites.map((item) => (
              <Button
                key={item.id}
                active={item.id === site.id}
                variant={item.id === site.id ? 'solid' : 'outlined'}
                text={L(item.name)}
                aria-pressed={item.id === site.id}
                onClick={() => {
                  setSiteId(item.id);
                  setThreshold(item.recovery?.thresholdDefault ?? 80);
                }}
              />
            ))}
          </ButtonGroup>
        </div>

        <div className="recovery-grid">
          <Panel title={`${t('recovery.estimateLabel')} · ${siteName}`} bodyClassName="card-pad-lg">
            <p className={`recovery-value ${estimateClass}`} aria-live="polite" data-testid="recovery-estimate" dir="auto">
              {loading
                ? t('common.checkingLive')
                : site.recovery.insufficient
                ? t('recovery.notMeasured')
                : (modelResult?.months ?? estimate.months) == null
                  ? t('recovery.notReached')
                  : formatMonths(modelResult?.months ?? estimate.months, language)}
            </p>

            {!loading && !site.recovery.insufficient && modelResult?.months != null && modelResult.ci95Days ? (
              <p className="micro" style={{ marginTop: 2, marginBottom: 0 }}>
                {t('recovery.ciLabel', { n: modelResult.ci95Days })}
              </p>
            ) : null}

            {!loading && !site.recovery.insufficient && site.recovery.model ? (
              <p className="micro" style={{ marginTop: 2, marginBottom: 0, opacity: 0.8 }}>
                {t('recovery.modelBadge', {
                  model: site.recovery.model.name,
                  r2: site.recovery.model.r2,
                })}
              </p>
            ) : null}

            <div
              style={{
                paddingTop: 12,
                borderTop: '1px solid var(--bp-surface-border-color-default)',
                marginBottom: 16,
                display: site.recovery.insufficient ? 'none' : undefined,
              }}
            >
              <div className="row-between" style={{ marginBottom: 6 }}>
                <span className="micro">{t('recovery.signalToday')}</span>
                <span className="numeric small">{current}%</span>
              </div>
              <Meter value={current / 100} label={t('recovery.signalToday')} />
            </div>

            <div className="threshold-row">
              <span>{t('recovery.target')}</span>
              <span className="threshold-value">{threshold}%</span>
            </div>
            <div className="slider-wrap">
              <input
                className="threshold-slider"
                type="range"
                min={50}
                max={95}
                step={5}
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value))}
                aria-label={t('recovery.target')}
                aria-valuetext={`${threshold}%`}
              />
              <div className="slider-scale" aria-hidden="true">
                <span>50%</span>
                <span>95%</span>
              </div>
            </div>
            <p className="micro" style={{ marginTop: 4, marginBottom: 0 }}>{t('recovery.targetHint')}</p>
          </Panel>

          <Panel title={t('recovery.chartTitle')} bodyClassName="card-pad">
            {loading ? (
              <Callout intent="none" icon="refresh" data-testid="recovery-loading" style={{ marginBottom: 10 }}>
                {t('common.checkingLive')}
              </Callout>
            ) : site.recovery.insufficient ? (
              <Callout
                intent="warning"
                icon="info-sign"
                data-testid="recovery-insufficient"
                style={{ marginBottom: 10 }}
              >
                {t(
                  site.recovery.noPeakPass
                    ? 'recovery.noPeakPassNotice'
                    : 'recovery.insufficientNotice',
                  {
                    change: Math.round(Number(site.recovery.eventChange ?? 0)),
                    noise: Math.round(Number(site.recovery.noise ?? 0)),
                    gap: Math.round(Number(site.recovery.gapDays ?? 0)),
                  }
                )}
              </Callout>
            ) : site.recovery.fromApi !== true ? (
              <Callout
                intent="warning"
                icon="info-sign"
                data-testid="recovery-fallback"
                style={{ marginBottom: 10 }}
              >
                {t('recovery.fallbackNotice')}
              </Callout>
            ) : (
              <p className="micro" data-testid="recovery-source" style={{ marginBottom: 8 }}>
                {t('recovery.sourceLine', { passes: measuredPoints.length })}
              </p>
            )}
            {!loading && site.recovery.insufficient ? (
              <div className="chart-scroll">
                <PassChart series={site.series} eventDate={site.eventDate} language={language} />
              </div>
            ) : null}
            <div className="chart-scroll" style={loading || site.recovery.insufficient ? { display: 'none' } : undefined}>
              <RecoveryChart
                points={site.recovery.points}
                threshold={threshold}
                language={language}
                title={t('recovery.chartTitle')}
                yLabel={t('recovery.chartY')}
                xLabel={t('recovery.chartX')}
                targetLabel={t('recovery.target')}
                rtl={language === 'ar'}
                model={site.recovery.model}
                sigma={site.recovery.model?.sigma}
              />
            </div>

            {!loading && !site.recovery.insufficient && site.recovery.validation ? (
              <p className="micro" style={{ marginTop: 10, marginBottom: 0, opacity: 0.85 }}>
                {t('recovery.validationLine', {
                  rmse: site.recovery.validation.modelRmsePct,
                  r: site.recovery.validation.hhHvR,
                  n: site.recovery.validation.nPasses,
                })}
              </p>
            ) : null}

            <div className="recovery-method-block">
              <Button
                variant="minimal"
                small
                icon={infoOpen ? 'chevron-up' : 'info-sign'}
                text={t('recovery.methodLabel')}
                className="recovery-info-button"
                aria-expanded={infoOpen}
                aria-controls="recovery-method"
                data-testid="recovery-info"
                onClick={() => setInfoOpen((open) => !open)}
              />
              <Collapse isOpen={infoOpen} transitionDuration={300}>
                <div className="recovery-method" id="recovery-method">
                  <p>{t('recovery.methodBody', { site: siteName })}</p>
                  <p>{L(site.recovery.note)}</p>
                  <p className="recovery-info-caveat">{t('recovery.caveat')}</p>
                </div>
              </Collapse>
            </div>
          </Panel>
        </div>


      </div>
    </section>
  );
}
