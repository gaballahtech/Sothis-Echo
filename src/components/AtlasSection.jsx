import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localized } from '../data/localized';
import { atlasSites, CHANGE_TYPES } from '../data/atlas';
import AtlasMap from './AtlasMap';
import { useSiteData } from '../context/SiteDataContext';

/**
 * Global Atlas — a real Leaflet/OSM map plus a curated list. Clicking a
 * measured site selects it across the whole page (study area, lenses, explain,
 * rapid response) and scrolls to the story. Story-only sites zoom in and show
 * their narrative, clearly labelled as narrative (not a failure).
 */
export default function AtlasSection() {
  const { t } = useTranslation();
  const { sites, setSelectedSiteId } = useSiteData();
  const [selectedId, setSelectedId] = useState(() => atlasSites[0]?.id);
  const selected = atlasSites.find((site) => site.id === selectedId) ?? atlasSites[0];

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

  const isMeasured = selected ? measuredIds.has(selected.id) : false;

  return (
    <section id="atlas" className="content-section chapter" aria-labelledby="atlas-title">
      <div className="section-inner">
        <h2 id="atlas-title" style={{ margin: 0 }}>{t('atlas.title')}</h2>
        <p className="body-copy-muted" style={{ margin: '6px 0 0', maxWidth: 760 }}>{t('atlas.subtitle')}</p>

        <div style={{ marginTop: 16 }}>
          <AtlasMap selectedId={selectedId} onSelect={choose} />
        </div>

        {selected ? (
          <div className={`atlas-preview${isMeasured ? ' is-measured' : ''}`} data-testid="atlas-preview">
            <div className="atlas-preview-main">
              <h3 style={{ margin: '0 0 4px' }}>{localized(selected.name, 'en')}</h3>
              <p className="micro" style={{ margin: '0 0 10px' }}>
                {localized(selected.region, 'en')} · {changeTypeName(selected.changeType)}
                {' · '}
                <span className={isMeasured ? 'atlas-badge measured' : 'atlas-badge story'}>
                  {isMeasured ? t('atlas.measured') : t('atlas.storyOnly')}
                </span>
              </p>

              <dl className="atlas-story">
                <dt>{t('atlas.whatHappened')}</dt>
                <dd>{localized(selected.summary, 'en')}</dd>
                <dt>{t('atlas.whyRadar')}</dt>
                <dd>{localized(selected.radar, 'en')}</dd>
                <dt>{t('atlas.whatMeasures')}</dt>
                <dd>{localized(selected.measure, 'en')}</dd>
              </dl>
            </div>
            <div className="atlas-preview-action">
              {isMeasured ? (
                <button type="button" className="atlas-open" onClick={() => openStory(selected)} data-testid="atlas-open">
                  {t('atlas.openStory')} →
                </button>
              ) : (
                <span className="atlas-pending micro">{t('atlas.storyNote')}</span>
              )}
            </div>
          </div>
        ) : null}

        <div className="atlas-list" data-testid="atlas-list">
          {atlasSites.map((site) => {
            const measured = measuredIds.has(site.id);
            return (
              <button
                key={site.id}
                type="button"
                className={`atlas-list-item${site.id === selectedId ? ' active' : ''}${measured ? ' measured' : ''}`}
                onClick={() => choose(site)}
                data-testid={`atlas-item-${site.id}`}
                title={measured ? t('atlas.clickToOpen') : localized(site.summary, 'en')}
              >
                <span
                  className="atlas-list-swatch"
                  style={{ background: (CHANGE_TYPES.find((c) => c.id === site.changeType) || {}).color || '#888' }}
                />
                <span className="atlas-list-name">{localized(site.name, 'en')}</span>
                <span className="atlas-list-meta micro">
                  {measured ? t('atlas.measured') : t('atlas.storyOnly')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}