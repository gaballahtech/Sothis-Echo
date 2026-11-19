import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localized } from '../data/localized';
import { atlasSites, CHANGE_TYPES } from '../data/atlas';
import AtlasMap from './AtlasMap';
import { useSiteData } from '../context/SiteDataContext';

/**
 * Global Atlas — a real Leaflet/OSM map plus a card for every curated site.
 * All places are shown at once (name, region, change type and the full
 * what-happened / why-radar / what-NISAR-measures story). Measured sites also
 * show a real NISAR HH crop and open the study area everywhere; story-only
 * sites are clearly labelled as narrative, never as a failure.
 */
export default function AtlasSection() {
  const { t } = useTranslation();
  const { sites, setSelectedSiteId } = useSiteData();
  const [selectedId, setSelectedId] = useState(() => atlasSites[0]?.id);

  const measuredIds = new Set(sites.map((site) => site.id));

  useEffect(() => {
    if (selectedId && !atlasSites.some((site) => site.id === selectedId)) {
      setSelectedId(atlasSites[0]?.id);
    }
  }, [selectedId]);

  const scrollToSites = () => {
    const target = document.getElementById('sites');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Selecting a measured site both highlights it here and opens its story.
  const choose = (site) => {
    setSelectedId(site.id);
    if (measuredIds.has(site.id)) {
      setSelectedSiteId(site.id);
    }
  };

  const openStory = (site) => {
    if (!measuredIds.has(site.id)) return;
    setSelectedSiteId(site.id);
    scrollToSites();
  };

  const changeTypeName = (ct) => {
    const found = CHANGE_TYPES.find((item) => item.id === ct);
    return found ? localized(found.name, 'en') : ct;
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
            const color = swatchFor(site);
            return (
              <article
                key={site.id}
                className={`atlas-card${measured ? ' is-measured' : ''}${isSelected ? ' active' : ''}`}
                data-testid={`atlas-item-${site.id}`}
                onClick={() => choose(site)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    choose(site);
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
                    <div className="atlas-card-media-overlay">
                      <h3>{localized(site.name, 'en')}</h3>
                      <span className={measured ? 'atlas-badge measured' : 'atlas-badge story'}>
                        {measured ? t('atlas.measured') : t('atlas.storyOnly')}
                      </span>
                    </div>
                  </div>

                  <div className="atlas-card-body">
                    <p className="micro atlas-card-meta">
                      {localized(site.region, 'en')} · {changeTypeName(site.changeType)}
                    </p>

                    <dl className="atlas-story">
                      <dt>{t('atlas.whatHappened')}</dt>
                      <dd>{localized(site.summary, 'en')}</dd>
                      <dt>{t('atlas.whyRadar')}</dt>
                      <dd>{localized(site.radar, 'en')}</dd>
                      <dt>{t('atlas.whatMeasures')}</dt>
                      <dd>{localized(site.measure, 'en')}</dd>
                    </dl>

                    <div className="atlas-card-action">
                      {measured ? (
                        <button
                          type="button"
                          className="atlas-open"
                          onClick={(event) => {
                            event.stopPropagation();
                            openStory(site);
                          }}
                          data-testid={isSelected ? 'atlas-open' : undefined}
                          title={t('atlas.clickToOpen')}
                        >
                          {t('atlas.openStory')} →
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
