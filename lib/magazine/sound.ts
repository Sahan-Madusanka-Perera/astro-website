/* ---------------------------------------------------------------------------
   The sound of a page.

   A recorded clip from /public/sounds, replayed at a slightly different pitch
   each time so a run of turns doesn't sound mechanical, and louder for a fast
   flick than a slow drag.

   The file is fetched when the reader opens, but the audio context is only
   created on the first turn: browsers refuse to start audio before the reader
   has touched the page, and decoding a 20 KB clip then takes milliseconds.
--------------------------------------------------------------------------- */

const SOUND_URL = '/sounds/page-flip.mp3';

let ctx: AudioContext | null = null;
let raw: Promise<ArrayBuffer | null> | null = null;
let clip: Promise<AudioBuffer | null> | null = null;

function fetchClip(): Promise<ArrayBuffer | null> {
  raw ??= fetch(SOUND_URL)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    // A missing or unreachable file means a silent turn, never a broken one.
    .catch(() => null);
  return raw;
}

/** Start downloading the clip ahead of the first turn. */
export function preloadPageTurn() {
  if (typeof window !== 'undefined') void fetchClip();
}

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

function decoded(ac: AudioContext): Promise<AudioBuffer | null> {
  clip ??= fetchClip().then((data) =>
    // decodeAudioData detaches the buffer it is given, so hand it a copy.
    data ? ac.decodeAudioData(data.slice(0)).catch(() => null) : null
  );
  return clip;
}

/** @param strength 0–1; a fast flick is louder than a slow drag. */
export function playPageTurn(strength = 1) {
  const ac = context();
  if (!ac) return;
  void decoded(ac).then((buffer) => {
    if (!buffer) return;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = 0.94 + Math.random() * 0.12;
    const gain = ac.createGain();
    gain.gain.value = 0.75 * Math.max(0.35, Math.min(1, strength));
    src.connect(gain).connect(ac.destination);
    src.start();
  });
}
