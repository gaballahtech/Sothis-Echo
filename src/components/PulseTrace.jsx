import { useTranslation } from 'react-i18next';

/**
 * Real data view for the sonification section: the 16 pass-change values that
 * drive the audio, drawn as a bar trace. No simulated terrain — every bar is a
 * value from the live (or bundled fallback) radar series.
 */
export default function PulseTrace({ values = [], currentPassIndex = -1, playing = false }) {
  const { t } = useTranslation();
  const safe = values.length ? values : Array(16).fill(0);
  const W = 900;
  const H = 240;
  const pad = { l: 28, r: 12, t: 18, b: 34 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const barW = innerW / safe.length;
  const active = currentPassIndex >= 0 ? currentPassIndex : -1;

  return (
    <div className="pulse-trace" data-testid="pulse-trace">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('sound.mappingTitle')} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = pad.t + innerH * (1 - tick);
          return (
            <g key={tick}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--bp-surface-border-color-default)" strokeDasharray="2 4" />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--bp-typography-color-muted)">
                {Math.round(tick * 100)}
              </text>
            </g>
          );
        })}
        {safe.map((value, index) => {
          const v = Math.max(0, Math.min(1, Number(value) || 0));
          const height = v * innerH;
          const x = pad.l + index * barW + barW * 0.14;
          const y = pad.t + innerH - height;
          const isActive = index === active;
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barW * 0.72}
                height={Math.max(1, height)}
                fill={isActive ? 'var(--bp-intent-warning-rest)' : 'var(--bp-intent-primary-rest)'}
                opacity={isActive ? 1 : 0.78}
              />
              <text x={x + (barW * 0.72) / 2} y={H - 16} textAnchor="middle" fontSize="8" fill="var(--bp-typography-color-muted)">
                {index + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="micro" style={{ margin: '4px 12px 0', paddingBottom: 8 }}>
        {playing
          ? t('sound.nowPlaying', { current: active + 1, total: safe.length })
          : t('sound.mappingTitle')}
      </p>
    </div>
  );
}
