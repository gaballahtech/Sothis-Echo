import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localized } from '../data/localized';
import { atlasSites, CHANGE_TYPES } from '../data/atlas';
import AtlasMap from './AtlasMap';
import { useSiteData } from '../context/SiteDataContext';

/**
 * Global Atlas section — the inline world map plus a curated list. Measured
 * sites (maturity 'lens') are clickable and jump to their study-area detail;
 * story-only sites are shown honestly as "not yet measured" and are not
 * clickable-into-numbers.
 */
export default function AtlasSection() {
  const { t } = useTranslation();
  const { sites } = useSiteData();
  const [selectedId, setSelectedId] = useState(() => atlasSites[0]?.id);
  const selected = atlasSites.find((site) => site.id === selectedId) ?? atlasSites[0];

  // Only the measured sites can be opened in StudyAreas; story sites just
  // preview their summary inline.
  const measuredIds = new Set(sites.map((site) => site.id));

  useEffect(() => {
    if (selectedId && !atlasSites.some((site) => site.id === selectedId)) {
      setSelectedId(atlasSites[0]?.id);
    }
  }, [selectedId]);

  const openSite = (site) => {
    if (!measuredIds.has(site.id)) return;
    const target = document.getElementById('sites');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const changeTypeName = (ct) => {
    const found = CHANGE_TYPES.find((item) => item.id === ct);
    return found ? localized(found.name, 'en') : ct;
  };

  return (
    <section id="atlas" className="content-section chapter" aria-labelledby="atlas-title">
      <div className="section-inner">
        <h2 id="atlas-title" style={{ margin: 0 }}>{t('atlas.title')}</h2>
        <p className="body-copy-muted" style={{ margin: '6px 0 0', maxWidth: 760 }}>{t('atlas.subtitle')}</p>

        <div style={{ marginTop: 16 }}>
          <AtlasMap selectedId={selectedId} onSelect={(site) => setSelectedId(site.id)} />
        </div>

        {/* selected site preview */}
        {selected ? (
          <div className="atlas-preview" data-testid="atlas-preview">
            <div>
              <h3 style={{ margin: '0 0 4px' }}>{localized(selected.name, 'en')}</h3>
              <p className="micro" style={{ margin: '0 0 6px' }}>
                {localized(selected.region, 'en')} · {changeTypeName(selected.changeType)}
                {' · '}
                {selected.maturity === 'lens' ? t('atlas.measured') : t('atlas.storyOnly')}
              </p>
              <p className="body-copy" style={{ margin: 0 }}>{localized(selected.summary, 'en')}</p>
            </div>
            {measuredIds.has(selected.id) ? (
              <button
                type="button"
                className="atlas-open"
                onClick={() => openSite(selected)}
                data-testid="atlas-open"
              >
                {t('atlas.openStory')} →
              </button>
            ) : (
              <span className="atlas-pending micro">{t('atlas.notMeasured')}</span>
            )}
          </div>
        ) : null}

        {/* full curated list */}
        <div className="atlas-list" data-testid="atlas-list">
          {atlasSites.map((site) => (
            <button
              key={site.id}
              type="button"
              className={`atlas-list-item${site.id === selectedId ? ' active' : ''}`}
              onClick={() => setSelectedId(site.id)}
              data-testid={`atlas-item-${site.id}`}
            >
              <span
                className="atlas-list-swatch"
                style={{ background: (CHANGE_TYPES.find((c) => c.id === site.changeType) || {}).color || '#888' }}
              />
              <span className="atlas-list-name">{localized(site.name, 'en')}</span>
              <span className="atlas-list-meta micro">
                {localized(site.region, 'en')}
                {site.maturity === 'lens' ? ` · ${t('atlas.measured')}` : ''}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}