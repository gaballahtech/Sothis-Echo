import { Icon } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { SceneCanvas } from './SceneCanvas';
import { useCompareDivider } from './useCompareDivider';

/* A draggable before/after divider for the two radar passes. The "before" layer
   is clipped to the left of the handle, the "after" layer fills the frame, so
   dragging reveals one pass over the other on the exact same pixel grid. */
export function SwipeCompare({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
  beforeDate,
  afterDate,
  alt,
  className = '',
}) {
  const { t } = useTranslation();
  const { position, dragging, wrapRef, handlers } = useCompareDivider();

  const beforeText = beforeDate ? `${beforeLabel} · ${beforeDate}` : beforeLabel;
  const afterText = afterDate ? `${afterLabel} · ${afterDate}` : afterLabel;

  return (
    <div dir="ltr" className={className}>
      <div
        ref={wrapRef}
        className="compare-frame"
        {...handlers}
        role="slider"
        data-testid="swipe-compare"
        tabIndex={0}
        aria-label={t('sites.swipeSliderAria')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={t('sites.swipeValueText', {
          before: Math.round(position),
          after: Math.round(100 - position),
        })}
        style={{ cursor: dragging ? 'ew-resize' : 'ew-resize' }}
      >
        <SceneCanvas
          alt={`${alt} — ${afterText}`}
          className="compare-layer compare-layer--nisar"
          imageUrl={afterUrl}
          fit="cover"
          eager
        />
        <div className="compare-layer" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <SceneCanvas
            alt={`${alt} — ${beforeText}`}
            className="compare-layer compare-layer--nisar"
            imageUrl={beforeUrl}
            fit="cover"
            eager
          />
        </div>

        <div className="compare-handle" style={{ left: `${position}%` }} aria-hidden="true">
          <span className="compare-knob">
            <Icon icon="swap-horizontal" size={14} />
          </span>
        </div>

        <div className="compare-labels swipe-labels">
          <span className="swipe-label swipe-label--before">{beforeText}</span>
          <span className="swipe-label swipe-label--after">{afterText}</span>
        </div>
      </div>

      <div className="compare-help">
        <span>{t('sites.swipeDragHint')}</span>
        <span className="numeric">{t('sites.swipeDividerAt', { value: Math.round(position) })}</span>
        <span>{t('sites.swipeKeyboardHint')}</span>
      </div>
    </div>
  );
}