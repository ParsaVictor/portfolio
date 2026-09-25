import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { useLang } from "../i18n/LangProvider";
import { groups, type Project } from "../data/projects";
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
  YOLO: ["ppe-sentinel", "pelakx", "fireguard", "pcb-detect"],
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
  React: ["melkai", "site"],
  TypeScript: ["b2b", "site"],
  "Three.js": ["site"],
  "Next.js": ["melkai"],
  MLOps: ["ai-template"],
};

const ALL_PROJECTS: Project[] = [...groups.cv, ...groups.data, ...groups.web];
const byId = (id: string) => ALL_PROJECTS.find((p) => p.id === id);

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  color: string;
  kind: "hub" | "branch" | "leaf";
  parent: number | null;
  branch: number; // index into BRANCHES, -1 for the hub
  seed: number;
};

/** A mote riding one edge of the graph. */
type Mote = { edge: number; t: number; speed: number; size: number };

const MOTES_PER_EDGE = 4;
/** Seconds for one pulse to travel hub → branch → leaf. */
const PULSE_PERIOD = 5200;
/** Below this box width the graph drops its tool labels and the panel leads. */
const COMPACT_W = 640;

/**
 * The stack as a living graph.
 *
 * Layout is a radial tree (hub → discipline → tool) computed from the measured
 * box. Links, nodes and a field of motes that ride the links are painted to
 * canvas; the labels are real buttons over the top, so they stay sharp,
 * selectable, focusable and tappable.
 *
 * Hover (or keyboard focus) traces a node's path to the centre; a click or tap
 * pins it, and the read-out underneath answers the question the graph raises —
 * where does this actually show up? — with the projects behind it. On a phone
 * the graph keeps only its disciplines as words and the read-out does the rest.
 */
