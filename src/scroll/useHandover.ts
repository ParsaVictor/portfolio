import { useEffect, useRef } from "react";
import { onScroll } from "./scrollStore";

/**
 * Fades a chapter's content out as the page hands over to the next one.
 *
 * `scrollStore.stage` is a whole number for as long as a chapter owns the
 * screen, so the distance from this chapter's own index is exactly zero while
 * you are reading and only climbs during a handover. Content lifts and fades in
 * step with the particle swarm coming apart, then resolves as the next chapter
 * lands.
 *
 * Only opacity and transform, never a filter: this runs on whole page sections,
 * and a blur there would cost far more than it is worth.
 */
export function useHandover<T extends HTMLElement>(stageIndex: number) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.style.willChange = "opacity, transform";
    return onScroll((s) => {
      const d = s.stage - stageIndex;
      const k = Math.min(1, Math.abs(d));
      const e = k * k; // hold near full strength, then drop away quickly
      el.style.opacity = String(1 - e * 0.9);
      el.style.transform =
        "translate3d(0," + -Math.sign(d) * e * 34 + "px,0) scale(" + (1 - e * 0.035) + ")";
    });
  }, [stageIndex]);

  return ref;
}
