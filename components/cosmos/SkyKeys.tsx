'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { sky } from './sky-store';

/* ---------------------------------------------------------------------------
   Things that are not on the map.

   ↑↑↓↓←→←→BA        deep field — the sky opens up, constellations light
   type "orion"      the same reveal, for people who read constellations
   the console       a note for whoever opens it

   All of it is decorative. Nothing here gates content, and every reveal is
   reversible by repeating the input.
--------------------------------------------------------------------------- */

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

export function SkyKeys() {
  useEffect(() => {
    let konamiAt = 0;
    let typed = '';

    const isTyping = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      // ── Konami ──────────────────────────────────────────────────────────
      if (key === KONAMI[konamiAt]) {
        konamiAt += 1;
        if (konamiAt === KONAMI.length) {
          konamiAt = 0;
          const on = sky.toggleDeepField();
          toast(on ? 'Deep field engaged' : 'Back to naked eye', {
            description: on
              ? 'Exposure stacked. Every constellation on the page is lit.'
              : 'Sky returned to what the eye can actually see.',
          });
        }
      } else {
        konamiAt = key === KONAMI[0] ? 1 : 0;
      }

      // ── the word itself ─────────────────────────────────────────────────
      if (/^[a-z]$/.test(key)) {
        typed = (typed + key).slice(-6);
        if (typed.endsWith('orion')) {
          typed = '';
          const on = sky.toggleDeepField();
          toast(on ? 'Orion rising' : 'Orion set', {
            description: on
              ? 'The hunter is over the eastern horizon. 05h 35m −05° 27′.'
              : 'Below the horizon again.',
          });
        }
      }
    };

    window.addEventListener('keydown', onKey);

    // A note for whoever opens the console. Costs nothing, means something.
    if (process.env.NODE_ENV === 'production') {
      const azure = 'color:#6fd0f7;font:600 13px ui-monospace,monospace';
      const dim = 'color:#7f8ea8;font:400 12px ui-monospace,monospace';
      console.log(
        '%c  ✦  J\'PURA ASTRONOMY CLUB\n' +
          '%c  6.8524° N, 79.9040° E — University of Sri Jayewardenepura\n\n' +
          '  You found the console. Two more things are hidden on this page.\n' +
          '  One needs a pointer and a steady hand. One is a very old code.\n\n' +
          '  Clear skies.',
        azure,
        dim
      );
    }

    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return null;
}
