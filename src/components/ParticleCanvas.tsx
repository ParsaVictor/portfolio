import { useEffect, useRef } from "react";
import { STAGE_COLORS, STAGES } from "../config";
import { scrollStore } from "../scroll/scrollStore";
import { quietZone, stepQuiet } from "../state/quietZone";
import type { ParticleSystem } from "../three/ParticleSystem";

export default function ParticleCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let last = performance.now();
    let disposed = false;
    let sys: ParticleSystem | null = null;
    let cleanupEvents = () => {};

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 820px)").matches;
    const colors = STAGES.map((s) => STAGE_COLORS[s]);

    import("../three/ParticleSystem").then(({ ParticleSystem: PS }) => {
      if (disposed) return;
      let s: ParticleSystem;
      try {
        s = new PS({ canvas, colors, reducedMotion: reduced, mobile });
      } catch (err) {
        // A GPU/driver hiccup here (context creation failing on a cold
        // refresh) must not wedge the page — drop the instrument, keep
        // everything else running.
        console.error("[ParticleCanvas] failed to init WebGL, skipping instrument:", err);
        return;
      }
      sys = s;
      s.resize(window.innerWidth, window.innerHeight);
      if (import.meta.env.DEV) {
        const w = window as unknown as Record<string, unknown>;
        w.__mpk = s;
        w.__quiet = quietZone;
      }
      // Paint one frame immediately: a background tab (or any context where rAF
      // is parked) should still show the form rather than an empty canvas.
      s.update(16);

      const onResize = () => s.resize(window.innerWidth, window.innerHeight);

      // the swarm has to flip with the page, or it lands under the copy in Persian
      const readDir = () => s.setRTL(document.documentElement.dir === "rtl");
      readDir();
      const dirObserver = new MutationObserver(readDir);
      dirObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
      const onPointer = (e: PointerEvent) =>
        s.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      const onLeave = () => s.setPointer(0, 0);
      const onDown = () => s.pulse();

      window.addEventListener("resize", onResize);
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      cleanupEvents = () => {
        dirObserver.disconnect();
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("pointerdown", onDown);
        document.removeEventListener("pointerleave", onLeave);
      };

      let started = false;
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        const dt = now - last;
        last = now;
        if (document.hidden) return;
        if (activeRef.current && !started) {
          started = true;
          s.playIntro();
        }
        try {
          s.setScrollProgress(scrollStore.progress);
          s.setStage(scrollStore.stage);
          s.setQuiet(stepQuiet(dt));
          s.update(dt);
        } catch (err) {
          // Never let a single bad frame kill the rAF loop silently — the
          // canvas would freeze on its last frame while the rest of the
          // page reads as "hung".
          console.error("[ParticleCanvas] frame error:", err);
        }
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanupEvents();
      sys?.dispose();
      sys = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-0 h-full w-full"
    />
  );
}
