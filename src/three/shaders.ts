/**
 * Shared float uniforms are deliberately kept out of the fragment stage
 * (some GL validators reject cross-stage precision mismatches). The vertex
 * shader does the colour maths and passes results as varyings.
 */

export const POINT_VERT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uMix;
uniform float uIntro;
uniform float uSize;
uniform float uPixelRatio;
uniform float uBreathe;
uniform float uSpread;      // 0 at rest, 1 mid-transition — the cloud flies apart
uniform float uMouseForce;
uniform float uPointerR;
uniform vec2  uPointer;
uniform vec3  uColorFrom;
uniform vec3  uColorTo;

attribute vec3  aFrom;
attribute vec3  aTo;
attribute vec3  aCore;
attribute float aScale;
attribute float aSeed;

varying vec3  vColor;
varying float vGlow;
varying float vFade;
varying float vHot;

void main() {
  vec3 shaped = mix(aFrom, aTo, uMix);

  // birth: bloom outward from a dense core, points arriving on staggered delays
  float delay = aSeed * 0.35;
  float born  = clamp((uIntro - delay) / (1.0 - delay), 0.0, 1.0);
  born = 1.0 - pow(1.0 - born, 4.0);           // power4.out
  vec3 pos = mix(aCore, shaped, born);

  // gentle organic drift so the form always feels alive
  float t = uTime * 0.001;
  pos += vec3(
    sin(t * 0.55 + aSeed * 6.2831),
    cos(t * 0.63 + aSeed * 4.13),
    sin(t * 0.48 + aSeed * 2.71)
  ) * 0.018 * born;

  // ── scatter & regroup ───────────────────────────────────────────────
  // Between two stages the swarm blows outward and drifts, then settles into
  // the next geometry. Radial push keeps the silhouette readable; the seeded
  // vector adds the turbulence that makes it feel like a real dispersal.
  if (uSpread > 0.001) {
    vec3 radial = normalize(shaped + vec3(0.0001, 0.0002, 0.0003));
    vec3 turb = vec3(
      sin(aSeed * 31.7 + t * 1.7),
      cos(aSeed * 17.3 + t * 1.3),
      sin(aSeed * 47.1 + t * 2.1)
    );
    float s = uSpread * born;
    pos += radial * s * (0.55 + aSeed * 0.5);
    pos += turb * s * 0.40;
  }

  pos *= uBreathe;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  // ── cursor bubble ───────────────────────────────────────────────────
  // The pointer pushes points outward, opening a rounded cavity in the swarm
  // that travels with the cursor. uPointer already arrives in view space, so
  // the bubble sits exactly under the mouse at any aspect ratio.
  vec2 fromP = mv.xy - uPointer;
  float d = length(fromP) + 0.0001;
  float infl = 1.0 - smoothstep(0.0, uPointerR, d);
  infl = infl * infl;                                   // tight rim, soft falloff
  vec2 dir = fromP / d;
  mv.xy += dir * infl * uPointerR * uMouseForce;
  // lift the displaced points toward the lens so the cavity reads as a dome
  mv.z += infl * uMouseForce * 0.55;
  // a little rotation in the rim keeps it alive rather than a dead hole
  mv.xy += vec2(-dir.y, dir.x) * infl * uMouseForce * 0.22;
  float pull = infl;

  gl_Position = projectionMatrix * mv;

  float size = uSize * aScale * uPixelRatio * (1.0 + pull * 0.85);
  gl_PointSize = clamp(size * (9.0 / -mv.z), 0.5, 24.0);

  // depth + screen-edge falloff keep the form contained instead of "all over"
  float depth = clamp((-mv.z - 4.5) / 11.0, 0.0, 1.0);
  vec2  ndc   = gl_Position.xy / max(gl_Position.w, 0.001);
  float edge  = 1.0 - smoothstep(0.66, 1.30, length(ndc));

  vColor = mix(uColorFrom, uColorTo, uMix);
  vGlow  = aScale;
  vFade  = (1.0 - depth * 0.65) * edge * born;
  vHot   = pull;
}
`;

export const POINT_FRAG = /* glsl */ `
precision highp float;

uniform float uOpacity;

varying vec3  vColor;
varying float vGlow;
varying float vFade;
varying float vHot;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = smoothstep(0.42, 0.06, d);
  float halo = smoothstep(0.5, 0.0, d) * 0.22;
  float a = (core + halo) * uOpacity * vFade * (1.0 + vHot * 0.7);
  if (a < 0.006) discard;

  vec3 col = mix(vColor, vec3(1.0), core * 0.5 * vGlow + vHot * 0.35);
  gl_FragColor = vec4(col, a);
}
`;

export const LINE_VERT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uMix;
uniform float uIntro;
uniform float uBreathe;
uniform float uSpread;
uniform vec3  uColorFrom;
uniform vec3  uColorTo;

attribute vec3  aFrom;
attribute vec3  aTo;
attribute float aSeed;

varying float vPulse;
varying float vFade;
varying vec3  vColor;

void main() {
  vec3 pos = mix(aFrom, aTo, uMix) * uBreathe;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float depth = clamp((-mv.z - 4.5) / 11.0, 0.0, 1.0);
  vec2  ndc   = gl_Position.xy / max(gl_Position.w, 0.001);
  float edge  = 1.0 - smoothstep(0.55, 1.15, length(ndc));

  vPulse = 0.45 + 0.55 * sin(uTime * 0.0016 + aSeed * 9.0);
  // wiring can't survive a dispersal — it dims out while the swarm is loose
  vFade  = (1.0 - depth * 0.8) * edge * uIntro * (1.0 - uSpread);
  vColor = mix(uColorFrom, uColorTo, uMix);
}
`;

export const LINE_FRAG = /* glsl */ `
precision highp float;

uniform float uOpacity;

varying float vPulse;
varying float vFade;
varying vec3  vColor;

void main() {
  float a = uOpacity * vFade * (0.30 + 0.70 * vPulse);
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}
`;
