import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n/LangProvider";
import { identity } from "../config";
import { clamp, digits } from "../lib/num";

const MIN_MS = 1500;
const MAX_MS = 4200;
const R = 78; // progress ring radius

/**
 * The boot sequence.
 *
 * Progress is real where it can be — fonts and the window load event both
 * report in — with a floor so the sequence never flashes and a ceiling so a
 * stalled asset can never trap the visitor behind it.
 */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const { t, lang } = useLang();
  const [pct, setPct] = useState(0);
  const [line, setLine] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const doneRef = useRef(false);

  const steps = t.preloader.steps;

  useEffect(() => {
    const start = performance.now();
    let assets = 0; // 0..1 from real signals
    let raf = 0;

    const bump = (v: number) => {
      assets = Math.max(assets, v);
    };
    document.fonts?.ready.then(() => bump(0.6));
    if (document.readyState === "complete") bump(1);
    else window.addEventListener("load", () => bump(1), { once: true });

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPct(100);
      setLine(steps.length - 1);
      window.setTimeout(() => setLeaving(true), 260);
      window.setTimeout(() => {
        setGone(true);
        onDone();
      }, 1050);
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      // time gives it a floor; the real signals let it finish early
      const byTime = clamp(elapsed / MAX_MS, 0, 1);
      const floor = clamp(elapsed / MIN_MS, 0, 1);
      const p = clamp(Math.max(byTime, Math.min(assets, floor)), 0, 1);
      setPct(Math.round(p * 100));
      setLine(Math.min(steps.length - 1, Math.floor(p * steps.length)));
      if (p >= 1 || elapsed > MAX_MS) finish();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // last-resort guard: never leave someone staring at a loader
    const bail = window.setTimeout(finish, MAX_MS + 900);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(bail);
    };
  }, [onDone, steps.length]);

  if (gone) return null;

  const circ = 2 * Math.PI * R;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-ink"
      style={{
        clipPath: leaving ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        transition: "clip-path 780ms cubic-bezier(0.76,0,0.24,1)",
      }}
      role="status"
      aria-live="polite"
      aria-label={t.preloader.status}
    >
      {/* the swarm is already blooming behind this, so keep the ground dark */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(53,224,255,0.13),transparent_62%)]" />

      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: leaving ? 0 : 1,
          transform: leaving ? "scale(0.97)" : "scale(1)",
          transition: "opacity 380ms ease, transform 780ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* progress ring + counter */}
        <div className="relative grid place-items-center">
          <svg width={R * 2 + 24} height={R * 2 + 24} className="-rotate-90" aria-hidden>
            <circle
              cx={R + 12}
              cy={R + 12}
              r={R}
              fill="none"
              stroke="rgba(237,240,247,0.09)"
              strokeWidth="1.5"
            />
            <circle
              cx={R + 12}
              cy={R + 12}
              r={R}
              fill="none"
              stroke="url(#mpk-load)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 160ms linear" }}
            />
            <defs>
              <linearGradient id="mpk-load" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#35e0ff" />
                <stop offset="55%" stopColor="#9d8cff" />
                <stop offset="100%" stopColor="#ff4d6d" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute grid place-items-center">
            <div className="font-display text-5xl font-bold tabular-nums leading-none text-bone">
              {digits(String(pct).padStart(2, "0"), lang)}
            </div>
            <div className="mt-1 font-mono text-[9px] tracking-[0.36em] text-dim ltr">
              {identity.handle}
            </div>
          </div>
        </div>

        {/* the boot log — one line at a time, previous lines dimmed */}
        <ul className="mt-10 w-[min(78vw,320px)] space-y-1.5 font-mono text-[10px] tracking-[0.14em] ltr">
          {steps.map((s, i) => (
            <li
              key={s}
              className="flex items-center gap-2 transition-opacity duration-500"
              style={{ opacity: i > line ? 0.16 : i === line ? 1 : 0.4 }}
            >
              <span style={{ color: i <= line ? "#35e0ff" : "rgba(237,240,247,0.25)" }}>
                {i < line ? "✓" : i === line ? "▸" : "·"}
              </span>
              <span className={i === line ? "text-bone/85" : "text-dim"}>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* name, pinned to the floor of the screen */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-8 px-6 text-center"
        style={{
          opacity: leaving ? 0 : 1,
          transition: "opacity 300ms ease",
        }}
      >
        <div className="font-mono text-[9px] uppercase tracking-[0.42em] text-bone/30 ltr">
          {t.preloader.tag}
        </div>
      </div>
    </div>
  );
}
