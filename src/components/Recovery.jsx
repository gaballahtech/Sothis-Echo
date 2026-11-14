import { useMemo, useState } from 'react';
import { Button, ButtonGroup, Collapse } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { estimateRecovery, formatMonthTick, formatMonths } from '../services/recovery';
import { Meter, Panel, SectionHead } from './ui';

const CHART = { width: 680, height: 280, left: 46, right: 18, top: 20, bottom: 40 };

function RecoveryChart({ points, threshold, language, title, yLabel, xLabel, targetLabel, rtl }) {
  const maxMonth = Math.max(...points.map((p) => p.month));
  const measured = points.filter((p) => !p.projected);
  const projectedPoints = points.filter((p) => p.projected);
  const projectedLine = projectedPoints.length ? [measured[measured.length - 1], ...projectedPoints] : [];
  const estimate = estimateRecovery(points, threshold);

  const innerW = CHART.width - CHART.left - CHART.right;
  const innerH = CHART.height - CHART.top - CHART.bottom;
  // Arabic reads right to left, so the time axis runs the other way too.
  const x = (month) => {
    const offset = (month / Math.max(1, maxMonth)) * innerW;
    return rtl ? CHART.left + innerW - offset : CHART.left + offset;
  };
  const y = (pct) => CHART.top + ((100 - pct) / 100) * innerH;
  const polyline = (list) => list.map((p) => `${x(p.month)},${y(p.pct)}`).join(' ');

  const tickStep = maxMonth > 48 ? 24 : 12;
  const ticks = [];
  for (let month = 0; month <= maxMonth; month += tickStep) ticks.push(month);

  const crossingX = estimate?.months != null ? x(estimate.months) : null;
  const crossingY = y(threshold);

  const summary =
    language === 'ar'
      ? `منحنى التعافي. الهدف ${threshold} بالمئة. ${estimate?.months != null ? `الزمن المقدر ${formatMonths(estimate.months, 'ar')}.` : 'لم يتحقق داخل النافذة.'}`
      : `Recovery curve. Target ${threshold} percent. ${
          estimate?.months != null ? `Estimated time ${formatMonths(estimate.months, 'en')}.` : 'Not reached inside the window.'
        }`;

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
        <circle key={`m-${point.month}`} cx={x(point.month)} cy={y(point.pct)} r="2.6" fill="var(--bp-intent-primary-rest)" />
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
  const { sites } = useSiteData();
  const [siteId, setSiteId] = useState(() => sites[0]?.id);
  const site = sites.find((item) => item.id === siteId) ?? sites[0];
  const [infoOpen, setInfoOpen] = useState(false);
  const [threshold, setThreshold] = useState(() => site?.recovery?.thresholdDefault ?? 80);

  const estimate = useMemo(
    () => (site ? estimateRecovery(site.recovery.points, threshold) : null),
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
              {estimate.months == null ? t('recovery.notReached') : formatMonths(estimate.months, language)}
            </p>

            <div style={{ paddingTop: 12, borderTop: '1px solid var(--bp-surface-border-color-default)', marginBottom: 16 }}>
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
            <div className="chart-scroll">
              <RecoveryChart
                points={site.recovery.points}
                threshold={threshold}
                language={language}
                title={t('recovery.chartTitle')}
                yLabel={t('recovery.chartY')}
                xLabel={t('recovery.chartX')}
                targetLabel={t('recovery.target')}
                rtl={language === 'ar'}
              />
            </div>

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
