import { useEffect, useRef, useState } from 'react';
import { Button } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { SectionHead } from './ui';

/**
 * Time-series view: every real NISAR pass for the selected site, in order.
 * The line is calibrated HH backscatter (dB); the bars are the change metric
 * (0–1). Press play to animate a playhead through the record.
 */
export default function TimeSeries() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, selectedSiteId } = useSiteData();
  const site = sites.find((item) => item.id === selectedSiteId) ?? sites[0];
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(-1);
  const timerRef = useRef(null);

  const series = site?.series ?? [];

  useEffect(() => {
    if (!playing || series.length === 0) {
      clearInterval(timerRef.current);
      return undefined;
    }
    setIndex(0);
    timerRef.current = setInterval(() => {
      setIndex((i) => {
        if (i + 1 >= series.length) {
          clearInterval(timerRef.current);
          setPlaying(false);
          return series.length - 1;
        }
        return i + 1;
      });
    }, 750);
    return () => clearInterval(timerRef.current);
  }, [playing, series.length]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  if (!site || series.length === 0) return null;

  const siteName = localized(site.name, language);
  const W = 900;
  const H = 260;
  const pad = { l: 44, r: 16, t: 18, b: 40 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const vvValues = series.map((p) => Number(p.vv)).filter(Number.isFinite);
  const vMin = vvValues.length ? Math.min(...vvValues) : 0;
  const vMax = vvValues.length ? Math.max(...vvValues) : 1;
  const vRange = vMax - vMin || 1;

  const x = (i) => pad.l + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (v) => pad.t + innerH * (1 - (v - vMin) / vRange);

  const linePath = series
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(Number(p.vv)).toFixed(1)}`)
    .join(' ');

  const active = index >= 0 ? index : -1;

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', {
      day: '2-digit',
      month: 'short',
    }).format(d);
  };

  const toggle = () => {
    if (playing) {
      setPlaying(false);
      clearInterval(timerRef.current);
    } else {
      setPlaying(true);
    }
  };

  return (
    <section id="timeseries" className="content-section chapter chapter--sky" aria-labelledby="timeseries-title">
      <div className="section-inner">
        <SectionHead title={t('timeSeries.title')} subtitle={t('timeSeries.subtitle')} id="timeseries-title" />

        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <span className="micro">
            {siteName} · {t('timeSeries.pass', { current: active >= 0 ? active + 1 : 1, total: series.length })}
          </span>
          <Button
            intent={playing ? 'warning' : 'primary'}
            icon={playing ? 'stop' : 'play'}
            text={playing ? t('timeSeries.pause') : t('timeSeries.play')}
            onClick={toggle}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={t('timeSeries.backscatter')}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const v = vMin + tick * vRange;
              const yy = y(v);
              return (
                <g key={tick}>
                  <line x1={pad.l} x2={W - pad.r} y1={yy} y2={yy} stroke="var(--bp-surface-border-color-default)" strokeDasharray="2 4" />
                  <text x={pad.l - 6} y={yy + 3} textAnchor="end" fontSize="9" fill="var(--bp-typography-color-muted)">
                    {v.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {series.map((p, i) => {
              const ch = Math.max(0, Math.min(1, Number(p.change) || 0));
              const barH = ch * innerH * 0.5;
              const bw = innerW / series.length;
              return (
                <rect
                  key={`bar-${i}`}
                  x={x(i) - bw * 0.3}
                  y={pad.t + innerH - barH}
                  width={bw * 0.6}
                  height={Math.max(0, barH)}
                  fill="var(--bp-intent-primary-rest)"
                  opacity={active === i ? 0.9 : 0.22}
                />
              );
            })}

            <path d={linePath} fill="none" stroke="var(--bp-intent-success-rest)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {series.map((p, i) => (
              <g key={`pt-${i}`}>
                <circle
                  cx={x(i)}
                  cy={y(Number(p.vv))}
                  r={active === i ? 4.5 : 3}
                  fill={active === i ? 'var(--bp-intent-warning-rest)' : 'var(--bp-intent-success-rest)'}
                />
                <text x={x(i)} y={H - 14} textAnchor="middle" fontSize="8" fill="var(--bp-typography-color-muted)">
                  {formatDate(p.date)}
                </text>
              </g>
            ))}

            {active >= 0 ? (
              <line x1={x(active)} x2={x(active)} y1={pad.t} y2={pad.t + innerH} stroke="var(--bp-intent-warning-rest)" strokeWidth="1.5" />
            ) : null}
          </svg>
        </div>

        <p className="micro" style={{ marginTop: 8 }}>{t('timeSeries.hint')}</p>
      </div>
    </section>
  );
}