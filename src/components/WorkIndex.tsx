import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Globe, Lock, GitFork } from "lucide-react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SpotlightCard from "./bits/SpotlightCard";
import CountUp from "./bits/CountUp";
import FeaturedBadge, { NewBadge } from "./FeaturedBadge";
import { StageCopy } from "./VisionRail";
import Reveal from "./Reveal";
import { GithubIcon } from "./icons";
import { useLang } from "../i18n/LangProvider";
import {
  KINDS,
  allProjects,
  domain,
  kindMeta,
  type Kind,
  type Project,
} from "../data/projects";
import { digits } from "../lib/num";
import { useHandover } from "../scroll/useHandover";
import { measureStages } from "../scroll/scrollStore";
import { useQuietZone } from "../state/quietZone";
import { openProject, shouldOpenInPage } from "../state/projectModal";

gsap.registerPlugin(Flip, ScrollTrigger);

const ACCENT = "#8fd67a";
type Filter = Kind | "all";

/**
 * The index — every project on one board, sorted by what kind of work it is.
 *
 * The chapters above tell the work as a story, one scroll grammar each; this
 * is the catalogue a visitor reaches for when they only want, say, the
 * products. The four kind cards define each kind and double as the filter.
 * Cards are never unmounted: a filter flips `display`, and GSAP Flip carries
 * every card from where it was to where it lands, so the board rearranges
 * instead of blinking.
 */
