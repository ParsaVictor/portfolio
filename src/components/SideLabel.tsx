/**
 * The vertical plate that marks the half of a stage the particle cloud owns.
 * It deliberately carries almost no content — the swarm is the content there.
 */
export default function SideLabel({
  index,
  kicker,
  caption,
  accent,
  side = "start",
}: {
  index: string;
  kicker: string;
  caption: string;
  accent: string;
  side?: "start" | "end";
}) {
  return (
    <div
      className={
        "relative hidden h-[64vh] flex-col justify-between lg:flex " +
        (side === "end" ? "items-end text-end" : "items-start")
      }
    >
      <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.4em] text-dim ltr">
        <span className="text-lg font-bold tabular-nums" style={{ color: accent }}>
          {index}
        </span>
        <span className="h-px w-10" style={{ background: accent, opacity: 0.6 }} />
      </div>

      <div
        className="font-mono text-[10px] uppercase tracking-[0.42em] text-bone/35 ltr"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        {kicker}
      </div>

      <p className="max-w-[10rem] font-mono text-[10px] leading-6 tracking-[0.14em] text-dim">
        {caption}
      </p>
    </div>
  );
}
