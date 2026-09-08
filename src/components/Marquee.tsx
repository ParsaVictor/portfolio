import { useLang } from "../i18n/LangProvider";

export default function Marquee() {
  const { t } = useLang();
  const words = t.marquee;
  const run = [...words, ...words, ...words];

  return (
    <div className="relative z-10 overflow-hidden border-y border-bone/10 bg-ink/40 py-5 backdrop-blur-sm">
      <div className="flex w-max animate-[mpk-marquee_32s_linear_infinite] gap-8">
        {run.map((w, i) => (
          <span key={i} className="flex shrink-0 items-center gap-8 font-mono text-sm tracking-[0.18em] text-bone/45">
            {w}
            <span className="text-cyanx">✦</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes mpk-marquee { from { transform: translateX(0) } to { transform: translateX(-33.333%) } }`}</style>
    </div>
  );
}
