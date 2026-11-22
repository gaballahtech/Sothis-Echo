import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';

/**
 * Lightweight 3D terrain: stacks ~32 transparent height slices (PNG) with CSS
 * 3D transforms (no WebGL/Three.js). The radar browse is draped on the top.
 */
export default function Terrain3D({ radarUrl }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, selectedSiteId } = useSiteData();
  const site = sites.find((s) => s.id === selectedSiteId) ?? sites[0];
  const [manifest, setManifest] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!site?.id) return;
    setManifest(null);
    setFailed(false);
    fetch(`/terrain/${site.id}/manifest.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((m) => setManifest(m))
      .catch(() => setFailed(true));
  }, [site?.id]);

  if (!site) return null;
  if (failed) return <div className="micro">{t('seeThrough.noImage')}</div>;
  if (!manifest) return <div className="micro">{t('common.loading')}</div>;

  const step = 5; // px per height level
  const levels = Array.from({ length: manifest.levels }, (_, i) => i);
  const topZ = (manifest.levels - 1) * step;

  return (
    <div
      className="terrain3d"
      role="img"
      aria-label={t('seeThrough.view3d')}
      style={{ perspective: '1200px', height: 420, overflow: 'hidden', borderRadius: 12, background: 'var(--bp-surface-color, #0c0e12)' }}
    >
      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateX(56deg) rotateZ(-15deg)',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {levels.map((level) => (
          <img
            key={level}
            src={`/terrain/${site.id}/slice-${String(level).padStart(2, '0')}.png`}
            alt=""
            loading="lazy"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              transform: `translateZ(${level * step}px)`,
              imageRendering: 'pixelated',
            }}
          />
        ))}
        {radarUrl ? (
          <img
            src={radarUrl}
            alt={localized(site.name, language)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              transform: `translateZ(${topZ + 3}px)`,
              objectFit: 'cover',
              opacity: 0.82,
              borderRadius: 8,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}