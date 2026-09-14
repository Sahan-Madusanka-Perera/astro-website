/* ---------------------------------------------------------------------------
   The sound of a page.

   Synthesised rather than shipped as a file: filtered noise swept up through
   the band where paper rustles, then let go. A few hundred bytes of code
   instead of a download, and every turn sounds slightly different.
--------------------------------------------------------------------------- */

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noise) return noise;
  const len = Math.floor(ac.sampleRate * 0.9);
  noise = ac.createBuffer(1, len, ac.sampleRate);
  const data = noise.getChannelData(0);
  // Slightly reddened noise: paper has less hiss than white noise.
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.55 + white * 0.45;
    data[i] = last;
  }
  return noise;
}

/** @param strength 0–1; a fast flick is louder than a slow drag. */
export function playPageTurn(strength = 1) {
  const ac = context();
  if (!ac) return;
  const t = ac.currentTime + 0.005;
  const dur = 0.34 + Math.random() * 0.08;
  const gainPeak = 0.16 * Math.max(0.35, Math.min(1, strength));

  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);

  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 380;

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.9;
  const f0 = 1100 + Math.random() * 300;
  bp.frequency.setValueAtTime(f0, t);
  bp.frequency.exponentialRampToValueAtTime(f0 * 2.8, t + dur * 0.45);
  bp.frequency.exponentialRampToValueAtTime(f0 * 1.2, t + dur);

  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gainPeak, t + 0.035);
  g.gain.exponentialRampToValueAtTime(gainPeak * 0.35, t + dur * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(hp).connect(bp).connect(g).connect(ac.destination);
  src.start(t, Math.random() * 0.4);
  src.stop(t + dur + 0.02);
}
