import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, GitFork, Globe, Lock } from "lucide-react";
import gsap from "gsap";
import CountUp from "./bits/CountUp";
import FeaturedBadge, { NewBadge } from "./FeaturedBadge";
import Scramble from "./Scramble";
import Reveal from "./Reveal";
import { GithubIcon } from "./icons";
import { useLang } from "../i18n/LangProvider";
import {
  KINDS,
  allProjects,
  desc,
  domain,
  type Kind,
  type KindMeta,
  type Project,
} from "../data/projects";
import { digits } from "../lib/num";
import { useHandover } from "../scroll/useHandover";
import { useQuietZone } from "../state/quietZone";
import { openProject, shouldOpenInPage } from "../state/projectModal";

const ACCENT = "#8fd67a";

/**
 * The index — a switchboard rather than a wall.
 *
 * All four kinds of work are visible at once, each with its count and a fanned
 * stack of its covers, so one glance gives the shape of the whole body of work.
 * Only the kind you point at opens: its projects slide into the middle column
 * and the one under the pointer fills the inspection frame on the right. On a
 * phone the kinds become a 2×2 switch and the projects a swipeable strip.
 */
export default function WorkIndex() {
  const { t, lang } = useLang();
  const [active, setActive] = useState<Kind>(KINDS[0].id);
  const quietRef = useQuietZone<HTMLDivElement>();
  const stageRef = useHandover<HTMLDivElement>(3);

  const byKind = useMemo(() => {
    const m = {} as Record<Kind, Project[]>;
    for (const k of KINDS) m[k.id] = allProjects.filter((p) => p.kind === k.id);
    return m;
  }, []);
  const fields = useMemo(() => new Set(allProjects.map((p) => p.domainEn)).size, []);
  const live = useMemo(() => allProjects.filter((p) => p.website).length, []);
  const kind = KINDS.find((k) => k.id === active)!;
  const fa = lang === "fa";
  const toFa = fa ? (s: string) => digits(s, "fa") : undefined;

  const vitals = [
    { n: allProjects.length, label: t.index.projects },
    { n: KINDS.length, label: t.index.kinds },
    { n: fields, label: t.index.fields },
    { n: live, label: t.index.live },
  ];

  return (
    <section id="index" className="relative py-20 md:py-24">
      <div ref={quietRef}>
        <div ref={stageRef} className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
          {/* ── one compact header line: what this is, and its vital signs ── */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Reveal variant="fade" duration={700}>
                <p className="mb-3 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] ltr sm:text-[11px]" style={{ color: ACCENT }}>
                  <span className="font-bold">∑</span>
                  <span className="h-px w-8" style={{ backgroundColor: ACCENT }} />
                  <Scramble text={t.index.kicker} />
                </p>
              </Reveal>
              <Reveal variant="clip" duration={900} delay={80}>
                <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.12] text-bone">
                  {t.index.titleA}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: "linear-gradient(90deg, " + ACCENT + ", #fff)" }}
                  >
                    {t.index.titleHi}
                  </span>
                </h2>
              </Reveal>
            </div>
            <Reveal variant="up" duration={800} delay={160}>
              <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-2.5 sm:grid-cols-4 lg:grid-cols-2">
                {vitals.map((v) => (
                  <div key={v.label} className="flex items-baseline gap-2">
                    <dt className="text-2xl font-bold tabular-nums leading-none text-bone">
                      <CountUp key={lang} to={v.n} duration={1.4} easing="expo" localize={toFa} />
                    </dt>
                    <dd className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">{v.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal variant="up" duration={900} delay={120}>
            <div className="mt-10 lg:grid lg:h-[min(620px,calc(100svh-210px))] lg:min-h-[520px] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.1fr)_minmax(0,1.2fr)] lg:gap-5">
              {/* ── the switchboard: every kind at a glance ─────────────── */}
              <div
                role="tablist"
                aria-label={t.index.kindsLabel}
                data-cursor-plain
                className="grid grid-cols-2 gap-2.5 lg:flex lg:flex-col lg:gap-2"
              >
                {KINDS.map((k, i) => (
                  <KindTab
                    key={k.id}
                    meta={k}
                    index={i}
                    projects={byKind[k.id]}
                    on={k.id === active}
                    lang={lang}
                    onSelect={() => setActive(k.id)}
                  />
                ))}
              </div>

              <KindStage key={active} kind={kind} projects={byKind[active]} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ kind tabs */

function KindTab({
  meta,
  index,
  projects,
  on,
  lang,
  onSelect,
}: {
  meta: KindMeta;
  index: number;
  projects: Project[];
  on: boolean;
  lang: "en" | "fa";
  onSelect: () => void;
}) {
  const hoverTimer = useRef(0);
  const stack = projects.filter((p) => p.image).slice(0, 4);

  return (
    <button
      type="button"
      role="tab"
      id={"kind-tab-" + meta.id}
      aria-selected={on}
      aria-controls="kind-panel"
      onClick={onSelect}
      // pointer users browse by hovering; a short intent delay stops a pass
      // across the column from flicking through every kind on the way
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        hoverTimer.current = window.setTimeout(onSelect, 140);
      }}
      onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
      className="group relative flex min-h-[86px] flex-col justify-between overflow-hidden rounded-2xl border p-3.5 text-start transition-[background-color,border-color] duration-300 lg:min-h-0 lg:flex-1 lg:p-5"
      style={{
        borderColor: on ? meta.color + "99" : "rgba(242,236,225,0.09)",
        background: on
          ? `linear-gradient(120deg, ${meta.color}24, rgba(19,16,14,0.94) 62%)`
          : "rgba(19,16,14,0.72)",
      }}
    >
      {/* a light bar that fills along the active tab */}
      <span
        aria-hidden
        className="absolute inset-y-3 start-0 w-[3px] origin-center rounded-full transition-transform duration-500"
        style={{ background: meta.color, transform: on ? "scaleY(1)" : "scaleY(0)" }}
      />

      <span className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] tracking-[0.22em]" style={{ color: meta.color }}>
          {digits(String(index + 1).padStart(2, "0"), lang)}
        </span>
        <span
          className="text-xl font-bold tabular-nums leading-none transition-colors lg:text-3xl"
          style={{ color: on ? meta.color : "rgba(242,236,225,0.8)" }}
        >
          {digits(projects.length, lang)}
        </span>
      </span>

      <span className="mt-2 flex items-end justify-between gap-3">
        <span
          className={
            "min-w-0 text-[14px] font-bold leading-snug transition-colors lg:text-lg " +
            (on ? "text-bone" : "text-bone/70 group-hover:text-bone")
          }
        >
          {lang === "fa" ? meta.fa : meta.en}
        </span>

        {/* the kind's covers, stacked when resting and fanned when chosen */}
        <span dir="ltr" aria-hidden className="relative hidden h-10 w-[108px] shrink-0 lg:block">
          {stack.map((p, i) => {
            const n = stack.length;
            const spread = on ? 1 : 0.32;
            const x = (n - 1 - i) * 16 * spread;
            const r = (i - (n - 1) / 2) * (on ? 7 : 3);
            return (
              <img
                key={p.id}
                src={p.image}
                alt=""
                loading="lazy"
                className="absolute end-0 top-0 h-10 w-14 rounded-md object-cover shadow-[0_6px_16px_-6px_rgba(0,0,0,0.9)] ring-1 ring-black/60 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform: `translateX(${-x}px) rotate(${r}deg)`,
                  zIndex: n - i,
                }}
              />
            );
          })}
        </span>
      </span>
    </button>
  );
}

