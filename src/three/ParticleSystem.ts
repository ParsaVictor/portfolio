import * as THREE from "three";
import { buildForms } from "./forms";
import { LINE_FRAG, LINE_VERT, POINT_FRAG, POINT_VERT } from "./shaders";
import { clamp, lerp, smoothstep } from "../lib/num";

const STAGE_COUNT = 5; // hero · vision · neural · web · contact

/** Presence of the instrument per stage — loud at the poles, composed behind content. */
const STAGE_OPACITY = [0.8, 0.72, 0.78, 0.72, 0.92];
const STAGE_LINE_OPACITY = [0.34, 0.3, 0.46, 0.34, 0.55];
/** Hero fills the frame; the working sections keep the form compact. */
const STAGE_BREATHE = [1.18, 0.8, 0.72, 0.8, 1.1];
/** Which side of the viewport the instrument owns, so copy always gets the other. */
const STAGE_OFFSET_X = [0.1, -1.38, 1.15, -1.15, 0];
const STAGE_OFFSET_Y = [0, -0.06, 0.06, -0.06, 0];

/**
 * Phones stack everything in one column, so the swarm can never own "the
 * other half" of the frame — it is always under the copy. Rather than fight
 * that, the working chapters lift it into the top band of the screen (where
 * the section header sits, not the paragraphs) and turn its presence right
 * down. Hero and contact, which are all form and no reading, keep it full.
 */
const MOBILE_OFFSET_Y = [0, 0.82, 0.82, 0.82, 0.05];
const MOBILE_PRESENCE = [1, 0.5, 0.55, 0.5, 0.95];
// the lattice lines are what cross body copy on a phone — kept faint there
const MOBILE_LINE_PRESENCE = [1, 0.22, 0.26, 0.22, 0.9];
const MOBILE_BREATHE = [1.18, 0.62, 0.66, 0.62, 1.08];

/** How large the chapter-number glyph reads while the swarm holds it. */
const DIGIT_BREATHE = { desktop: 0.96, mobile: 0.74 };

type Opts = {
  canvas: HTMLCanvasElement;
  colors: string[]; // 5 hex strings, one per stage
  reducedMotion: boolean;
  mobile: boolean;
};

export class ParticleSystem {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private group = new THREE.Group();

  private points!: THREE.Points;
  private lines!: THREE.LineSegments;
  private pMat!: THREE.ShaderMaterial;
  private lMat!: THREE.ShaderMaterial;
  private pGeo!: THREE.BufferGeometry;
  private lGeo!: THREE.BufferGeometry;

  private colors: THREE.Color[];
  private forms: ReturnType<typeof buildForms>;
  private count: number;
  private lineSeg: number;
  private seg = -1;
  private reduced: boolean;
  private mobile: boolean;

  private progress = 0;
  private targetProgress = 0;
  private stage = 0;
  private targetStage = 0;
  private intro = 0;
  private introTarget = 0;
  private pointer = new THREE.Vector2(0, 0);
  private pointerTarget = new THREE.Vector2(0, 0);
  /** The bubble's cursor, in NDC: tracks the mouse almost 1:1 (the camera
   *  sway above uses a slow, smoothed copy — the bubble must not). Parked far
   *  off-screen while the mouse is outside the window. */
  private cursor = new THREE.Vector2(9, 9);
  private cursorTarget = new THREE.Vector2(9, 9);
  private camZ = 18;
  private spread = 0;
  private midW = 0;
  private unrot = new THREE.Matrix4();
  private quiet = 0;
  private rtl = false;
  private mouseForce = 0;
  private offsetX = 0;
  private offsetY = 0;
  private spin = 0;
  private time = 0;
  private disposed = false;

