import { STAGES } from "../config";

type ScrollState = {
  progress: number; // 0..1 over the whole page
  velocity: number; // normalised scroll velocity
  stage: number; // 0..STAGES-1, integer while a chapter holds the screen
};

export const scrollStore: ScrollState = { progress: 0, velocity: 0, stage: 0 };

const listeners = new Set<(s: ScrollState) => void>();

/**
 * Where each chapter takes over the screen, and where the handover starts.
 *
 * The particle form must be settled and legible for as long as you are reading
 * a chapter, and only come apart in the short stretch between two of them — so
 * the stage number is a *plateau* per chapter, not a straight ramp across the
 * page. `entry[i]` is the scroll position where chapter i takes the screen;
 * `handover[i]` is where the swarm starts breaking up to reach it.
 */
let entry: number[] = [];
let handover: number[] = [];

export function measureStages() {
  const vh = window.innerHeight;
  const tops = STAGES.map((id) => {
    const el = document.getElementById(id);
    return el ? el.offsetTop : 0;
  });

  // Every chapter has a seam block in front of it (ChapterBreak, tagged with
  // the chapter's id). The handover begins only once the chapter before has
  // been read to its end — the moment the seam's top edge reaches the bottom
  // of the screen — and finishes when the next chapter's own top has risen a
  // third of the way up. The seam is tall on purpose: that empty run is the
  // room the veil and the chapter number get to play out in.
  entry = tops.map((top, i) => (i === 0 ? 0 : Math.max(0, top - vh * 0.35)));
  handover = STAGES.map((id, i) => {
    if (i === 0) return 0;
    const seam = document.querySelector<HTMLElement>('[data-seam="' + id + '"]');
    const start = seam ? seam.offsetTop - vh : entry[i] - vh;
    return Math.max(0, start);
  });
  // keep everything strictly increasing even if a section is unexpectedly short
  for (let i = 1; i < entry.length; i++) {
    if (handover[i] <= entry[i - 1]) handover[i] = entry[i - 1] + 1;
    if (entry[i] <= handover[i] + vh * 0.5) entry[i] = handover[i] + vh * 0.5;
  }
}

/** Integer inside a chapter, fractional only across a handover. */
function stageAt(y: number): number {
  const n = entry.length;
  if (n < 2) return 0;
  for (let i = 1; i < n; i++) {
    if (y < handover[i]) return i - 1; // still settled in the previous chapter
    if (y < entry[i]) {
      const span = entry[i] - handover[i];
      return i - 1 + (span > 0 ? (y - handover[i]) / span : 1);
    }
  }
  return n - 1;
}

export function setScroll(progress: number, velocity: number, y: number) {
  scrollStore.progress = progress;
  scrollStore.velocity = velocity;
  scrollStore.stage = stageAt(y);
  listeners.forEach((l) => l(scrollStore));
}

export function onScroll(fn: (s: ScrollState) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
