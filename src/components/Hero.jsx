import { useEffect, useMemo, useState } from 'react';
import { Button } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { loadMissionStatus, isApiConfigured } from '../services/sarApi';
import GlossaryText from './GlossaryText';

export default function Hero() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites, source } = useSiteData();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!isApiConfigured()) {
      setStatus(null);
      return undefined;
    }
    loadMissionStatus().then((result) => {
      if (cancelled) return;
      setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      numberingSystem: 'latn',
    }).format(date);
  };

  const live = Boolean(status);

  const latestPass = useMemo(() => {
    if (!live || source !== 'api') return null;
    const dates = sites
      .flatMap((site) => (site.series ?? []).map((pass) => pass.date))
      .filter(Boolean)
      .sort();
    return dates.at(-1) ?? null;
  }, [live, source, sites]);

  return (
    <section id="home" className="content-section hero-section" aria-labelledby="home-title">
      <div className="hero-media" aria-hidden="true">
        <video
          className="hero-video"
          src="/Video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
        />
      </div>

      <div className="section-inner hero-grid">
        <div>
          <h1 id="home-title" className="hero-title">
            {t('hero.title')}
          </h1>
          <p className="hero-copy">
            <GlossaryText text={t('hero.subtitle')} />
          </p>

          <div className="hero-actions">
            <Button intent="primary" icon="layers" text={t('hero.ctaSee')} onClick={() => go('see-through')} />
            <Button variant="outlined" icon="volume-up" text={t('hero.ctaListen')} onClick={() => go('sound')} />
          </div>

          {isApiConfigured() ? (
            <div className="hero-status" data-testid="hero-status" style={{ marginTop: 14 }}>
              <span className="micro">
                {status ? (live ? t('hero.statusLive') : t('hero.statusLocal')) : '…'} ·{' '}
                {latestPass
                  ? `${t('hero.lastPass')}: ${formatDate(latestPass)}`
                  : live
                    ? t('hero.liveData')
                    : t('method.statusLabel')}
              </span>
            </div>
          ) : null}
        </div>
      </div>

    </section>
  );
}