import { useMemo } from "react";
import { mulberry32 } from "../lib/num";

/**
 * A generated cover for projects that have no screenshot.
 *
 * Deterministic from the project id, drawn in the same node-and-edge language
 * as the particle instrument — so an unillustrated repo reads as part of the
 * system rather than as a missing image. Never presented as a screenshot.
 */
export default function ProjectCover({
  seed,
  accent,
  variant = "mesh",
  className = "",
}: {
  seed: string;
  accent: string;
  variant?: "mesh" | "grid";
  className?: string;
}) {
  const W = 320;
  const H = 200;

  const { nodes, edges, bars } = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const rand = mulberry32(h >>> 0);

    const count = variant === "grid" ? 18 : 26;
    const pts: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < count; i++) {
      if (variant === "grid") {
        const cols = 6;
        const col = i % cols;
        const row = Math.floor(i / cols);
        pts.push({
          x: 40 + col * ((W - 80) / (cols - 1)),
          y: 52 + row * 44 + (rand() - 0.5) * 8,
          r: 1.6 + rand() * 1.8,
        });
      } else {
        pts.push({
          x: 26 + rand() * (W - 52),
          y: 26 + rand() * (H - 52),
          r: 1.4 + rand() * 2.4,
        });
      }
    }

    // connect each node to its two nearest neighbours — a readable mesh, not spaghetti
    const es: [number, number][] = [];
    pts.forEach((p, i) => {
      const near = pts
        .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      near.forEach((o) => {
        const key: [number, number] = i < o.j ? [i, o.j] : [o.j, i];
        if (!es.some((e) => e[0] === key[0] && e[1] === key[1])) es.push(key);
      });
    });

    const bs = Array.from({ length: 7 }, () => 0.2 + rand() * 0.8);
    return { nodes: pts, edges: es, bars: bs };
  }, [seed, variant]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={"h-full w-full " + className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      role="presentation"
    >
      <defs>
        <linearGradient id={`cv-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill="#06070c" />
      <rect width={W} height={H} fill={`url(#cv-${seed})`} />

      {/* faint measurement grid */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={"h" + i}
          x1="0"
          x2={W}
          y1={(i * H) / 8}
          y2={(i * H) / 8}
          stroke="rgba(237,240,247,0.05)"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line
          key={"v" + i}
          y1="0"
          y2={H}
          x1={(i * W) / 10}
          x2={(i * W) / 10}
          stroke="rgba(237,240,247,0.05)"
          strokeWidth="1"
        />
      ))}

      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke={accent}
          strokeOpacity="0.32"
          strokeWidth="0.9"
        />
      ))}

      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={accent} fillOpacity={0.75} />
      ))}

      {/* a small read-out strip, echoing the telemetry panel */}
      <g transform={`translate(20 ${H - 22})`}>
        {bars.map((b, i) => (
          <rect
            key={i}
            x={i * 9}
            y={-b * 14}
            width="4"
            height={b * 14}
            fill={accent}
            fillOpacity="0.5"
          />
        ))}
      </g>
    </svg>
  );
}
