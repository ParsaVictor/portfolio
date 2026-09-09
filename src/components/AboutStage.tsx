import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "./Reveal";
import Scramble from "./Scramble";
import Timeline from "./Timeline";
import { useLang } from "../i18n/LangProvider";
import { identity } from "../config";
import { clamp, digits } from "../lib/num";
import { useHandover } from "../scroll/useHandover";

gsap.registerPlugin(ScrollTrigger);

const ACCENT = "#a894ff";

/** Relative emphasis across the stack, not a self-assessment score. */
const CAPABILITIES: { label: string; level: number }[] = [
  { label: "Python · PyTorch", level: 0.95 },
  { label: "Computer vision · YOLO", level: 0.93 },
  { label: "OpenCV · classical CV", level: 0.88 },
  { label: "Data / geometry", level: 0.8 },
  { label: "TypeScript · React", level: 0.78 },
  { label: "Infra · Docker · CI", level: 0.65 },
];

export default function AboutStage() {
  const { t, lang } = useLang();
  const stageRef = useHandover<HTMLDivElement>(0);

  return (
    <section id="about" className="relative py-16 md:py-20 lg:py-24">
      <div ref={stageRef} className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* ── header + dossier ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14">
          <div>
            <Reveal variant="fade" duration={700}>
              <p className="mb-4 flex items-center gap-3 font-mono text-[10px] tracking-[0.28em] text-violetx sm:text-[11px] sm:tracking-[0.3em] ltr">
                <span className="h-px w-8 bg-violetx" />
                <Scramble text={t.about.kicker} />
              </p>
            </Reveal>

            <Reveal variant="clip" duration={950} delay={80}>
              <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-bold leading-[1.15] text-bone">
                {t.about.titleA}
                <span className="bg-gradient-to-r from-cyanx to-violetx bg-clip-text text-transparent">
                  {t.about.titleHi}
                </span>
              </h2>
            </Reveal>

            <Reveal variant="up" duration={850} delay={160}>
              <p className="mt-6 text-[16px] leading-8 text-bone/85 sm:text-base">{t.about.p1}</p>
            </Reveal>
            <Reveal variant="up" duration={850} delay={240}>
              <p className="mt-4 text-[16px] leading-8 text-bone/85 sm:text-base">{t.about.p2}</p>
            </Reveal>

            <Reveal variant="up" duration={850} delay={320}>
              <Capabilities label={t.about.skillsLabel} lang={lang} />
            </Reveal>
          </div>

          <Reveal variant="up" duration={950} delay={200} className="lg:self-start">
            <Dossier lang={lang} labels={t.about.dossier} />
          </Reveal>
        </div>

        {/* ── stat strip ───────────────────────────────────────────────── */}
        <Reveal variant="fade" duration={800} delay={120}>
          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-y border-bone/10 py-6 sm:grid-cols-4">
            {t.about.stats.map((s) => (
              <div key={s.label}>
                <dt className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-none text-bone tabular-nums">
                  {s.value}
                </dt>
                <dd className="mt-2 font-mono text-[10px] uppercase leading-5 tracking-[0.2em] text-dim">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* ── the method, drawn as you scroll ──────────────────────────── */}
        <div className="mt-14 md:mt-16">
          <Reveal variant="fade" duration={700}>
            <p className="mb-3 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] text-violetx ltr">
              <span className="h-px w-8 bg-violetx" />
              <Scramble text={t.about.methodKicker} />
            </p>
          </Reveal>
          <Reveal variant="clip" duration={900} delay={80}>
            <h3 className="max-w-2xl text-[clamp(1.4rem,3.6vw,2.25rem)] font-bold leading-[1.2] text-bone">
              {t.about.methodTitle}
            </h3>
          </Reveal>

          <div className="mt-8">
            <Timeline items={t.about.method} accent={ACCENT} lang={lang} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- capabilities */

function Capabilities({ label, lang }: { label: string; lang: "en" | "fa" }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const bars = Array.from(el.querySelectorAll<HTMLElement>("[data-bar]"));
    const paint = (p: number) => {
      bars.forEach((b, i) => {
        const level = Number(b.dataset.level || 0);
        // staggered: each bar starts a little after the previous
        const local = clamp((p - i * 0.06) / 0.5, 0, 1);
        b.style.transform = "scaleX(" + level * local + ")";
      });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(1);
      return;
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      end: "bottom 55%",
      onUpdate: (self) => paint(self.progress),
      onRefresh: (self) => paint(self.progress),
    });
    paint(0);
    return () => st.kill();
  }, []);

  return (
    <div ref={wrapRef} className="mt-8">
      <div className="mb-4 font-mono text-[10px] tracking-[0.3em] text-dim ltr">{label}</div>
      <div className="space-y-2.5">
        {CAPABILITIES.map((c) => (
          <div key={c.label} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
            <span className="font-mono text-[11px] tracking-wider text-bone/85 ltr">{c.label}</span>
            <span className="font-mono text-[10px] tabular-nums text-dim ltr">
              {digits(Math.round(c.level * 100), lang)}
            </span>
            <div className="col-span-2 h-[3px] overflow-hidden rounded-full bg-bone/8">
              <div
                data-bar
                data-level={c.level}
                className="h-full origin-left rounded-full"
                style={{
                  background: "linear-gradient(90deg, #35e0ff, " + ACCENT + ")",
                  transform: "scaleX(0)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- dossier */

function Dossier({
  lang,
  labels,
}: {
  lang: "en" | "fa";
  labels: { title: string; name: string; role: string; base: string; status: string; open: string };
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
    [labels.base, "Isfahan, Iran · UTC+3:30"],
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
          {digits(11, lang)} {labels.open}
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
