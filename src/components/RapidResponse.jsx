import { useEffect, useState } from 'react';
import { Button, Callout, Spinner } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { loadRapidResponse, pickDefaultSiteId } from '../services/sarApi';

/**
 * Draw the one-page situation report onto a <canvas> and return a PNG data URL.
 * Runs entirely in the browser so the feature works on the deployed serverless
 * site (no Python venv needed). English/Arabic aware for labels.
 */
async function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function renderReportCanvas(data, site, t, language) {
  const dir = language === 'ar';
  const W = 1000;
  const H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#0c0e12';
  ctx.fillRect(0, 0, W, H);

  const label = (text) => (dir ? [...String(text)].reverse().join('') : String(text));
  const font = (size, weight = '400') => `${weight} ${size}px system-ui, -apple-system, sans-serif`;

  ctx.fillStyle = '#78dcb4';
  ctx.font = font(20, '700');
  ctx.fillText(label(t('respond.reportHeader')), 30, 44);
  ctx.fillStyle = '#c8c8c8';
  ctx.font = font(13);
  ctx.fillText(label(`${localized(site.name, language)} · ${data.generatedAt || ''}`), 30, 70);

  let y = 120;
  const rows = [
    [t('respond.extent'), data.extentKm2 != null ? `${data.extentKm2} km²` : '—'],
    [t('respond.extentPct'), data.changedPct != null ? `${data.changedPct}%` : '—'],
    [t('respond.mechanism'), data.mechanism || '—'],
    [t('respond.populationExposed'), data.populationExposed != null ? data.populationExposed.toLocaleString() : '—'],
    [
      t('respond.populationTotal'),
      data.population ? `${data.population.total.toLocaleString()} (${data.population.source})` : t('respond.populationUnavailable'),
    ],
  ];
  for (const [k, v] of rows) {
    ctx.fillStyle = '#8a8f98';
    ctx.font = font(14);
    ctx.fillText(label(k), 30, y);
    ctx.fillStyle = '#f2f2f2';
    ctx.font = font(18, '600');
    ctx.fillText(label(String(v)), 380, y);
    y += 40;
  }

  if (data.decision) {
    ctx.fillStyle = '#8a8f98';
    ctx.font = font(13);
    ctx.fillText(label(t('respond.decision')), 30, y + 8);
    ctx.fillStyle = '#ffdc78';
    ctx.font = font(15, '500');
    wrapText(ctx, label(data.decision), 380, y + 8, W - 420, 22);
    y += 60;
  }

  const keys = ['mechanismBefore', 'mechanismAfter', 'coherence'];
  const imgs = await Promise.all(keys.map((k) => loadImage(data.images?.[k])));
  let tx = 30;
  const ty = Math.min(y + 30, H - 200);
  for (let i = 0; i < keys.length; i += 1) {
    const img = imgs[i];
    if (!img) continue;
    const tw = 300;
    const th = 200;
    ctx.drawImage(img, tx, ty, tw, th);
    ctx.strokeStyle = '#2a3545';
    ctx.strokeRect(tx, ty, tw, th);
    ctx.fillStyle = '#8a8f98';
    ctx.font = font(12);
    ctx.fillText(keys[i], tx, ty + th + 16);
    tx += tw + 20;
  }

  return canvas.toDataURL('image/png');
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}

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
  const [activeId, setActiveId] = useState(() => pickDefaultSiteId(sites));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!sites.length) return;
    if (!sites.some((item) => item.id === activeId)) {
      setActiveId(pickDefaultSiteId(sites));
      return;
    }
    const preferred = pickDefaultSiteId(sites);
    if (preferred && preferred !== activeId) setActiveId(preferred);
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
    if (!site?.id || !data) return;
    setRendering(true);
    const dataUrl = await renderReportCanvas(data, site, t, language);
    if (dataUrl) setData((prev) => (prev ? { ...prev, reportImage: dataUrl } : prev));
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