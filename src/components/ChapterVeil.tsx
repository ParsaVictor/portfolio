import { useEffect, useRef, useState } from "react";
import { onScroll } from "../scroll/scrollStore";

const COLS_WIDE = 12;
const COLS_NARROW = 6;

/**
 * The sheet that takes the screen between two chapters.
 *
 * A rank of panels closes over the page as the stage number leaves one chapter,
 * meets in full cover at the midpoint — exactly when the particle swarm is at
 * its loosest — then opens again onto the next. Alternate panels sweep from
 * opposite edges so the close reads as a shutter rather than a fade.
 *
 * Panels are plain transforms on a fixed layer, so this costs nothing to
 * animate and can never disturb the sticky stages underneath.
 */
export default function ChapterVeil() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const edgeRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(COLS_WIDE);

  useEffect(() => {
    const read = () => setCols(window.innerWidth < 768 ? COLS_NARROW : COLS_WIDE);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    return onScroll((s) => {
      const p = Math.max(0, Math.min(1, s.stage - Math.floor(s.stage)));
      const idle = p <= 0.001 || p >= 0.999;
      wrap.style.visibility = idle ? "hidden" : "visible";
      if (idle) return;

      for (let i = 0; i < colRefs.current.length; i++) {
        const el = colRefs.current[i];
        if (!el) continue;
        // a small stagger from the outside in, so the shutter feels mechanical
        const lag = (Math.abs(i - (colRefs.current.length - 1) / 2) / colRefs.current.length) * 0.16;
        const enter = clamp01((p - lag) / 0.42);
        const exit = clamp01((p - 0.5 - lag) / 0.42);
        const scale = Math.max(0, enter - exit);
        el.style.transform = "scaleY(" + scale.toFixed(4) + ")";
      }

      // a thin bright seam that rides the closing edge
      if (edgeRef.current) {
        edgeRef.current.style.opacity = String(Math.sin(p * Math.PI) * 0.5);
      }
    });
  }, [cols]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-20 flex"
      style={{ visibility: "hidden" }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            colRefs.current[i] = el;
          }}
          className="h-full flex-1 bg-ink will-change-transform"
          style={{
            transform: "scaleY(0)",
            transformOrigin: i % 2 === 0 ? "top" : "bottom",
          }}
        />
      ))}
      <div
        ref={edgeRef}
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-cyanx to-transparent"
        style={{ opacity: 0 }}
      />
    </div>
  );
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