export default function WorkIndex() {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<Filter>("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const quietRef = useQuietZone<HTMLDivElement>();
  const stageRef = useHandover<HTMLDivElement>(3);

  const counts = useMemo(() => {
    const c = { all: allProjects.length } as Record<Filter, number>;
    for (const k of KINDS) c[k.id] = allProjects.filter((p) => p.kind === k.id).length;
    return c;
  }, []);
  const fields = useMemo(() => new Set(allProjects.map((p) => p.domainEn)).size, []);
  const live = useMemo(() => allProjects.filter((p) => p.website).length, []);

  const apply = useCallback((next: Filter) => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-kind]"));
    const show = (el: HTMLElement) => next === "all" || el.dataset.kind === next;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const settle = () => {
      // the board changed height: everything scroll-driven below it moves
      ScrollTrigger.refresh();
      measureStages();
    };

    if (reduce) {
      cards.forEach((el) => (el.style.display = show(el) ? "" : "none"));
      settle();
      return;
    }

    const state = Flip.getState(cards, { props: "opacity" });
    cards.forEach((el) => (el.style.display = show(el) ? "" : "none"));
    Flip.from(state, {
      duration: 0.7,
      ease: "power3.inOut",
      absolute: true,
      stagger: 0.025,
      nested: true,
      onEnter: (els) =>
        gsap.fromTo(els, { opacity: 0, scale: 0.92, y: 18 }, { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "power3.out", delay: 0.15 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.35, ease: "power2.in" }),
      onComplete: settle,
    });
  }, []);

  const choose = (next: Filter) => {
    const target = next === filter ? "all" : next;
    setFilter(target);
    apply(target);
  };

  const meta = {
    index: digits(counts.all, lang),
    kicker: t.index.kicker,
    titleA: t.index.titleA,
    titleHi: t.index.titleHi,
    desc: t.index.desc,
  };

  const summary: { n: number; label: string }[] = [
    { n: counts.all, label: t.index.projects },
    { n: KINDS.length, label: t.index.kinds },
    { n: fields, label: t.index.fields },
    { n: live, label: t.index.live },
  ];
  const toFa = lang === "fa" ? (s: string) => digits(s, "fa") : undefined;

  return (
    <section id="index" className="relative py-24 md:py-28 lg:py-32">
      <div ref={quietRef}>
        <div ref={stageRef} className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
          {/* ── heading + the board's vital signs ─────────────────────── */}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
            <div className="copy-plate">
              <StageCopy accent={ACCENT} meta={meta} />
            </div>
            <Reveal variant="up" duration={850} delay={160}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-bone/10 py-5 sm:grid-cols-4">
                {summary.map((s) => (
                  <div key={s.label}>
                    <dt className="text-[clamp(1.6rem,3.4vw,2.4rem)] font-bold leading-none tabular-nums text-bone">
                      <CountUp key={lang} to={s.n} duration={1.6} easing="expo" localize={toFa} />
                    </dt>
                    <dd className="mt-2 font-mono text-[10px] uppercase leading-5 tracking-[0.2em] text-dim">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* ── the four kinds: definition and filter in one ─────────── */}
          <Reveal variant="up" duration={900} delay={100}>
            <div className="mt-14 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] tracking-[0.3em] text-dim">{t.index.kindsLabel}</p>
              <button
                type="button"
                onClick={() => choose("all")}
                aria-pressed={filter === "all"}
                data-cursor-plain
                className={
                  "rounded-full border px-4 py-1.5 font-mono text-[11px] tracking-[0.16em] transition-colors " +
                  (filter === "all"
                    ? "border-bone/60 bg-bone text-ink"
                    : "border-bone/20 text-bone/75 hover:border-bone/45 hover:text-bone")
                }
              >
                {t.index.all} · {digits(counts.all, lang)}
              </button>
            </div>
          </Reveal>

          <div data-cursor-plain className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {KINDS.map((k, i) => {
              const on = filter === k.id;
              const dim = filter !== "all" && !on;
              return (
                <Reveal key={k.id} variant="up" duration={850} delay={120 + i * 70}>
                  <SpotlightCard
                    spotlightColor={k.color}
                    intensity={0.2}
                    spotlightSize={260}
                    borderGlow={0.85}
                    className="h-full !rounded-2xl !p-0 transition-opacity duration-300"
                    style={
                      {
                        "--spotlight-card-surface": on ? "rgba(26,22,19,0.96)" : "rgba(19,16,14,0.88)",
                        "--spotlight-card-border": on ? k.color + "aa" : "rgba(242,236,225,0.1)",
                        opacity: dim ? 0.55 : 1,
                      } as React.CSSProperties
                    }
                  >
                    <button
                      type="button"
                      onClick={() => choose(k.id)}
                      aria-pressed={on}
                      className="flex h-full w-full flex-col items-start gap-2 p-4 text-start sm:p-5"
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: k.color, boxShadow: on ? `0 0 12px 2px ${k.color}` : "none" }}
                          />
                          <span className="font-mono text-[10px] tracking-[0.2em]" style={{ color: k.color }}>
                            {digits(String(i + 1).padStart(2, "0"), lang)}
                          </span>
                        </span>
                        <span className="text-2xl font-bold leading-none tabular-nums text-bone sm:text-3xl">
                          {digits(counts[k.id], lang)}
                        </span>
                      </span>
                      <span className="mt-1 text-[15px] font-bold leading-snug text-bone sm:text-base">
                        {lang === "fa" ? k.fa : k.en}
                      </span>
                      <span className="hidden text-[13px] leading-6 text-bone/65 sm:block">
                        {lang === "fa" ? k.noteFa : k.noteEn}
                      </span>
                    </button>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </div>

          <p className="mt-8 font-mono text-[10px] tracking-[0.26em] text-dim" aria-live="polite">
            {t.index.showing} ·{" "}
            <span className="text-bone/80">
              {filter === "all" ? t.index.all : lang === "fa" ? kindMeta(filter).fa : kindMeta(filter).en}
            </span>{" "}
            · {digits(counts[filter], lang)}
          </p>

          {/* ── the board ───────────────────────────────────────────── */}
          <div
            ref={gridRef}
            className="relative mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5"
          >
            {allProjects.map((p, i) => (
              <IndexCard key={p.id} project={p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function IndexCard({ project, index }: { project: Project; index: number }) {
  const { t, lang } = useLang();
  const k = kindMeta(project.kind);
  const AccessIcon = project.access === "private" ? Lock : project.access === "contrib" ? GitFork : GithubIcon;

  return (
    <div data-kind={project.kind} className="min-w-0">
      <SpotlightCard
        spotlightColor={project.accent}
        intensity={0.16}
        spotlightSize={300}
        borderGlow={0.9}
        className="group h-full !rounded-2xl !p-0"
        style={
          {
            "--spotlight-card-surface": "rgba(19,16,14,0.94)",
            "--spotlight-card-border": "rgba(242,236,225,0.1)",
          } as React.CSSProperties
        }
      >
        <a
          href={project.url}
          target="_blank"
          rel="noreferrer"
          data-cursor-hover
          onClick={(e) => {
            if (!shouldOpenInPage(e)) return;
            e.preventDefault();
            openProject(project);
          }}
          className="flex h-full flex-col"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl bg-black">
            {project.image && (
              <img
                src={project.image}
                alt={project.title}
                loading={index < 3 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
              />
            )}
            <div className="absolute start-2 top-2 flex flex-wrap gap-1.5 sm:start-3 sm:top-3">
              {project.isNew && <NewBadge label={t.project.isNew} />}
              {project.featured && <FeaturedBadge label={t.project.featured} className="hidden sm:inline-flex" />}
            </div>
            <span
              className="absolute bottom-2 start-2 hidden rounded-md px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur-sm ltr sm:bottom-3 sm:start-3 sm:inline-block"
              style={{ background: "rgba(8,7,6,0.72)", color: project.accent }}
            >
              {project.stat}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-2 p-3 sm:p-5">
            <span className="font-mono text-[9.5px] tracking-[0.18em] sm:text-[10px]" style={{ color: k.color }}>
              {lang === "fa" ? k.fa : k.en.toUpperCase()}
            </span>
            <h3 className="text-[14px] font-bold leading-snug text-bone sm:text-lg ltr">{project.title}</h3>
            <p className="flex items-center gap-1.5 text-[12px] text-bone/60 sm:text-[13px]">
              <AccessIcon size={12} />
              <span className="truncate">
                {domain(project, lang)} · {t.index.access[project.access]}
              </span>
            </p>
            <div className="mt-auto hidden flex-wrap gap-1.5 pt-2 sm:flex">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-bone/10 px-2.5 py-1 font-mono text-[10px] text-bone/80 ltr"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span
              className="mt-1 hidden items-center gap-1 text-xs font-semibold opacity-80 transition-opacity group-hover:opacity-100 sm:flex"
              style={{ color: project.accent }}
            >
              {project.website && project.access === "private" ? <Globe size={13} /> : null}
              {t.project.open}
              <ArrowUpRight size={13} />
            </span>
          </div>
        </a>
      </SpotlightCard>
    </div>
  );
}