export default function SkillGraph({ hub = "MPK" }: { hub?: string }) {
  const { t, lang } = useLang();
  const g = t.about.graph;
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const compact = size.w > 0 && size.w < COMPACT_W;

  const active = hover ?? pinned;
  const activeRef = useRef<number | null>(null);
  activeRef.current = active;
  const lean = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const motes = useRef<Mote[]>([]);
  const lastT = useRef(0);

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

  /* ---------------------------------------------------------- layout */
  useEffect(() => {
    const { w, h } = size;
    if (!w || !h) return;
    const small = w < COMPACT_W;

    // Room reserved for the labels, which sit outside the node they belong to.
    // The box is usually far wider than it is tall, so the ring is an ellipse
    // rather than a circle — that is what keeps the top and bottom rows inside.
    const padX = small ? Math.min(52, w * 0.15) : Math.min(96, w * 0.14);
    const padY = small ? 34 : Math.min(64, h * 0.14);
    const usableW = Math.max(60, w / 2 - padX);
    const usableH = Math.max(50, h / 2 - padY);

    const cx = w / 2;
    const cy = h / 2;
    const rbx = usableW * (small ? 0.6 : 0.56);
    const rby = usableH * (small ? 0.5 : 0.54);
    const rlx = usableW * (small ? 0.42 : 0.52);
    const rly = usableH * (small ? 0.4 : 0.5);

    const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
    const inX = (v: number) => clamp(v, padX, w - padX);
    const inY = (v: number) => clamp(v, padY, h - padY);

    const next: Node[] = [
      { id: "hub", label: hub, x: cx, y: cy, r: small ? 7 : 10, color: "#f2ece1", kind: "hub", parent: null, branch: -1, seed: 0 },
    ];

    const sector = (Math.PI * 2) / BRANCHES.length;

    BRANCHES.forEach((b, bi) => {
      const a = -Math.PI / 2 + bi * sector;
      const bx = inX(cx + Math.cos(a) * rbx);
      const by = inY(cy + Math.sin(a) * rby);
      const bIndex = next.length;
      next.push({
        id: b.key, label: small ? b.short : b.label, x: bx, y: by, r: small ? 4.5 : 6,
        color: b.color, kind: "branch", parent: 0, branch: bi, seed: bi * 1.7,
      });

      // leaves fan across most of their own sector — wide enough to breathe,
      // still bounded so neighbouring disciplines never interleave
      // a branch pointing up or down has the least vertical room for its
      // tools, so its fan opens wider sideways instead
      const spread = sector * ((small ? 1.05 : 0.92) + (small ? 0.35 : 0.55) * Math.abs(Math.sin(a)));
      b.leaves.forEach((leaf, li) => {
        const tt = b.leaves.length === 1 ? 0.5 : li / (b.leaves.length - 1);
        const la = a + (tt - 0.5) * spread;
        next.push({
          id: b.key + "-" + leaf, label: leaf,
          x: inX(bx + Math.cos(la) * rlx),
          y: inY(by + Math.sin(la) * rly),
          r: small ? 2.6 : 3.2, color: b.color, kind: "leaf", parent: bIndex, branch: bi,
          seed: bi * 3.1 + li * 0.9,
        });
      });
    });

    // Relax the leaf labels apart — from each other, and away from the
    // discipline labels, which hold still. Boxes are wide and short, so overlap
    // is judged per axis and resolved vertically, where there is slack. Phones
    // show no tool labels, so there is nothing to untangle there.
    if (!small) {
      const halfW = (n: Node) =>
        n.kind === "branch" ? n.label.length * 4.4 + 10 : n.label.length * 3.2 + 14;
      const labelY = (n: Node) => n.y + (n.kind === "branch" ? 13 : 10);
      const movable = next.map((n, i) => (n.kind === "leaf" ? i : -1)).filter((i) => i >= 0);
      const fixed = next.map((n, i) => (n.kind === "branch" ? i : -1)).filter((i) => i >= 0);
      for (let pass = 0; pass < 60; pass++) {
        let moved = false;
        for (let a1 = 0; a1 < movable.length; a1++) {
          const p = next[movable[a1]];
          for (let b1 = a1 + 1; b1 < movable.length; b1++) {
            const q = next[movable[b1]];
            const needX = halfW(p) + halfW(q) + 6;
            const dx = p.x - q.x;
            const dy = labelY(p) - labelY(q);
            if (Math.abs(dx) >= needX || Math.abs(dy) >= 30) continue;
            const push = (30 - Math.abs(dy)) / 2 + 0.5;
            const dir = dy === 0 ? (p.y < cy ? -1 : 1) : Math.sign(dy);
            p.y = inY(p.y + dir * push);
            q.y = inY(q.y - dir * push);
            moved = true;
          }
          for (const fi of fixed) {
            const q = next[fi];
            const needX = halfW(p) + halfW(q) + 6;
            const dx = p.x - q.x;
            const dy = labelY(p) - labelY(q);
            if (Math.abs(dx) >= needX || Math.abs(dy) >= 30) continue;
            const dir = dy === 0 ? (p.y < cy ? -1 : 1) : Math.sign(dy);
            p.y = inY(p.y + dir * (30 - Math.abs(dy) + 1));
            moved = true;
          }
        }
        if (!moved) break;
      }
    }

    setNodes(next);

    const edges = next.map((n, i) => (n.parent == null ? -1 : i)).filter((i) => i >= 0);
    const list: Mote[] = [];
    edges.forEach((e) => {
      for (let k = 0; k < MOTES_PER_EDGE; k++) {
        list.push({
          edge: e,
          t: (k / MOTES_PER_EDGE + Math.random() * 0.2) % 1,
          speed: 0.045 + Math.random() * 0.05,
          size: 0.9 + Math.random() * 1.1,
        });
      }
    });
    motes.current = list;
  }, [size, hub]);

  // Opens on the first discipline already pinned: the read-out has something
  // to say from the start, and the lit branch shows the map is alive.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !nodes.length || !size.w) return;
    seeded.current = true;
    setPinned(1);
  }, [nodes, size.w]);

  /** A node's path to the centre, plus — for a discipline — all its tools. */
  const litFor = useCallback(
    (a: number | null) => {
      const lit = new Set<number>();
      if (a == null || !nodes[a]) return lit;
      let cur: number | null = a;
      while (cur != null) {
        lit.add(cur);
        cur = nodes[cur].parent;
      }
      if (nodes[a].kind === "branch") nodes.forEach((n, i) => n.parent === a && lit.add(i));
      return lit;
    },
    [nodes]
  );

  /* ------------------------------------------------------------ paint */
  const draw = useCallback(
    (time: number, dt: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !nodes.length) return;

      const { w, h } = size;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // ease the lean so the graph glides rather than snaps
      lean.current.x += (lean.current.tx - lean.current.x) * Math.min(1, dt / 260);
      lean.current.y += (lean.current.ty - lean.current.y) * Math.min(1, dt / 260);

      // live position: layout spot + seeded float + a lean toward the pointer
      const depth = (n: Node) => (n.kind === "hub" ? 0.35 : n.kind === "branch" ? 0.7 : 1);
      const tier = (n: Node) => (n.kind === "hub" ? 0 : n.kind === "branch" ? 1 : 2);

      // a charge leaves the hub and travels outward on a loop; each ring lights
      // as it passes, which is what makes the graph read as powered rather than drawn
      const wave = ((time % PULSE_PERIOD) / PULSE_PERIOD) * 3.1;
      const charge = (n: Node) => {
        const d = wave - tier(n);
        return Math.exp(-(d * d) / 0.14);
      };
      const px = (n: Node) =>
        n.x + Math.sin(time * 0.00034 + n.seed) * 5 * depth(n) + lean.current.x * 16 * depth(n);
      const py = (n: Node) =>
        n.y + Math.cos(time * 0.00041 + n.seed * 1.3) * 5 * depth(n) + lean.current.y * 12 * depth(n);

      const lit = litFor(activeRef.current);
      const dimOthers = lit.size > 0;

      /* links */
      nodes.forEach((n, i) => {
        if (n.parent == null) return;
        const p = nodes[n.parent];
        const on = lit.has(i) && lit.has(n.parent);
        ctx.beginPath();
        ctx.moveTo(px(p), py(p));
        ctx.lineTo(px(n), py(n));
        const q = Math.max(charge(n), charge(p));
        ctx.strokeStyle = on
          ? n.color
          : "rgba(242,236,225," + ((0.09 + q * 0.16) * (dimOthers ? 0.6 : 1)).toFixed(3) + ")";
        ctx.lineWidth = on ? 1.5 : 0.9 + q * 0.5;
        ctx.stroke();
      });

      /* motes riding the links — the graph's own weather */
      ctx.globalCompositeOperation = "lighter";
      for (const mo of motes.current) {
        const n = nodes[mo.edge];
        if (!n || n.parent == null) continue;
        const p = nodes[n.parent];
        const on = lit.has(mo.edge) && lit.has(n.parent);
        mo.t += (mo.speed * (on ? 3.2 : 1) * dt) / 1000;
        if (mo.t > 1) mo.t -= 1;

        const x = px(p) + (px(n) - px(p)) * mo.t;
        const y = py(p) + (py(n) - py(p)) * mo.t;
        // fade in and out at the ends so they appear to enter and leave the wire
        const fade = Math.sin(mo.t * Math.PI) * (on || !dimOthers ? 1 : 0.5);
        const r = mo.size * (on ? 2.1 : 1.25);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = on ? "#ffffff" : n.color;
        ctx.globalAlpha = (on ? 0.95 : 0.42 + charge(n) * 0.4) * fade;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = (on ? 0.22 : 0.09) * fade;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      /* nodes */
      nodes.forEach((n, i) => {
        const on = lit.has(i);
        const x = px(n);
        const y = py(n);

        const q = charge(n);

        if (n.kind === "hub") {
          for (let k = 0; k < 2; k++) {
            const pulse = (time * 0.00022 + k * 0.5) % 1;
            ctx.beginPath();
            ctx.arc(x, y, n.r + 6 + pulse * (w < COMPACT_W ? 28 : 46), 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(242,236,225," + (0.18 * (1 - pulse)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // the halo the charge leaves behind
        if (q > 0.02 || on) {
          const halo = Math.max(q, on ? 0.85 : 0);
          ctx.beginPath();
          ctx.arc(x, y, n.r * (2.6 + halo * (w < COMPACT_W ? 1.4 : 2.4)), 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.globalAlpha = halo * 0.16;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        ctx.beginPath();
        ctx.arc(x, y, n.r * (on ? 1.45 : 1 + q * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = on ? n.color : n.kind === "leaf" ? "rgba(242,236,225,0.45)" : n.color;
        ctx.globalAlpha = on ? 1 : Math.min(1, (n.kind === "leaf" ? 0.72 : 0.85) + q * 0.3);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    },
    [nodes, size, litFor]
  );

  useEffect(() => {
    if (!nodes.length) return;
    draw(0, 16);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only animate while on screen. Left running, this loop competed with
    // the swarm for frames right at the first chapter handover ("01"),
    // which sits just below it — the one numeral that used to stutter.
    let raf = 0;
    let visible = false;
    const loop = (tm: number) => {
      raf = visible ? requestAnimationFrame(loop) : 0;
      if (document.hidden || !visible) return;
      const dt = lastT.current ? Math.min(50, tm - lastT.current) : 16;
      lastT.current = tm;
      draw(tm, dt);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      lastT.current = 0;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    if (boxRef.current) io.observe(boxRef.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [draw, nodes.length]);

  // reduced motion paints once per change instead of every frame
  useEffect(() => {
    if (nodes.length && window.matchMedia("(prefers-reduced-motion: reduce)").matches) draw(0, 16);
  }, [active, draw, nodes.length]);

  /* -------------------------------------------------------- pointer */
  const nearest = useCallback(
    (x: number, y: number, radius: number) => {
      let best: number | null = null;
      let bestD = radius;
      nodes.forEach((n, i) => {
        if (n.kind === "hub") return;
        if (compact && n.kind === "leaf") return; // unlabelled dots aren't targets
        const d = Math.hypot(n.x - x, n.y - y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    },
    [nodes, compact]
  );

  useEffect(() => {
    const el = boxRef.current;
    if (!el || !nodes.length) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return; // touch has no hover — it taps
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      lean.current.tx = (x / r.width - 0.5) * 2;
      lean.current.ty = (y / r.height - 0.5) * 2;
      setHover(nearest(x, y, 96));
    };
    const onLeave = () => {
      setHover(null);
      lean.current.tx = 0;
      lean.current.ty = 0;
    };
    // a click or tap on the canvas pins whatever is near it; on nothing, unpins
    const onClick = (e: MouseEvent) => {
      // the labels are buttons with their own handler; this native listener
      // runs before React sees the click, so it has to step aside for them
      if ((e.target as Element).closest("button")) return;
      const r = el.getBoundingClientRect();
      const hit = nearest(e.clientX - r.left, e.clientY - r.top, compact ? 44 : 96);
      setPinned((p) => (hit == null || hit === p ? null : hit));
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("click", onClick);
    };
  }, [nodes, nearest, compact]);

  const pin = (i: number) => setPinned((p) => (p === i ? null : i));
  const lit = useMemo(() => litFor(active), [litFor, active]);
  const activeNode = active != null ? nodes[active] : null;
  const toolCount = BRANCHES.reduce((s, b) => s + b.leaves.length, 0);
  const projectCount = new Set(Object.values(EVIDENCE).flat().filter((id) => id !== "site")).size;

  // Desktop: graph and read-out side by side, so the whole act — the map and
  // what it means — reads in a single screen instead of a scroll apart.
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:[@media(min-height:760px)]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
      <div
        ref={boxRef}
        className="relative w-full select-none overflow-hidden rounded-3xl"
        style={{ height: compact ? "clamp(300px, 46svh, 380px)" : "clamp(400px, min(76vh, calc(100vh - 250px)), 760px)" }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ width: size.w, height: size.h }}
          aria-hidden
        />

        {nodes.map((n, i) => {
          if (n.kind === "hub") {
            return (
              <span
                key={n.id}
                className="pointer-events-none absolute -translate-x-1/2 font-mono text-[10px] font-bold tracking-[0.34em] text-bone ltr"
                style={{ left: n.x, top: n.y + 22 }}
              >
                {n.label}
              </span>
            );
          }
          if (compact && n.kind === "leaf") return null;
          const on = lit.has(i);
          const branch = n.kind === "branch";
          return (
            <button
              key={n.id}
              type="button"
              data-cursor-plain
              onClick={() => pin(i)}
              onFocus={(e) => e.currentTarget.matches(":focus-visible") && setHover(i)}
              onBlur={() => setHover(null)}
              aria-pressed={pinned === i}
              className="absolute -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 font-mono outline-none transition-colors duration-200 ltr focus-visible:ring-1 focus-visible:ring-bone/50"
              style={{
                left: n.x,
                top: n.y + (branch ? 12 : 8),
                fontSize: branch ? (compact ? 10.5 : 10) : 10.5,
                letterSpacing: branch ? (compact ? "0.18em" : "0.28em") : "0.02em",
                fontWeight: branch ? 700 : 400,
                color: on
                  ? n.color
                  : active != null
                    ? "rgba(242,236,225,0.34)"
                    : branch
                      ? "rgba(242,236,225,0.82)"
                      : "rgba(242,236,225,0.56)",
                textShadow: "0 1px 10px rgba(10,9,8,0.9)",
              }}
            >
              {n.label}
            </button>
          );
        })}
      </div>

      <ReadOut
        node={activeNode}
        pinned={pinned != null && pinned === active}
        compact={compact}
        lang={lang}
        strings={g}
        summary={{ disciplines: BRANCHES.length, tools: toolCount, projects: projectCount }}
        onBranch={(bi) => pin(nodes.findIndex((n) => n.kind === "branch" && n.branch === bi))}
        onTool={(id) => setPinned(nodes.findIndex((n) => n.id === id))}
        onClear={() => {
          setPinned(null);
          setHover(null);
        }}
        activeBranch={activeNode ? activeNode.branch : -1}
        activeId={activeNode?.id ?? null}
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
 * The legend and the answer. Discipline chips double as the graph's keyboard
 * and touch controls; the panel beside them says what the selection means —
 * its tools, and the projects that actually use them.
 */
function ReadOut({
  node,
  pinned,
  compact,
  lang,
  strings: g,
  summary,
  onBranch,
  onTool,
  onClear,
  activeBranch,
  activeId,
}: {
  node: Node | null;
  pinned: boolean;
  compact: boolean;
  lang: "en" | "fa";
  strings: GraphStrings;
  summary: { disciplines: number; tools: number; projects: number };
  onBranch: (bi: number) => void;
  onTool: (id: string) => void;
  onClear: () => void;
  activeBranch: number;
  activeId: string | null;
}) {
  const b = node && node.branch >= 0 ? BRANCHES[node.branch] : null;
  const leaf = node?.kind === "leaf" ? node.label : null;
  const ids = leaf
    ? EVIDENCE[leaf] ?? []
    : b
      ? [...new Set(b.leaves.flatMap((l) => EVIDENCE[l] ?? []))]
      : [];

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-bone/10 pt-5 lg:mt-0 lg:border-t-0 lg:pt-0">
      {/* the legend — six chips, one per discipline */}
      <div dir="ltr" className="grid grid-cols-3 content-start gap-2 lg:grid-cols-2" role="group" aria-label="disciplines">
        {BRANCHES.map((br, bi) => {
          const on = activeBranch === bi;
          return (
            <button
              key={br.key}
              type="button"
              data-cursor-plain
              onClick={() => onBranch(bi)}
              aria-pressed={on}
              className="flex min-h-10 items-center gap-2 lg:min-h-9 whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[10.5px] tracking-[0.12em] transition-colors duration-200"
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

      {/* the answer */}
      <div aria-live="polite" className="min-h-[6.5rem] rounded-2xl border lg:min-h-[15rem] border-bone/10 bg-ink/70 p-4 backdrop-blur-md sm:p-5">
        {!b ? (
          <>
            <p className="font-mono text-[11px] tracking-[0.12em] text-bone/80 ltr">
              <span className="text-bone">{digits(summary.disciplines, lang)}</span> {g.disciplines} ·{" "}
              <span className="text-bone">{digits(summary.tools, lang)}</span> {g.tools} ·{" "}
              <span className="text-bone">{digits(summary.projects, lang)}</span> {g.projects}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div dir="ltr" className="flex min-w-0 flex-wrap items-center gap-x-2 font-mono text-[11px] tracking-[0.2em]">
                <span style={{ color: b.color }} className="font-bold">
                  {b.label}
                </span>
                {leaf && (
                  <>
                    <span className="text-dim">›</span>
                    <span className="tracking-[0.04em] text-bone">{leaf}</span>
                  </>
                )}
              </div>
              {pinned && (
                <button
                  type="button"
                  onClick={onClear}
                  aria-label={g.clear}
                  className="-m-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-dim transition-colors hover:text-bone"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* the siblings stay listed with the pinned one lit, so moving from
                tool to tool never means going back up to the discipline */}
            <div className="mt-3">
              <div className={"font-mono text-dim " + (lang === "fa" ? "text-[11px]" : "text-[9.5px] tracking-[0.28em]")}>{g.toolsLabel}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {b.leaves.map((l) => (
                  <button
                    key={l}
                    type="button"
                    data-cursor-plain
                    onClick={() => onTool(b.key + "-" + l)}
                    className="min-h-8 rounded-full border border-bone/12 px-2.5 py-1 font-mono text-[11px] text-bone/85 transition-colors hover:text-bone"
                    style={activeId === b.key + "-" + l ? { borderColor: b.color, color: b.color } : undefined}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className={"font-mono text-dim " + (lang === "fa" ? "text-[11px]" : "text-[9.5px] tracking-[0.28em]")}>{g.seenIn}</div>
              {ids.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ids.map((id) => {
                    if (id === "site") {
                      return (
                        <span
                          key={id}
                          className="rounded-full border border-dashed border-bone/20 px-2.5 py-1 text-[12px] text-bone/75"
                        >
                          {g.thisSite}
                        </span>
                      );
                    }
                    const p = byId(id);
                    if (!p) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        data-cursor-plain
                        onClick={() => openProject(p)}
                        className="group/p flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] text-bone/90 transition-colors hover:text-bone ltr"
                        style={{ borderColor: "color-mix(in oklab, " + p.accent + " 45%, transparent)" }}
                      >
                        {p.title}
                        <ArrowUpRight size={12} className="opacity-60 transition-opacity group-hover/p:opacity-100" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-[13.5px] leading-6 text-bone/65">{g.toolkit}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* how to use it — kept out of the panel so it survives a selection */}
      <p className="text-[12.5px] leading-6 text-dim lg:[@media(max-height:780px)]:hidden">
        {compact ? g.hintTouch : g.hintPointer}
      </p>
    </div>
  );
}
