import { useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup, Callout, Spinner } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { loadLenses } from '../services/sarApi';

/**
 * "Three Lenses" — three independent physical measurements of the same surface
 * change, all from real NISAR data:
 *   A. Amplitude change  (calibrated gamma-0 HH/HV, before vs after)
 *   B. InSAR coherence    (GSLC complex pair; low coherence = structural change)
 *   C. Dual-pol mechanism (HH/HV scattering classes: surface / volume / low)
 * Plus a fused "mechanism change" view.
 *
 * Every number and image comes from server/cache/nisar/<site>-lenses.mjs and
 * carries its own granule + date. When a lens was not computed for a site, its
 * tab shows an explicit "not available" state instead of a placeholder.
 */

const TABS = [
  { id: 'amplitude', key: 'lenses.tabAmplitude' },
  { id: 'coherence', key: 'lenses.tabCoherence' },
  { id: 'mechanism', key: 'lenses.tabMechanism' },
  { id: 'change', key: 'lenses.tabChange' },
];

function dataUrl(base64) {
  return base64 ? `data:image/png;base64,${base64}` : null;
}

function Stat({ label, value, unit }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <p className="numeric" style={{ margin: 0, fontSize: 18, fontWeight: 600 }} dir="ltr">
        {value}
        {unit ? <span className="small" style={{ opacity: 0.7 }}> {unit}</span> : null}
      </p>
    </div>
  );
}

function Legend() {
  return (
    <div className="row lens-legend" style={{ gap: 12, flexWrap: 'wrap' }}>
      <span className="row small"><span className="swatch" style={{ background: 'rgb(220,60,60)' }} />surface / double-bounce</span>
      <span className="row small"><span className="swatch" style={{ background: 'rgb(60,200,90)' }} />volume (canopy)</span>
      <span className="row small"><span className="swatch" style={{ background: 'rgb(40,70,200)' }} />low return (water / shadow)</span>
      <span className="row small"><span className="swatch" style={{ background: 'rgb(255,220,60)' }} />mechanism change</span>
    </div>
  );
}

