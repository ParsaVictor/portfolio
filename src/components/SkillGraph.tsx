import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Branch = { key: string; label: string; color: string; leaves: string[] };

/** Grounded in what the repos actually use — no aspirational entries. */
const BRANCHES: Branch[] = [
  {
    key: "vision",
    label: "VISION",
    color: "#35e0ff",
    leaves: ["YOLO", "OpenCV", "ByteTrack", "MediaPipe"],
  },
  {
    key: "learning",
    label: "LEARNING",
    color: "#a894ff",
    leaves: ["PyTorch", "scikit-learn", "Random Forest"],
  },
  {
    key: "data",
    label: "DATA",
    color: "#ffb454",
    leaves: ["NumPy", "Open3D", "B-Spline"],
  },
  {
    key: "web",
    label: "WEB",
    color: "#ff6a5e",
    leaves: ["React", "TypeScript", "Three.js", "Next.js"],
  },
  {
    key: "infra",
    label: "INFRA",
    color: "#8fd67a",
    leaves: ["Docker", "Git", "CI"],
  },
];

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  color: string;
  kind: "hub" | "branch" | "leaf";
  parent: number | null;
  seed: number;
};

/**
 * The stack as a graph rather than a list of pills.
 *
 * Layout is computed from the measured box (a radial tree: hub → discipline →
 * tool), links and nodes are painted to canvas, and the labels are real DOM
 * text positioned over it — so they stay selectable, searchable and legible at
 * any pixel ratio instead of being baked into the bitmap.
 *
 * Bringing the cursor near a node traces its path back to the centre.
 */
