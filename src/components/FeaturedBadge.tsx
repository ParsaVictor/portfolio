import { Sparkles } from "lucide-react";
import ShinyText from "./bits/ShinyText";

/**
 * The "don't miss this one" pill — violet, same accent as a featured card's
 * glow ring. A slow sheen (React Bits' ShinyText) crosses the label every few
 * seconds, so the eye finds it without the pill ever shouting.
 */
export default function FeaturedBadge({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`pointer-events-none inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-widest ltr backdrop-blur-sm ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(168,148,255,0.32), rgba(168,148,255,0.14))",
        color: "#e4defd",
        border: "1px solid rgba(168,148,255,0.55)",
      }}
    >
      <Sparkles size={11} />
      <ShinyText text={label} color="#e4defd" shineColor="#ffffff" speed={2.6} delay={1.8} />
    </span>
  );
}

/** Small mark for work shipped since the last update. */
export function NewBadge({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`pointer-events-none inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.22em] backdrop-blur-sm ${className}`}
      style={{
        background: "rgba(143,214,122,0.16)",
        color: "#c9f2bd",
        border: "1px solid rgba(143,214,122,0.55)",
      }}
    >
      <ShinyText text={label} color="#c9f2bd" shineColor="#ffffff" speed={2.2} delay={2.4} />
    </span>
  );
}
