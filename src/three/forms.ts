/**
 * Form library for the particle instrument.
 *
 * Every stage is a *deformation of one evenly-distributed sphere* so morphs stay
 * coherent — points never scatter into noise, they flow from one clean geometry
 * to the next (sphere → lens → lattice → globe → ring).
 *
 * POINTS  : Float32Array(POINT_COUNT * 3)
 * LINES   : Float32Array(LINE_SEG * 2 * 3)   (pairs of endpoints, morph 1:1)
 * All coordinates live in ~[-1, 1].
 */
import { mulberry32 } from "../lib/num";

const TAU = Math.PI * 2;
const PHI = Math.PI * (3 - Math.sqrt(5)); // golden angle

export type FormSet = {
  points: Float32Array[]; // one per stage
  lines: Float32Array[]; // one per stage
  core: Float32Array; // birth position (tight glowing core)
};

/* ------------------------------------------------------------------ helpers */

function fibSphere(n: number, jitter = 0): [number, number, number][] {
  const rand = mulberry32(99);
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = PHI * i;
    const j = 1 + (rand() - 0.5) * jitter;
    out.push([Math.cos(th) * r * j, y * j, Math.sin(th) * r * j]);
  }
  return out;
}

/** resample a list of segments (each [[x,y,z],[x,y,z]]) to exactly `count` */
function fitSegments(
  segs: [number[], number[]][],
  count: number,
  seed: number
): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 6);
  const n = segs.length || 1;
  for (let i = 0; i < count; i++) {
    const s = segs[Math.floor(rand() * n) % n] || [
      [0, 0, 0],
      [0, 0, 0],
    ];
    out[i * 6] = s[0][0];
    out[i * 6 + 1] = s[0][1];
    out[i * 6 + 2] = s[0][2];
    out[i * 6 + 3] = s[1][0];
    out[i * 6 + 4] = s[1][1];
    out[i * 6 + 5] = s[1][2];
  }
  return out;
}

function polylineToSegs(pts: number[][]): [number[], number[]][] {
  const s: [number[], number[]][] = [];
  for (let i = 0; i < pts.length - 1; i++) s.push([pts[i], pts[i + 1]]);
  return s;
}

/* --------------------------------------------------------------- 0 · SPHERE */

function sphereForm(base: [number, number, number][]): Float32Array {
  const out = new Float32Array(base.length * 3);
  base.forEach((p, i) => {
    out[i * 3] = p[0];
    out[i * 3 + 1] = p[1];
    out[i * 3 + 2] = p[2];
  });
  return out;
}

function sphereLines(n: number, seed: number): Float32Array {
  // Fibonacci offsets weave the phyllotaxis spirals instead of latitude stripes
  const M = 1100;
  const base = fibSphere(M);
  const segs: [number[], number[]][] = [];
  for (let k = 0; k < M; k++) {
    for (const step of [21, 34]) {
      const b = base[(k + step) % M];
      const a = base[k];
      // skip the wrap-around chords that would cut through the sphere
      if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.42) segs.push([a, b]);
    }
  }
  return fitSegments(segs, n, seed);
}

/* ------------------------------------------------------------------ 1 · EYE */

function eyeForm(base: [number, number, number][], seed: number): Float32Array {
  const rand = mulberry32(seed);
  const n = base.length;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const p = base[i];
    const r2 = Math.hypot(p[0], p[1]);
    const ang = Math.atan2(p[1], p[0]);
    const u = i / n;
    let x: number, y: number, z: number;
    if (u < 0.12) {
      // pupil
      const rr = 0.14 * Math.sqrt(rand());
      const a = rand() * TAU;
      x = Math.cos(a) * rr;
      y = Math.sin(a) * rr;
      z = 0.14 + (rand() - 0.5) * 0.05;
    } else if (u < 0.85) {
      // iris — snap to one of N concentric rings + radial fibre jitter
      const rings = 9;
      const ri = 1 + Math.floor(((r2 + rand() * 0.12) / 1.05) * rings);
      const rad = 0.2 + (ri / rings) * 0.62;
      x = Math.cos(ang) * rad;
      y = Math.sin(ang) * rad;
      z = (rand() - 0.5) * 0.12 + Math.cos(rad * 6) * 0.05;
    } else {
      // outer aperture rim
      const rad = 0.98 + (rand() - 0.5) * 0.04;
      x = Math.cos(ang) * rad;
      y = Math.sin(ang) * rad * 0.82;
      z = (rand() - 0.5) * 0.06;
    }
    // dome the iris toward the viewer so it reads as a cornea, not a disc
    const rr = Math.hypot(x, y);
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z + Math.cos(Math.min(1, rr) * Math.PI * 0.5) * 0.34;
  }
  return out;
}