/* ----------------------------------------------------------- kind stage */

function KindStage({ kind, projects }: { kind: KindMeta; projects: Project[] }) {
  const { t, lang } = useLang();
  const [focus, setFocus] = useState(projects[0]);
  const listRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fa = lang === "fa";

  // the stage remounts per kind; deal its rows in and settle the frame
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-row]", {
        opacity: 0,
        x: fa ? -18 : 18,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.045,
      });
      gsap.from(previewRef.current, { opacity: 0, scale: 0.97, duration: 0.6, ease: "power3.out" });
    }, listRef.current?.parentElement ?? undefined);
    return () => ctx.revert();
  }, [fa]);

  // swapping the preview: a quick dip so the new cover never pops in raw
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!imgRef.current) return;
    gsap.fromTo(imgRef.current, { opacity: 0.35, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" });
  }, [focus]);

  return (
    <div
      id="kind-panel"
      role="tabpanel"
      aria-labelledby={"kind-tab-" + kind.id}
      className="contents"
    >
      {/* ── middle: what this kind is + its projects ─────────────────── */}
      <div ref={listRef} className="mt-5 flex min-h-0 flex-col lg:mt-0">
        <p className="text-[13px] leading-6 text-bone/65 lg:text-[14px]">{fa ? kind.noteFa : kind.noteEn}</p>

        {/* desktop: a list of rows; phones: a swipeable strip of cards */}
        <div
          data-lenis-prevent
          data-cursor-plain
          className="mpk-scroll -mx-5 mt-4 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 lg:scroll-px-0 lg:mx-0 lg:min-h-0 lg:flex-1 lg:snap-none lg:flex-col lg:gap-1.5 lg:overflow-y-auto lg:overflow-x-visible lg:px-0 lg:pb-0 lg:pe-1"
        >
          {projects.map((p, i) => (
            <ProjectRow
              key={p.id}
              project={p}
              index={i}
              on={focus.id === p.id}
              color={kind.color}
              onFocus={() => setFocus(p)}
            />
          ))}
        </div>
      </div>

      {/* ── right: the inspection frame ──────────────────────────────── */}
      <div ref={previewRef} className="hidden min-h-0 lg:flex">
        <a
          href={focus.url}
          target="_blank"
          rel="noreferrer"
          data-cursor-hover
          onClick={(e) => {
            if (!shouldOpenInPage(e)) return;
            e.preventDefault();
            openProject(focus);
          }}
          className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-bone/10 bg-ink-2/90"
        >
          <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
            {focus.image && (
              <img
                ref={imgRef}
                src={focus.image}
                alt={focus.title}
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
              />
            )}
            {/* corner brackets — the frame a detector draws */}
            {["start-3 top-3 border-s border-t", "end-3 top-3 border-e border-t", "start-3 bottom-3 border-s border-b", "end-3 bottom-3 border-e border-b"].map((c) => (
              <span key={c} aria-hidden className={"absolute h-5 w-5 " + c} style={{ borderColor: kind.color }} />
            ))}
            <div className="absolute start-5 top-5 flex gap-1.5">
              {focus.isNew && <NewBadge label={t.project.isNew} />}
              {focus.featured && <FeaturedBadge label={t.project.featured} />}
            </div>
            <span
              className="absolute bottom-5 start-5 rounded-md px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur-sm ltr"
              style={{ background: "rgba(8,7,6,0.75)", color: focus.accent }}
            >
              {focus.stat}
            </span>
          </div>
          <div className="shrink-0 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold leading-snug text-bone ltr">{focus.title}</h3>
              <ArrowUpRight
                size={18}
                className="mt-1 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                style={{ color: focus.accent }}
              />
            </div>
            <p className="mt-2 line-clamp-3 text-[13.5px] leading-6 text-bone/75">{desc(focus, lang)}</p>
          </div>
        </a>
      </div>
    </div>
  );
}

