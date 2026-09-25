import { Sparkles } from "lucide-react";

/** The "don't miss this one" pill — violet, same accent as a featured card's glow ring. */
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
      {label}
    </span>
  );
}
