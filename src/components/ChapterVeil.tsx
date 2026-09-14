import { useEffect, useRef } from "react";
import { onScroll } from "../scroll/scrollStore";
import { useLang } from "../i18n/LangProvider";
import { STAGE_COLORS, STAGES } from "../config";

/**
 * The sheet that takes the screen between two chapters.
 *
 * One dark plate descends over the page like a scanner head: its leading edge
 * is a bright line in the next chapter's colour, and while the plate covers
 * the screen — exactly when the particle swarm is at its loosest — it carries
 * the number and name of the chapter you are about to enter. Then it keeps
 * going and clears off the bottom, revealing the new room from the top down.
 *
 * A single sweep in one direction reads as "turning the page", which the old
 * rank of columns closing from both edges never quite did. Everything here is
 * a transform or an opacity on a fixed layer, so it costs nothing to animate
 * and can never disturb the sticky stages underneath.
 */
export default function ChapterVeil() {
  const { t } = useLang();
  const wrapRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  // what the plate says as it passes: the chapter it is opening onto
  const meta = [
    { index: "00", label: t.rail.hero },
    { index: t.cv.index, label: t.cv.kicker },
    { index: t.data.index, label: t.data.kicker },
    { index: t.web.index, label: t.web.kicker },
    { index: "04", label: t.contact.kicker },
  ];
  const metaRef = useRef(meta);
  metaRef.current = meta;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let shown = -1;
    return onScroll((s) => {
      const p = Math.max(0, Math.min(1, s.stage - Math.floor(s.stage)));
      const idle = p <= 0.001 || p >= 0.999;
      wrap.style.visibility = idle ? "hidden" : "visible";
      if (idle) return;

      const next = Math.min(STAGES.length - 1, Math.ceil(s.stage));
      const accent = STAGE_COLORS[STAGES[next]];
      if (next !== shown) {
        shown = next;
        const m = metaRef.current[next];
        if (indexRef.current) indexRef.current.textContent = m.index;
        if (labelRef.current) labelRef.current.textContent = m.label;
        if (indexRef.current) indexRef.current.style.color = accent;
        if (lineRef.current) lineRef.current.style.background = accent;
        if (beamRef.current) {
          beamRef.current.style.background =
            "linear-gradient(90deg, transparent, " + accent + " 30%, " + accent + " 70%, transparent)";
          beamRef.current.style.boxShadow = "0 0 24px 2px " + accent + "aa";
        }
      }

      // the plate travels one full screen height, -100% → 0 → +100%, with a
      // hold at full cover in the middle so the readout gets a beat to land
      const ss = (v: number) => v * v * (3 - 2 * v);
      let y: number;
      if (p < 0.42) y = (ss(p / 0.42) - 1) * 100;
      else if (p > 0.58) y = ss((p - 0.58) / 0.42) * 100;
      else y = 0;
      if (plateRef.current) plateRef.current.style.transform = "translate3d(0," + y + "%,0)";

      // the beam rides the leading edge: bottom of the plate on the way in,
      // top of it on the way out
      if (beamRef.current) {
        beamRef.current.style.top = p < 0.5 ? "100%" : "0%";
        beamRef.current.style.opacity = String(0.6 + Math.sin(p * Math.PI) * 0.4);
      }
      if (glowRef.current) {
        glowRef.current.style.top = p < 0.5 ? "100%" : "0%";
        glowRef.current.style.transform = p < 0.5 ? "translateY(-100%)" : "none";
        glowRef.current.style.background =
          "linear-gradient(" + (p < 0.5 ? "0deg" : "180deg") + ", " + accent + "26, transparent)";
      }

      // the readout is only legible around full cover
      const cover = Math.max(0, 1 - Math.abs(p - 0.5) / 0.32);
      const k = cover * cover * (3 - 2 * cover);
      if (indexRef.current) {
        indexRef.current.style.opacity = String(k);
        indexRef.current.style.transform = "translate3d(0," + (1 - k) * 18 + "px,0)";
      }
      if (labelRef.current) {
        labelRef.current.style.opacity = String(k * 0.9);
        labelRef.current.style.letterSpacing = 0.5 - k * 0.15 + "em";
      }
      if (lineRef.current) lineRef.current.style.transform = "scaleX(" + k + ")";
    });
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      style={{ visibility: "hidden" }}
    >
      <div
        ref={plateRef}
        className="absolute inset-0 bg-ink will-change-transform"
        style={{ transform: "translate3d(0,-100%,0)" }}
      >
        {/* fine scanlines — a scanner head, not a curtain */}
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(242,236,225,0.12) 0 1px, transparent 1px 4px)",
          }}
        />
        {/* the readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span
            ref={indexRef}
            className="font-display text-[clamp(5rem,22vw,14rem)] font-bold leading-none tabular-nums ltr"
            style={{ opacity: 0 }}
          />
          <span
            ref={lineRef}
            className="h-px w-24 origin-center"
            style={{ transform: "scaleX(0)" }}
          />
          <span
            ref={labelRef}
            className="font-mono text-[11px] uppercase text-bone/70 sm:text-xs ltr"
            style={{ opacity: 0, letterSpacing: "0.5em" }}
          />
        </div>
        {/* a soft wash behind the leading edge */}
        <div ref={glowRef} className="absolute inset-x-0 h-[28vh]" style={{ top: "100%" }} />
        {/* the leading edge itself */}
        <div
          ref={beamRef}
          className="absolute inset-x-0 h-[2px] -translate-y-1/2"
          style={{ top: "100%", opacity: 0 }}
        />
      </div>
    </div>
  );
}
