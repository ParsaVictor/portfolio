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

  // Each card is as tall as its copy makes it — which depends on the width,
  // the language and the font — so rows are laid out from measured heights,
  // never a fixed pitch. (A fixed 176px row stacked the phone cards on top of
  // one another the moment a body ran to five lines.)
  const [heights, setHeights] = useState<number[]>([]);
  useLayoutEffect(() => {
    const read = () => {
      const next = cardRefs.current.slice(0, items.length).map((c) => c?.offsetHeight ?? 0);
      setHeights((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next
      );
    };
    read();
    const ro = new ResizeObserver(read);
    cardRefs.current.forEach((c) => c && ro.observe(c));
    // the web fonts land after first layout and rewrap every card; catch that
    // explicitly rather than trusting the observer to be running yet
    let alive = true;
    document.fonts?.ready.then(() => alive && read());
    const timers = [300, 1200].map((ms) => window.setTimeout(read, ms));
    return () => {
      alive = false;
      ro.disconnect();
      timers.forEach(window.clearTimeout);
    };
  }, [items, w, narrow]);

  const guess = narrow ? 200 : 170;
  const hOf = (i: number) => heights[i] || guess;
  // Wide: cards alternate sides and each starts only once the last has
  // ended, so every leg of the connector gets a long, open run of its own —
  // the drawing is the part people enjoy, so it is given the room to be long.
  const gap = narrow ? 18 : 64;
  const tops: number[] = [];
  for (let i = 0; i < items.length; i++) {
    tops.push(i === 0 ? 0 : tops[i - 1] + hOf(i - 1) + gap);
  }
  const height = items.length
    ? Math.max(...tops.map((tp, i) => tp + hOf(i))) + (narrow ? 8 : 16)
    : 0;

  // Wide: each node is a port on its card's inner edge (the cards stop
  // GUTTER px short of the centre line), so the connector sweeps down the
  // gutter between the two columns and never runs underneath anybody's copy.
  const GUTTER = 84;
  const leftX = narrow ? 22 : w * 0.5 - GUTTER;
  const rightX = narrow ? 22 : w * 0.5 + GUTTER;
  const rawX = (i: number) => (narrow ? leftX : i % 2 === 0 ? leftX : rightX);
  const nodeX = (i: number) => (rtl ? w - rawX(i) : rawX(i));
  // phone: level with the step label; wide: the card's middle, which gives
  // each leg of the S an even rise either side
  const nodeY = (i: number) => tops[i] + (narrow ? 27 : hOf(i) / 2);

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

    // Scroll drives the front's HEIGHT, not its share of the path's length:
    // the S-legs are longer than they are tall, and mapping by length would
    // make the tip race across each sweep and crawl down each straight. A
    // lookup of (length, y) samples turns "how far down" into "how far along".
    const SAMPLES = 360;
    const lens: number[] = [];
    const ys: number[] = [];
    for (let k = 0; k <= SAMPLES; k++) {
      const l = (len * k) / SAMPLES;
      lens.push(l);
      ys.push(path.getPointAtLength(l).y);
    }
    const lenAtY = (y: number) => {
      if (y <= ys[0]) return 0;
      if (y >= ys[SAMPLES]) return len;
      let lo = 0;
      let hi = SAMPLES;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] < y) lo = mid;
        else hi = mid;
      }
      const t = (y - ys[lo]) / Math.max(1e-6, ys[hi] - ys[lo]);
      return lens[lo] + (lens[hi] - lens[lo]) * t;
    };
    const y0 = nodeY(0);
    const y1 = nodeY(items.length - 1);
    const nodeLen = items.map((_, i) => lenAtY(nodeY(i)));

    const paint = (p: number) => {
      const at = lenAtY(y0 + (y1 - y0) * clamp(p, 0, 1));
      const drawn = at / Math.max(1, len);
      path.style.strokeDashoffset = String(len - at);
      const pt = path.getPointAtLength(at);
      const tip = tipRef.current;
      if (tip) {
        tip.setAttribute("cx", String(pt.x));
        tip.setAttribute("cy", String(pt.y));
        tip.style.opacity = drawn > 0.004 && drawn < 0.999 ? "1" : "0";
        let ahead = 0;
        while (ahead < items.length - 1 && at >= nodeLen[ahead + 1]) ahead++;
        tip.setAttribute("fill", "#fff");
        tip.style.filter = "drop-shadow(0 0 12px " + hue(ahead) + ")";
      }
      // light each node — and its card — once the front has passed it
      for (let i = 0; i < items.length; i++) {
        const reached = at >= nodeLen[i] - 24 ? 1 : 0;
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

    // The front trails the scroll by a breath instead of snapping to it — a
    // short ease that makes the line feel poured rather than stamped.
    let shown = 0;
    let aim = 0;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(48, now - last) : 16;
      last = now;
      shown += (aim - shown) * Math.min(1, dt / 110);
      if (Math.abs(aim - shown) < 0.0004) shown = aim;
      paint(shown);
      raf = shown === aim ? 0 : requestAnimationFrame(tick);
      if (!raf) last = 0;
    };
    const follow = (p: number) => {
      aim = p;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const st = ScrollTrigger.create({
      trigger: wrap,
      // Both edges pin to the SAME viewport reference point (dead centre),
      // so the vh term cancels out of the math entirely: scroll distance
      // == wrap's own height, exactly. That's what makes this correct
      // instead of another guessed percentage — draw progress is now
      // pixel-for-pixel locked to physical scroll through the timeline, so
      // it can never race ahead or lag behind, at any viewport size.
      start: "top 36%",
      end: "bottom 64%",
      onUpdate: (self) => follow(self.progress),
      onRefresh: (self) => {
        shown = aim = self.progress;
        paint(shown);
      },
    });
    ScrollTrigger.refresh();
    return () => {
      st.kill();
      cancelAnimationFrame(raf);
    };
  }, [w, narrow, rtl, items.length, colors, d]);

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
          {/* user-space, not bounding-box: on a phone the route is a dead
              straight vertical line, whose zero-width bbox would otherwise
              leave the gradient — and so the drawn stroke — invisible */}
          <linearGradient id="mpk-method" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={Math.max(1, height)}>
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
              top: tops[i] + "px",
              insetInlineStart: narrow ? "46px" : onRight ? "50%" : undefined,
              insetInlineEnd: narrow ? "0" : onRight ? undefined : "50%",
              width: narrow ? "auto" : "min(44%, 560px)",
              paddingInlineStart: narrow ? 0 : onRight ? GUTTER + "px" : 0,
              paddingInlineEnd: narrow ? 0 : onRight ? 0 : GUTTER + "px",
              ["--lit" as string]: "0",
              transform: "translateY(calc((1 - var(--lit)) * 10px))",
              transition: "transform 480ms ease",
            }}
          >
            {/* each step is its own card, so the copy always has a ground of
                its own rather than floating on whatever is behind the page */}
            <div
              className="rounded-2xl border p-4 backdrop-blur-md transition-colors duration-500 sm:p-5"
              style={{
                borderColor:
                  "color-mix(in oklab, " + hue(i) + " calc(var(--lit) * 46%), rgba(242,236,225,0.09))",
                // near-solid: the copy reads on its own ground, never on the
                // swarm or the connector's glow passing behind it
                background: "linear-gradient(180deg, rgba(38,34,30,0.94), rgba(24,22,19,0.94))",
                boxShadow: "0 18px 60px -30px color-mix(in oklab, " + hue(i) + " calc(var(--lit) * 85%), transparent)",
              }}
            >
              {/* only the copy waits for the front to arrive — the card's
                  ground stays solid, so nothing ever shows through it */}
              <div
                style={{
                  opacity: "calc(0.58 + var(--lit) * 0.42)",
                  transition: "opacity 480ms ease",
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
          </div>
        );
      })}
    </div>
  );
}