function ProjectRow({
  project,
  index,
  on,
  color,
  onFocus,
}: {
  project: Project;
  index: number;
  on: boolean;
  color: string;
  onFocus: () => void;
}) {
  const { t, lang } = useLang();
  const AccessIcon =
    project.access === "private" ? Lock : project.access === "contrib" ? GitFork : GithubIcon;

  return (
    <a
      data-row
      href={project.url}
      target="_blank"
      rel="noreferrer"
      onPointerEnter={(e) => e.pointerType === "mouse" && onFocus()}
      onFocus={onFocus}
      onClick={(e) => {
        if (!shouldOpenInPage(e)) return;
        e.preventDefault();
        openProject(project);
      }}
      className={
        "group relative flex w-[68vw] max-w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border transition-colors duration-200 sm:w-[46vw] " +
        "lg:w-auto lg:max-w-none lg:flex-row lg:items-center lg:gap-3 lg:p-2 lg:pe-3"
      }
      style={{
        borderColor: on ? color + "80" : "rgba(242,236,225,0.08)",
        background: on ? "rgba(242,236,225,0.06)" : "rgba(19,16,14,0.7)",
      }}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-black lg:aspect-auto lg:h-11 lg:w-[72px] lg:rounded-lg">
        {project.image && (
          <img src={project.image} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
        {project.isNew && (
          <span className="absolute start-2 top-2 lg:hidden">
            <NewBadge label={t.project.isNew} />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 p-3 lg:p-0">
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[10px] tabular-nums text-dim lg:inline">
            {digits(String(index + 1).padStart(2, "0"), lang)}
          </span>
          <span className="truncate text-[14px] font-semibold text-bone ltr">{project.title}</span>
          {project.isNew && (
            <span
              aria-label={t.project.isNew}
              className="hidden h-1.5 w-1.5 shrink-0 rounded-full lg:inline-block"
              style={{ background: "#8fd67a", boxShadow: "0 0 8px #8fd67a" }}
            />
          )}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-bone/55">
          <AccessIcon size={11} />
          <span className="truncate">
            {domain(project, lang)} · {t.index.access[project.access]}
          </span>
          {project.website && <Globe size={11} className="shrink-0" style={{ color }} />}
        </p>
        <span className="mt-2 inline-block font-mono text-[10px] tracking-widest ltr lg:hidden" style={{ color: project.accent }}>
          {project.stat}
        </span>
      </div>

      <ArrowUpRight
        size={14}
        className="hidden shrink-0 transition-opacity duration-200 lg:block"
        style={{ color, opacity: on ? 1 : 0 }}
      />
    </a>
  );
}
