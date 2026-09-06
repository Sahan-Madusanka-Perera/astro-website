'use client';

import { useSyncExternalStore } from 'react';

/* ---------------------------------------------------------------------------
   A three-field store shared by every sky on the site, so an easter egg
   triggered in the footer reaches the star field behind the hero.
   Tiny enough not to earn a dependency.
--------------------------------------------------------------------------- */

type SkyState = {
  /** Konami. Opens the field up: brighter, larger, constellations lit. */
  deepField: boolean;
  /** Seal clicked seven times. */
  sealSpin: number;
};

let state: SkyState = { deepField: false, sealSpin: 0 };
const listeners = new Set<() => void>();

function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

export const sky = {
  toggleDeepField() {
    state.deepField = !state.deepField;
    emit();
    return state.deepField;
  },
  bumpSeal() {
    state.sealSpin += 1;
    emit();
    return state.sealSpin;
  },
};

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const server: SkyState = { deepField: false, sealSpin: 0 };

export function useSky(): SkyState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => server
  );
}
