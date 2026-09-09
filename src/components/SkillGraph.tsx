import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Branch = { key: string; label: string; color: string; leaves: string[] };

/** Grounded in what the repos actually use — no aspirational entries. */
const BRANCHES: Branch[] = [
  { key: "vision", label: "VISION", color: "#35e0ff", leaves: ["YOLO", "OpenCV", "ByteTrack", "MediaPipe"] },
  { key: "deep", label: "DEEP LEARNING", color: "#7cc4ff", leaves: ["PyTorch", "CNN", "Transfer Learning"] },
  { key: "ml", label: "MACHINE LEARNING", color: "#a894ff", leaves: ["scikit-learn", "Random Forest", "Explainable AI"] },
  { key: "data", label: "DATA", color: "#ffb454", leaves: ["NumPy", "Open3D", "B-Spline"] },
  { key: "web", label: "WEB", color: "#ff6a5e", leaves: ["React", "TypeScript", "Three.js", "Next.js"] },
  { key: "infra", label: "INFRA", color: "#8fd67a", leaves: ["Docker", "Git", "MLOps"] },
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

/** A mote riding one edge of the graph. */
type Mote = { edge: number; t: number; speed: number; size: number };

const MOTES_PER_EDGE = 4;
/** Seconds for one pulse to travel hub → branch → leaf. */
const PULSE_PERIOD = 5200;

/**
 * The stack as a living graph.
 *
 * Layout is a radial tree (hub → discipline → tool) computed from the measured
 * box. Links, nodes and a field of motes that ride the links are painted to
 * canvas; the labels stay real DOM text over the top, so they remain selectable
 * and sharp at any pixel ratio instead of being baked into the bitmap.
 *
 * The whole graph floats — every node drifts on its own seeded phase and the
 * cloud leans toward the pointer. Bringing the cursor near a node traces its
 * path to the centre and the motes on that path surge.
 */
export default function SkillGraph({ hub = "MPK" }: { hub?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [active, setActive] = useState<number | null>(null);

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
    const wide = w / h;
    const rBranch = m * 0.3;
    const rLeaf = m * 0.21;

    const next: Node[] = [
      { id: "hub", label: hub, x: cx, y: cy, r: 10, color: "#f2ece1", kind: "hub", parent: null, seed: 0 },
    ];

    BRANCHES.forEach((b, bi) => {
      const a = -Math.PI / 2 + (bi / BRANCHES.length) * Math.PI * 2;
      const bx = cx + Math.cos(a) * rBranch * Math.min(wide, 1.5);
      const by = cy + Math.sin(a) * rBranch;
      const bIndex = next.length;
      next.push({
        id: b.key, label: b.label, x: bx, y: by, r: 6,
        color: b.color, kind: "branch", parent: 0, seed: bi * 1.7,
      });

      const spread = Math.PI * 0.8;
      b.leaves.forEach((leaf, li) => {
        const t = b.leaves.length === 1 ? 0.5 : li / (b.leaves.length - 1);
        const la = a + (t - 0.5) * spread;
        next.push({
          id: b.key + "-" + leaf, label: leaf,
          x: bx + Math.cos(la) * rLeaf * Math.min(wide, 1.45),
          y: by + Math.sin(la) * rLeaf,
          r: 3.2, color: b.color, kind: "leaf", parent: bIndex,
          seed: bi * 3.1 + li * 0.9,
        });
      });
    });

    setNodes(next);

    // one mote set per edge; edges are every node with a parent
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

  /* ------------------------------------------------------------ paint */
  const draw = useCallback(
    (time: number, dt: number) => {
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

      const lit = new Set<number>();
      const a = activeRef.current;
      if (a != null) {
        let cur: number | null = a;
        while (cur != null) {
          lit.add(cur);
          cur = nodes[cur].parent;
        }
      }

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
          : "rgba(242,236,225," + (0.09 + q * 0.16).toFixed(3) + ")";
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
        const fade = Math.sin(mo.t * Math.PI);
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
            const pulse = ((time * 0.00022 + k * 0.5) % 1);
            ctx.beginPath();
            ctx.arc(x, y, n.r + 6 + pulse * 46, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(242,236,225," + (0.18 * (1 - pulse)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // the halo the charge leaves behind
        if (q > 0.02 || on) {
          const halo = Math.max(q, on ? 0.85 : 0);
          ctx.beginPath();
          ctx.arc(x, y, n.r * (2.6 + halo * 2.4), 0, Math.PI * 2);
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
    [nodes, size]
  );

  useEffect(() => {
    if (!nodes.length) return;
    draw(0, 16);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const dt = lastT.current ? Math.min(50, t - lastT.current) : 16;
      lastT.current = t;
      draw(t, dt);
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
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      lean.current.tx = (x / r.width - 0.5) * 2;
      lean.current.ty = (y / r.height - 0.5) * 2;

      let best: number | null = null;
      let bestD = 96;
      nodes.forEach((n, i) => {
        if (n.kind === "hub") return;
        const d = Math.hypot(n.x - x, n.y - y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onLeave = () => {
      setActive(null);
      lean.current.tx = 0;
      lean.current.ty = 0;
    };
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
      className="relative w-full overflow-hidden rounded-3xl"
      style={{ height: "clamp(430px, 64vh, 680px)" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ width: size.w, height: size.h }}
        aria-hidden
      />

      {nodes.map((n, i) => {
        const on = active != null && (i === active || nodes[active]?.parent === i);
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
        return (
          <span
            key={n.id}
            className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap font-mono transition-colors duration-200 ltr"
            style={{
              left: n.x,
              top: n.y + (n.kind === "branch" ? 13 : 10),
              fontSize: n.kind === "branch" ? 10 : 10.5,
              letterSpacing: n.kind === "branch" ? "0.28em" : "0.02em",
              fontWeight: n.kind === "branch" ? 700 : 400,
              color: on ? n.color : n.kind === "branch" ? "rgba(242,236,225,0.82)" : "rgba(242,236,225,0.52)",
              textShadow: "0 1px 10px rgba(10,9,8,0.9)",
            }}
          >
            {n.label}
          </span>
        );
      })}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-2 pb-1 font-mono text-[9px] uppercase tracking-[0.28em] text-dim ltr">
        <span style={activeNode ? { color: activeNode.color } : undefined}>
          {activeNode ? "traced · " + activeNode.label : "move the cursor near a node to trace"}
        </span>
        <span>{nodes.length} nodes</span>
      </div>
    </div>
  );
}
