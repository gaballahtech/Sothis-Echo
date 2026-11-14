import { useRef, useState } from 'react';
import { Icon, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';

export function SceneCanvas({ alt, className = '', imageUrl, fit = 'cover' }) {
  const { t } = useTranslation();

  if (!imageUrl) {
    return (
      <div className={`scene-wrap ${className}`}>
        <div className="scene-unavailable" role="img" aria-label={alt}>
          {t('seeThrough.noImage')}
        </div>
      </div>
    );
  }

  return (
    <div className={`scene-wrap ${className}`}>
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }}
      />
    </div>
  );
}

export function CompareSlider({
  opticalAlt,
  radarAlt,
  opticalLabel,
  radarLabel,
  opticalUrl,
  radarUrl,
  radarFit = 'cover',
  radarClassName = '',
}) {
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
        {radarUrl ? (
          <SceneCanvas
            alt={radarAlt}
            className={`compare-layer ${radarClassName}`.trim()}
            imageUrl={radarUrl}
            fit={radarFit}
          />
        ) : (
          <div className="compare-layer scene-unavailable">{t('seeThrough.noImage')}</div>
        )}
        <div className="compare-layer" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          {opticalUrl ? (
            <SceneCanvas alt={opticalAlt} className="compare-layer" imageUrl={opticalUrl} />
          ) : (
            <div className="compare-layer scene-unavailable">{t('seeThrough.noImage')}</div>
          )}
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
      </div>

      <div className="compare-help">
        <span>{t('seeThrough.dragHint')}</span>
        <span className="numeric">
          {Math.round(position)}% {t('seeThrough.optical').split(' · ')[0]} · {Math.round(100 - position)}% {t('seeThrough.radar').split(' · ')[0]}
        </span>
        <span>{t('seeThrough.keyboardHint')}</span>
      </div>
    </div>
  );
}
