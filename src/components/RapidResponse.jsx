import { useEffect, useState } from 'react';
import { Button, Callout, Spinner } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { loadRapidResponse } from '../services/sarApi';

// Rule-based "questions to ask" and "what to do" per dominant mechanism.
const QUESTIONS = {
  flood: {
    en: ['Has this area flooded before?', 'Are there flood defenses?', 'What is the drainage like?'],
    ar: ['هل غمرت المنطقة سابقًا؟', 'هل توجد دفاعات فيضان؟', 'ما حالة الصرف؟'],
  },
  fire: {
    en: ['Is there defensible space around the property?', 'What is the evacuation route?', 'Are there fire-resistant materials?'],
    ar: ['هل توجد مساحة دفاعية حول العقار؟', 'ما طريق الإخلاء؟', 'هل توجد مواد مقاومة للحريق؟'],
  },
  default: {
    en: ['What changed here, and when?', 'Is the change ongoing or complete?', 'What is the local context?'],
    ar: ['ما الذي تغيّر هنا، ومتى؟', 'هل التغيّر مستمر أم مكتمل؟', 'ما السياق المحلي؟'],
  },
};

const ACTIONS = {
  flood: {
    en: ['Avoid building in the flood zone', 'Check flood insurance', 'Prepare an evacuation plan'],
    ar: ['تجنّب البناء في منطقة الفيضان', 'تحقق من تأمين الفيضان', 'جهّز خطة إخلاء'],
  },
  fire: {
    en: ['Create defensible space', 'Prepare a go-bag', 'Follow evacuation orders'],
    ar: ['أنشئ مساحة دفاعية', 'جهّز حقيبة طوارئ', 'اتبع أوامر الإخلاء'],
  },
  default: {
    en: ['Monitor the area for further change', 'Consult local authorities', 'Document the change with dates'],
    ar: ['راقب المنطقة لأي تغيّر إضافي', 'استشر السلطات المحلية', 'وثّق التغيّر بالتواريخ'],
  },
};

const MECHANISM_WEIGHT = {
  flood: 20, fire: 20, disturbance: 15, 'amplitude-change': 15, smoothing: 10, roughening: 10, stable: 0,
};

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
  // Render Arabic with the correct base direction and shaping. Reversing the
  // characters (the old approach) scrambles the cursive letter forms.
  ctx.direction = dir ? 'rtl' : 'ltr';
  ctx.textAlign = 'left';

  ctx.fillStyle = '#0c0e12';
  ctx.fillRect(0, 0, W, H);

  const label = (text) => String(text);
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

  const decisionText = data?.decision ? (data.decision[language] || data.decision.en || data.decision) : null;
  if (decisionText) {
    ctx.fillStyle = '#8a8f98';
    ctx.font = font(13);
    ctx.fillText(label(t('respond.decision')), 30, y + 8);
    ctx.fillStyle = '#ffdc78';
    ctx.font = font(15, '500');
    wrapText(ctx, label(decisionText), 380, y + 8, W - 420, 22);
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
  const { sites, source, selectedSiteId, setSelectedSiteId } = useSiteData();
  const activeId = selectedSiteId;
  const setActiveId = setSelectedSiteId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!sites.length) return;
    if (!sites.some((item) => item.id === activeId)) setActiveId(sites[0]?.id);
  }, [sites, activeId, setActiveId]);

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
      'amplitude-change': t('respond.mechAmplitude'),
    };
    return map[kind] || kind || '—';
  };

  const decisionText = data?.decision ? (data.decision[language] || data.decision.en || data.decision) : null;

  // Actionable decision brief: risk score + grade + questions + actions.
  const mechanismKey = data?.mechanism === 'fire' ? 'fire' : data?.mechanism === 'flood' ? 'flood' : 'default';
  const questions = QUESTIONS[mechanismKey][language] || QUESTIONS[mechanismKey].en;
  const actions = ACTIONS[mechanismKey][language] || ACTIONS[mechanismKey].en;
  const riskScore = data
    ? Math.min(100, Math.max(0, Math.round(
        (Math.log10(1 + (data.extentKm2 || 0)) / Math.log10(1001)) * 40 +
        (Math.log10(1 + (data.populationExposed || 0)) / Math.log10(1000001)) * 40 +
        (MECHANISM_WEIGHT[data.mechanism] || 0)
      )))
    : null;
  const riskLevel = riskScore == null ? null : riskScore < 30 ? 'low' : riskScore < 70 ? 'medium' : 'high';
  const riskLabel = riskLevel === 'low' ? t('respond.riskLow') : riskLevel === 'medium' ? t('respond.riskMedium') : t('respond.riskHigh');
  const whatItMeans = t('respond.whatItMeansBody', {
    mechanism: mechanismLabel(data?.mechanism),
    extent: data?.extentKm2 ?? '—',
    population: data?.populationExposed != null ? data.populationExposed.toLocaleString() : '—',
  });

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

            {decisionText ? (
              <div className="explain-headline" data-testid="respond-decision">
                <span className="micro" style={{ display: 'block', opacity: 0.7, marginBottom: 4 }}>{t('respond.decision')}</span>
                {decisionText}
              </div>
            ) : null}

            {/* Actionable decision brief: risk score + what it means + questions + actions */}
            <div className="grid-2" data-testid="respond-brief">
              <div className="card">
                <div className="stat-label">{t('respond.riskScore')}</div>
                <p className="numeric" style={{ margin: 0, fontSize: 34, fontWeight: 700 }}>
                  {riskScore ?? '—'}
                </p>
                <div className="micro" style={{ marginTop: 4 }}>{t('respond.riskLevel')}: {riskLabel}</div>
              </div>
              <div className="card">
                <div className="stat-label">{t('respond.whatItMeans')}</div>
                <p className="body-copy" style={{ margin: 0 }}>{whatItMeans}</p>
              </div>
            </div>
            <div className="grid-2">
              <div className="card">
                <h4 className="micro">{t('respond.questionsTitle')}</h4>
                <ul className="small" style={{ margin: 0, paddingInlineStart: 18 }}>
                  {questions.map((q) => <li key={q}>{q}</li>)}
                </ul>
              </div>
              <div className="card">
                <h4 className="micro">{t('respond.actionsTitle')}</h4>
                <ul className="small" style={{ margin: 0, paddingInlineStart: 18 }}>
                  {actions.map((a) => <li key={a}>{a}</li>)}
                </ul>
              </div>
            </div>

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