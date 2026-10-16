import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import gsap from "gsap";
import { useLang } from "../i18n/LangProvider";
import { allProjects } from "../data/projects";
import { openProject } from "../state/projectModal";
import { digits } from "../lib/num";

type Branch = { key: string; label: string; short: string; color: string; leaves: string[] };

/** Grounded in what the repos actually use — no aspirational entries. */
const BRANCHES: Branch[] = [
  { key: "vision", label: "VISION", short: "VISION", color: "#35e0ff", leaves: ["YOLO", "OpenCV", "ByteTrack", "MediaPipe"] },
  { key: "deep", label: "DEEP LEARNING", short: "DEEP", color: "#7cc4ff", leaves: ["PyTorch", "CNN", "Transfer Learning", "TensorRT"] },
  { key: "ml", label: "MACHINE LEARNING", short: "ML", color: "#a894ff", leaves: ["scikit-learn", "Random Forest", "Explainable AI"] },
  { key: "data", label: "DATA", short: "DATA", color: "#ffb454", leaves: ["NumPy", "Pandas", "SQL", "Matplotlib"] },
  { key: "web", label: "WEB", short: "WEB", color: "#ff6a5e", leaves: ["React", "TypeScript", "Three.js", "Next.js"] },
  { key: "infra", label: "INFRA", short: "INFRA", color: "#8fd67a", leaves: ["Docker", "Git", "MLOps"] },
];

/**
 * Where each tool demonstrably shows up — project ids from data/projects.ts,
 * read off their tags and write-ups. "site" is this portfolio itself. A tool
 * with no entry is everyday toolkit and says so, rather than inventing a link.
 */
const EVIDENCE: Record<string, string[]> = {
  YOLO: ["ppe-sentinel", "pelakx", "fireguard", "pcb-detect", "pcb-solder-defects", "pcb-bare-defects"],
  OpenCV: ["pelakx", "pcb-classify"],
  ByteTrack: ["thief", "ppe-sentinel"],
  PyTorch: ["pcb-detect", "ai-template"],
  CNN: ["pcb-detect", "fireguard", "pelakx"],
  "Transfer Learning": ["pcb-detect"],
  TensorRT: ["ppe-sentinel"],
  "scikit-learn": ["pcb-classify"],
  "Random Forest": ["pcb-classify"],
  "Explainable AI": ["pcb-classify"],
  NumPy: ["pointcloud", "pcb-classify"],
  SQL: ["univecity", "homsayeh", "imam-reza-shift"],
  React: ["homsayeh", "univecity", "melkai", "site"],
  TypeScript: ["homsayeh", "univecity", "b2b", "neuromesh", "site"],
  "Three.js": ["site"],
  "Next.js": ["homsayeh", "univecity", "melkai"],
  Docker: ["univecity", "homsayeh"],
  Git: ["neuromesh", "code-context-engine"],
  MLOps: ["ai-template"],
};


/** Projects behind a discipline, in the site's own order (Must-see first, then newest). */
function projectsOf(b: Branch) {
  const ids = new Set(b.leaves.flatMap((l) => EVIDENCE[l] ?? []));
  return {
    projects: allProjects.filter((p) => ids.has(p.id)),
    site: ids.has("site"),
  };
}
const usesTool = (tool: string, id: string) => (EVIDENCE[tool] ?? []).includes(id);

type Node = {
  id: string;
  label: string;
  color: string;
  kind: "hub" | "branch" | "leaf";
  parent: number | null;
  branch: number; // index into BRANCHES, -1 for the hub
  seed: number;
  r: number;
};

/** Where a node wants to be, how big and how present — per focus state. */
type Target = { x: number; y: number; s: number; a: number };

const MOTES_PER_EDGE = 3;
/** Seconds for one pulse to travel hub → branch → leaf. */
const PULSE_PERIOD = 5200;
/** Below this box width the graph uses short labels and tighter rings. */
const COMPACT_W = 640;
/** Time constant of the glide between layouts — ~0.8s to settle. */
const GLIDE_MS = 230;

type Mote = { edge: number; t: number; speed: number; size: number };

