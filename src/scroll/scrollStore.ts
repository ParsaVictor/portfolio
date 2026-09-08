import { STAGES } from "../config";

type ScrollState = {
  progress: number; // 0..1 over the whole page
  velocity: number; // normalised scroll velocity
  stage: number; // 0..STAGES-1 (float)
};

export const scrollStore: ScrollState = { progress: 0, velocity: 0, stage: 0 };

const listeners = new Set<(s: ScrollState) => void>();

export function setScroll(progress: number, velocity: number) {
  scrollStore.progress = progress;
  scrollStore.velocity = velocity;
  scrollStore.stage = progress * (STAGES.length - 1);
  listeners.forEach((l) => l(scrollStore));
}

export function onScroll(fn: (s: ScrollState) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
