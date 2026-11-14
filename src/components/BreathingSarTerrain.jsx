import { useEffect, useRef, useState } from 'react';

/**
 * Full-bleed SAR wave field — horizontal wave rows rolling slowly toward the
 * camera, Canvas 2D only.
 *
 * PRECISION CONTRACT (no tangled rows, ever):
 *   rows are distributed evenly on screen and each row's pixel amplitude is
 *   capped by the slope budget  A ≤ 0.95 · slot · λ / 2π , so the steepest
 *   point of a wave can never overtake the neighbouring row — crests and
 *   troughs stay fully readable at every loudness. The wavelength λ itself
 *   GROWS with the audio signal (8 rows at rest → 24 rows at the event
 *   peak), so one full crest-and-trough cycle fills the field exactly when
 *   the change is loudest.
 *
 * Motion design:
 *   · at rest  — a calm stable surface whose character follows the selected
 *     study area (Sundarbans: longer tidal swell; Caldor: choppier);
 *   · playing  — the SAME surface grows with the audio: amplitude, wavelength
 *     and roll speed all rise with the change signal, then ebb back.
 *
 * ONE motion only: the wave phase (`wavePhase += drift · dt`) is the roll
 * toward the viewer — no second travelling layer, no per-note kick, and
 * nothing is ever derived from `t · speed` (no teleports when speed changes).
 * The pass position is read from the audio clock every frame.
 *
 * Deterministic (pure sines, no Math.random). Performance: single rAF loop,
 * FPS pinned (30 idle / 60 playing), DPR capped at 1.5, paused offscreen,
 * one static frame under prefers-reduced-motion.
 */
const ROWS = 26;
const POINTS_PER_ROW = 56;
const BG = '#F2EFE9';
const GROUND = '#EAE5DB';
const TEAL = '#1F5E5B';
const AMBER = '#C88A55';

