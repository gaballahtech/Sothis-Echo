import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { localized } from '../data/localized';
import { atlasSites, CHANGE_TYPES } from '../data/atlas';

/**
 * AtlasMap — a real Leaflet map on OpenStreetMap tiles. Each curated site is a
 * circle marker coloured by change type. Clicking a marker selects that site
 * (the parent loads its story). Measured sites carry a ring; story-only sites
 * are dimmed but still open their narrative.
 */

// Keep the map centred when a site is chosen from the list (outside the map).
function FlyTo({ site }) {
  const map = useMap();
  useEffect(() => {
    if (!site?.coords) return;
    map.flyTo([site.coords.lat, site.coords.lng], Math.max(map.getZoom(), 5), { duration: 0.9 });
  }, [site, map]);
  return null;
}

export default function AtlasMap({ selectedId, onSelect }) {
  const { t } = useTranslation();
  const selected = atlasSites.find((site) => site.id === selectedId) || null;

  const colorFor = useMemo(() => {
    const map = {};
    for (const ct of CHANGE_TYPES) map[ct.id] = ct.color;
    return map;
  }, []);

  const typeName = (ct) => {
    const found = CHANGE_TYPES.find((item) => item.id === ct);
    return found ? localized(found.name, 'en') : ct;
  };

  return (
    <div className="atlas-map" role="group" aria-label={t('atlas.mapLabel')}>
      <MapContainer
        center={[18, 10]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        scrollWheelZoom={false}
        worldCopyJump
        style={{ height: 440, width: '100%', borderRadius: 6, zIndex: 0 }}
        attributionControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FlyTo site={selected} />
        {atlasSites.map((site) => {
          const color = colorFor[site.changeType] || '#888';
          const isSelected = site.id === selectedId;
          const measured = site.maturity === 'lens';
          return (
            <CircleMarker
              key={site.id}
              center={[site.coords.lat, site.coords.lng]}
              radius={isSelected ? 12 : measured ? 9 : 7}
              pathOptions={{
                color: isSelected ? '#ffffff' : '#0d1117',
                weight: isSelected ? 2.5 : 1.5,
                fillColor: color,
                fillOpacity: measured ? 0.95 : 0.6,
                dashArray: measured ? undefined : '3 3',
              }}
              eventHandlers={{
                click: () => onSelect && onSelect(site),
              }}
            >
              <Popup>
                <div className="atlas-popup">
                  <strong>{localized(site.name, 'en')}</strong>
                  <div className="micro">{localized(site.region, 'en')}</div>
                  <div className="micro">
                    {typeName(site.changeType)} ·{' '}
                    {measured ? t('atlas.measured') : t('atlas.storyOnly')}
                  </div>
                  {measured ? <div className="micro">{t('atlas.clickToOpen')}</div> : null}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="atlas-legend">
        {CHANGE_TYPES.map((ct) => (
          <span key={ct.id} className="atlas-legend-item" title={localized(ct.name, 'en')}>
            <span className="atlas-legend-swatch" style={{ background: ct.color }} />
            {localized(ct.name, 'en')}
          </span>
        ))}
        <span className="atlas-legend-item atlas-legend-lens" title={t('atlas.lensMark')}>
          <span className="atlas-legend-dot" />
          {t('atlas.lensMark')}
        </span>
      </div>
    </div>
  );
}