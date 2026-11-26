import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localized } from '../data/localized';
import { atlasSites, CHANGE_TYPES } from '../data/atlas';
import AtlasMap from './AtlasMap';
import { useSiteData } from '../context/SiteDataContext';
import { useCaseFile } from '../context/CaseFileContext';
import GlossaryText from './GlossaryText';

/**
 * Static satellite (optical basemap) thumbnail for any site, from its bbox or
 * coords, via the Esri World Imagery export. Used for story-only sites that have
 * no real NISAR snapshot, so every card shows a real image instead of a colour.
 */
function satelliteThumb(site) {
  let bbox;
  const b = site.bbox;
  if (Array.isArray(b) && b.length === 4) {
    bbox = `${b[0]},${b[1]},${b[2]},${b[3]}`;
  } else if (site.coords && Number.isFinite(site.coords.lng) && Number.isFinite(site.coords.lat)) {
    const { lng, lat } = site.coords;
    bbox = `${lng - 0.05},${lat - 0.05},${lng + 0.05},${lat + 0.05}`;
  } else {
    return null;
  }
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=3857&size=640,420&format=jpg&f=image`;
}

// Rule-based "local impact" — what this change means for people living here.
const LOCAL_IMPACT = {
  flood: {
    en: 'For residents here, this means flood risk. Check drainage, avoid low-lying areas, and prepare an evacuation plan.',
    ar: 'للسكان هنا، هذا يعني خطر الفيضان. تحقق من الصرف، تجنّب المناطق المنخفضة، وجهّز خطة إخلاء.',
  },
  fire: {
    en: 'For residents here, this means fire risk. Create defensible space, prepare a go-bag, and follow evacuation orders.',
    ar: 'للسكان هنا، هذا يعني خطر الحريق. أنشئ مساحة دفاعية، جهّز حقيبة طوارئ، واتبع أوامر الإخلاء.',
  },
  landslide: {
    en: 'For residents here, this means landslide risk. Avoid steep slopes, watch for cracks, and follow evacuation orders.',
    ar: 'للسكان هنا، هذا يعني خطر الانهيار. تجنّب المنحدرات الشديدة، راقب الشقوق، واتبع أوامر الإخلاء.',
  },
  deforestation: {
    en: 'For residents here, this means forest loss and its effects on water, soil and livelihoods.',
    ar: 'للسكان هنا، هذا يعني فقدان الغابات وتأثيرها على الماء والتربة وسبل العيش.',
  },
  glacier: {
    en: 'For residents here, this means changing water supply and long-term landscape change.',
    ar: 'للسكان هنا، هذا يعني تغيّر إمدادات المياه وتغيّر المشهد على المدى الطويل.',
  },
  volcano: {
    en: 'For residents here, this means volcanic risk and the need for monitoring and evacuation plans.',
    ar: 'للسكان هنا، هذا يعني خطرًا بركانيًا والحاجة للمراقبة وخطط الإخلاء.',
  },
  subsidence: {
    en: 'For residents here, this means ground sinking that can damage buildings and infrastructure.',
    ar: 'للسكان هنا، هذا يعني هبوط الأرض الذي قد يلحق أضرارًا بالمباني والبنية التحتية.',
  },
  'oil-spill': {
    en: 'For residents here, this means water contamination and impacts on fishing and ecosystems.',
    ar: 'للسكان هنا، هذا يعني تلوث المياه وتأثيرات على الصيد والنظم البيئية.',
  },
  crop: {
    en: 'For residents here, this means changes in crop health and food security.',
    ar: 'للسكان هنا، هذا يعني تغيّرات في صحة المحاصيل والأمن الغذائي.',
  },
  earthquake: {
    en: 'For residents here, this means ground deformation that can damage structures.',
    ar: 'للسكان هنا، هذا يعني تشوّه الأرض الذي قد يلحق أضرارًا بالمنشآت.',
  },
};

/**
 * Global Atlas — a real Leaflet/OSM map plus a card for every curated site.
 * All places are shown at once (name, region, change type and the full
 * what-happened / why-radar / what-NISAR-measures story). Measured sites also
 * show a real NISAR HH crop and open the study area everywhere; story-only
 * sites are clearly labelled as narrative, never as a failure.
 */
export default function AtlasSection() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const { sites } = useSiteData();
  const { open: openCaseFile } = useCaseFile();
  const [selectedId, setSelectedId] = useState(() => atlasSites[0]?.id);

  const measuredIds = new Set(sites.map((site) => site.id));

  useEffect(() => {
    if (selectedId && !atlasSites.some((site) => site.id === selectedId)) {
      setSelectedId(atlasSites[0]?.id);
    }
  }, [selectedId]);

  // Selecting a story-only site just highlights it on the map and shows its
  // narrative card. Measured sites open the full-screen case file instead.
  const choose = (site) => {
    setSelectedId(site.id);
  };

  const activate = (site) => {
    if (measuredIds.has(site.id)) {
      setSelectedId(site.id);
      openCaseFile(site.id);
    } else {
      choose(site);
    }
  };

  const changeTypeName = (ct) => {
    const found = CHANGE_TYPES.find((item) => item.id === ct);
    return found ? localized(found.name, language) : ct;
  };

  const swatchFor = (site) => (CHANGE_TYPES.find((c) => c.id === site.changeType) || {}).color || '#888';

  return (
    <section id="atlas" className="content-section chapter" aria-labelledby="atlas-title">
      <div className="section-inner">
        <h2 id="atlas-title" style={{ margin: 0 }}>{t('atlas.title')}</h2>
        <p className="body-copy-muted" style={{ margin: '6px 0 0', maxWidth: 760 }}>{t('atlas.subtitle')}</p>

        <div style={{ marginTop: 16 }}>
          <AtlasMap selectedId={selectedId} onSelect={choose} />
        </div>

        <div className="atlas-cards" data-testid="atlas-list">
          {atlasSites.map((site) => {
            const measured = measuredIds.has(site.id);
            const isSelected = site.id === selectedId;
            const thumb = measured
              ? sites.find((item) => item.id === site.id)?.states?.after?.imageUrl
              : null;
            const sat = satelliteThumb(site);
            const color = swatchFor(site);
            return (
              <article
                key={site.id}
                className={`atlas-card${measured ? ' is-measured' : ''}${isSelected ? ' active' : ''}`}
                data-testid={`atlas-item-${site.id}`}
                onClick={(event) => {
                  if (event.target.closest('.term')) return;
                  activate(site);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.target.closest('.term')) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activate(site);
                  }
                }}
                style={{ '--atlas-accent': color }}
              >
                <div
                  className="atlas-card-inner"
                  {...(isSelected ? { 'data-testid': 'atlas-preview' } : {})}
                >
                  <div className={`atlas-card-media${measured && thumb ? '' : ' atlas-card-media--story'}`}>
                    {measured && thumb ? <img src={thumb} alt="" loading="lazy" /> : null}
                    {!measured && sat ? <img src={sat} alt="" loading="lazy" /> : null}
                    <div className="atlas-card-media-overlay">
                      <h3>{localized(site.name, language)}</h3>
                      <span className={measured ? 'atlas-badge measured' : 'atlas-badge story'}>
                        {measured ? t('atlas.measured') : t('atlas.storyOnly')}
                      </span>
                    </div>
                  </div>

                  <div className="atlas-card-body">
                    <p className="micro atlas-card-meta">
                      {localized(site.region, language)} · {changeTypeName(site.changeType)}
                    </p>
                    <div className="atlas-card-place-row">
                      <span className="micro atlas-card-coords" dir="ltr">
                        {site.coords.lat.toFixed(2)}°, {site.coords.lng.toFixed(2)}°
                      </span>
                      <button
                        type="button"
                        className="atlas-maplink micro"
                        onClick={(event) => {
                          event.stopPropagation();
                          choose(site);
                        }}
                      >
                        {t('atlas.viewOnMap')}
                      </button>
                    </div>

                    <dl className="atlas-story">
                      <dt>{t('atlas.whatHappened')}</dt>
                      <dd><GlossaryText text={localized(site.summary, language)} /></dd>
                      <dt>{t('atlas.whyRadar')}</dt>
                      <dd><GlossaryText text={localized(site.radar, language)} /></dd>
                      <dt>{t('atlas.whatMeasures')}</dt>
                      <dd><GlossaryText text={localized(site.measure, language)} /></dd>
                      <dt>{t('atlas.localImpact')}</dt>
                      <dd>{LOCAL_IMPACT[site.changeType]?.[language] || LOCAL_IMPACT[site.changeType]?.en || '—'}</dd>
                    </dl>

                    <div className="atlas-card-action">
                      {measured ? (
                        <button
                          type="button"
                          className="atlas-open"
                          onClick={(event) => {
                            event.stopPropagation();
                            activate(site);
                          }}
                          data-testid={isSelected ? 'atlas-open' : undefined}
                          title={t('atlas.clickToOpen')}
                        >
                          {t('casefile.open')} →
                        </button>
                      ) : (
                        <span className="atlas-pending micro">{t('atlas.storyNote')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
