import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Client-side typewriter reveal. The full `text` is already available (the
 * server returned the complete answer); this only animates how fast it is
 * shown, so the chat *feels* like it streams without any SSE / backend change.
 *
 * - `speed`  : milliseconds per character (lower = faster).
 * - `enabled`: when false (e.g. prefers-reduced-motion) the text shows instantly.
 * - `skip()` : reveal the whole text immediately (WCAG pause/stop).
 */
export function useTypewriter(text, { speed = 15, enabled = true } = {}) {
  const [displayed, setDisplayed] = useState(enabled ? '' : text);
  const [isTyping, setIsTyping] = useState(enabled && text.length > 0);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const skipRef = useRef(false);

  const skip = useCallback(() => {
    skipRef.current = true;
    setDisplayed(text);
    setIsTyping(false);
  }, [text]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!enabled || !text) {
      setDisplayed(text);
      setIsTyping(false);
      return undefined;
    }
    skipRef.current = false;
    startRef.current = 0;
    setDisplayed('');
    setIsTyping(true);
    const step = (ts) => {
      if (skipRef.current) return;
      if (!startRef.current) startRef.current = ts;
      const chars = Math.min(text.length, Math.floor((ts - startRef.current) / Math.max(1, speed)));
      setDisplayed(text.slice(0, chars));
      if (chars >= text.length) {
        setIsTyping(false);
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, speed, enabled]);

  return { displayed, isTyping, skip };
}