function eyeLines(n: number, seed: number): Float32Array {
  const segs: [number[], number[]][] = [];
  const rings = [0.2, 0.34, 0.48, 0.62, 0.78, 0.98];
  rings.forEach((rad, idx) => {
    const steps = 60;
    const yScale = idx === rings.length - 1 ? 0.82 : 1;
    const dome = Math.cos(Math.min(1, rad) * Math.PI * 0.5) * 0.34;
    const poly: number[][] = [];
    for (let k = 0; k <= steps; k++) {
      const a = (k / steps) * TAU;
      poly.push([Math.cos(a) * rad, Math.sin(a) * rad * yScale, dome]);
    }
    segs.push(...polylineToSegs(poly));
  });
  // radial spokes, following the same dome
  for (let k = 0; k < 32; k++) {
    const a = (k / 32) * TAU;
    const dz = (r: number) => Math.cos(Math.min(1, r) * Math.PI * 0.5) * 0.34;
    segs.push([
      [Math.cos(a) * 0.2, Math.sin(a) * 0.2, dz(0.2)],
      [Math.cos(a) * 0.78, Math.sin(a) * 0.78, dz(0.78)],
    ]);
  }
  return fitSegments(segs, n, seed);
}

/* -------------------------------------------------------------- 2 · NETWORK */

/**
 * A layered network drawn as a lantern: each layer is a ring of nodes in the
 * YZ plane, so the weave between layers has real depth and reads beautifully
 * as the instrument rotates.
 */
const NET_LAYERS = [3, 6, 6, 4];
const NET_X = [-1.12, -0.38, 0.38, 1.12];
const NET_R = [0.44, 0.82, 0.82, 0.5];

function networkNodes(): { nodes: number[][][]; edges: [number[], number[]][] } {
  const nodes: number[][][] = NET_LAYERS.map((count, l) => {
    const ring: number[][] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + l * 0.42;
      ring.push([NET_X[l], Math.cos(a) * NET_R[l], Math.sin(a) * NET_R[l]]);
    }
    return ring;
  });
  const edges: [number[], number[]][] = [];
  for (let l = 0; l < nodes.length - 1; l++)
    for (const a of nodes[l]) for (const b of nodes[l + 1]) edges.push([a, b]);
  return { nodes, edges };
}

