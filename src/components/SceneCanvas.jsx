import { useEffect, useState } from 'react';
import { Icon, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useCompareDivider } from './useCompareDivider';

export function SceneCanvas({ alt, className = '', imageUrl, fit = 'cover', crop = null, eager = false }) {
  const { t } = useTranslation();
  // A 409/503 composite (or any dead image URL) should read as unavailable
  // rather than a broken-image icon.
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [imageUrl]);

  if (!imageUrl || failed) {
    return (
      <div className={`scene-wrap ${className}`}>
        <div className="scene-unavailable" role="img" aria-label={alt}>
          {t('seeThrough.noImage')}
        </div>
      </div>
    );
  }

  // A fractional crop ({x, y, w, h} in 0..1) shows one geographic window of the
  // source image: scale the image up by 1/w × 1/h and shift the window's corner
  // out of frame.
  const cropStyle = crop
    ? {
        position: 'absolute',
        maxWidth: 'none',
        width: `${100 / crop.w}%`,
        height: `${100 / crop.h}%`,
        left: `${(-crop.x / crop.w) * 100}%`,
        top: `${(-crop.y / crop.h) * 100}%`,
        display: 'block',
      }
    : { width: '100%', height: '100%', objectFit: fit, display: 'block' };

  return (
    <div className={`scene-wrap ${className}`}>
      <img
        src={imageUrl}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={cropStyle}
        onError={() => setFailed(true)}
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
  radarEager = false,
  opticalCrop = null,
  radarCrop = null,
}) {
  const { t } = useTranslation();
  const { position, dragging, wrapRef, handlers } = useCompareDivider();

  return (
    <div dir="ltr">
      <div
        ref={wrapRef}
        className="compare-frame"
        {...handlers}
        role="slider"
        data-testid="compare-slider"
        tabIndex={0}
        aria-label={t('seeThrough.dragHint')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% ${t('seeThrough.optical')} / ${Math.round(100 - position)}% ${t('seeThrough.radar')}`}
        style={{ cursor: dragging ? 'ew-resize' : 'ew-resize' }}
      >
        {radarUrl ? (
          <SceneCanvas
            alt={radarAlt}
            className={`compare-layer ${radarClassName}`.trim()}
            imageUrl={radarUrl}
            fit={radarFit}
            crop={radarCrop}
            eager={radarEager}
          />
        ) : (
          <div className="compare-layer scene-unavailable">{t('seeThrough.noImage')}</div>
        )}
        <div className="compare-layer" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          {opticalUrl ? (
            <SceneCanvas
              alt={opticalAlt}
              className="compare-layer"
              imageUrl={opticalUrl}
              crop={opticalCrop}
            />
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
          {t('seeThrough.dividerAt', { value: Math.round(position) })}
        </span>
        <span>{t('seeThrough.keyboardHint')}</span>
      </div>
    </div>
  );
}
