import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type Variant = "up" | "fade" | "clip" | "scale";

const HIDDEN: Record<Variant, string> = {
  up: "opacity:0; transform: translate3d(0,26px,0)",
  fade: "opacity:0",
  clip: "opacity:0; clip-path: inset(0 0 100% 0); transform: translate3d(0,12px,0)",
  scale: "opacity:0; transform: scale(0.94)",
};

/**
 * Scroll reveal built on IntersectionObserver + CSS transitions rather than a
 * JS animation loop, so content still appears when rAF is throttled — and a
 * safety timer guarantees it appears even if the observer never fires.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  variant = "up",
  delay = 0,
  duration = 900,
  amount = 0.15,
  className = "",
  once = true,
}: {
  children: ReactNode;
  as?: ElementType;
  variant?: Variant;
  delay?: number;
  duration?: number;
  amount?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) setShown(false);
        }
      },
      { threshold: amount, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    // failsafe: never leave content invisible
    const t = window.setTimeout(() => setShown(true), 2200 + delay);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [amount, once, delay]);

  const hidden = HIDDEN[variant];
  const style: Record<string, string> = {
    transitionProperty: "opacity, transform, clip-path",
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    transitionDelay: `${delay}ms`,
    willChange: "opacity, transform",
  };
  if (!shown) {
    hidden.split(";").forEach((decl) => {
      const [k, v] = decl.split(":");
      if (!k || !v) return;
      const key = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      style[key] = v.trim();
    });
  }

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
