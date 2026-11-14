import { useEffect, useRef, useState } from 'react';

/**
 * Full-bleed 3D wave field — TRUE perspective projection (pinhole camera).
 *
 * A world-space grid (x = lateral, z = depth) is projected with a single
 * perspective divide:
 *     screenX = cx + (x · f) / z
 *     screenY = horizon + ((CAM_Y − y) · f) / z
 * so the longitudinal fan lines converge to a vanishing point and the swell
 * itself travels along z — the wave rolls TOWARD the viewer in depth, never
 * sideways.
 *
 * Row distribution: cross rows are placed GEOMETRICALLY in depth
 * (z_r = zNear · ZRATIO^r) so their screen gaps shrink smoothly from ~40px
 * at the bottom edge to a few px at the horizon — the field stays fully
 * covered, near cells stay readable and the far field dissolves into haze.
 *
 * Wave field (two swell systems, so crests read diagonally, not as flat
 * lines across a row):
 *   v(x, z) = 0.72·sin(k·z + φ + 0.35·x)          — the main swell rolling
 *                                                     toward the viewer
 *           + 0.28·sin(0.8·k·z + 0.55·k·x − 0.6·φ) — a diagonal cross-swell
 *   y(x, z) = min(amp(z) · (v + 0.15·organic), CAM_Y·0.85)
 *   · φ (wavePhase) accumulates with dt — the ONLY motion; nothing is ever
 *     derived from `t · speed`, so a speed change never teleports the field.
 *   · at rest the amplitude is capped by the screen-space slope budget
 *       amp ≤ 0.9 · CAM_Y · (1 − 1/ZRATIO)
 *     so rows can never cross — the idle surface is mathematically clean.
 *   · while playing the cap is relaxed (∝ loudness) and near crests may rise
 *     over the row behind them; strips are drawn FAR → NEAR with quad fills
 *     (painter's algorithm), so the nearer swell correctly occludes the land
 *     behind it — that is real 3D relief, not tangling.
 *   · wavelength λ and roll speed grow with the audio signal; at rest the
 *     surface shows the selected site's stable character (Sundarbans: long
 *     tidal swell, Caldor: shorter choppier seas).
 *   · crest bands are shaded amber, troughs carry a permanent soft shading
 *     so the surface form is readable even at rest.
 *
 * Deterministic (pure sines, no Math.random). Performance: single rAF loop,
 * FPS pinned (30 idle / 60 playing), DPR capped at 1.5, paused offscreen,
 * per-strip batched Path2D fills/strokes (~130 draw calls per frame), one
 * static frame under prefers-reduced-motion.
 */
const CAM_Y = 1.15; // camera height above the mean surface (world units)
const ZRATIO = 1.22; // geometric depth ratio between cross rows
const ROWS = 16; // cross rows (constant z); row 0 starts below the frame edge
const COLS = 56; // longitudinal fan lines (constant x, even count -> no dead-center line)
const X_STEP = 0.9; // world spacing between fan lines

const BG = '#F2EFE9';
const GROUND = '#EAE5DB';
const TEAL = '#1F5E5B';
const AMBER = '#C88A55';
const HORIZON_FRAC = 0.26;

