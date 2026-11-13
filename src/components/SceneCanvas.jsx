import { useEffect, useRef, useState } from 'react';
import { Icon, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { paintScene } from '../services/sceneRenderer';

export function SceneCanvas({ site, params, channel = 'radar', alt, className = '', showSim = true }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    paintScene(ref.current, site, params, channel);
  }, [visible, site, channel, params?.water, params?.emergent, params?.burn, params?.cloud]);

  return (
    <div className={`scene-wrap ${className}`}>
      <canvas ref={ref} role="img" aria-label={alt} />
      {showSim ? (
        <Tag minimal intent="warning" className="scene-chip" icon="warning-sign">
          {t('common.simulated')}
        </Tag>
      ) : null}
    </div>
  );
}

export function CompareSlider({ site, params, opticalAlt, radarAlt, opticalLabel, radarLabel, simulatedLabel }) {
  const { t } = useTranslation();
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const wrapRef = useRef(null);

  const updateFromClientX = (clientX) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, next)));
  };

  const onPointerDown = (event) => {
    event.preventDefault();
    setDragging(true);
    wrapRef.current?.setPointerCapture?.(event.pointerId);
    updateFromClientX(event.clientX);
  };

  const onPointerMove = (event) => {
    if (!dragging) return;
    updateFromClientX(event.clientX);
  };

  const onPointerUp = (event) => {
    setDragging(false);
    wrapRef.current?.releasePointerCapture?.(event.pointerId);
  };

  const onKeyDown = (event) => {
    const step = event.shiftKey ? 10 : 2;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setPosition((value) => Math.max(0, value - step));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setPosition((value) => Math.min(100, value + step));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setPosition(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setPosition(100);
    }
  };

  return (
    <div dir="ltr">
      <div
        ref={wrapRef}
        className="compare-frame"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        data-testid="compare-slider"
        tabIndex={0}
        aria-label={t('seeThrough.dragHint')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% ${t('seeThrough.optical')} / ${Math.round(100 - position)}% ${t('seeThrough.radar')}`}
        onKeyDown={onKeyDown}
        style={{ cursor: dragging ? 'ew-resize' : 'ew-resize' }}
      >
        <SceneCanvas
          site={site}
          params={params}
          channel="radar"
          alt={radarAlt}
          className="compare-layer"
          showSim={false}
        />
        <div className="compare-layer" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <SceneCanvas
            site={site}
            params={params}
            channel="optical"
            alt={opticalAlt}
            className="compare-layer"
            showSim={false}
          />
        </div>

        <div className="compare-handle" style={{ left: `${position}%` }} aria-hidden="true">
          <span className="compare-knob">
            <Icon icon="swap-horizontal" size={14} />
          </span>
        </div>

        <div className="compare-labels">
          <Tag minimal intent="warning">{opticalLabel}</Tag>
          <Tag minimal intent="primary">{radarLabel}</Tag>
        </div>

        <span className="compare-note">
          <Tag minimal>{simulatedLabel || t('common.simulated')}</Tag>
        </span>
      </div>

      <div className="compare-help">
        <span>{t('seeThrough.dragHint')}</span>
        <span className="numeric">
          {Math.round(position)}% OPTICAL · {Math.round(100 - position)}% RADAR
        </span>
        <span>{t('seeThrough.keyboardHint')}</span>
      </div>
    </div>
  );
}