function networkForm(count: number, seed: number): Float32Array {
  const rand = mulberry32(seed);
  const { nodes, edges } = networkNodes();
  const flat = nodes.flat();
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let x: number, y: number, z: number;
    if (rand() < 0.3) {
      // glowing halo around a node
      const nd = flat[Math.floor(rand() * flat.length)];
      const r = 0.075 * Math.cbrt(rand());
      const a = rand() * TAU;
      const b = Math.acos(rand() * 2 - 1);
      x = nd[0] + Math.sin(b) * Math.cos(a) * r;
      y = nd[1] + Math.sin(b) * Math.sin(a) * r;
      z = nd[2] + Math.cos(b) * r;
    } else {
      // a signal travelling along a synapse
      const e = edges[Math.floor(rand() * edges.length)];
      const t = rand();
      const j = 0.012;
      x = e[0][0] + (e[1][0] - e[0][0]) * t + (rand() - 0.5) * j;
      y = e[0][1] + (e[1][1] - e[0][1]) * t + (rand() - 0.5) * j;
      z = e[0][2] + (e[1][2] - e[0][2]) * t + (rand() - 0.5) * j;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

function networkLines(n: number, seed: number): Float32Array {
  const { nodes, edges } = networkNodes();
  const segs: [number[], number[]][] = [...edges];
  // close each layer's ring so the lantern has hoops as well as ribs
  nodes.forEach((ring) => {
    for (let i = 0; i < ring.length; i++) segs.push([ring[i], ring[(i + 1) % ring.length]]);
  });
  return fitSegments(segs, n, seed);
}

/* --------------------------------------------------------------- 3 · GLOBE */

function globeForm(base: [number, number, number][], seed: number): Float32Array {
  const rand = mulberry32(seed);
  const n = base.length;
  const lats = 12;
  const lons = 18;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const p = base[i];
    let lat = Math.asin(Math.max(-1, Math.min(1, p[1])));
    let lon = Math.atan2(p[2], p[0]);
    if (i % 2 === 0) {
      const li = Math.round(((lat + Math.PI / 2) / Math.PI) * lats);
      lat = (li / lats) * Math.PI - Math.PI / 2;
    } else {
      const oi = Math.round(((lon + Math.PI) / TAU) * lons);
      lon = (oi / lons) * TAU - Math.PI;
    }
    const cl = Math.cos(lat);
    out[i * 3] = cl * Math.cos(lon) * (1 + (rand() - 0.5) * 0.015);
    out[i * 3 + 1] = Math.sin(lat);
    out[i * 3 + 2] = cl * Math.sin(lon) * (1 + (rand() - 0.5) * 0.015);
  }
  return out;
}

function globeLines(n: number, seed: number): Float32Array {
  const segs: [number[], number[]][] = [];
  const lats = 7;
  const lons = 12;
  for (let a = 1; a < lats; a++) {
    const lat = (a / lats) * Math.PI - Math.PI / 2;
    const poly: number[][] = [];
    for (let k = 0; k <= 48; k++) {
      const lon = (k / 48) * TAU - Math.PI;
      poly.push([Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]);
    }
    segs.push(...polylineToSegs(poly));
  }
  for (let o = 0; o < lons; o++) {
    const lon = (o / lons) * TAU;
    const poly: number[][] = [];
    for (let k = 0; k <= 48; k++) {
      const lat = (k / 48) * Math.PI - Math.PI / 2;
      poly.push([Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]);
    }
    segs.push(...polylineToSegs(poly));
  }
  return fitSegments(segs, n, seed);
}

/* ------------------------------------------------------------------- 4 · @ */

/**
 * The contact glyph, drawn parametrically rather than sampled from a font —
 * the shape then reads identically on every machine, and each stroke keeps its
 * own arc-length so the points spread evenly instead of bunching at the joins.
 */
function atCurves(): number[][][] {
  const R = 0.92;
  const start = (-22 * Math.PI) / 180;
  const sweep = (302 * Math.PI) / 180;

  const outer: number[][] = [];
  for (let k = 0; k <= 260; k++) {
    const t = k / 260;
    const a = start + t * sweep;
    outer.push([Math.cos(a) * R, Math.sin(a) * R, Math.sin(t * 7) * 0.035]);
  }

  // the stroke that runs off the open end of the ring
  const tail: number[][] = [];
  for (let k = 0; k <= 48; k++) {
    const t = k / 48;
    const a = start - t * 0.62;
    const rad = R * (1 + t * 0.3);
    tail.push([Math.cos(a) * rad, Math.sin(a) * rad - t * 0.14, 0]);
  }

  // the bowl of the inner 'a'
  const bowl: number[][] = [];
  const br = 0.32;
  const bx = -0.06;
  for (let k = 0; k <= 150; k++) {
    const a = (k / 150) * TAU;
    bowl.push([bx + Math.cos(a) * br, Math.sin(a) * br, 0]);
  }

  // its stem, dropping down the right side and kicking out at the foot
  const stem: number[][] = [];
  for (let k = 0; k <= 70; k++) {
    const t = k / 70;
    stem.push([0.26 + (t > 0.76 ? (t - 0.76) * 0.85 : 0), 0.34 - t * 0.62, 0]);
  }

  return [outer, tail, bowl, stem];
}

function atForm(base: [number, number, number][], seed: number): Float32Array {
  const rand = mulberry32(seed);
  const curves = atCurves();
  const flat: number[][] = [];
  for (const c of curves) flat.push(...c);
  const n = base.length;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const p = flat[Math.floor(rand() * flat.length) % flat.length];
    out[i * 3] = p[0] + (rand() - 0.5) * 0.05;
    out[i * 3 + 1] = p[1] + (rand() - 0.5) * 0.05;
    out[i * 3 + 2] = (p[2] ?? 0) + (rand() - 0.5) * 0.13;
  }
  return out;
}

function atLines(n: number, seed: number): Float32Array {
  const segs: [number[], number[]][] = [];
  for (const c of atCurves()) segs.push(...polylineToSegs(c));
  return fitSegments(segs, n, seed);
}

/* ---------------------------------------------------------------- assemble */

export function buildForms(pointCount: number, lineSeg: number): FormSet {
  const base = fibSphere(pointCount, 0.02);

  const core = new Float32Array(pointCount * 3);
  const rand = mulberry32(7);
  for (let i = 0; i < pointCount; i++) {
    const rr = 0.05 * Math.cbrt(rand());
    const a = rand() * TAU;
    const b = Math.acos(rand() * 2 - 1);
    core[i * 3] = Math.sin(b) * Math.cos(a) * rr;
    core[i * 3 + 1] = Math.sin(b) * Math.sin(a) * rr;
    core[i * 3 + 2] = Math.cos(b) * rr;
  }

  return {
    core,
    points: [
      sphereForm(base),
      eyeForm(base, 12),
      networkForm(pointCount, 23),
      globeForm(base, 31),
      atForm(base, 41),
    ],
    lines: [
      sphereLines(lineSeg, 112),
      eyeLines(lineSeg, 123),
      networkLines(lineSeg, 223),
      globeLines(lineSeg, 331),
      atLines(lineSeg, 441),
    ],
  };
}
