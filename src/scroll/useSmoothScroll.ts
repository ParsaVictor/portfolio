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
      duration: reduce ? 0.1 : 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !reduce,
      touchMultiplier: 1.5,
    });

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

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);
    // fonts / images can shift layout — refresh once settled
    const rt = window.setTimeout(() => ScrollTrigger.refresh(), 1200);

    return () => {
      window.clearTimeout(rt);
      window.removeEventListener("resize", onResize);
      st.kill();
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, [enabled]);
}