const STATUS_AR = {
  'BASELINE BREATHING': 'تنفس السطح الأساسي',
  'STEADY ORBITAL PULSE': 'نبض مداري مستقر',
  'STORM-SURGE DOUBLE BOUNCE': 'ارتداد مزدوج · موجة فيضان',
  'CANOPY COLLAPSE · VH DROP': 'انهيار الغطاء الشجري · هبوط VH',
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function BreathingSarTerrain({
  selectedSite,
  playingTrack,
  getPass,
  values,
  currentPassIndex,
  language,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const stateRef = useRef({ selectedSite, playingTrack, getPass, values });
  stateRef.current = { selectedSite, playingTrack, getPass, values };
  const visibleRef = useRef(true);
  const rafRef = useRef(null);
  const lastFrameRef = useRef(0);
  const redrawRef = useRef(null);
  const [status, setStatus] = useState('BASELINE BREATHING');

  useEffect(() => {
    const pt = playingTrack;
    let t;
    if (!pt) t = 'BASELINE BREATHING';
    else if (pt === 'stable') t = 'STEADY ORBITAL PULSE';
    else if (selectedSite === 'sundarbans') t = 'STORM-SURGE DOUBLE BOUNCE';
    else t = 'CANOPY COLLAPSE · VH DROP';
    setStatus(t);
  }, [playingTrack, selectedSite]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;
    const ctx = canvas.getContext('2d');

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // accumulated motion state (never teleports when speed changes)
    let wavePhase = 0; // radians rolled toward the viewer
    let intensity = 0; // smoothed audio loudness -> wave character
    let lastNow = 0;

    const draw = (now) => {
      const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
      lastNow = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = container.clientWidth || 320;
      const h = Math.round(clamp(w * 0.55, 300, 640));
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      const st = stateRef.current;
      const pt = st.playingTrack;
      const isSundarbans = st.selectedSite === 'sundarbans';

      // ---- audio-driven loudness ----------------------------------------
      // at rest the surface shows the stable baseline of the selected site;
      // while playing, loudness follows the pulse series read off the audio
      // clock. Slow attack / slower release so the growth is readable.
      let target = 0;
      if (pt) {
        const series = st.values;
        const ts = st.getPass ? st.getPass() : null;
        if (ts && series && series.length) {
          target = clamp(Number(series[ts.passIndex]) || 0, 0, 1);
        }
      }
      intensity += (target - intensity) * Math.min(1, dt * (target > intensity ? 2 : 0.5));
      const loud = clamp(intensity, 0, 1.05);

      // ---- wave parameters (all three grow with the signal) --------------
      const horizon = h * 0.34;
      const span = h - horizon;
      const slot = span / ROWS; // screen distance between rows
      // wavelength in rows: longer waves as the signal rises — at the peak a
      // full crest + trough cycle spans the whole field
      const lambda = (isSundarbans ? 9 : 7) + loud * 16;
      // amplitude: near rows carry most of it, far rows stay quiet
      const strength = 0.55 + loud * 0.45;
      const drift = 0.18 + loud * 0.25; // rad/s — the roll toward the viewer

      wavePhase += drift * dt;

      // ---- ground fill + horizon rule ------------------------------------
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, horizon, w, h - horizon);
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 1;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, horizon + 0.5);
      ctx.lineTo(w, horizon + 0.5);
      ctx.stroke();
      ctx.restore();

      // ---- wave rows, far to near ----------------------------------------
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (let r = ROWS - 1; r >= 0; r -= 1) {
        const d = r / (ROWS - 1); // 0 at horizon, 1 at the viewer
        const baseY = horizon + slot * (r + 0.75);
        // wavelength shortens slightly with depth so near waves read livelier
        const kRow = (2 * Math.PI) / (lambda * (1.25 - 0.35 * d));
        // per-row slope budget: the amplitude this row may carry without ever
        // overtaking its neighbour (the no-overlap guarantee, per row)
        const ampCap = (0.95 * slot) / kRow;
        // depth ramp keeps the far field quiet, the near field expressive;
        // multiplied by the loudness ramp it can never exceed the cap
        const ampPx = ampCap * strength * (0.25 + 0.75 * d * d);

        let crestSeen = 0;
        ctx.beginPath();
        for (let s = 0; s <= POINTS_PER_ROW; s += 1) {
          const sx = (s / POINTS_PER_ROW) * w;
          // bounded meander keeps crest lines organic without any crossing
          const meander = 0.55 * Math.sin(sx * 0.006 + r * 0.15);
          const v =
            Math.sin(kRow * r - wavePhase + meander) *
            (0.88 + 0.12 * Math.sin(sx * 0.004 + r * 0.3));
          if (v > crestSeen) crestSeen = v;
          const sy = baseY - v * ampPx;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        // crest rows glow amber only when the signal is genuinely loud
        const crest = loud > 0.42 && crestSeen > 0.6;
        ctx.strokeStyle = crest ? AMBER : TEAL;
        ctx.globalAlpha = 0.12 + d * 0.8;
        ctx.lineWidth = 0.8 + d * 1.0 + (crest ? 0.35 : 0);
        ctx.stroke();
      }
      ctx.restore();
    };

    const loop = (now) => {
      if (!visibleRef.current) {
        rafRef.current = null;
        return;
      }
      const playing = !!stateRef.current.playingTrack;
      const interval = playing ? 16 : 33; // 60fps playing, 30fps idle
      if (now - lastFrameRef.current < interval) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastFrameRef.current = now;
      draw(now);
      rafRef.current = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduced) {
        draw(performance.now());
        return;
      }
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries[0]?.isIntersecting ?? true;
        visibleRef.current = vis;
        if (vis) start();
      },
      { threshold: 0.05 }
    );
    io.observe(container);

    const ro = new ResizeObserver(() => {
      if (reduced) draw(performance.now());
    });
    ro.observe(container);

    redrawRef.current = () => {
      if (reduced) draw(performance.now());
    };
    start();

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      io.disconnect();
      ro.disconnect();
      redrawRef.current = null;
    };
  }, []);

  useEffect(() => {
    redrawRef.current?.();
  }, [selectedSite, playingTrack, values]);

  const passNum = (currentPassIndex >= 0 ? currentPassIndex + 1 : 1).toString().padStart(2, '0');
  const isPlayingNow = !!playingTrack;

  return (
    <div
      ref={containerRef}
      className="sar-terrain-card"
      style={{ position: 'relative', background: BG, overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        dir="ltr"
        style={{ display: 'block', width: '100%' }}
        aria-label="3D topographic surface"
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderTop: '1px solid var(--te-border)',
          fontFamily: 'var(--te-mono)',
          fontSize: 11,
          letterSpacing: '0.04em',
          color: 'var(--te-ink-soft)',
          background: BG,
        }}
      >
        <span>{language === 'ar' ? STATUS_AR[status] || status : status}</span>
        <span>
          {language === 'ar' ? 'تمريرة' : 'PASS'}{' '}
          <span
            style={{
              color: isPlayingNow ? '#C88A55' : 'inherit',
              fontWeight: isPlayingNow ? 600 : 400,
            }}
          >
            {passNum}
          </span>{' '}
          / 16
        </span>
      </div>
    </div>
  );
}
