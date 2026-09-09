import { useEffect, useRef } from "react";
import { onScroll } from "../scroll/scrollStore";

/**
 * Dims the page during a chapter handover.
 *
 * The stage number is a whole number while a chapter holds the screen and only
 * goes fractional in the stretch between two — so this veil is invisible while
 * you read, and darkest at the exact moment the swarm is mid-scatter. One
 * fixed element, so it can never disturb the sticky stages underneath.
 */
export default function ChapterVeil() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    return onScroll((s) => {
      const frac = s.stage - Math.floor(s.stage);
      // zero at both ends of a handover, deepest in the middle of it
      el.style.opacity = String(Math.sin(Math.max(0, Math.min(1, frac)) * Math.PI) * 0.3);
    });
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-20 bg-ink"
      style={{ opacity: 0 }}
    />
  );
}
