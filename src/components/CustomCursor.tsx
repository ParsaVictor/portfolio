import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouch(true);
      return;
    }
    const pos = { x: -100, y: -100 };
    const ring = { x: -100, y: -100 };

    function onMove(e: MouseEvent) {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (dotRef.current)
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      const target = e.target as HTMLElement;
      setActive(!!target.closest("a, button, [data-cursor-hover]"));
    }
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    function loop() {
      ring.x += (pos.x - ring.x) * 0.16;
      ring.y += (pos.y - ring.y) * 0.16;
      if (ringRef.current)
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyanx"
      />
      <div
        ref={ringRef}
        className={`pointer-events-none fixed left-0 top-0 z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-[width,height,border-color,background-color] duration-200 ${
          active
            ? "h-12 w-12 border-cyanx bg-cyanx/10"
            : "h-8 w-8 border-bone/35 bg-transparent"
        }`}
      />
    </>
  );
}
