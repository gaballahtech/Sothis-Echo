import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { CompareSlider } from './SceneCanvas';
import { Panel, SectionHead } from './ui';

const LEGEND = [
  { key: 'legendWater', swatch: 'var(--bp-palette-gray-1)' },
  { key: 'legendCanopy', swatch: 'var(--bp-palette-gray-3)' },
  { key: 'legendTrunk', swatch: 'var(--bp-palette-light-gray-2)' },
];

export default function SeeThrough() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, selectedSiteId } = useSiteData();
  // Follow the shared selection so the comparison always shows the same place
  // as the study areas, lenses and explain section underneath it.
  const site =
    sites.find((item) => item.id === selectedSiteId) ??
    sites.find((item) => (item.states?.after?.imageUrl || item.states?.after?.nisarImageUrl) && item.states?.after?.opticalUrl) ??
    sites.find((item) => item.id === 'sundarbans') ??
    sites[0];
  const state = site?.states?.after;

  if (!site || !state) return null;

  const siteName = localized(site.name, language);
  const stateLabel = localized(state.label, language);
  // Prefer the calibrated HH scene crop the study areas render, so the radar
  // side is the identical product and footprint — not the full swath browse.
  const radarIsScene = Boolean(state.imageUrl);
  const radarUrl = radarIsScene ? state.imageUrl : state.nisarImageUrl;
  const radarDate = state.nisarDate || state.date;
  // Every scene in this app is a NISAR L-band HH browse image, so the radar
  // layer is always NISAR; there is no Sentinel fallback branch to mislabel.
  const radarPlatform = 'NASA NISAR L-band';
  const radarLabel = t('seeThrough.radar');
  const radarCaption = t('seeThrough.radarCaption');

  return (
    <section id="see-through" className="content-section chapter chapter--teal" aria-labelledby="see-through-title">
      <div className="section-inner">
        <SectionHead title={t('seeThrough.title')} subtitle={t('seeThrough.subtitle')} id="see-through-title" />

        <div className="split-main">
          <Panel
            title={`${siteName} · ${radarDate} · ${stateLabel}`}
            bodyClassName="card-pad"
          >
            <CompareSlider
              site={site}
              params={state.params}
              opticalAlt={`${siteName} — ${t('seeThrough.optical')}`}
              radarAlt={`${siteName} — ${radarLabel}`}
              opticalLabel={t('seeThrough.optical')}
              radarLabel={radarLabel}
              opticalUrl={state.opticalUrl}
              opticalCrop={state.opticalCrop ?? null}
              radarUrl={radarUrl}
              radarCrop={radarIsScene ? null : (state.nisarCrop ?? null)}
              radarFit={radarIsScene ? 'cover' : (state.nisarImageUrl ? 'contain' : 'cover')}
              radarClassName={radarIsScene ? '' : (state.nisarImageUrl ? 'compare-layer--nisar' : '')}
              radarEager
            />
            {state.nisarImageUrl && !radarIsScene ? (
              <p className="micro" style={{ margin: '6px 0 0' }}>
                {t('seeThrough.nisarSwath')}
              </p>
            ) : null}
            <p className="micro" style={{ margin: '8px 0 0' }}>
              {state.opticalUrl
                ? `${state.opticalPlatform || 'Sentinel-2'} · ${state.opticalDate} · ${Math.round(state.opticalCloudCover ?? 0)}% ${language === 'ar' ? 'غيوم' : 'cloud'} — ${radarPlatform} · ${radarDate}`
                : t('seeThrough.noImage')}
            </p>

            <div className="info-list" style={{ marginTop: 12, border: '1px solid var(--bp-surface-border-color-default)', borderRadius: 'var(--bp-surface-border-radius)' }}>
              <div className="info-block">
                <h4>{t('seeThrough.optical')}</h4>
                <p className="body-copy-muted" style={{ margin: 0 }}>{t('seeThrough.opticalCaption')}</p>
              </div>
              <div className="info-block">
                <h4>{radarLabel}</h4>
                <p className="body-copy" style={{ margin: 0 }}>{radarCaption}</p>
              </div>
            </div>

          </Panel>

          <div className="stack">
            <Panel title={t('seeThrough.calloutTitle')} bodyClassName="card-pad">
              <p className="body-copy-muted" style={{ margin: 0 }}>{t('seeThrough.calloutBody')}</p>
              <div className="stack" style={{ gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--bp-surface-border-color-default)' }}>
                {LEGEND.map((item) => (
                  <div key={item.key} className="row" style={{ flexWrap: 'nowrap' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 34,
                        height: 18,
                        flex: '0 0 34px',
                        background: item.swatch,
                        border: '1px solid var(--bp-surface-border-color-strong)',
                        borderRadius: 0,
                      }}
                    />
                    <span className="small">{t(`seeThrough.${item.key}`)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}
