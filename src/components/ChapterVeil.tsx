import { useEffect, useRef } from "react";
import { onScroll } from "../scroll/scrollStore";
import { useLang } from "../i18n/LangProvider";
import { STAGE_COLORS, STAGES } from "../config";

/**
 * The sheet that takes the screen between two chapters.
 *
 * One dark plate rises from the bottom of the screen — the same direction the
 * page is moving, so it reads as the next room sliding up into place — with a
 * bright leading edge in the next chapter's colour. It holds at full cover for
 * a beat: that is when the particle swarm, lifted above the plate, stands as
 * the number of the chapter ahead, with the chapter's name printed beneath.
 * Then the plate keeps rising and clears off the top, revealing the new room
 * from the bottom up.
 *
 * Everything here is a transform or an opacity on a fixed layer, so it costs
 * nothing to animate and can never disturb the sticky stages underneath.
 */
export default function ChapterVeil() {
  const { t } = useLang();
  const wrapRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);

  // what the plate says as it passes: the chapter it is opening onto
  const meta = [t.rail.hero, t.cv.kicker, t.data.kicker, t.web.kicker, t.contact.kicker];
  const metaRef = useRef(meta);
  metaRef.current = meta;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The cursor carries a faint light of the next chapter's colour across
    // the whole plate — the same light the swarm's numeral gives off where
    // the pointer touches it, only quieter, so the numeral still burns
    // brightest. Plate coordinates move with the plate, so the light is
    // re-aimed on every mouse move and every scroll step.
    const fine = window.matchMedia("(pointer: fine)").matches;
    const mouse = { x: -9999, y: -9999 };
    let plateY = 100; // % of the screen the plate is pushed down
    let accentNow = STAGE_COLORS.hero as string;
    const aim = () => {
      const spot = spotRef.current;
      if (!spot || !fine) return;
      const y = mouse.y - (plateY / 100) * window.innerHeight;
      spot.style.background =
        "radial-gradient(520px circle at " + mouse.x + "px " + y + "px, " + accentNow + "24, " +
        accentNow + "0d 38%, transparent 70%)";
    };
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (wrap.style.visibility === "visible") aim();
    };
    if (fine) window.addEventListener("mousemove", onMove, { passive: true });

    let shown = -1;
    const off = onScroll((s) => {
      const p = Math.max(0, Math.min(1, s.stage - Math.floor(s.stage)));
      const idle = p <= 0.001 || p >= 0.999;
      wrap.style.visibility = idle ? "hidden" : "visible";
      if (idle) return;

      const next = Math.min(STAGES.length - 1, Math.ceil(s.stage));
      const accent = STAGE_COLORS[STAGES[next]];
      accentNow = accent;
      if (next !== shown) {
        shown = next;
        if (labelRef.current) labelRef.current.textContent = metaRef.current[next];
        if (lineRef.current) lineRef.current.style.background = accent;
        if (beamRef.current) {
          beamRef.current.style.background =
            "linear-gradient(90deg, transparent, " + accent + " 30%, " + accent + " 70%, transparent)";
          beamRef.current.style.boxShadow = "0 0 24px 2px " + accent + "aa";
        }
        if (haloRef.current) {
          haloRef.current.style.background =
            "radial-gradient(ellipse 60% 50% at 50% 46%, " + accent + "1f, transparent 70%)";
        }
      }

      // the plate travels one full screen height, +100% → 0 → −100%, with a
      // long hold at full cover — half the handover — while the swarm spells the number
      const ss = (v: number) => v * v * (3 - 2 * v);
      let y: number;
      if (p < 0.25) y = (1 - ss(p / 0.25)) * 100;
      else if (p > 0.75) y = -ss((p - 0.75) / 0.25) * 100;
      else y = 0;
      if (plateRef.current) plateRef.current.style.transform = "translate3d(0," + y + "%,0)";
      plateY = y;
      aim();

      // the beam rides the leading edge: top of the plate on the way up and
      // in, bottom of it on the way out
      const entering = p < 0.5;
      if (beamRef.current) {
        beamRef.current.style.top = entering ? "0%" : "100%";
        beamRef.current.style.opacity = String(0.6 + Math.sin(p * Math.PI) * 0.4);
      }
      if (glowRef.current) {
        glowRef.current.style.top = entering ? "0%" : "100%";
        glowRef.current.style.transform = entering ? "none" : "translateY(-100%)";
        glowRef.current.style.background =
          "linear-gradient(" + (entering ? "180deg" : "0deg") + ", " + accent + "26, transparent)";
      }

      // the readout is only legible around full cover
      const cover = Math.max(0, 1 - Math.abs(p - 0.5) / 0.38);
      const k = ss(cover);
      if (haloRef.current) haloRef.current.style.opacity = String(k);
      if (labelRef.current) {
        labelRef.current.style.opacity = String(k);
        labelRef.current.style.transform = "translate3d(0," + (1 - k) * 14 + "px,0)";
        labelRef.current.style.letterSpacing = 0.46 - k * 0.12 + "em";
      }
      if (lineRef.current) lineRef.current.style.transform = "scaleX(" + k + ")";
    });
    return () => {
      off();
      if (fine) window.removeEventListener("mousemove", onMove);
    };
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
        style={{ transform: "translate3d(0,100%,0)" }}
      >
        {/* fine scanlines — a scanner head, not a curtain */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(242,236,225,0.12) 0 1px, transparent 1px 4px)",
          }}
        />
        {/* a soft pool of the chapter's colour behind the number the swarm draws */}
        <div ref={haloRef} className="absolute inset-0" style={{ opacity: 0 }} />
        {/* the cursor's own light, faint, over the whole plate */}
        <div ref={spotRef} className="absolute inset-0" />

        {/* the chapter's name, printed under the number. The number itself is
            the particle swarm, which sits on its own layer above this plate. */}
        <div className="absolute inset-x-0 top-[66%] flex flex-col items-center gap-3 px-6 text-center sm:top-[68%]">
          <span ref={lineRef} className="h-px w-16 origin-center" style={{ transform: "scaleX(0)" }} />
          <span
            ref={labelRef}
            className="font-mono text-[12px] font-medium uppercase text-bone sm:text-sm ltr"
            style={{ opacity: 0, letterSpacing: "0.46em" }}
          />
        </div>

        {/* a soft wash behind the leading edge */}
        <div ref={glowRef} className="absolute inset-x-0 h-[28vh]" style={{ top: "0%" }} />
        {/* the leading edge itself */}
        <div
          ref={beamRef}
          className="absolute inset-x-0 h-[2px] -translate-y-1/2"
          style={{ top: "0%", opacity: 0 }}
        />
      </div>
    </div>
  );
}