  constructor(opts: Opts) {
    this.reduced = opts.reducedMotion;
    this.mobile = opts.mobile;
    this.colors = opts.colors.map((c) => new THREE.Color(c));

    this.renderer = new THREE.WebGLRenderer({
      canvas: opts.canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 1.75));
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    this.camera.position.set(0, 0, this.camZ);
    this.group.scale.setScalar(opts.mobile ? 2.05 : 2.85);
    this.scene.add(this.group);

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.count = this.reduced
      ? 1600
      : Math.round(clamp((w * h) / (opts.mobile ? 1100 : 420), opts.mobile ? 1600 : 2400, opts.mobile ? 2600 : 7000));
    this.lineSeg = this.reduced ? 260 : opts.mobile ? 300 : 900;

    this.mouseForce = this.reduced ? 0 : opts.mobile ? 0.25 : 0.28; // a gentle nudge, not a blast

    this.forms = buildForms(this.count, this.lineSeg);

    this.buildPoints();
    this.buildLines();

    if (this.reduced) {
      this.intro = this.introTarget = 1;
      this.camZ = 8.4;
      this.camera.position.z = this.camZ;
    }
  }

  /* ------------------------------------------------------------------ build */

  private buildPoints() {
    const n = this.count;
    this.pGeo = new THREE.BufferGeometry();

    const aFrom = new Float32Array(this.forms.points[0]);
    const aTo = new Float32Array(this.forms.points[1]);
    const aScale = new Float32Array(n);
    const aSeed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      // a scattering of brighter "stars" gives the cloud its sparkle
      aScale[i] = i % 23 === 0 ? 2.2 : i % 7 === 0 ? 1.35 : 0.7 + Math.random() * 0.4;
      aSeed[i] = Math.random();
    }

