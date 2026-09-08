import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n/LangProvider";
import { identity } from "../config";
import { digits } from "../lib/num";

/**
 * Deliberately timer-driven rather than animation-driven: the curtain must lift
 * even if requestAnimationFrame is being throttled, so the site is never trapped
 * behind it.
 */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const { t, lang } = useLang();
  const [progress, setProgress] = useState(0);
  const [lifting, setLifting] = useState(false);
  const [gone, setGone] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const DUR = 1250;
    const start = performance.now();
    let raf = 0;

    const tick = () => {
      const pct = Math.min(100, Math.round(((performance.now() - start) / DUR) * 100));
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // hard timers — independent of the rAF counter above
    const t1 = window.setTimeout(() => {
      setProgress(100);
      setLifting(true);
      doneRef.current();
    }, DUR + 200);
    const t2 = window.setTimeout(() => setGone(true), DUR + 1100);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-ink transition-[clip-path,opacity] duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
      style={{
        clipPath: lifting ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        opacity: lifting ? 0.999 : 1,
      }}
      aria-hidden={lifting}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(53,224,255,0.14),transparent_65%)]" />
      <div className="relative flex flex-col items-center gap-6">
        <div className="font-mono text-[10px] tracking-[0.5em] text-dim ltr">
          {identity.handle}
        </div>
        <div className="text-6xl font-bold tracking-tight text-bone tabular-nums sm:text-7xl">
          <span className="bg-gradient-to-r from-cyanx via-violetx to-rose bg-clip-text text-transparent">
            {digits(String(progress).padStart(2, "0"), lang)}%
          </span>
        </div>
        <div className="h-px w-56 overflow-hidden bg-bone/10 sm:w-72">
          <div
            className="h-full bg-gradient-to-r from-cyanx via-violetx to-rose transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="font-mono text-[10px] tracking-[0.35em] text-dim ltr">
          {t.preloader.status}
        </div>
      </div>
    </div>
  );
}
