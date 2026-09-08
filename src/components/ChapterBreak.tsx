import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scramble from "./Scramble";
import { clamp } from "../lib/num";

gsap.registerPlugin(ScrollTrigger);

/**
 * The seam between two chapters.
 *
 * A rule opens from the centre and a ghost numeral rises as you cross it, which
 * is the moment the particle swarm is mid-scatter — together they announce that
 * you have left one room and entered another.
 */
export default function ChapterBreak({
  index,
  label,
  accent,
}: {
  index: string;
  label: string;
  accent: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const paint = (p: number) => {
      const t = clamp(p, 0, 1);
      // the rule opens fast, then holds
      const open = clamp(t / 0.55, 0, 1);
      if (ruleRef.current) ruleRef.current.style.transform = "scaleX(" + open + ")";
      if (ghostRef.current) {
        ghostRef.current.style.opacity = String(0.04 + open * 0.06);
        ghostRef.current.style.transform = "translateY(" + (1 - open) * 26 + "px)";
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(1);
      return;
    }

    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top 92%",
      end: "bottom 45%",
      onUpdate: (self) => paint(self.progress),
      onRefresh: (self) => paint(self.progress),
    });
    paint(0);
    return () => st.kill();
  }, []);

  return (
    <div ref={wrapRef} className="relative overflow-hidden py-16 md:py-24" aria-hidden={false}>
      {/* the ghost numeral */}
      <span
        ref={ghostRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-display text-[22vw] font-bold leading-none text-stroke ltr"
        style={{ opacity: 0.04 }}
      >
        {index}
      </span>

      <div className="relative mx-auto flex max-w-7xl items-center gap-5 px-6 lg:px-10">
        <span className="font-mono text-xs font-bold tabular-nums tracking-[0.2em] ltr" style={{ color: accent }}>
          {index}
        </span>
        <div className="h-px flex-1 overflow-hidden bg-bone/10">
          <div
            ref={ruleRef}
            className="h-full origin-center"
            style={{
              background: "linear-gradient(90deg, transparent, " + accent + ", transparent)",
              transform: "scaleX(0)",
            }}
          />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-bone/60 sm:text-[11px] ltr">
          <Scramble text={label} />
        </span>
      </div>
    </div>
  );
}
