import { useEffect, useState } from "react";
import { useLang } from "../i18n/LangProvider";
import { STAGE_COLORS } from "../config";
import { onScroll } from "../scroll/scrollStore";
import { scrollToId } from "../scroll/useSmoothScroll";

const IDS = ["hero", "cv", "data", "web", "contact"] as const;

export default function SectionRail() {
  const { t } = useLang();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = IDS.map((id) => document.getElementById(id));
    return onScroll(() => {
      const center = window.scrollY + window.innerHeight * 0.4;
      let cur = 0;
      els.forEach((el, i) => {
        if (el && el.offsetTop <= center) cur = i;
      });
      setActive(cur);
    });
  }, []);

  const labels = [t.rail.hero, t.rail.cv, t.rail.data, t.rail.web, t.rail.contact];

  return (
    <nav className="fixed start-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-5 lg:flex">
      {IDS.map((id, i) => {
        const on = active === i;
        const color = STAGE_COLORS[id];
        return (
          <button
            key={id}
            onClick={() => scrollToId(id)}
            data-cursor-hover
            className="group relative flex items-center"
            aria-label={labels[i]}
          >
            <span
              className="h-2.5 w-2.5 rounded-full border transition-all duration-300"
              style={{
                borderColor: on ? color : "rgba(237,240,247,0.3)",
                background: on ? color : "transparent",
                boxShadow: on ? `0 0 12px 2px ${color}aa` : "none",
                transform: on ? "scale(1.35)" : "scale(1)",
              }}
            />
            <span className="pointer-events-none absolute start-6 whitespace-nowrap rounded-md border border-bone/10 bg-ink/80 px-2 py-1 font-mono text-[10px] text-bone/70 opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
              {labels[i]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
