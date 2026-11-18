import { useEffect, useState } from 'react';
import { Button, Callout, Spinner } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { loadRapidResponse } from '../services/sarApi';

/**
 * "Rapid Response" — turn the selected site into an actionable situation report:
 * extent (km²), population exposed (WorldPop estimate), dominant mechanism, and
 * a one-page shareable PNG. Population is labelled as an estimate; if the data
 * is unavailable the report says so instead of faking a number.
 */
export default function RapidResponse() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, source } = useSiteData();
  const [activeId, setActiveId] = useState(() => sites[0]?.id);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!sites.some((item) => item.id === activeId)) setActiveId(sites[0]?.id);
  }, [sites, activeId]);

  const site = sites.find((item) => item.id === activeId) ?? sites[0];

  useEffect(() => {
    if (source !== 'api' || !site?.id) {
      setData(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setData(null);
    loadRapidResponse(site.id).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [site?.id, source]);

  if (!site) return null;

  if (source !== 'api') {
    return (
      <section id="respond" className="content-section chapter" aria-labelledby="respond-title">
        <div className="section-inner">
          <h2 id="respond-title" style={{ margin: 0 }}>{t('respond.title')}</h2>
          <p className="body-copy-muted" style={{ marginTop: 8 }}>{t('respond.offline')}</p>
        </div>
      </section>
    );
  }

  const makeReport = async () => {
    if (!site?.id) return;
    setRendering(true);
    const result = await loadRapidResponse(site.id, { report: true });
    if (result) setData(result);
    setRendering(false);
  };

  const downloadReport = () => {
    if (!data?.reportImage) return;
    const anchor = document.createElement('a');
    anchor.href = data.reportImage;
    anchor.download = `${site.id}-situation-report.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const mechanismLabel = (kind) => {
    const map = {
      fire: t('respond.mechFire'),
      flood: t('respond.mechFlood'),
      disturbance: t('respond.mechDisturbance'),
      smoothing: t('respond.mechSmoothing'),
      roughening: t('respond.mechRoughening'),
      stable: t('respond.mechStable'),
    };
    return map[kind] || kind || '—';
  };

  return (
    <section id="respond" className="content-section chapter" aria-labelledby="respond-title">
      <div className="section-inner">
        <div className="row-between" style={{ alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 id="respond-title" style={{ margin: 0 }}>{t('respond.title')}</h2>
            <p className="body-copy-muted" style={{ margin: '6px 0 0', maxWidth: 720 }}>{t('respond.subtitle')}</p>
          </div>
          <Button intent="primary" onClick={makeReport} loading={rendering} icon="flame" text={t('respond.generate')} data-testid="respond-generate" />
        </div>

        {loading ? (
          <div style={{ padding: '24px 0' }}><Spinner size={24} /></div>
        ) : !data ? (
          <Callout intent="primary" style={{ marginTop: 14 }}>{t('respond.unavailable')}</Callout>
        ) : (
          <div className="stack" style={{ gap: 16, marginTop: 14 }}>
            <div className="grid-2" data-testid="respond-stats">
              <div className="stat">
                <div className="stat-label">{t('respond.extent')}</div>
                <p className="numeric" style={{ margin: 0, fontSize: 20, fontWeight: 600 }} dir="ltr">
                  {data.extentKm2 != null ? `${data.extentKm2} km²` : '—'}
                </p>
              </div>
              <div className="stat">
                <div className="stat-label">{t('respond.populationExposed')}</div>
                <p className="numeric" style={{ margin: 0, fontSize: 20, fontWeight: 600 }} dir="ltr">
                  {data.populationExposed != null ? data.populationExposed.toLocaleString() : '—'}
                </p>
                <p className="micro" style={{ margin: '2px 0 0' }}>
                  {data.populationNote === 'estimate'
                    ? t('respond.populationEstimate', { source: data.population?.source || 'WorldPop', year: data.population?.year || '' })
                    : t('respond.populationUnavailable')}
                </p>
              </div>
              <div className="stat">
                <div className="stat-label">{t('respond.mechanism')}</div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{mechanismLabel(data.mechanism)}</p>
              </div>
              <div className="stat">
                <div className="stat-label">{t('respond.extentPct')}</div>
                <p className="numeric" style={{ margin: 0, fontSize: 18 }} dir="ltr">
                  {data.changedPct != null ? `${data.changedPct}%` : '—'}
                </p>
              </div>
            </div>

            {data.decision ? (
              <div className="explain-headline" data-testid="respond-decision">
                <span className="micro" style={{ display: 'block', opacity: 0.7, marginBottom: 4 }}>{t('respond.decision')}</span>
                {data.decision}
              </div>
            ) : null}

            {data.reportImage ? (
              <div className="stack" style={{ gap: 8 }}>
                {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                <img className="lens-image" src={data.reportImage} alt={t('respond.reportAlt')} data-testid="respond-report" />
                <div>
                  <Button icon="download" onClick={downloadReport} text={t('respond.download')} />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}