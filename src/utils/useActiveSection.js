import { useEffect, useState } from 'react';

/** Lightweight scroll spy for the command-console navigation. */
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0] ?? 'home');

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = ids[0] ?? 'home';
      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= 140) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ids]);

  return active;
}
