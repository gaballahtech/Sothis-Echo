/**
 * Data sonification — Sothis Echo.
 *
 * Mapping is deliberately simple and explainable:
 *   one pulse  = one satellite pass (12-day repeat)
 *   pitch      = size of the change (flat → high)
 *   rhythm     = how fast the surface is changing (slow → urgent)
 *   static     = texture of the change (roughness / many small changes)
 *
 * The sequencer schedules on the Web Audio clock (sample-accurate) and uses
 * timers only to drive the visible playhead. No audio files are bundled.
 */

const SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
const ROOT_HZ = 146.83; // D3 — low, calm register
const MASTER_LEVEL = 0.26;
const NOISE_LEVEL = 0.07;
const NOISE_DURATION = 0.11;

export const isAudioSupported = () =>
  typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext);

export function stepDuration(value) {
  return 0.62 - Math.max(0, Math.min(1, value)) * 0.36;
}

export function stepFrequency(value) {
  const v = Math.max(0, Math.min(1, value));
  const degree = Math.min(SCALE.length - 1, Math.floor(v * (SCALE.length - 1)));
  const semitone = SCALE[degree] + (v > 0.66 ? 12 : 0);
  return ROOT_HZ * 2 ** (semitone / 12);
}

export function createSonifier() {
  let ctx = null;
  let master = null;
  let timers = [];
  let activeNodes = new Set();
  let session = 0;
  let playing = false;
  let timeline = null;

  function ensureContext() {
    if (ctx) return ctx;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtor();
    master = ctx.createGain();
    master.gain.value = MASTER_LEVEL;
    // gentle lowpass keeps the noise texture soft and the pitch readable
    const softener = ctx.createBiquadFilter();
    softener.type = 'lowpass';
    softener.frequency.value = 5200;
    softener.Q.value = 0.4;
    master.connect(softener);
    softener.connect(ctx.destination);
    return ctx;
  }

  function noiseBurst(start, value) {
    const duration = NOISE_DURATION;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800 + value * 1900;
    filter.Q.value = 0.9;
    const gain = ctx.createGain();
    gain.gain.value = value * NOISE_LEVEL;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
    source.stop(start + duration);
    activeNodes.add(source);
    source.onended = () => activeNodes.delete(source);
  }

  function note(start, value) {
    const frequency = stepFrequency(value);
    const duration = 0.34 - value * 0.1;
    const volume = 0.11 + value * 0.16;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = value > 0.58 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
    activeNodes.add(osc);
    osc.onended = () => activeNodes.delete(osc);

    // quiet octave sparkle on strong changes
    if (value > 0.45) {
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(frequency * 2.005, start);
      shimmerGain.gain.setValueAtTime(0.0001, start);
      shimmerGain.gain.linearRampToValueAtTime(value * 0.045, start + 0.02);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.85);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(master);
      shimmer.start(start);
      shimmer.stop(start + duration);
      activeNodes.add(shimmer);
      shimmer.onended = () => activeNodes.delete(shimmer);
    }

    if (value > 0.3) noiseBurst(start, value);
  }

  function stop() {
    session += 1;
    playing = false;
    timeline = null;
    timers.forEach((id) => clearTimeout(id));
    timers = [];
    if (ctx) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.0001, now + 0.08);
      const restoreAt = now + 0.14;
      master.gain.setValueAtTime(MASTER_LEVEL, restoreAt);
      activeNodes.forEach((node) => {
        try {
          node.stop(now + 0.06);
        } catch {
          /* already ended */
        }
      });
      activeNodes = new Set();
    }
  }

  function play(values, handlers = {}) {
    if (!Array.isArray(values) || !values.length || !isAudioSupported()) return false;
    stop();
    ensureContext();
    ctx.resume().catch(() => {});
    // cancel the fade-out scheduled by stop() so the first pulse is audible
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(MASTER_LEVEL, ctx.currentTime);
    playing = true;
    const current = session;

    const startAt = ctx.currentTime + 0.08;
    let cursor = startAt;
    const offsets = [];
    values.forEach((raw) => {
      const value = Math.max(0, Math.min(1, Number(raw) || 0));
      offsets.push(cursor - startAt);
      note(cursor, value);
      cursor += stepDuration(value);
    });

    // The audio clock (ctx.currentTime) is the single source of truth for the
    // visuals: rAF loops read getTimeState() every frame, so the playhead and
    // the terrain pulse land exactly on the scheduled notes (web.dev,
    // "A tale of two clocks").
    timeline = { offsets, startAt, total: cursor - startAt };

    values.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          if (current !== session) return;
          handlers.onStep?.(index);
        }, Math.max(0, offsets[index] * 1000))
      );
    });

    timers.push(
      setTimeout(() => {
        if (current !== session) return;
        playing = false;
        handlers.onEnd?.();
      }, Math.max(400, (cursor - startAt) * 1000 + 350))
    );

    handlers.onStart?.();
    return true;
  }

  /**
   * Playback position measured on the audio clock. Returns
   * `{ passIndex, passT, sinceOnset, ratio }` while a sequence is playing, or
   * `null` when nothing is playing. `sinceOnset` is the time in seconds since
   * the current note started, so visuals can decay their envelope in step
   * with the scheduled audio.
   */
  function getTimeState() {
    if (!playing || !ctx || !timeline) return null;
    const t = ctx.currentTime - timeline.startAt;
    if (t < 0) return { passIndex: 0, passT: 0, sinceOnset: 0, ratio: 0 };
    if (t >= timeline.total) return null;
    const { offsets, total } = timeline;
    let index = offsets.length - 1;
    while (index > 0 && offsets[index] > t) index -= 1;
    const stepEnd = index + 1 < offsets.length ? offsets[index + 1] : total;
    const span = Math.max(0.0001, stepEnd - offsets[index]);
    const sinceOnset = Math.max(0, t - offsets[index]);
    return {
      passIndex: index,
      passT: Math.min(1, sinceOnset / span),
      sinceOnset,
      ratio: Math.min(1, t / total),
    };
  }

  function dispose() {
    stop();
    if (ctx) {
      ctx.close().catch(() => {});
      ctx = null;
      master = null;
    }
  }

  return {
    play,
    stop,
    dispose,
    getTimeState,
    get isPlaying() {
      return playing;
    },
  };
}

/** Human-readable mapping used in the UI — keep in sync with the engine. */
export const sonificationMapping = {
  rootHz: ROOT_HZ,
  scale: SCALE,
  minStepMs: Math.round(stepDuration(1) * 1000),
  maxStepMs: Math.round(stepDuration(0) * 1000),
};
