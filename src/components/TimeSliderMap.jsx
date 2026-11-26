import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@blueprintjs/core';
import { localized } from '../data/localized';
import { sceneImageUrl } from '../services/sarApi';

function Recenter({ site }) {
  const map = useMap();
  useEffect(() => {
    if (site?.coords) map.setView([site.coords.lat, site.coords.lng], 8);
  }, [map, site]);
  return null;
}

/**
 * Per-site time slider over the map: steps through the site's real NISAR passes
 * (series), showing date + HH/VH + change index, with the change image. Honest:
 * passes without data are flagged "unavailable". Differentiated by the real
 * per-pass numbers + shareable date (not just pretty pictures).
 */
export default function TimeSliderMap({ site, language }) {
  const { t } = useTranslation();
  const series = site?.series || [];
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(0);

  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [site?.id]);

  useEffect(() => {
    if (!playing || series.length < 2) return undefined;
    timerRef.current = setInterval(() => {
      setIdx((cur) => {
        if (cur >= series.length - 1) { setPlaying(false); return cur; }
        return cur + 1;
      });
    }, 700);
    return () => clearInterval(timerRef.current);
  }, [playing, series.length]);

  if (!site || series.length < 2) return null;

  const point = series[Math.min(idx, series.length - 1)];
  const unavailable = point.vv == null || point.vh == null;
  const changePct = Math.round((point.change ?? 0) * 100);
  const changeImg = sceneImageUrl(site.id, 'change', 'nisar');
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const dateLabel = point.date;

  const beep = () => {};

  return (
    <div className="time-slider" dir={dir}>
      <div className="time-slider-map">
        <MapContainer center={[site.coords.lat, site.coords.lng]} zoom={8} minZoom={3} maxZoom={12} scrollWheelZoom={false} style={{ height: 260, width: '100%', borderRadius: 6, zIndex: 0 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' noWrap />
          <Recenter site={site} />
          <CircleMarker center={[site.coords.lat, site.coords.lng]} radius={10} pathOptions={{ color: '#fff', weight: 2, fillColor: '#e8443a', fillOpacity: 0.9 }} />
        </MapContainer>
      </div>

      <div className="time-slider-readout">
        <span className="time-slider-date" dir="ltr">{dateLabel}</span>
        <span className="time-slider-metrics" dir="ltr">
          {unavailable ? <em>{t('timeSlider.unavailable')}</em> : (
            <>
              HH {point.vv} dB · HV {point.vh} dB · {t('timeSlider.change')} {changePct}%
            </>
          )}
        </span>
      </div>

      <div className="time-slider-controls">
        <Button small minimal icon="chevron-left" onClick={() => setIdx((c) => Math.max(0, c - 1))} aria-label={t('timeSlider.prev')} />
        <Button small minimal icon={playing ? 'pause' : 'play'} onClick={() => { beep(); setPlaying((p) => !p); }} aria-label={playing ? t('timeSlider.pause') : t('timeSlider.play')} />
        <Button small minimal icon="chevron-right" onClick={() => setIdx((c) => Math.min(series.length - 1, c + 1))} aria-label={t('timeSlider.next')} />
        <input
          className="time-slider-range"
          type="range"
          min={0}
          max={series.length - 1}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          aria-label={t('timeSlider.date')}
        />
      </div>

      <div className="time-slider-image">
        <img src={changeImg} alt={t('timeSlider.change')} loading="lazy" />
      </div>
    </div>
  );
}