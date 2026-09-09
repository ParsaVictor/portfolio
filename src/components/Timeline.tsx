import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clamp, digits } from "../lib/num";

gsap.registerPlugin(ScrollTrigger);

export type Milestone = { step: string; title: string; body: string };

/**
 * A serpentine connector that draws itself as you scroll.
 *
 * The path is generated in pixel space from a measured container so the curve
 * keeps its shape at any width (no viewBox stretching), the stroke is revealed
 * with `stroke-dashoffset` scrubbed to scroll, and a bright tip rides the draw
 * front while each node lights as the tip reaches it.
 */
export default function Timeline({
  items,
  accent,
  lang,
}: {
  items: Milestone[];
  accent: string;
  lang: "en" | "fa";
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [w, setW] = useState(0);
  const [narrow, setNarrow] = useState(true);

  // Measure — the geometry is derived, never hardcoded. Belt and braces on the
  // read, because a mount that happens before layout settles (fonts, a hidden
  // tab, a pane that starts collapsed) would otherwise freeze the path at 0.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => {
      const next = el.clientWidth;
      if (next > 0) setW(next);
      setNarrow(window.innerWidth < 1024);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    window.addEventListener("resize", read);
    const timers = [80, 400, 1200, 2500].map((ms) => window.setTimeout(read, ms));
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
      timers.forEach(window.clearTimeout);
    };
  }, []);

  const rowH = narrow ? 176 : 208;
  const height = items.length * rowH;
  const leftX = narrow ? 22 : w * 0.5 - w * 0.24;
  const rightX = narrow ? 22 : w * 0.5 + w * 0.24;
  const nodeX = (i: number) => (narrow ? leftX : i % 2 === 0 ? leftX : rightX);
  const nodeY = (i: number) => (i + 0.5) * rowH;

  let d = "";
  if (w > 0) {
    d = "M " + nodeX(0) + " " + nodeY(0);
    for (let i = 1; i < items.length; i++) {
      const x0 = nodeX(i - 1);
      const y0 = nodeY(i - 1);
      const x1 = nodeX(i);
      const y1 = nodeY(i);
      const my = (y0 + y1) / 2;
      d += " C " + x0 + " " + my + ", " + x1 + " " + my + ", " + x1 + " " + y1;
    }
  }

  useEffect(() => {
    const path = pathRef.current;
    const wrap = wrapRef.current;
    if (!path || !wrap || w === 0) return;

    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);

    const paint = (p: number) => {
      const drawn = clamp(p, 0, 1);
      path.style.strokeDashoffset = String(len * (1 - drawn));
      const pt = path.getPointAtLength(len * drawn);
      const tip = tipRef.current;
      if (tip) {
        tip.setAttribute("cx", String(pt.x));
        tip.setAttribute("cy", String(pt.y));
        tip.style.opacity = drawn > 0.004 && drawn < 0.999 ? "1" : "0";
      }
      // light each node — and its card — once the front has passed it
      for (let i = 0; i < items.length; i++) {
        const reached = drawn >= (i + 0.5) / items.length - 0.06 ? 1 : 0;
        const n = nodeRefs.current[i];
        if (n) {
          n.style.opacity = String(0.35 + reached * 0.65);
          n.setAttribute("r", String(reached ? 5.5 : 3.5));
        }
        const c = cardRefs.current[i];
        if (c) c.style.setProperty("--lit", String(reached));
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(1);
      return;
    }

    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top 78%",
      end: "bottom 62%",
      onUpdate: (self) => paint(self.progress),
      onRefresh: (self) => paint(self.progress),
    });
    ScrollTrigger.refresh();
    return () => st.kill();
  }, [w, narrow, items.length]);

  return (
    <div ref={wrapRef} className="relative" style={{ height: height + "px" }}>
      <svg
        className="pointer-events-none absolute inset-0"
        width={w}
        height={height}
        viewBox={"0 0 " + Math.max(w, 1) + " " + height}
        aria-hidden
      >
        {/* the ghost route, so the shape reads before it is drawn */}
        <path d={d} fill="none" stroke="rgba(242,236,225,0.10)" strokeWidth="1.5" />
        <path
          ref={pathRef}
          d={d}
          fill="none"
          stroke={accent}
          strokeWidth="1.8"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px " + accent + "55)" }}
        />
        {items.map((_, i) => (
          <circle
            key={i}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            cx={nodeX(i)}
            cy={nodeY(i)}
            r={3.5}
            fill={accent}
            style={{ opacity: 0.35, transition: "r 320ms ease, opacity 320ms ease" }}
          />
        ))}
        <circle
          ref={tipRef}
          r={4}
          fill="#fff"
          style={{ opacity: 0, filter: "drop-shadow(0 0 10px " + accent + ")" }}
        />
      </svg>

      {items.map((m, i) => {
        const onRight = !narrow && i % 2 === 1;
        return (
          <div
            key={m.step}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="absolute"
            style={{
              top: nodeY(i) - rowH * 0.4 + "px",
              left: narrow ? "46px" : onRight ? "50%" : undefined,
              right: narrow ? "0" : onRight ? undefined : "50%",
              width: narrow ? "auto" : "42%",
              paddingInlineStart: narrow ? 0 : onRight ? "3rem" : 0,
              paddingInlineEnd: narrow ? 0 : onRight ? 0 : "3rem",
              ["--lit" as string]: "0",
              opacity: "calc(0.45 + var(--lit) * 0.55)",
              transform: "translateY(calc((1 - var(--lit)) * 10px))",
              transition: "opacity 480ms ease, transform 480ms ease",
            }}
          >
            {/* each step is its own card, so the copy always has a ground of
                its own rather than floating on whatever is behind the page */}
            <div
              className="rounded-2xl border p-4 backdrop-blur-sm transition-colors duration-500 sm:p-5"
              style={{
                borderColor: "color-mix(in oklab, " + accent + " calc(var(--lit) * 38%), rgba(242,236,225,0.09))",
                background: "rgba(10,9,8,0.55)",
                boxShadow: "0 0 0 0 transparent",
              }}
            >
              <div className="font-mono text-[10px] tracking-[0.34em] text-dim ltr">
                {digits(m.step, lang)}
              </div>
              <h3 className="mt-2 text-lg font-bold leading-tight text-bone sm:text-xl">
                {m.title}
              </h3>
              <p className="mt-2 text-[14px] leading-7 text-bone/85 sm:text-[14.5px]">{m.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
