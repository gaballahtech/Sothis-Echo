import { useMemo, useState } from 'react';
import { Button, ButtonGroup, Popover, Slider, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { estimateRecovery, formatMonthTick, formatMonths } from '../services/recovery';
import { Meter, Panel, SectionHead } from './ui';

const CHART = { width: 680, height: 280, left: 46, right: 18, top: 20, bottom: 40 };

function RecoveryChart({ points, threshold, language, title, yLabel, xLabel, targetLabel }) {
  const maxMonth = Math.max(...points.map((p) => p.month));
  const measured = points.filter((p) => !p.projected);
  const projectedPoints = points.filter((p) => p.projected);
  const projectedLine = projectedPoints.length ? [measured[measured.length - 1], ...projectedPoints] : [];
  const estimate = estimateRecovery(points, threshold);

  const innerW = CHART.width - CHART.left - CHART.right;
  const innerH = CHART.height - CHART.top - CHART.bottom;
  const x = (month) => CHART.left + (month / Math.max(1, maxMonth)) * innerW;
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
          <text x={CHART.left - 8} y={y(value) + 3} textAnchor="end" fontSize="9" fill="var(--bp-typography-color-muted)">
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
      <text x={CHART.width - CHART.right} y={y(threshold) - 5} textAnchor="end" fontSize="9" fill="var(--bp-intent-warning-rest)">
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
          <text x={crossingX + 5} y={crossingY - 7} fontSize="9" fill="var(--bp-intent-warning-rest)">
            {formatMonths(estimate.months, language)}
          </text>
        </g>
      ) : null}

      <text x={CHART.width / 2} y={CHART.height - 5} textAnchor="middle" fontSize="9" fill="var(--bp-typography-color-muted)">
        {xLabel}
      </text>
      <text x={CHART.left} y={12} fontSize="9" fill="var(--bp-typography-color-muted)">
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
        <SectionHead kicker={t('recovery.kicker')} title={t('recovery.title')} subtitle={t('recovery.subtitle')} id="recovery-title" />

        <div className="row" style={{ marginBottom: 12 }}>
          <span className="micro">{t('sound.sitePicker')}</span>
          <ButtonGroup>
            {sites.map((item) => (
              <Button
                key={item.id}
                small
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

        <div className="split-main">
          <Panel
            title={`${t('recovery.estimateLabel')} · ${siteName}`}
            icon="history"
            status={
              <Tag minimal intent={estimate.months == null ? 'danger' : estimate.projected ? 'warning' : 'success'}>
                {estimate.months == null ? t('recovery.notReached') : estimate.projected ? t('recovery.projected') : t('recovery.measured')}
              </Tag>
            }
            bodyClassName="card-pad-lg"
          >
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
              <Slider
                min={50}
                max={95}
                stepSize={5}
                labelStepSize={10}
                value={threshold}
                onChange={setThreshold}
                labelRenderer={(value) => `${value}%`}
                aria-label={t('recovery.target')}
                showTrackFill
              />
            </div>
            <p className="micro" style={{ marginTop: 4, marginBottom: 0 }}>{t('recovery.targetHint')}</p>
          </Panel>

          <Panel
            title={t('recovery.chartTitle')}
            icon="chart"
            status={estimate.months == null ? '—' : estimate.projected ? t('recovery.projectedLegend') : t('recovery.measured')}
            bodyClassName="card-pad"
          >
            <div className="row-between">
              <div className="chart-legend">
                <span><span className="legend-line primary" />{t('recovery.measured')}</span>
                <span><span className="legend-line warning" />{t('recovery.projectedLegend')}</span>
                <span><span className="legend-line warning" />{t('recovery.target')} {threshold}%</span>
              </div>
              <Popover
                placement="bottom-end"
                content={
                  <div className="recovery-info-popover">
                    <h4>{t('recovery.researcherTitle')}</h4>
                    <p>{t('recovery.researcherBody')}</p>
                    <p>{L(site.recovery.note)}</p>
                    <p>{t('recovery.researchExtra')}</p>
                    <p className="recovery-info-caveat">{t('recovery.caveat')}</p>
                  </div>
                }
              >
                <Button
                  variant="minimal"
                  small
                  icon="info-sign"
                  text={t('recovery.info')}
                  className="recovery-info-button"
                  aria-label={t('recovery.researcherTitle')}
                  data-testid="recovery-info"
                />
              </Popover>
            </div>
            <div className="chart-scroll">
              <RecoveryChart
                points={site.recovery.points}
                threshold={threshold}
                language={language}
                title={t('recovery.chartTitle')}
                yLabel={t('recovery.chartY')}
                xLabel={t('recovery.chartX')}
                targetLabel={t('recovery.target')}
              />
            </div>
            <p className="micro" style={{ marginTop: 6, marginBottom: 0 }}>{t('recovery.source')}</p>
          </Panel>
        </div>


      </div>
    </section>
  );
}
