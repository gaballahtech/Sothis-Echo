import { useRef, useState } from 'react';

/* Shared pointer/keyboard behaviour for before/after divider widgets. Both the
   see-through `CompareSlider` and the study-area `SwipeCompare` drag a handle
   between 0 and 100, so the interaction lives here once instead of twice. */
export function useCompareDivider(initial = 50) {
  const [position, setPosition] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const wrapRef = useRef(null);

  const updateFromClientX = (clientX) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
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

  return {
    position,
    dragging,
    wrapRef,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onKeyDown },
  };
}