import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setScroll } from "./scrollStore";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}

/** Lenis smooth-scroll wired into GSAP ScrollTrigger + a global progress store. */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    lenis = new Lenis({
      // autoRaf off is the whole point: Lenis must NOT run its own loop, or the
      // page is advanced twice per frame and every scroll-linked effect judders.
      autoRaf: false,
      lerp: reduce ? 1 : 0.085,
      smoothWheel: !reduce,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });

    // one frame, one source of truth: Lenis pushes straight into ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__lenis = lenis;

    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    let lastY = window.scrollY;
    let vel = 0;

    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const y = window.scrollY;
        vel = vel * 0.8 + ((y - lastY) / window.innerHeight) * 0.2;
        lastY = y;
        setScroll(self.progress, vel);
      },
    });

    const remeasure = () => {
      lenis?.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", remeasure);
    document.fonts?.ready.then(remeasure);
    // Fonts, lazy images and the WebGL canvas all settle at different moments and
    // each one can shift layout under a trigger, so remeasure on a stagger.
    const timers = [300, 900, 2000, 3500].map((ms) => window.setTimeout(remeasure, ms));

    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("resize", remeasure);
      st.kill();
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, [enabled]);
}