/**
 * The stack as a focus orbit.
 *
 * At rest the map is quiet: the six disciplines around the centre, each with
 * its tools as unlabelled satellites. Choosing a discipline swaps it with the
 * centre — it glides into the middle, its tools open around it as readable
 * labels, and the hub and the other disciplines step back onto an outer ring.
 * Every node eases to its new place, so nothing ever jumps.
 *
 * Hover only lights a path; it never changes what the read-out says. Only a
 * click (or tap, or Enter) commits, and the read-out keeps one steady list of
 * the discipline's projects — choosing a tool dims the ones that don't use it
 * instead of swapping the list out.
 */
export default function SkillGraph({ hub = "MPK" }: { hub?: string }) {
  const { t, lang } = useLang();
  const g = t.about.graph;
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef<(HTMLElement | null)[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [focus, setFocus] = useState<number | null>(null); // branch index
  const [tool, setTool] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null); // node index
  const compact = size.w > 0 && size.w < COMPACT_W;

  /* ------------------------------------------------------------ nodes */
  const nodes = useMemo(() => {
    const list: Node[] = [
      { id: "hub", label: hub, color: "#f2ece1", kind: "hub", parent: null, branch: -1, seed: 0, r: 9 },
    ];
    BRANCHES.forEach((b, bi) => {
      const bIndex = list.length;
      list.push({ id: b.key, label: b.label, color: b.color, kind: "branch", parent: 0, branch: bi, seed: bi * 1.7, r: 6 });
      b.leaves.forEach((leaf, li) =>
        list.push({
          id: b.key + "-" + leaf, label: leaf, color: b.color, kind: "leaf",
          parent: bIndex, branch: bi, seed: bi * 3.1 + li * 0.9, r: 3.4,
        })
      );
    });
    return list;
  }, [hub]);

  /* --------------------------------------------------------- measure */
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const read = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    window.addEventListener("resize", read);
    const timers = [100, 500, 1500].map((ms) => window.setTimeout(read, ms));
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
      timers.forEach(window.clearTimeout);
    };
  }, []);

  /* --------------------------------------------------------- targets */
  const targets = useMemo<Target[]>(() => {
    const { w, h } = size;
    if (!w || !h) return [];
    const small = w < COMPACT_W;
    const padX = small ? Math.min(46, w * 0.13) : Math.min(90, w * 0.12);
    const padY = small ? 30 : Math.min(56, h * 0.12);
    const uw = Math.max(60, w / 2 - padX);
    const uh = Math.max(50, h / 2 - padY);
    const cx = w / 2;
    const cy = h / 2;
    const n = BRANCHES.length;
    const slot = (i: number) => -Math.PI / 2 + (i * Math.PI * 2) / n;
    const out: Target[] = new Array(nodes.length);

    if (focus == null) {
      // rest: disciplines on a ring, tools as satellites fanned outward
      out[0] = { x: cx, y: cy, s: 1, a: 1 };
      const sat = small ? 16 : 30;
      nodes.forEach((nd, i) => {
        if (nd.kind === "branch") {
          const a = slot(nd.branch);
          out[i] = { x: cx + Math.cos(a) * uw * 0.8, y: cy + Math.sin(a) * uh * 0.78, s: 1, a: 1 };
        }
      });
      nodes.forEach((nd, i) => {
        if (nd.kind !== "leaf") return;
        const p = out[nd.parent!];
        const sibs = BRANCHES[nd.branch].leaves;
        const k = sibs.indexOf(nd.label);
        const a = slot(nd.branch) + (k / Math.max(1, sibs.length - 1) - 0.5) * 1.7;
        out[i] = { x: p.x + Math.cos(a) * sat, y: p.y + Math.sin(a) * sat * 0.9, s: 0.85, a: 0.75 };
      });
      return out;
    }

    // focus: the chosen discipline takes the centre and the hub takes its old
    // slot — a swap, so the eye can follow both. Its tools ring it, labelled.
    const fbIndex = nodes.findIndex((nd) => nd.kind === "branch" && nd.branch === focus);
    const ring = (i: number) => ({ x: cx + Math.cos(slot(i)) * uw * 0.92, y: cy + Math.sin(slot(i)) * uh * 0.9 });
    out[fbIndex] = { x: cx, y: cy, s: 1.7, a: 1 };
    out[0] = { ...ring(focus), s: 0.8, a: 0.85 };
    nodes.forEach((nd, i) => {
      if (nd.kind === "branch" && nd.branch !== focus) out[i] = { ...ring(nd.branch), s: 0.8, a: 0.5 };
    });
    const leaves = BRANCHES[focus].leaves;
    // a tall inner ellipse keeps the tool labels clear of the outer ring's
    const lrx = small ? 0.8 : 0.42;
    const lry = small ? 0.7 : 0.56;
    nodes.forEach((nd, i) => {
      if (nd.kind !== "leaf") return;
      if (nd.branch === focus) {
        const k = leaves.indexOf(nd.label);
        const a = -Math.PI / 2 + ((k + 0.5) * Math.PI * 2) / leaves.length;
        out[i] = { x: cx + Math.cos(a) * uw * lrx, y: cy + Math.sin(a) * uh * lry, s: 1.5, a: 1 };
      } else {
        // folded back into its discipline
        const p = out[nd.parent!];
        out[i] = { x: p.x, y: p.y, s: 0.3, a: 0 };
      }
    });
    return out;
  }, [size, focus, nodes]);

  /* ------------------------------------------- live (eased) positions */
  const live = useRef<Target[]>([]);
  useLayoutEffect(() => {
    if (!targets.length) return;
    // first layout (or a resize) lands in place; focus changes glide
    if (live.current.length !== targets.length) live.current = targets.map((tg) => ({ ...tg }));
  }, [targets]);

  const motes = useRef<Mote[]>([]);
  useEffect(() => {
    const list: Mote[] = [];
    nodes.forEach((nd, i) => {
      if (nd.parent == null) return;
      for (let k = 0; k < MOTES_PER_EDGE; k++) {
        list.push({ edge: i, t: (k / MOTES_PER_EDGE + Math.random() * 0.2) % 1, speed: 0.04 + Math.random() * 0.05, size: 0.9 + Math.random() * 1 });
      }
    });
    motes.current = list;
  }, [nodes]);

  /** What's lit: the hovered node's path, else the focused discipline (and tool). */
  const litFor = useCallback(
    (hv: number | null) => {
      const lit = new Set<number>();
      const add = (i: number) => {
        let cur: number | null = i;
        while (cur != null) {
          lit.add(cur);
          cur = nodes[cur].parent;
        }
      };
      if (hv != null && nodes[hv]) {
        add(hv);
        if (nodes[hv].kind === "branch") nodes.forEach((nd, i) => nd.parent === hv && lit.add(i));
      } else if (focus != null) {
        const fb = nodes.findIndex((nd) => nd.kind === "branch" && nd.branch === focus);
        lit.add(fb);
        nodes.forEach((nd, i) => nd.parent === fb && lit.add(i));
      }
      return lit;
    },
    [nodes, focus]
  );

  const state = useRef({ hover, tool, focus, compact });
  state.current = { hover, tool, focus, compact };

  /* ------------------------------------------------------------ paint */
  const draw = useCallback(
    (time: number, dt: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const L = live.current;
      if (!canvas || !ctx || !targets.length || L.length !== targets.length) return;
      const { w, h } = size;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // glide every node toward its target — exponential, so it eases out
      const k = dt <= 0 ? 1 : 1 - Math.exp(-dt / GLIDE_MS);
      L.forEach((c, i) => {
        const tg = targets[i];
        c.x += (tg.x - c.x) * k;
        c.y += (tg.y - c.y) * k;
        c.s += (tg.s - c.s) * k;
        c.a += (tg.a - c.a) * k;
      });

      const { hover: hv, tool: tl } = state.current;
      const lit = litFor(hv);
      const dim = lit.size > 0;
      const depth = (nd: Node) => (nd.kind === "hub" ? 0.4 : nd.kind === "branch" ? 0.7 : 1);
      const tier = (nd: Node) => (nd.kind === "hub" ? 0 : nd.kind === "branch" ? 1 : 2);
      const wave = ((time % PULSE_PERIOD) / PULSE_PERIOD) * 3.1;
      const charge = (nd: Node) => {
        const d = wave - tier(nd);
        return Math.exp(-(d * d) / 0.14);
      };
      // a slow breath, never a lurch
      const px = (i: number) => L[i].x + Math.sin(time * 0.0003 + nodes[i].seed) * 3 * depth(nodes[i]);
      const py = (i: number) => L[i].y + Math.cos(time * 0.00036 + nodes[i].seed * 1.3) * 3 * depth(nodes[i]);

      /* links */
      nodes.forEach((nd, i) => {
        if (nd.parent == null) return;
        const p = nd.parent;
        const alpha = Math.min(L[i].a, L[p].a);
        if (alpha < 0.02) return;
        const on = lit.has(i) && lit.has(p);
        ctx.beginPath();
        ctx.moveTo(px(p), py(p));
        ctx.lineTo(px(i), py(i));
        const q = Math.max(charge(nd), charge(nodes[p]));
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = on ? nd.color : "rgba(242,236,225," + ((0.08 + q * 0.14) * (dim ? 0.55 : 1)).toFixed(3) + ")";
        ctx.lineWidth = on ? 1.4 : 0.8 + q * 0.4;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      /* motes */
      ctx.globalCompositeOperation = "lighter";
      for (const mo of motes.current) {
        const nd = nodes[mo.edge];
        const p = nd.parent!;
        const alpha = Math.min(L[mo.edge].a, L[p].a);
        if (alpha < 0.05) continue;
        const on = lit.has(mo.edge) && lit.has(p);
        mo.t += (mo.speed * (on ? 2.6 : 1) * Math.max(dt, 0)) / 1000;
        if (mo.t > 1) mo.t -= 1;
        const x = px(p) + (px(mo.edge) - px(p)) * mo.t;
        const y = py(p) + (py(mo.edge) - py(p)) * mo.t;
        const fade = Math.sin(mo.t * Math.PI) * (on || !dim ? 1 : 0.45) * alpha;
        const r = mo.size * (on ? 1.9 : 1.15);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = on ? "#ffffff" : nd.color;
        ctx.globalAlpha = (on ? 0.9 : 0.4) * fade;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = nd.color;
        ctx.globalAlpha = (on ? 0.2 : 0.08) * fade;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      /* nodes */
      nodes.forEach((nd, i) => {
        const c = L[i];
        if (c.a < 0.02) return;
        const on = lit.has(i) || (nd.kind === "leaf" && nd.label === tl && nd.branch === state.current.focus);
        const x = px(i);
        const y = py(i);
        const q = charge(nd);
        const r = nd.r * c.s;

        if (nd.kind === "hub" || (nd.kind === "branch" && nd.branch === state.current.focus)) {
          for (let k2 = 0; k2 < 2; k2++) {
            const pulse = (time * 0.00022 + k2 * 0.5) % 1;
            ctx.beginPath();
            ctx.arc(x, y, r + 6 + pulse * (w < COMPACT_W ? 26 : 42), 0, Math.PI * 2);
            ctx.strokeStyle = nd.kind === "hub" ? "rgba(242,236,225,1)" : nd.color;
            ctx.globalAlpha = 0.18 * (1 - pulse) * c.a;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        // resting tools stay crisp points; only lit ones glow
        const halo = Math.max(nd.kind === "leaf" ? 0 : q * 0.7, on ? 0.85 : 0);
        if (halo > 0.02) {
          ctx.beginPath();
          ctx.arc(x, y, r * (2.4 + halo * 2), 0, Math.PI * 2);
          ctx.fillStyle = nd.color;
          ctx.globalAlpha = halo * 0.15 * c.a;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x, y, r * (on ? 1.3 : 1), 0, Math.PI * 2);
        ctx.fillStyle = on || nd.kind !== "leaf" ? nd.color : "rgba(242,236,225,0.6)";
        ctx.globalAlpha = c.a * (on ? 1 : 0.85);
        ctx.fill();
        ctx.globalAlpha = 1;

        // the labels are DOM buttons riding the same eased positions
        const el = labelRefs.current[i];
        if (el) {
          const off = nd.kind === "leaf" ? r + 7 : r + 8;
          el.style.transform = "translate3d(" + x.toFixed(1) + "px," + (y + off).toFixed(1) + "px,0) translateX(-50%)";
        }
      });
    },
    [nodes, size, targets, litFor]
  );

  // land the labels before first paint, and on every layout change
  useLayoutEffect(() => {
    if (targets.length) draw(performance.now(), 0.0001);
  }, [targets, draw]);

  useEffect(() => {
    if (!targets.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      live.current = targets.map((tg) => ({ ...tg }));
      draw(0, 0);
      return;
    }
    let raf = 0;
    let visible = false;
    let last = 0;
    const loop = (tm: number) => {
      raf = visible ? requestAnimationFrame(loop) : 0;
      if (document.hidden || !visible) return;
      const dt = last ? Math.min(50, tm - last) : 16;
      last = tm;
      draw(tm, dt);
    };
    // only animate on screen — it shares frames with the swarm
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      last = 0;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    if (boxRef.current) io.observe(boxRef.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [draw, targets]);

  // reduced motion: repaint on every state change
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && targets.length) draw(0, 0);
  }, [hover, tool, draw, targets.length]);

  /* ----------------------------------------------------------- actions */
  const choose = useCallback((bi: number | null) => {
    setFocus((f) => (f === bi ? null : bi));
    setTool(null);
    setHover(null);
  }, []);
  const pickTool = useCallback((leaf: string) => setTool((tl) => (tl === leaf ? null : leaf)), []);

  // clicking the canvas itself — not a label — goes back to the overview
  const onBoxClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest("button")) return;
    if (focus != null) choose(null);
  };

  const fb = focus != null ? BRANCHES[focus] : null;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:[@media(min-height:760px)]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch lg:gap-10">
      <div
        ref={boxRef}
        onClick={onBoxClick}
        onPointerLeave={() => setHover(null)}
        className="relative w-full select-none overflow-hidden rounded-3xl"
        style={{ height: compact ? "clamp(320px, 50svh, 400px)" : "clamp(400px, min(76vh, calc(100vh - 250px)), 760px)" }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ width: size.w, height: size.h }} aria-hidden />

        {nodes.map((nd, i) => {
          if (nd.kind === "hub") {
            return (
              <button
                key={nd.id}
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                type="button"
                data-cursor-plain
                onClick={() => choose(null)}
                tabIndex={focus == null ? -1 : 0}
                className="absolute left-0 top-0 whitespace-nowrap rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.34em] text-bone outline-none ltr focus-visible:ring-1 focus-visible:ring-bone/50"
                style={{
                  textShadow: "0 1px 10px rgba(10,9,8,0.9)",
                  cursor: focus == null ? "default" : "pointer",
                  opacity: compact && focus != null ? 0 : 1,
                  transition: "opacity 400ms",
                }}
              >
                {nd.label}
              </button>
            );
          }
          const isFocusBranch = nd.kind === "branch" && nd.branch === focus;
          if (nd.kind === "branch") {
            const b = BRANCHES[nd.branch];
            const lit = hover === i || isFocusBranch;
            const quiet = focus != null && !isFocusBranch;
            return (
              <button
                key={nd.id}
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                type="button"
                data-cursor-plain
                onClick={() => choose(nd.branch)}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && setHover(i)}
                onBlur={() => setHover(null)}
                aria-pressed={isFocusBranch}
                className="absolute left-0 top-0 whitespace-nowrap rounded-md px-2 py-1 font-mono font-bold outline-none transition-[color,opacity,font-size] duration-500 ltr focus-visible:ring-1 focus-visible:ring-bone/50"
                style={{
                  opacity: compact && quiet ? 0 : 1,
                  pointerEvents: compact && quiet ? "none" : "auto",
                  fontSize: isFocusBranch ? (compact ? 12 : 14) : compact ? 10 : 10.5,
                  letterSpacing: compact ? "0.16em" : "0.26em",
                  color: lit ? b.color : quiet ? "rgba(242,236,225,0.42)" : "rgba(242,236,225,0.85)",
                  textShadow: "0 1px 12px rgba(10,9,8,0.95)",
                }}
              >
                {compact ? b.short : b.label}
              </button>
            );
          }
          // tool labels exist only around the focused discipline
          const shown = nd.branch === focus;
          const picked = shown && tool === nd.label;
          const count = (EVIDENCE[nd.label] ?? []).filter((id) => id !== "site").length;
          return (
            <button
              key={nd.id}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              type="button"
              data-cursor-plain
              tabIndex={shown ? 0 : -1}
              aria-hidden={!shown}
              aria-pressed={picked}
              onClick={() => pickTool(nd.label)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
              onPointerLeave={() => setHover(null)}
              className="absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono outline-none backdrop-blur-sm transition-[opacity,color,background-color,border-color] duration-500 ltr focus-visible:ring-1 focus-visible:ring-bone/50"
              style={{
                opacity: shown ? 1 : 0,
                pointerEvents: shown ? "auto" : "none",
                transitionDelay: shown ? "220ms" : "0ms",
                fontSize: compact ? 10.5 : 12,
                color: picked ? "#0a0908" : nd.color,
                background: picked ? nd.color : "rgba(10,9,8,0.72)",
                borderColor: picked ? nd.color : "color-mix(in oklab, " + nd.color + " 45%, transparent)",
              }}
            >
              {nd.label}
              {count > 0 && <span className="opacity-60">{digits(count, lang)}</span>}
            </button>
          );
        })}
      </div>

      <ReadOut
        branch={fb}
        tool={tool}
        lang={lang}
        strings={g}
        compact={compact}
        onBranch={(bi) => choose(bi)}
        onTool={pickTool}
        onClear={() => choose(null)}
        focus={focus}
      />
    </div>
  );
}