    this.pGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(aFrom), 3));
    this.pGeo.setAttribute("aFrom", new THREE.BufferAttribute(aFrom, 3));
    this.pGeo.setAttribute("aTo", new THREE.BufferAttribute(aTo, 3));
    this.pGeo.setAttribute("aCore", new THREE.BufferAttribute(new Float32Array(this.forms.core), 3));
    this.pGeo.setAttribute("aMid", new THREE.BufferAttribute(new Float32Array(this.forms.digits[1]), 3));
    this.pGeo.setAttribute("aScale", new THREE.BufferAttribute(aScale, 1));
    this.pGeo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    this.pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);

    this.pMat = new THREE.ShaderMaterial({
      vertexShader: POINT_VERT,
      fragmentShader: POINT_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 0 },
        uIntro: { value: this.reduced ? 1 : 0 },
        uSize: { value: this.mobile ? 2.3 : 3.1 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uBreathe: { value: 1 },
        uSpread: { value: 0 },
        uMouseForce: { value: this.mouseForce },
        uPointer: { value: new THREE.Vector2() },
        uPointerR: { value: 0.24 },
        uAspect: { value: 1 },
        uTanHalfFov: { value: 0.4 },
        uMidW: { value: 0 },
        uUnrot: { value: new THREE.Matrix3() },
        uColorFrom: { value: this.colors[0].clone() },
        uColorTo: { value: this.colors[1].clone() },
        uOpacity: { value: STAGE_OPACITY[0] },
      },
    });

    this.points = new THREE.Points(this.pGeo, this.pMat);
    this.points.frustumCulled = false;
    this.group.add(this.points);
  }

  private buildLines() {
    const segs = this.lineSeg;
    const verts = segs * 2;
    this.lGeo = new THREE.BufferGeometry();

    const aFrom = new Float32Array(this.forms.lines[0]);
    const aTo = new Float32Array(this.forms.lines[1]);
    const aSeed = new Float32Array(verts);
    for (let i = 0; i < segs; i++) {
      const s = Math.random();
      aSeed[i * 2] = s;
      aSeed[i * 2 + 1] = s;
    }

    this.lGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(aFrom), 3));
    this.lGeo.setAttribute("aFrom", new THREE.BufferAttribute(aFrom, 3));
    this.lGeo.setAttribute("aTo", new THREE.BufferAttribute(aTo, 3));
    this.lGeo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    this.lGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);

    this.lMat = new THREE.ShaderMaterial({
      vertexShader: LINE_VERT,
      fragmentShader: LINE_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 0 },
        uIntro: { value: this.reduced ? 1 : 0 },
        uBreathe: { value: 1 },
        uSpread: { value: 0 },
        uColorFrom: { value: this.colors[0].clone() },
        uColorTo: { value: this.colors[1].clone() },
        uOpacity: { value: STAGE_LINE_OPACITY[0] },
      },
    });

    this.lines = new THREE.LineSegments(this.lGeo, this.lMat);
    this.lines.frustumCulled = false;
    this.group.add(this.lines);
  }

  /* -------------------------------------------------------------- controls */

  playIntro() {
    this.introTarget = 1;
  }

  setScrollProgress(p: number) {
    this.targetProgress = clamp(p, 0, 1);
  }

  /**
   * Which chapter the page is showing. Integer while a chapter holds the
   * screen, fractional only across a handover — so the form sits still and
   * legible while you read, and only comes apart between chapters.
   */
  setStage(s: number) {
    this.targetStage = clamp(s, 0, STAGE_COUNT - 1);
  }

  /**
   * Mirror the instrument for right-to-left reading.
   *
   * The layout flips sides in Persian because it is built on logical
   * properties, but WebGL has no notion of direction — without this the swarm
   * stays put and ends up sitting underneath the copy.
   */
  setRTL(rtl: boolean) {
    this.rtl = rtl;
  }

  /** 0 = full presence, 1 = stand right down and let a section have the room. */
  setQuiet(v: number) {
    this.quiet = clamp(v, 0, 1);
  }

  setPointer(nx: number, ny: number, inside = true) {
    this.pointerTarget.set(nx, -ny);
    if (inside) {
      const wasOut = this.cursorTarget.x > 5;
      this.cursorTarget.set(nx, -ny);
      if (wasOut) this.cursor.copy(this.cursorTarget); // appear under the mouse, don't sweep in
    } else {
      this.cursorTarget.set(9, 9);
      this.cursor.set(9, 9);
    }
  }

  pulse() {
    this.spin += 0.28;
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.pMat.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
  }

  /* ----------------------------------------------------------------- frame */

  private applyStage() {
    const f = this.stage;
    let seg = Math.floor(f);
    if (seg > STAGE_COUNT - 2) seg = STAGE_COUNT - 2;
    if (seg < 0) seg = 0;
    const frac = clamp(f - seg, 0, 1);

    if (seg !== this.seg) {
      this.seg = seg;
      const pf = this.pGeo.getAttribute("aFrom") as THREE.BufferAttribute;
      const pt = this.pGeo.getAttribute("aTo") as THREE.BufferAttribute;
      (pf.array as Float32Array).set(this.forms.points[seg]);
      (pt.array as Float32Array).set(this.forms.points[seg + 1]);
      pf.needsUpdate = true;
      pt.needsUpdate = true;
      // the glyph the swarm reads out on the way in: the number of the room ahead
      const pm = this.pGeo.getAttribute("aMid") as THREE.BufferAttribute;
      (pm.array as Float32Array).set(this.forms.digits[seg + 1]);
      pm.needsUpdate = true;

      const lf = this.lGeo.getAttribute("aFrom") as THREE.BufferAttribute;
      const lt = this.lGeo.getAttribute("aTo") as THREE.BufferAttribute;
      (lf.array as Float32Array).set(this.forms.lines[seg]);
      (lt.array as Float32Array).set(this.forms.lines[seg + 1]);
      lf.needsUpdate = true;
      lt.needsUpdate = true;
    }

    // `frac` is zero for the whole time a chapter owns the screen and only sweeps
    // 0→1 across a handover, so the swarm blows apart *between* rooms and is
    // settled and readable inside them.
    // The middle of the handover is a hold: the veil is at full cover and the
    // swarm, lifted above it, stands as the next chapter's number. `midW` ramps
    // in just before that cover lands and out just after it lifts, so the glyph
    // stands for most of the handover, not just a blink at the middle.
    const midW = this.reduced ? 0 : smoothstep(clamp((frac - 0.08) / 0.17, 0, 1)) * (1 - smoothstep(clamp((frac - 0.75) / 0.17, 0, 1)));
    this.midW = midW;
    this.spread = this.reduced ? 0 : Math.pow(Math.sin(clamp(frac, 0, 1) * Math.PI), 0.8) * (1 - midW);

    const mix = smoothstep(clamp((frac - 0.08) / 0.84, 0, 1));
    const cFrom = this.colors[seg];
    const cTo = this.colors[seg + 1];

    const pu = this.pMat.uniforms;
    pu.uMix.value = mix;
    pu.uColorFrom.value.copy(cFrom);
    pu.uColorTo.value.copy(cTo);
    const hush = 1 - this.quiet * 0.94;
    const m = this.mobile;
    const presence = m ? lerp(MOBILE_PRESENCE[seg], MOBILE_PRESENCE[seg + 1], mix) : 1;
    const linePresence = m ? lerp(MOBILE_LINE_PRESENCE[seg], MOBILE_LINE_PRESENCE[seg + 1], mix) : 1;
    pu.uOpacity.value = lerp(STAGE_OPACITY[seg], STAGE_OPACITY[seg + 1], mix) * hush * presence;
    const stageBreathe = m
      ? lerp(MOBILE_BREATHE[seg], MOBILE_BREATHE[seg + 1], mix)
      : lerp(STAGE_BREATHE[seg], STAGE_BREATHE[seg + 1], mix);
    pu.uBreathe.value = lerp(stageBreathe, m ? DIGIT_BREATHE.mobile : DIGIT_BREATHE.desktop, midW);
    pu.uSpread.value = this.spread;
    pu.uMidW.value = midW;
    // the cursor bubble would punch a hole through the number — it rests while the glyph stands
    pu.uMouseForce.value = this.mouseForce * (1 - midW);
    // the glyph must read at full presence, whatever the chapters either side ask for
    pu.uOpacity.value = lerp(pu.uOpacity.value, 0.95 * hush, midW);

    const lu = this.lMat.uniforms;
    lu.uMix.value = mix;
    lu.uColorFrom.value.copy(cFrom);
    lu.uColorTo.value.copy(cTo);
    lu.uOpacity.value =
      lerp(STAGE_LINE_OPACITY[seg], STAGE_LINE_OPACITY[seg + 1], mix) * hush * linePresence * (1 - midW);
    lu.uBreathe.value = pu.uBreathe.value;
    lu.uSpread.value = this.spread;

    // drift the instrument off-centre so section copy always has clean ground
    const wide = window.innerWidth > 1024;
    const ox = wide ? lerp(STAGE_OFFSET_X[seg], STAGE_OFFSET_X[seg + 1], mix) : 0;
    // …and pull it back to dead centre while it is spelling out the number
    this.offsetX = (this.rtl ? -ox : ox) * (1 - midW);
    this.offsetY =
      (m
        ? lerp(MOBILE_OFFSET_Y[seg], MOBILE_OFFSET_Y[seg + 1], mix)
        : lerp(STAGE_OFFSET_Y[seg], STAGE_OFFSET_Y[seg + 1], mix)) * (1 - midW);
  }

  update(dtMs: number) {
    if (this.disposed) return;
    const dt = clamp(dtMs, 8, 60);
    if (!this.reduced) this.time += dt;

    this.progress += (this.targetProgress - this.progress) * clamp(dt / 260, 0, 1);
    this.stage += (this.targetStage - this.stage) * clamp(dt / 220, 0, 1);
    this.intro += (this.introTarget - this.intro) * clamp(dt / 620, 0, 1);
    this.pointer.lerp(this.pointerTarget, clamp(dt / 200, 0, 1));
    this.cursor.lerp(this.cursorTarget, clamp(dt / 40, 0, 1));

    // cinematic dolly on birth, then a gentle push-in across the page
    const zTarget =
      lerp(8.6, 7.4, smoothstep(this.progress)) + (1 - this.intro) * 9 + this.spread * 0.9;
    this.camZ += (zTarget - this.camZ) * clamp(dt / 900, 0, 1);
    this.camera.position.z = this.camZ;
    this.camera.position.x += (this.pointer.x * 0.35 - this.camera.position.x) * clamp(dt / 500, 0, 1);
    this.camera.position.y += (this.pointer.y * 0.25 - this.camera.position.y) * clamp(dt / 500, 0, 1);
    this.camera.lookAt(0, 0, 0);

    this.applyStage();

    // The bubble is resolved on screen by the shader (see POINT_VERT); it
    // only needs the raw cursor, the aspect and the lens.
    this.pMat.uniforms.uTime.value = this.time;
    this.pMat.uniforms.uIntro.value = this.intro;
    this.pMat.uniforms.uPointer.value.copy(this.cursor);
    this.pMat.uniforms.uAspect.value = this.camera.aspect;
    this.pMat.uniforms.uTanHalfFov.value = Math.tan((this.camera.fov * Math.PI) / 360);
    this.pMat.uniforms.uPointerR.value = 0.24; // in screen-height units — a small, precise bubble
    this.lMat.uniforms.uTime.value = this.time;
    this.lMat.uniforms.uIntro.value = this.intro;

    // slow autonomous rotation + a scroll-driven quarter turn: it reads as one object
    if (!this.reduced) this.spin += dt * 0.000055;
    // the contact chapter reads as "@" — calm the spin there so the glyph stays legible
    // instead of tumbling; every earlier chapter keeps its full rotation untouched.
    const contactCalm = smoothstep(clamp((this.stage - (STAGE_COUNT - 1) + 0.7) / 0.7, 0, 1));
    const spinAmount = this.spin * lerp(1, 0.5, contactCalm);
    const scrollTurn = this.progress * Math.PI * 0.85 * lerp(1, 0.55, contactCalm);
    this.group.rotation.y = spinAmount + scrollTurn + this.pointer.x * 0.18;
    this.group.rotation.x = Math.sin(this.time * 0.00013) * 0.1 - this.pointer.y * 0.12;
    // the glyph is authored flat in XY; feed the shader the inverse of the
    // group's turn so it stays square to the lens while the swarm holds it
    if (this.midW > 0.0005) {
      this.unrot.makeRotationFromEuler(this.group.rotation).invert();
      this.pMat.uniforms.uUnrot.value.setFromMatrix4(this.unrot);
    }

    const ease = clamp(dt / 700, 0, 1);
    this.group.position.x += (this.offsetX * 2.6 - this.group.position.x) * ease;
    this.group.position.y += (this.offsetY * 2.6 - this.group.position.y) * ease;

    this.renderer.render(this.scene, this.camera);
  }

  /** 0..1 — how fully the swarm is currently standing as a chapter number. */
  glyphWeight() {
    return this.midW;
  }

  /** DEV-only snapshot for verifying the instrument from the console. */
  debugState() {
    return {
      intro: this.intro,
      progress: this.progress,
      stage: this.stage,
      spread: this.spread,
      midW: this.midW,
      quiet: this.quiet,
      rtl: this.rtl,
      camZ: this.camZ,
      breathe: this.pMat.uniforms.uBreathe.value,
      opacity: this.pMat.uniforms.uOpacity.value,
      groupX: this.group.position.x,
      groupScale: this.group.scale.x,
      count: this.count,
      seg: this.seg,
      mix: this.pMat.uniforms.uMix.value,
    };
  }

  dispose() {
    this.disposed = true;
    this.pGeo?.dispose();
    this.lGeo?.dispose();
    this.pMat?.dispose();
    this.lMat?.dispose();
    this.renderer.dispose();
  }
}
