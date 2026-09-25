import { useLayoutEffect, useRef, type ReactNode } from "react";

export type LimelightItem = {
  id: string;
  label: ReactNode;
  /** Stage colour (e.g. STAGE_COLORS) the limelight tints itself when this item is active. */
  color?: string;
};

type LimelightNavProps = {
  items: LimelightItem[];
  activeIndex: number;
  onSelect: (id: string, index: number) => void;
  className?: string;
};

/**
 * A sliver of moonlight overhead that slides to the active nav label and
 * spills a soft cone of its stage colour down onto it — the top-nav echo
 * of the scroll spine.
 */
export default function LimelightNav({ items, activeIndex, onSelect, className = "" }: LimelightNavProps) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const limelightRef = useRef<HTMLSpanElement>(null);
  const readyRef = useRef(false);

  useLayoutEffect(() => {
    const limelight = limelightRef.current;
    const active = itemRefs.current[activeIndex];
    if (!limelight || !active) return;

    const left = active.offsetLeft + active.offsetWidth / 2 - limelight.offsetWidth / 2;
    limelight.style.left = `${left}px`;

    const color = items[activeIndex]?.color;
    if (color) {
      limelight.style.background = color;
      limelight.style.boxShadow = `0 0 16px 2px ${color}88`;
    }

    if (!readyRef.current) {
      // First placement must be instant (no glide in from off-screen);
      // only arm the transition once the bar is already where it belongs.
      const id = window.setTimeout(() => {
        readyRef.current = true;
        limelight.style.transition =
          "left 420ms cubic-bezier(0.22, 1, 0.36, 1), background 300ms ease, box-shadow 300ms ease";
      }, 30);
      return () => window.clearTimeout(id);
    }
  }, [activeIndex, items]);

  return (
    <nav className={`relative flex items-center ${className}`}>
      {items.map((item, index) => {
        const active = index === activeIndex;
        const color = items[activeIndex]?.color;
        return (
          <button
            key={item.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            onClick={() => onSelect(item.id, index)}
            data-cursor-hover
            className={`relative z-10 pb-1 pt-3 text-xs tracking-wide transition-colors duration-300 ${
              active ? "text-bone" : "text-bone/60 hover:text-bone"
            }`}
            style={active && color ? { textShadow: `0 2px 14px ${color}77` } : undefined}
          >
            {item.label}
          </button>
        );
      })}
      {/* the moon itself: a thin sliver overhead, sitting above the active label */}
      <span
        ref={limelightRef}
        aria-hidden
        className="pointer-events-none absolute top-[-2px] z-0 h-[3px] w-6 rounded-full bg-cyanx"
        style={{ left: "-999px" }}
      >
        {/* its own halo */}
        <span
          className="absolute left-1/2 top-1/2 h-4 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-sm"
          style={{ background: "inherit" }}
        />
        {/* moonlight: a cone that widens as it falls, fading out over the label below */}
        <span
          className="absolute left-1/2 top-0 h-10 w-24 -translate-x-1/2 opacity-45 blur-[2px]"
          style={{
            background: "inherit",
            clipPath: "polygon(44% 0%, 56% 0%, 92% 100%, 8% 100%)",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </span>
    </nav>
  );
}
