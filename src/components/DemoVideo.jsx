import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHead } from './ui';

function fmt(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * "Watch the demo" — a 30-second walkthrough with a fully custom transport bar
 * (play/pause, seek, time, mute) styled to match the site's sharp terminal look.
 * No autoplay, no native controls.
 */
export default function DemoVideo() {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;
    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onPlay = () => { setPlaying(true); setEnded(false); };
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setEnded(true); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
    };
  }, []);

  const play = () => {
    const el = videoRef.current;
    if (!el) return;
    setStarted(true);
    if (ended) { el.currentTime = 0; setEnded(false); }
    el.play().catch(() => setPlaying(false));
  };

  const replay = () => {
    const el = videoRef.current;
    if (!el) return;
    setStarted(true);
    setEnded(false);
    el.currentTime = 0;
    setCurrent(0);
    el.play().catch(() => setPlaying(false));
  };

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) play();
    else el.pause();
  };

  const seek = (e) => {
    const el = videoRef.current;
    if (!el || !duration) return;
    const pct = Number(e.target.value) / 100;
    el.currentTime = pct * duration;
    setCurrent(el.currentTime);
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <section id="demo" className="content-section chapter demo-section" aria-labelledby="demo-title">
      <div className="section-inner">
        <SectionHead title={t('demo.title')} subtitle={t('demo.subtitle')} id="demo-title" />

        <div className={`demo-frame${started ? ' is-started' : ''}`}>
          <video
            ref={videoRef}
            className="demo-video"
            src="/Demo.mp4"
            poster="/Demo-poster.jpg"
            playsInline
            preload="metadata"
            onClick={toggle}
            aria-label={t('demo.videoLabel')}
          />

          {(!started || ended) && (
            <button
              type="button"
              className="demo-overlay-play"
              onClick={ended ? replay : play}
              aria-label={ended ? t('demo.replay') : t('demo.play')}
            >
              <span className="demo-overlay-icon" aria-hidden="true">
                {ended ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </span>
              <span className="demo-overlay-text">{ended ? t('demo.replay') : t('demo.play')}</span>
            </button>
          )}

          {started && (
          <div className="demo-bar" role="group" aria-label={t('demo.controls')}>
            <button
              type="button"
              className={`demo-btn demo-btn--toggle${ended ? ' demo-btn--hidden' : ''}`}
              onClick={toggle}
              aria-label={playing ? t('demo.pause') : ended ? t('demo.replay') : t('demo.play')}
              tabIndex={ended ? -1 : 0}
            >
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : ended ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <span className="demo-time">{fmt(current)}</span>

            <input
              className="demo-seek"
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={pct}
              onChange={seek}
              aria-label={t('demo.seek')}
              style={{ '--demo-progress': `${pct}%` }}
            />

            <span className="demo-time demo-time--total">{fmt(duration)}</span>

            <button
              type="button"
              className="demo-btn"
              onClick={toggleMute}
              aria-label={muted ? t('demo.unmute') : t('demo.mute')}
            >
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4 9v6h4l5 5V4L8 9H4zm12.5 3l2.5-2.5-1-1L15.5 11 13 8.5l-1 1L14.5 12 12 14.5l1 1L15.5 13 18 15.5l1-1L16.5 12z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4 9v6h4l5 5V4L8 9H4zm12 3a4 4 0 0 0-2-3.5v7A4 4 0 0 0 16 12zm-2-7.5v2.1a6 6 0 0 1 0 10.8v2.1a8 8 0 0 0 0-15z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              className="demo-btn"
              onClick={() => {
                const el = videoRef.current;
                if (el) { el.currentTime = 0; setCurrent(0); setEnded(false); play(); }
              }}
              aria-label={t('demo.restart')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
              </svg>
            </button>

            <button
              type="button"
              className="demo-btn"
              onClick={() => {
                const el = videoRef.current;
                if (!el) return;
                if (document.fullscreenElement) {
                  document.exitFullscreen?.();
                } else {
                  el.requestFullscreen?.();
                }
              }}
              aria-label={t('demo.fullscreen')}
              title={t('demo.fullscreen')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            </button>
          </div>
          )}
        </div>

        <p className="demo-caption micro">{t('demo.caption')}</p>
      </div>
    </section>
  );
}