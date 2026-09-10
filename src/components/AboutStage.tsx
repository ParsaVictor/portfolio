import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import Scramble from "./Scramble";
import Timeline from "./Timeline";
import SkillGraph from "./SkillGraph";
import { useLang } from "../i18n/LangProvider";
import { identity } from "../config";
import { digits } from "../lib/num";
import { useHandover } from "../scroll/useHandover";
import { useQuietZone } from "../state/quietZone";

const ACCENT = "#a894ff";

/** One colour per method step, running the site's cool-to-warm journey. */
const STEP_COLORS = ["#35e0ff", "#7cc4ff", "#a894ff", "#ffb454", "#ff6a5e"];

/**
 * About, staged as three acts rather than one long column.
 *
 * Each act announces itself and owns its own screen: the profile, then the
 * stack as a graph, then the method drawing itself out. The stack act claims
 * quiet while it is on screen, so the global particle instrument pulls back and
 * the graph is the only thing moving.
 */
export default function AboutStage() {
  const { t, lang } = useLang();
  const stageRef = useHandover<HTMLDivElement>(0);
  const quietRef = useQuietZone<HTMLDivElement>();

  return (
    <section id="about" className="relative py-16 md:py-20 lg:py-24">
      <div ref={stageRef}>
        {/* ─────────────────────────── ACT I · the profile ───────────── */}
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <ActMark index="I" label={t.about.kicker} accent={ACCENT} />

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14">
            <div className="copy-plate">
              <Reveal variant="clip" duration={950} delay={80}>
                <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-bold leading-[1.15] text-bone">
                  {t.about.titleA}
                  <span className="bg-gradient-to-r from-cyanx to-violetx bg-clip-text text-transparent">
                    {t.about.titleHi}
                  </span>
                </h2>
              </Reveal>

              <Reveal variant="up" duration={850} delay={160}>
                <p className="mt-6 text-[16px] leading-8 text-bone/85">{t.about.p1}</p>
              </Reveal>
              <Reveal variant="up" duration={850} delay={240}>
                <p className="mt-4 text-[16px] leading-8 text-bone/85">{t.about.p2}</p>
              </Reveal>
            </div>

            <Reveal variant="up" duration={950} delay={200} className="lg:self-start">
              <Dossier lang={lang} labels={t.about.dossier} />
            </Reveal>
          </div>

          <Reveal variant="fade" duration={800} delay={120}>
            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-y border-bone/10 py-6 sm:grid-cols-4">
              {t.about.stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-none tabular-nums text-bone">
                    {s.value}
                  </dt>
                  <dd className="mt-2 font-mono text-[10px] uppercase leading-5 tracking-[0.2em] text-dim">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* ───────────────────── ACT II · the stack, given the room ───── */}
        <div
          ref={quietRef}
          className="relative mt-16 flex min-h-[84svh] flex-col justify-center md:mt-20"
        >
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
            <ActMark index="II" label={t.about.skillsLabel} accent="#35e0ff" />
            <Reveal variant="fade" duration={900} delay={120}>
              <p className="mt-4 max-w-xl text-[15px] leading-8 text-bone/70">
                {t.about.stackNote}
              </p>
            </Reveal>
          </div>
          <div className="mx-auto mt-6 w-full max-w-[1400px] px-4 lg:px-10">
            <SkillGraph hub="MPK" />
          </div>
        </div>

        {/* ──────────────────────── ACT III · the method ──────────────── */}
        <div className="mx-auto mt-16 max-w-7xl px-6 md:mt-20 lg:px-10">
          <ActMark index="III" label={t.about.methodKicker} accent={ACCENT} />
          <Reveal variant="clip" duration={900} delay={80}>
            <h3 className="mt-4 max-w-2xl text-[clamp(1.4rem,3.6vw,2.25rem)] font-bold leading-[1.2] text-bone">
              {t.about.methodTitle}
            </h3>
          </Reveal>

          <div className="relative mt-8 overflow-hidden rounded-3xl px-2 py-4 sm:px-6">
            <Timeline items={t.about.method} accent={ACCENT} colors={STEP_COLORS} lang={lang} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** The plate that opens an act. */
function ActMark({ index, label, accent }: { index: string; label: string; accent: string }) {
  return (
    <Reveal variant="fade" duration={700}>
      <div className="flex items-center gap-4">
        <span
          className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-none text-stroke ltr"
          aria-hidden
        >
          {index}
        </span>
        <span className="h-px flex-1" style={{ background: accent, opacity: 0.35 }} />
        <span
          className="font-mono text-[10px] tracking-[0.32em] sm:text-[11px] ltr"
          style={{ color: accent }}
        >
          <Scramble text={label} />
        </span>
      </div>
    </Reveal>
  );
}

function Dossier({
  lang,
  labels,
}: {
  lang: "en" | "fa";
  labels: {
    title: string;
    name: string;
    role: string;
    base: string;
    affiliation: string;
    status: string;
    open: string;
  };
}) {
  const [now, setNow] = useState("");

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: identity.timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date());
    setNow(fmt());
    const id = window.setInterval(() => setNow(fmt()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const rows: [string, string][] = [
    [labels.name, identity.nameEn],
    [labels.role, "AI / Computer-Vision Engineer"],
    [labels.base, (lang === "fa" ? identity.baseFa : identity.baseEn) + " · UTC+3:30"],
    [labels.affiliation, lang === "fa" ? identity.affiliationFa : identity.affiliation],
    ["lat / lon", identity.coords.lat.toFixed(4) + " / " + identity.coords.lon.toFixed(4)],
    ["local time", now],
  ];

  return (
    <div
      dir="ltr"
      className="relative rounded-2xl border border-bone/12 bg-ink/70 p-6 font-mono text-[11px] backdrop-blur-md sm:p-7"
    >
      <Corner className="left-3 top-3 border-l border-t" />
      <Corner className="right-3 top-3 border-r border-t" />
      <Corner className="bottom-3 left-3 border-b border-l" />
      <Corner className="bottom-3 right-3 border-b border-r" />

      <div className="flex items-center justify-between border-b border-bone/10 pb-3">
        <span className="tracking-[0.26em] text-bone/85">{labels.title}</span>
        <span className="text-[10px] text-dim">v1.0</span>
      </div>

      <div className="mt-4 flex items-baseline gap-2 text-bone/50">
        <span style={{ color: ACCENT }}>$</span>
        <Scramble text="whoami --verbose" className="tracking-wider" />
      </div>

      <dl className="mt-4 space-y-2.5">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-3">
            <dt className="text-dim">{k}</dt>
            <dd className="truncate text-bone/85 tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-bone/10 pt-4">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-limex opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-limex" />
        </span>
        <span className="text-bone/80">{labels.status}</span>
        <span className="text-dim">·</span>
        <span className="text-dim">
          {digits(13, lang)} {labels.open}
        </span>
      </div>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={"pointer-events-none absolute h-4 w-4 border-bone/25 " + className}
    />
  );
}
