import { Button } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();

  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const facts = [
    { key: 'orbit', value: t('hero.panel.orbitValue') },
    { key: 'repeat', value: t('hero.panel.repeatValue') },
    { key: 'resolution', value: t('hero.panel.resolutionValue') },
  ];

  return (
    <section id="home" className="content-section hero-section" aria-labelledby="home-title">
      <div className="hero-media" aria-hidden="true">
        <video
          className="hero-video"
          src="/Video.mp4"
          poster="/images/earth-limb.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
        />
      </div>

      <div className="section-inner hero-grid">
        <div>
          <h1 id="home-title" className="hero-title">
            {t('hero.title')}
          </h1>
          <p className="hero-copy">{t('hero.subtitle')}</p>

          <div className="hero-actions">
            <Button intent="primary" icon="layers" text={t('hero.ctaSee')} onClick={() => go('see-through')} />
            <Button variant="outlined" icon="volume-up" text={t('hero.ctaListen')} onClick={() => go('sound')} />
          </div>

          <div className="hero-inline-stats" aria-label={t('hero.factsLabel')}>
            {facts.map((fact) => (
              <div className="hero-stat" key={fact.key}>
                <span className="hero-stat-label">{t(`hero.panel.${fact.key}`)}</span>
                <span className="hero-stat-value">{fact.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="hero-credit">{t('hero.credit')}</span>
    </section>
  );
}
