import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { localized } from '../data/localized';
import { atlasSites, CHANGE_TYPES, CONTINENTS } from '../data/atlas';

/**
 * AtlasMap — a lightweight inline-SVG world map with site pins coloured by
 * change type. No Leaflet dependency; equirectangular projection keeps the
 * math trivial and the bundle small. Clicking a pin selects the site and the
 * parent loads that site's story.
 */

const W = 800;
const H = 400;

// Equirectangular: lon [-180,180] -> x [0,W]; lat [90,-90] -> y [0,H]
function project(lon, lat) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

// Very rough continent outlines (coastline simplified for a pin-map, not a
// basemap). Drawn as filled paths so pins read against land vs ocean.
const CONTINENT_PATHS = [
  // North America
  'M120,60 L210,45 L300,70 L330,120 L300,170 L260,200 L240,250 L210,240 L200,200 L170,180 L150,130 Z',
  // South America
  'M290,210 L340,215 L370,260 L360,330 L330,370 L310,350 L300,290 L280,250 Z',
  // Europe
  'M420,80 L470,70 L500,90 L490,130 L460,150 L430,140 L410,110 Z',
  // Africa
  'M430,160 L490,150 L520,190 L510,270 L470,320 L440,300 L420,240 L410,190 Z',
  // Asia
  'M500,70 L620,50 L700,80 L720,140 L680,180 L620,190 L560,170 L520,150 L500,110 Z',
  // Oceania
  'M650,290 L720,280 L740,320 L710,350 L660,340 L640,315 Z',
];

export default function AtlasMap({ selectedId, onSelect }) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(null);

  const colorFor = useMemo(() => {
    const map = {};
    for (const ct of CHANGE_TYPES) map[ct.id] = ct.color;
    return map;
  }, []);

  const nameFor = (ct) => CHANGE_TYPES.find((item) => item.id === ct)?.name;

  const handlePin = (site) => {
    if (onSelect) onSelect(site);
  };

  return (
    <div className="atlas-map" role="group" aria-label={t('atlas.mapLabel')}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label={t('atlas.mapAlt')}
        style={{ background: '#0d1117', borderRadius: 4, display: 'block', maxHeight: '100%' }}
      >
        <defs>
          <filter id="pin-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ocean */}
        <rect x={0} y={0} width={W} height={H} fill="#0d1117" />
        {/* graticule (subtle) */}
        {[60, 120, 180, 240, 300, 360].map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} stroke="#1a2230" strokeWidth={0.5} />
        ))}
        {[100, 200, 300, 400, 500, 600, 700].map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} stroke="#1a2230" strokeWidth={0.5} />
        ))}

        {/* continents */}
        {CONTINENT_PATHS.map((d, i) => (
          <path key={i} d={d} fill="#1c2633" stroke="#2a3545" strokeWidth={0.8} />
        ))}

        {/* pins */}
        {atlasSites.map((site) => {
          const [x, y] = project(site.coords.lng, site.coords.lat);
          const color = colorFor[site.changeType] || '#888';
          const isSelected = site.id === selectedId;
          const r = isSelected ? 7 : 5;
          return (
            <g
              key={site.id}
              transform={`translate(${x},${y})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHover(site)}
              onMouseLeave={() => setHover(null)}
              onClick={() => handlePin(site)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') handlePin(site);
              }}
              aria-label={`${localized(site.name, 'en')} — ${site.changeType}`}
            >
              {isSelected ? (
                <circle r={r + 4} fill="none" stroke={color} strokeWidth={1.5} opacity={0.7} />
              ) : null}
              <circle
                r={r}
                fill={color}
                stroke="#0d1117"
                strokeWidth={1}
                filter={isSelected ? 'url(#pin-glow)' : undefined}
              />
              {site.maturity === 'lens' ? (
                <circle r={2} fill="#0d1117" />
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div className="atlas-legend">
        {CHANGE_TYPES.map((ct) => (
          <span key={ct.id} className="atlas-legend-item" title={localized(ct.name, 'en')}>
            <span className="atlas-legend-swatch" style={{ background: ct.color }} />
            {localized(ct.name, 'en')}
          </span>
        ))}
        <span className="atlas-legend-item atlas-legend-lens">
          <span className="atlas-legend-dot" />
          {t('atlas.lensMark')}
        </span>
      </div>

      {hover ? (
        <div className="atlas-tooltip" role="status">
          <strong>{localized(hover.name, 'en')}</strong>
          <span>{localized(hover.region, 'en')}</span>
          <span className="micro">
            {nameFor(hover.changeType) ? localized(nameFor(hover.changeType), 'en') : hover.changeType}
            {' · '}
            {hover.maturity === 'lens' ? t('atlas.measured') : t('atlas.storyOnly')}
          </span>
        </div>
      ) : null}
    </div>
  );
}