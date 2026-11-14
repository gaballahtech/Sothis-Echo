import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonGroup, Callout } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { createSonifier, isAudioSupported } from '../services/sonifier';
import { SectionHead } from './ui';
import BreathingSarTerrain from './BreathingSarTerrain';

export default function Sonification() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites } = useSiteData();
  const [siteId, setSiteId] = useState(() => sites[0]?.id);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(-1);
  const [supported, setSupported] = useState(true);
  const sonifierRef = useRef(null);

  const site = sites.find((item) => item.id === siteId) ?? sites[0];
  const siteName = localized(site?.name, language);

  useEffect(() => {
    if (!isAudioSupported()) {
      setSupported(false);
      return undefined;
    }
    const sonifier = createSonifier();
    sonifierRef.current = sonifier;
    return () => {
      sonifier.dispose();
      sonifierRef.current = null;
    };
  }, []);

  useEffect(() => {
    sonifierRef.current?.stop();
    setPlaying(false);
    setStep(-1);
  }, [siteId]);

  const mapping = useMemo(
    () => [t('sound.map1'), t('sound.map2'), t('sound.map3'), t('sound.map4')],
    [t]
  );

  if (!site) return null;

  const stop = () => {
    sonifierRef.current?.stop();
    setPlaying(false);
    setStep(-1);
  };

  const toggle = () => {
    if (playing) {
      stop();
      return;
    }
    setStep(0);
    setPlaying(true);
    const ok = sonifierRef.current?.play(site.pulse, {
      onStep: setStep,
      onEnd: () => {
        setPlaying(false);
        setStep(-1);
      },
    });
    if (!ok) {
      setSupported(false);
      setPlaying(false);
      setStep(-1);
    }
  };

  // Sample-accurate playhead, read from the audio clock by the visuals.
  const getPass = () => sonifierRef.current?.getTimeState?.() ?? null;

  return (
    <section id="sound" className="content-section chapter chapter--gold" aria-labelledby="sound-title">
      <div className="section-inner">
        <SectionHead title={t('sound.title')} subtitle={t('sound.subtitle')} id="sound-title" />

        <div className="row site-choice-row" role="group" aria-label={t('common.sitePicker')}>
          <span className="site-choice-label">{t('common.sitePicker')}</span>
          <ButtonGroup className="site-choice">
            {sites.map((item) => (
              <Button
                key={item.id}
                active={item.id === site.id}
                variant={item.id === site.id ? 'solid' : 'outlined'}
                text={localized(item.name, language)}
                onClick={() => setSiteId(item.id)}
                aria-pressed={item.id === site.id}
              />
            ))}
          </ButtonGroup>
        </div>

        <div className="sound-actions-bar" role="group" aria-label={t('sound.title')}>
          <Button
            className="sound-action-btn"
            intent={playing ? 'warning' : 'none'}
            variant="outlined"
            icon={playing ? 'stop' : 'play'}
            text={
              playing
                ? t('sound.stop')
                : `${t('sound.changeTitle')} — ${siteName}`
            }
            onClick={toggle}
            disabled={!supported}
            aria-pressed={playing}
            data-testid="sound-play-change"
          />
        </div>

        <p className="sound-status" data-testid="sound-status" aria-live="polite">
          {playing
            ? t('sound.nowPlaying', { current: step + 1, total: site.pulse.length })
            : t('sound.hint')}
        </p>
      </div>

      <div className="sound-stage">
        <BreathingSarTerrain
          selectedSite={site.id}
          playingTrack={playing ? 'changing' : null}
          getPass={getPass}
          values={site.pulse}
          currentPassIndex={step}
          language={language}
        />
      </div>

      <div className="section-inner">
        <div className="sound-map-strip" aria-label={t('sound.mappingTitle')}>
          {mapping.map((line) => (
            <div key={line} className="sound-map-item">
              {line}
            </div>
          ))}
        </div>

        {!supported ? (
          <Callout intent="warning" icon="warning-sign" style={{ marginTop: 12 }}>
            {t('sound.noSupport')}
          </Callout>
        ) : null}
      </div>
    </section>
  );
}