export default function Lenses() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, source } = useSiteData();
  const [activeId, setActiveId] = useState(() => sites[0]?.id);
  const [tab, setTab] = useState('amplitude');
  const [lenses, setLenses] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sites.some((item) => item.id === activeId)) setActiveId(sites[0]?.id);
  }, [sites, activeId]);

  const site = sites.find((item) => item.id === activeId) ?? sites[0];

  useEffect(() => {
    if (source !== 'api' || !site?.id) {
      setLenses(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setLenses(null);
    loadLenses(site.id).then((data) => {
      if (!cancelled) {
        setLenses(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [site?.id, source]);

  const imgs = lenses?.images || {};
  const coherence = lenses?.coherence || {};
  const amplitude = lenses?.amplitude || {};
  const mechanism = lenses?.mechanism || {};
  const hasCoherence = Boolean(imgs.coherence) && coherence.mean != null;

  const amplitudeRows = useMemo(
    () => [
      { label: 'HH', before: amplitude.hhBeforeDb, after: amplitude.hhAfterDb, delta: amplitude.dHH },
      { label: 'HV', before: amplitude.hvBeforeDb, after: amplitude.hvAfterDb, delta: amplitude.dHV },
    ],
    [amplitude],
  );

  if (!site) return null;
  const L = (value) => localized(value, language);

  // No API / offline: the bundled narrative still renders elsewhere; here we show
  // an honest note instead of fabricating lens imagery.
  if (source !== 'api') {
    return (
      <section id="lenses" className="content-section chapter" aria-labelledby="lenses-title">
        <div className="section-inner">
          <h2 id="lenses-title" style={{ margin: 0 }}>{t('lenses.title')}</h2>
          <p className="body-copy-muted" style={{ marginTop: 8 }}>
            {t('lenses.offline')}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="lenses" className="content-section chapter" aria-labelledby="lenses-title">
      <div className="section-inner">
        <div className="row-between" style={{ alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 id="lenses-title" style={{ margin: 0 }}>{t('lenses.title')}</h2>
            <p className="body-copy-muted" style={{ margin: '6px 0 0', maxWidth: 720 }}>
              {t('lenses.subtitle')}
            </p>
          </div>
          <ButtonGroup className="site-tabs" role="tablist" aria-label={t('lenses.title')}>
            {sites.map((item) => {
              const selected = item.id === site.id;
              return (
                <Button
                  key={item.id}
                  role="tab"
                  aria-selected={selected}
                  active={selected}
                  variant={selected ? 'solid' : 'outlined'}
                  onClick={() => setActiveId(item.id)}
                  data-testid={`lens-site-tab-${item.id}`}
                >
                  {L(item.name)}
                </Button>
              );
            })}
          </ButtonGroup>
        </div>

        <div className="lens-tabs" style={{ marginTop: 14 }}>
          <ButtonGroup minimal>
            {TABS.map((item) => (
              <Button
                key={item.id}
                small
                active={tab === item.id}
                text={t(item.key)}
                onClick={() => setTab(item.id)}
                data-testid={`lens-tab-${item.id}`}
              />
            ))}
          </ButtonGroup>
        </div>

        {loading ? (
          <div className="lens-loading" style={{ padding: '32px 0', textAlign: 'center' }}>
            <Spinner size={28} />
          </div>
        ) : !lenses ? (
          <Callout intent="primary" style={{ marginTop: 14 }} data-testid="lens-unavailable">
            {t('lenses.unavailable')}
          </Callout>
        ) : (
          <div role="tabpanel" aria-label={L(site.name)} style={{ marginTop: 14 }}>
            {tab === 'amplitude' ? (
              <div className="stack" style={{ gap: 14 }}>
                <p className="body-copy-muted" style={{ margin: 0 }}>{t('lenses.amplitudeBody')}</p>
                <div className="grid-2">
                  {amplitudeRows.map((row) => (
                    <div key={row.label} className="stat">
                      <div className="stat-label">{row.label} · γ₀ (dB)</div>
                      <p className="numeric" style={{ margin: 0, fontSize: 18 }} dir="ltr">
                        {row.before ?? '—'} → {row.after ?? '—'}
                        <span className="small" style={{ opacity: 0.7 }}>
                          {' '}({row.delta >= 0 ? '+' : ''}{row.delta ?? '—'})
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
                <p className="micro" style={{ margin: 0 }} dir="ltr">
                  {t('lenses.pairNote', { before: lenses.pair?.before || '', after: lenses.pair?.after || '' })}
                </p>
              </div>
            ) : null}

            {tab === 'coherence' ? (
              <div className="stack" style={{ gap: 12 }}>
                {hasCoherence ? (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                    <img className="lens-image" src={dataUrl(imgs.coherence)} alt={t('lenses.coherenceAlt')} />
                    <div className="grid-2">
                      <Stat label={t('lenses.meanCoherence')} value={coherence.mean} />
                      <Stat label={t('lenses.lowCoherence')} value={coherence.lowCoherencePct} unit="%" />
                    </div>
                    <p className="body-copy-muted" style={{ margin: 0 }}>{t('lenses.coherenceBody')}</p>
                    <p className="micro" style={{ margin: 0 }} dir="ltr">
                      {coherence.granuleBefore} · {coherence.granuleAfter}
                    </p>
                  </>
                ) : (
                  <Callout intent="primary" data-testid="lens-coherence-unavailable">
                    {lenses.coherenceNote || t('lenses.coherenceUnavailable')}
                  </Callout>
                )}
              </div>
            ) : null}

            {tab === 'mechanism' ? (
              <div className="stack" style={{ gap: 12 }}>
                <Legend />
                <div className="scene-grid">
                  <div className="stack" style={{ gap: 0 }}>
                    <img className="lens-image" src={dataUrl(imgs.mechanismBefore)} alt={t('lenses.mechanismBeforeAlt')} />
                    <p className="micro" style={{ margin: '6px 0 0' }}>{t('lenses.before')}</p>
                  </div>
                  <div className="stack" style={{ gap: 0 }}>
                    <img className="lens-image" src={dataUrl(imgs.mechanismAfter)} alt={t('lenses.mechanismAfterAlt')} />
                    <p className="micro" style={{ margin: '6px 0 0' }}>{t('lenses.after')}</p>
                  </div>
                </div>
                <p className="body-copy-muted" style={{ margin: 0 }}>{t('lenses.mechanismBody')}</p>
                <p className="micro" style={{ margin: 0 }}>
                  {t('lenses.mechanismThresholds', {
                    low: lenses.thresholds?.lowDb ?? '−20',
                    ratio: lenses.thresholds?.volumeRatioDb ?? '−6',
                  })}
                </p>
              </div>
            ) : null}

            {tab === 'change' ? (
              <div className="stack" style={{ gap: 12 }}>
                <Legend />
                <img className="lens-image" src={dataUrl(imgs.mechanismChange)} alt={t('lenses.changeAlt')} />
                <p className="body-copy-muted" style={{ margin: 0 }}>{t('lenses.changeBody')}</p>
                {mechanism.changedPct != null ? (
                  <div className="grid-2">
                    <Stat label={t('lenses.mechanismChanged')} value={mechanism.changedPct} unit="%" />
                    <Stat
                      label={t('lenses.volumeBefore')}
                      value={mechanism.before?.volume != null ? Math.round(mechanism.before.volume * 100) : '—'}
                      unit="%"
                    />
                  </div>
                ) : null}
                <p className="micro" style={{ margin: 0 }}>
                  {t('lenses.fusionNote')}
                </p>
              </div>
            ) : null}

            <p className="micro" style={{ margin: '14px 0 0', opacity: 0.8 }}>
              {t('lenses.computedAt', { date: lenses.computedAt || '' })}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}