export default function SkillGraph({ hub = "MPK" }: { hub?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const pointer = useRef({ x: -9999, y: -9999 });
  const activeRef = useRef<number | null>(null);
  activeRef.current = active;

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const read = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setSize({ w, h });
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

    const cx = w / 2;
    const cy = h / 2;
    const m = Math.min(w, h);
    const rBranch = m * 0.29;
    const rLeaf = m * 0.2;

    const next: Node[] = [
      { id: "hub", label: hub, x: cx, y: cy, r: 9, color: "#f2ece1", kind: "hub", parent: null, seed: 0 },
    ];

    BRANCHES.forEach((b, bi) => {
      // start at the top and go round; the tree reads clockwise from 12 o'clock
      const a = -Math.PI / 2 + (bi / BRANCHES.length) * Math.PI * 2;
      const bx = cx + Math.cos(a) * rBranch * (w > h ? 1.35 : 1);
      const by = cy + Math.sin(a) * rBranch;
      const bIndex = next.length;
      next.push({
        id: b.key,
        label: b.label,
        x: bx,
        y: by,
        r: 5.5,
        color: b.color,
        kind: "branch",
        parent: 0,
        seed: bi * 1.7,
      });

      const spread = Math.PI * 0.78;
      b.leaves.forEach((leaf, li) => {
        const t = b.leaves.length === 1 ? 0.5 : li / (b.leaves.length - 1);
        const la = a + (t - 0.5) * spread;
        next.push({
          id: b.key + "-" + leaf,
          label: leaf,
          x: bx + Math.cos(la) * rLeaf * (w > h ? 1.3 : 1),
          y: by + Math.sin(la) * rLeaf,
          r: 3,
          color: b.color,
          kind: "leaf",
          parent: bIndex,
          seed: bi * 3.1 + li * 0.9,
        });
      });
    });

    setNodes(next);
  }, [size, hub]);

  /* ------------------------------------------------------------ paint */
  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !nodes.length) return;

      const { w, h } = size;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // a node's live position: its layout spot plus a slow, seeded drift
      const px = (n: Node) => n.x + Math.sin(time * 0.00035 + n.seed) * (n.kind === "hub" ? 0 : 4);
      const py = (n: Node) => n.y + Math.cos(time * 0.0004 + n.seed * 1.3) * (n.kind === "hub" ? 0 : 4);

      // which nodes are on the traced path back to the hub
      const lit = new Set<number>();
      const a = activeRef.current;
      if (a != null) {
        let cur: number | null = a;
        while (cur != null) {
          lit.add(cur);
          cur = nodes[cur].parent;
        }
      }

      // links first, so nodes sit on top of them
      nodes.forEach((n, i) => {
        if (n.parent == null) return;
        const p = nodes[n.parent];
        const on = lit.has(i) && lit.has(n.parent);
        ctx.beginPath();
        ctx.moveTo(px(p), py(p));
        ctx.lineTo(px(n), py(n));
        ctx.strokeStyle = on ? n.color : "rgba(242,236,225,0.13)";
        ctx.lineWidth = on ? 1.6 : 1;
        ctx.stroke();

        // a spark running the traced link
        if (on) {
          const t = ((time * 0.0006 + i * 0.2) % 1);
          const sx = px(p) + (px(n) - px(p)) * t;
          const sy = py(p) + (py(n) - py(p)) * t;
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.fill();
        }
      });

      nodes.forEach((n, i) => {
        const on = lit.has(i);
        const x = px(n);
        const y = py(n);
        if (n.kind === "hub") {
          ctx.beginPath();
          ctx.arc(x, y, n.r + 8 + Math.sin(time * 0.0012) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(242,236,225,0.22)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(x, y, n.r * (on ? 1.45 : 1), 0, Math.PI * 2);
        ctx.fillStyle = on ? n.color : n.kind === "leaf" ? "rgba(242,236,225,0.4)" : n.color;
        ctx.globalAlpha = on ? 1 : n.kind === "leaf" ? 0.75 : 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (on) {
          ctx.beginPath();
          ctx.arc(x, y, n.r * 2.6, 0, Math.PI * 2);
          ctx.strokeStyle = n.color + "66";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    },
    [nodes, size]
  );

  useEffect(() => {
    if (!nodes.length) return;
    draw(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      draw(t);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw, nodes.length]);

  /* -------------------------------------------------------- pointer */
  useEffect(() => {
    const el = boxRef.current;
    if (!el || !nodes.length) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      let best: number | null = null;
      let bestD = 92; // only trace when the cursor is genuinely near something
      nodes.forEach((n, i) => {
        if (n.kind === "hub") return;
        const d = Math.hypot(n.x - pointer.current.x, n.y - pointer.current.y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onLeave = () => setActive(null);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [nodes]);

  const activeNode = active != null ? nodes[active] : null;

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden rounded-3xl border border-bone/[0.07] bg-bone/[0.018]"
      style={{ height: "clamp(420px, 58vh, 620px)" }}
    >
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ width: size.w, height: size.h }} aria-hidden />

      {/* real text, positioned over the canvas */}
      {nodes.map((n, i) => {
        const on = active != null && (i === active || nodes[active]?.parent === i);
        if (n.kind === "hub") {
          return (
            <span
              key={n.id}
              className="pointer-events-none absolute -translate-x-1/2 font-mono text-[10px] font-bold tracking-[0.3em] text-bone ltr"
              style={{ left: n.x, top: n.y + 20 }}
            >
              {n.label}
            </span>
          );
        }
        return (
          <span
            key={n.id}
            className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap font-mono transition-colors duration-200 ltr"
            style={{
              left: n.x,
              top: n.y + (n.kind === "branch" ? 12 : 9),
              fontSize: n.kind === "branch" ? 10 : 10.5,
              letterSpacing: n.kind === "branch" ? "0.26em" : "0.02em",
              fontWeight: n.kind === "branch" ? 700 : 400,
              color: on ? n.color : n.kind === "branch" ? "rgba(242,236,225,0.8)" : "rgba(242,236,225,0.5)",
            }}
          >
            {n.label}
          </span>
        );
      })}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4 font-mono text-[9px] uppercase tracking-[0.26em] text-dim ltr">
        <span>{activeNode ? "traced · " + activeNode.label : "move the cursor near a node to trace"}</span>
        <span>{nodes.length} nodes</span>
      </div>
    </div>
  );
}