/* ------------------------------------------------------------ read-out */

type GraphStrings = {
  disciplines: string;
  tools: string;
  projects: string;
  hintPointer: string;
  hintTouch: string;
  toolsLabel: string;
  seenIn: string;
  toolkit: string;
  thisSite: string;
  clear: string;
};

/**
 * The legend and the answer. The answer panel never changes height and never
 * swaps its list out from under the reader: a discipline deals its projects in
 * once, and a tool only brightens the ones that use it.
 */
function ReadOut({
  branch: b,
  tool,
  lang,
  strings: g,
  compact,
  onBranch,
  onTool,
  onClear,
  focus,
}: {
  branch: Branch | null;
  tool: string | null;
  lang: "en" | "fa";
  strings: GraphStrings;
  compact: boolean;
  onBranch: (bi: number) => void;
  onTool: (leaf: string) => void;
  onClear: () => void;
  focus: number | null;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const { projects, site } = useMemo(() => (b ? projectsOf(b) : { projects: [], site: false }), [b]);
  const toolCount = BRANCHES.reduce((s, br) => s + br.leaves.length, 0);
  const projectCount = new Set(Object.values(EVIDENCE).flat().filter((id) => id !== "site")).size;
  const labelCls = "font-mono text-dim " + (lang === "fa" ? "text-[11px]" : "text-[9.5px] tracking-[0.28em]");

  // deal the panel in when the discipline changes — once, gently
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-deal]", { opacity: 0, y: 8, duration: 0.5, ease: "power3.out", stagger: 0.035, delay: 0.12 });
    }, el);
    return () => ctx.revert();
  }, [focus]);

  return (
    <div className="mt-4 flex min-h-0 flex-col gap-3 border-t border-bone/10 pt-5 lg:mt-0 lg:border-t-0 lg:pt-0">
      {/* the legend — six chips, one per discipline; also the touch/keyboard control */}
      <div dir="ltr" data-cursor-plain className="grid grid-cols-3 content-start gap-2 lg:grid-cols-2" role="group" aria-label={g.disciplines}>
        {BRANCHES.map((br, bi) => {
          const on = focus === bi;
          return (
            <button
              key={br.key}
              type="button"
              onClick={() => onBranch(bi)}
              aria-pressed={on}
              className="flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[10.5px] tracking-[0.12em] transition-colors duration-300 lg:min-h-9"
              style={{
                borderColor: on ? br.color : "rgba(242,236,225,0.12)",
                background: on ? "color-mix(in oklab, " + br.color + " 14%, transparent)" : "rgba(10,9,8,0.5)",
                color: on ? br.color : "rgba(242,236,225,0.78)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: br.color }} />
              {compact ? br.short : br.label}
            </button>
          );
        })}
      </div>

      {/* the answer — fixed height on desktop, its own scroll if it ever overflows */}
      <div
        ref={listRef}
        aria-live="polite"
        className="flex h-[19rem] min-h-0 flex-col rounded-2xl border border-bone/10 bg-ink/70 p-4 backdrop-blur-md sm:p-5 lg:h-auto lg:flex-1"
      >
        {!b ? (
          <div className="flex h-full flex-col justify-between gap-4">
            <p data-deal className="font-mono text-[11px] tracking-[0.12em] text-bone/80 ltr">
              <span className="text-bone">{digits(BRANCHES.length, lang)}</span> {g.disciplines} ·{" "}
              <span className="text-bone">{digits(toolCount, lang)}</span> {g.tools} ·{" "}
              <span className="text-bone">{digits(projectCount, lang)}</span> {g.projects}
            </p>
            <div data-deal className="space-y-2.5">
              {BRANCHES.map((br, bi) => {
                const n = projectsOf(br).projects.length;
                return (
                  <button
                    key={br.key}
                    type="button"
                    data-cursor-plain
                    onClick={() => onBranch(bi)}
                    dir="ltr"
                    className="group flex w-full items-center gap-3 text-start"
                  >
                    <span className="w-24 shrink-0 font-mono text-[10px] tracking-[0.16em] text-bone/70 transition-colors group-hover:text-bone">
                      {br.short}
                    </span>
                    <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-bone/8">
                      <span
                        className="absolute inset-y-0 start-0 rounded-full transition-[width] duration-700"
                        style={{ width: Math.max(8, (n / 9) * 100) + "%", background: br.color, opacity: 0.8 }}
                      />
                    </span>
                    <span className="w-5 shrink-0 text-end font-mono text-[11px] tabular-nums text-bone/80">{digits(n, lang)}</span>
                  </button>
                );
              })}
            </div>
            <p data-deal className="text-[12.5px] leading-6 text-dim">
              {compact ? g.hintTouch : g.hintPointer}
            </p>
          </div>
        ) : (
          <>
            <div data-deal className="flex items-start justify-between gap-3">
              <div dir="ltr" className="flex min-w-0 flex-wrap items-center gap-x-2 font-mono text-[11px] tracking-[0.2em]">
                <span className="h-2 w-2 rounded-full" style={{ background: b.color, boxShadow: "0 0 10px " + b.color }} />
                <span style={{ color: b.color }} className="font-bold">
                  {b.label}
                </span>
                {tool && (
                  <>
                    <span className="text-dim">›</span>
                    <span className="tracking-[0.04em] text-bone">{tool}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={onClear}
                aria-label={g.clear}
                className="-m-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-dim transition-colors hover:text-bone"
              >
                <X size={14} />
              </button>
            </div>

            <div data-deal className="mt-3">
              <div className={labelCls}>{g.toolsLabel}</div>
              <div className="mt-2 flex flex-wrap gap-1.5" data-cursor-plain>
                {b.leaves.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => onTool(l)}
                    aria-pressed={tool === l}
                    className="min-h-8 rounded-full border border-bone/12 px-2.5 py-1 font-mono text-[11px] text-bone/85 transition-colors duration-300 hover:text-bone"
                    style={tool === l ? { borderColor: b.color, color: "#0a0908", background: b.color } : undefined}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div data-deal className="mt-4 flex min-h-0 flex-1 flex-col">
              <div className={labelCls}>{g.seenIn}</div>
              {projects.length || site ? (
                <div data-lenis-prevent data-cursor-plain className="mpk-scroll mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pe-1">
                  {projects.map((p) => {
                    const on = !tool || usesTool(tool, p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        data-deal
                        onClick={() => openProject(p)}
                        className="group/p flex w-full items-center gap-3 rounded-lg px-1.5 py-1 text-start transition-[opacity,background-color] duration-300 hover:bg-bone/5"
                        style={{ opacity: on ? 1 : 0.28 }}
                      >
                        <span className="h-7 w-11 shrink-0 overflow-hidden rounded-md bg-black ring-1 ring-bone/10">
                          {p.image && <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
                        </span>
                        <span className="min-w-0 truncate text-[12.5px] text-bone/90 ltr">{p.title}</span>
                        <ArrowUpRight size={12} className="ms-auto shrink-0 opacity-0 transition-opacity group-hover/p:opacity-80" style={{ color: p.accent }} />
                      </button>
                    );
                  })}
                  {site && (
                    <div
                      data-deal
                      className="flex items-center gap-3 px-1.5 py-1 transition-opacity duration-300"
                      style={{ opacity: !tool || usesTool(tool, "site") ? 1 : 0.28 }}
                    >
                      <span className="grid h-7 w-11 shrink-0 place-items-center rounded-md border border-dashed border-bone/25 font-mono text-[9px] text-dim">
                        MPK
                      </span>
                      <span className="text-[12.5px] text-bone/75">{g.thisSite}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-[13.5px] leading-6 text-bone/65">{g.toolkit}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
