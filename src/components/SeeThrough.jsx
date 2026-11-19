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

/**
 * Parse a POLYGON WKT into a lon/lat bbox: [west, south, east, north].
 * Returns null when no coordinates are present.
 */
function parseWktBbox(wkt) {
  if (typeof wkt !== 'string') return null;
  const coords = [];
  const regex = /([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)/g;
  let match;
  while ((match = regex.exec(wkt)) !== null) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    if (Number.isFinite(x) && Number.isFinite(y)) coords.push([x, y]);
  }
  if (!coords.length) return null;
  const west = Math.min(...coords.map(([x]) => x));
  const south = Math.min(...coords.map(([, y]) => y));
  const east = Math.max(...coords.map(([x]) => x));
  const north = Math.max(...coords.map(([, y]) => y));
  return [west, south, east, north];
}

function esriOpticalURL(bbox) {
  const [w, s, e, n] = bbox;
  return `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${w},${s},${e},${n}&bboxSR=4326&imageSR=4326&size=760,500&format=png&f=image`;
}

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

  // The optical side must cover the exact same bbox as the radar, so fetch a
  // georeferenced Esri World Imagery export over the site bbox and render it
  // uncropped (crop=null). Never a fractional crop of a whole-tile thumbnail.
  const wktBbox = parseWktBbox(site.wkt);
  const esriOptical = Boolean(wktBbox);
  const opticalUrl = esriOptical ? esriOpticalURL(wktBbox) : null;
  const opticalPlatform = esriOptical ? 'Esri World Imagery' : (state.opticalPlatform || 'Sentinel-2');
  const opticalLabel = t('seeThrough.optical');
  const opticalCaption = esriOptical
    ? 'Esri World Imagery satellite basemap over the exact study window — north-up, no crop offset.'
    : t('seeThrough.opticalCaption');

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
              opticalLabel={opticalLabel}
              radarLabel={radarLabel}
              opticalUrl={opticalUrl}
              opticalCrop={null}
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
              {opticalUrl
                ? `${opticalPlatform} · ${radarPlatform} · ${radarDate}`
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
              <div className="info-block">
                <h4>{t('seeThrough.temporalNote')}</h4>
                <p className="body-copy-muted" style={{ margin: 0 }}>{t('seeThrough.temporalNoteBody')}</p>
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