const SITE = {
  sundarbans: { lambda: 6.5, amp: 0.14, drift: 0.5, peakAmp: 0.62, peakDrift: 1.25 },
  caldor: { lambda: 4.5, amp: 0.17, drift: 0.7, peakAmp: 0.68, peakDrift: 1.45 },
};
const LAMBDA_GROW = 2.1; // × wavelength at the signal peak

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

    // reusable buffers (fixed grid size — zero per-frame allocation)
    const px = new Float32Array(ROWS * COLS);
    const py = new Float32Array(ROWS * COLS);
    const pv = new Float32Array(ROWS * COLS);
    const ampR = new Float32Array(ROWS);
    const zR = new Float32Array(ROWS);
    const rowMaxPv = new Float32Array(ROWS);
    const rowCrestFrac = new Float32Array(ROWS);

    // accumulated motion state (never teleports when speed changes)
    let wavePhase = 0; // radians rolled toward the viewer
    let intensity = 0; // smoothed audio loudness -> wave character
    let lastNow = 0;
    let hazeGrad = null;
    let hazeKey = '';

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
        hazeGrad = null;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      const st = stateRef.current;
      const pt = st.playingTrack;
      const site = SITE[st.selectedSite] ?? SITE.sundarbans;

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

      // ---- camera / projection -------------------------------------------
      const horizon = h * HORIZON_FRAC;
      const span = h - horizon;
      const f = w * 0.5;
      const cx = w / 2;
      const zNear = (CAM_Y * f) / span; // flat surface at zNear lands on the bottom edge

      // ---- wave parameters (all grow with the signal) ---------------------
      // wavelength is expressed in ROWS so the swell stays readable across
      // the whole depth: idle ~6.5 rows per cycle (calm), peak ~13.7 (one
      // broad swell fills the field).
      const lamRows = site.lambda * (1 + (LAMBDA_GROW - 1) * loud);
      const kz = (2 * Math.PI) / lamRows;
      const ampTarget = site.amp + (site.peakAmp - site.amp) * loud;
      const drift = site.drift + (site.peakDrift - site.drift) * loud;
      wavePhase += drift * dt;

      // amplitude cap: opens with loudness — at the peak a crest rises
      // several rows tall and the painter fills occlude the land behind it,
      // so the swell reads as real rising relief.
      const capWorld = CAM_Y * (1 - 1 / ZRATIO) * (0.55 + 3.2 * loud);

      for (let r = 0; r < ROWS; r += 1) {
        const z = zNear * 0.95 * ZRATIO ** r;
        zR[r] = z;
        const depth = zNear / z;
        ampR[r] = Math.min(ampTarget * (0.6 + 0.4 * depth * depth), capWorld);
      }

      // ---- sample the world grid ------------------------------------------
      // wave phase is anchored to the ROW INDEX (even spacing across the
      // depth) with its x-component in NORMALISED SCREEN coordinates, so the
      // nearest rows bend into clear arcs instead of bobbing as flat lines.
      const halfW = w * 0.5;
      const heightAt = (x, z, rIdx, amp) => {
        const sx = cx + (x * f) / z;
        const xn = (sx - cx) / halfW; // -1..1 across the frame
        const dn = clamp(rIdx / (ROWS - 1), 0, 1);
        const v =
          0.72 * Math.sin(kz * rIdx - wavePhase + xn * 2.2 * (0.35 + 0.65 * (1 - dn))) +
          0.28 * Math.sin(kz * 0.43 * rIdx + xn * 1.1 - wavePhase * 0.6);
        const y = Math.min(amp * (v + 0.15 * Math.sin(xn * 1.3 + rIdx * 0.55)), CAM_Y * 0.85);
        return { sx, v, y };
      };

      for (let r = 0; r < ROWS; r += 1) {
        const z = zR[r];
        const a = ampR[r];
        const zscale = f / z;
        let max = -2;
        let crests = 0;
        for (let i = 0; i < COLS; i += 1) {
          const x = (i - (COLS - 1) / 2) * X_STEP;
          const h = heightAt(x, z, r, a);
          const idx = r * COLS + i;
          px[idx] = h.sx;
          py[idx] = horizon + (CAM_Y - h.y) * zscale;
          pv[idx] = h.v;
          if (h.v > max) max = h.v;
          if (h.v > 0.5) crests += 1;
        }
        rowMaxPv[r] = max;
        rowCrestFrac[r] = crests / COLS;
      }

      // ---- sky, ground, horizon, haze --------------------------------------
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, horizon, w, h - horizon);
      if (!hazeGrad || hazeKey !== `${w}x${h}`) {
        hazeGrad = ctx.createLinearGradient(0, horizon - h * 0.09, 0, horizon);
        hazeGrad.addColorStop(0, 'rgba(31, 94, 91, 0)');
        hazeGrad.addColorStop(1, 'rgba(31, 94, 91, 0.07)');
        hazeKey = `${w}x${h}`;
      }
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, horizon - h * 0.09, w, h * 0.09);
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 1;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, horizon + 0.5);
      ctx.lineTo(w, horizon + 0.5);
      ctx.stroke();
      ctx.restore();

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // ---- strips drawn FAR -> NEAR (painter's algorithm) ------------------
      // each strip is ONE filled polygon shaped exactly like the wave
      // (near-row silhouette + far-row silhouette) — smooth flowing bands,
      // no blocky tiles. Colour is a continuous trough→crest ramp; crests
      // warm to amber as the signal grows.
      const gate = loud > 0.3 ? clamp((loud - 0.3) / 0.45, 0, 1) : 0;
      const mixA = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      const TROUGH = [180, 175, 164];
      const MID = [229, 225, 215];
      const HAZE = [224, 220, 211];
      const crestCol = gate > 0 ? [222 + (198 - 222) * gate, 214 + (136 - 214) * gate, 196 + (84 - 196) * gate] : MID;
      for (let r = ROWS - 2; r >= 0; r -= 1) {
        const t = r / (ROWS - 2);
        const stripAlpha = 0.95 - 0.85 * t ** 1.1;
        const stripWidth = 2.2 - 1.35 * t;

        // strip colour from its crest fraction along the row
        const c = (rowCrestFrac[r] + rowCrestFrac[r + 1]) * 0.5;
        let hv = clamp(c * 1.6, 0, 1);
        hv = hv * hv * (3 - 2 * hv); // smoothstep
        // distance haze: far strips melt into the fog band at the horizon
        const fog = Math.min(1, (r / (ROWS - 2)) ** 1.4 * 0.85);
        const col = mixA(
          hv < 0.5 ? mixA(TROUGH, MID, hv * 2) : mixA(MID, crestCol, (hv - 0.5) * 2),
          HAZE,
          fog
        );
        const poly = new Path2D();
        for (let i = 0; i < COLS; i += 1) {
          const idx = r * COLS + i;
          if (i === 0) poly.moveTo(px[idx], py[idx]);
          else poly.lineTo(px[idx], py[idx]);
        }
        for (let i = COLS - 1; i >= 0; i -= 1) {
          const idx = (r + 1) * COLS + i;
          poly.lineTo(px[idx], py[idx]);
        }
        poly.closePath();
        ctx.fillStyle = `rgb(${Math.round(col[0])}, ${Math.round(col[1])}, ${Math.round(col[2])})`;
        ctx.fill(poly);

        // far boundary row — amber while it rides a crest
        const crestRow = gate > 0.15 && rowMaxPv[r + 1] > 0.62;
        const rp = new Path2D();
        for (let i = 0; i < COLS; i += 1) {
          const idx = (r + 1) * COLS + i;
          if (i === 0) rp.moveTo(px[idx], py[idx]);
          else rp.lineTo(px[idx], py[idx]);
        }
        ctx.globalAlpha = stripAlpha;
        ctx.lineWidth = crestRow ? stripWidth + 0.45 : stripWidth;
        ctx.strokeStyle = crestRow ? AMBER : TEAL;
        if (crestRow && gate > 0.4) {
          ctx.shadowColor = 'rgba(200, 138, 85, 0.55)';
          ctx.shadowBlur = 10;
        }
        ctx.stroke(rp);
        ctx.shadowBlur = 0;

        // column segments within this strip
        const cp = new Path2D();
        for (let i = 0; i < COLS; i += 1) {
          const near = r * COLS + i;
          const far = near + COLS;
          cp.moveTo(px[far], py[far]);
          cp.lineTo(px[near], py[near]);
        }
        ctx.globalAlpha = stripAlpha * 0.7;
        ctx.lineWidth = stripWidth * 0.72;
        ctx.stroke(cp);
        ctx.globalAlpha = 1;
      }

      // nearest boundary row (the swell entering the frame)
      const row0 = new Path2D();
      for (let i = 0; i < COLS; i += 1) {
        if (i === 0) row0.moveTo(px[i], py[i]);
        else row0.lineTo(px[i], py[i]);
      }
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 2.1;
      ctx.strokeStyle = TEAL;
      ctx.stroke(row0);

      // ---- longitudinal fan lines (constant x, converge to the vanishing
      //      point), drawn per strip inside the painter loop above; the
      //      sub-near extensions are drawn here so the bottom edge stays
      //      covered.
      const ext = new Path2D();
      for (let i = 0; i < COLS; i += 1) {
        const x = (i - (COLS - 1) / 2) * X_STEP;
        let prev = null;
        for (const sub of [
          { zf: 0.68, rIdx: Math.log(0.68 / 0.95) / Math.log(ZRATIO) },
          { zf: 0.82, rIdx: Math.log(0.82 / 0.95) / Math.log(ZRATIO) },
        ]) {
          const z = zNear * sub.zf;
          const h = heightAt(x, z, sub.rIdx, ampR[0]);
          const sy = horizon + (CAM_Y - h.y) * (f / z);
          if (prev) {
            ext.moveTo(prev[0], prev[1]);
            ext.lineTo(h.sx, sy);
          }
          prev = [h.sx, sy];
        }
        ext.moveTo(px[i], py[i]);
        ext.lineTo(prev[0], prev[1]);
      }
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.6;
      ctx.stroke(ext);
      ctx.globalAlpha = 1;
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
