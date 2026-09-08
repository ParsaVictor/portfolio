import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>*+=$";

/**
 * Character-by-character "decode": every glyph cycles through noise and then
 * locks, left to right. The real string stays the accessible label, so screen
 * readers never see the scramble.
 */
export default function Scramble({
  text,
  className = "",
  speed = 34,
  holdPerChar = 2.4,
  start = true,
}: {
  text: string;
  className?: string;
  speed?: number;
  holdPerChar?: number;
  start?: boolean;
}) {
  const [out, setOut] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (!start) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOut(text);
      return;
    }

    let timer = 0;
    let io: IntersectionObserver | null = null;

    const run = () => {
      if (ran.current) return;
      ran.current = true;
      const chars = [...text];
      let frame = 0;
      timer = window.setInterval(() => {
        frame += 1;
        const locked = Math.floor(frame / holdPerChar);
        if (locked > chars.length) {
          window.clearInterval(timer);
          setOut(text);
          return;
        }
        setOut(
          chars
            .map((c, i) => {
              if (i < locked || c === " ") return c;
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join("")
        );
      }, speed);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
    } else {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && run()),
        { threshold: 0.4 }
      );
      io.observe(el);
    }

    return () => {
      window.clearInterval(timer);
      io?.disconnect();
    };
  }, [text, speed, holdPerChar, start]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{out}</span>
    </span>
  );
}
