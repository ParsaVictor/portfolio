import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Attach to a tall wrapper that holds a `position: sticky` child. The callback
 * receives 0→1 across the wrapper's travel, so the sticky child can be driven
 * frame-accurately without GSAP pinning (no pin-spacer, no layout races).
 */
export function useScrub(cb: (p: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fire = (p: number) => cbRef.current(p);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => fire(self.progress),
      onRefresh: (self) => fire(self.progress),
    });
    fire(0);
    return () => st.kill();
  }, []);

  return ref;
}
