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
  colors,
  lang,
}: {
  items: Milestone[];
  accent: string;
  /** One colour per step; the connector grades through them as it draws. */
  colors?: string[];
  lang: "en" | "fa";
}) {
  const hue = (i: number) => colors?.[i] ?? accent;
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const haloRefs = useRef<(SVGCircleElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [w, setW] = useState(0);
  const [narrow, setNarrow] = useState(true);
  const [rtl, setRtl] = useState(false);

  // The cards flip on their own because they are placed with logical insets;
  // the SVG underneath is drawn in physical pixels, so it has to be mirrored by
  // hand or the connector ends up on the wrong side of them in Persian.
  useEffect(() => {
    const read = () => setRtl(document.documentElement.dir === "rtl");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
    return () => mo.disconnect();
  }, []);

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
  const rawX = (i: number) => (narrow ? leftX : i % 2 === 0 ? leftX : rightX);
  const nodeX = (i: number) => (rtl ? w - rawX(i) : rawX(i));
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
        const ahead = Math.min(items.length - 1, Math.floor(drawn * items.length));
        tip.setAttribute("fill", "#fff");
        tip.style.filter = "drop-shadow(0 0 12px " + hue(ahead) + ")";
      }
      // light each node — and its card — once the front has passed it
      for (let i = 0; i < items.length; i++) {
        const reached = drawn >= (i + 0.5) / items.length - 0.06 ? 1 : 0;
        const n = nodeRefs.current[i];
        if (n) {
          n.style.opacity = String(0.35 + reached * 0.65);
          n.setAttribute("r", String(reached ? 6 : 3.5));
        }
        const halo = haloRefs.current[i];
        if (halo) {
          halo.style.opacity = String(reached * 0.28);
          halo.setAttribute("r", String(reached ? 18 : 10));
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
      // span the connector's full pass through the viewport (enter at the
      // bottom, finish as it exits the top) so the draw can never outrun
      // the physical scroll — the old "top 78% / bottom 62%" window was
      // short enough that the tip visibly raced ahead of where you'd
      // actually scrolled to.
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => paint(self.progress),
      onRefresh: (self) => paint(self.progress),
    });
    ScrollTrigger.refresh();
    return () => st.kill();
  }, [w, narrow, rtl, items.length, colors]);

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
        <path d={d} fill="none" stroke="rgba(242,236,225,0.13)" strokeWidth="2.4" />
        <defs>
          <linearGradient id="mpk-method" x1="0" y1="0" x2="0" y2="1">
            {items.map((_, i) => (
              <stop
                key={i}
                offset={(i / Math.max(1, items.length - 1)) * 100 + "%"}
                stopColor={hue(i)}
              />
            ))}
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d={d}
          fill="none"
          stroke="url(#mpk-method)"
          strokeWidth="3.4"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 14px " + accent + "88)" }}
        />
        {items.map((_, i) => (
          <g key={i}>
            <circle
              ref={(el) => {
                haloRefs.current[i] = el;
              }}
              cx={nodeX(i)}
              cy={nodeY(i)}
              r={14}
              fill={hue(i)}
              style={{ opacity: 0, transition: "opacity 420ms ease, r 420ms ease" }}
            />
            <circle
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              cx={nodeX(i)}
              cy={nodeY(i)}
              r={3.5}
              fill={hue(i)}
              style={{ opacity: 0.35, transition: "r 320ms ease, opacity 320ms ease" }}
            />
          </g>
        ))}
        <circle
          ref={tipRef}
          r={5}
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
              insetInlineStart: narrow ? "46px" : onRight ? "50%" : undefined,
              insetInlineEnd: narrow ? "0" : onRight ? undefined : "50%",
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
                borderColor:
                  "color-mix(in oklab, " + hue(i) + " calc(var(--lit) * 46%), rgba(242,236,225,0.09))",
                background: "rgba(10,9,8,0.55)",
                boxShadow: "0 18px 60px -30px color-mix(in oklab, " + hue(i) + " calc(var(--lit) * 85%), transparent)",
              }}
            >
              <div
                className="font-mono text-[10px] tracking-[0.34em] ltr"
                style={{ color: "color-mix(in oklab, " + hue(i) + " calc(var(--lit) * 100%), #a09585)" }}
              >
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
