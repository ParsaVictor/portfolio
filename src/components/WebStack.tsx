import { useCallback, useRef } from "react";
import { ArrowUpRight, Lock, RotateCw } from "lucide-react";
import Reveal from "./Reveal";
import SideLabel from "./SideLabel";
import { StageCopy } from "./VisionRail";
import { useLang } from "../i18n/LangProvider";
import { desc, webProjects, type Project } from "../data/projects";
import { STAGE_COLORS } from "../config";
import { useScrub } from "../scroll/useScrub";
import { useHandover } from "../scroll/useHandover";
import { clamp } from "../lib/num";
import { openProject, shouldOpenInPage } from "../state/projectModal";

const ACCENT = STAGE_COLORS.web;
const N = webProjects.length;

/**
 * Creative web.
 *
 * The projects arrive as browser windows that deal themselves into a stack as
 * you scroll — a third scroll grammar, after the vision arc and the data list.
 */
export default function WebStack() {
  const { t, lang } = useLang();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const onScrub = useCallback((p: number) => {
    const pos = p * N;
    for (let i = 0; i < N; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const enter = clamp(pos - i, 0, 1); // slides up into place
      const recede = clamp(pos - (i + 1), 0, 1); // pushed back by the next one
      const y = (1 - enter) * 46 - recede * 7;
      const scale = 1 - recede * 0.09;
      el.style.transform = "translate3d(0, " + y + "%, 0) scale(" + scale + ")";
      el.style.opacity = String(clamp(enter * 1.6, 0, 1) * (1 - recede * 0.45));
      el.style.zIndex = String(10 + i);
      el.style.pointerEvents = recede > 0.6 ? "none" : "auto";
    }
  }, []);

  const wrapRef = useScrub(onScrub);
  const stageRef = useHandover<HTMLDivElement>(3);

  return (
    <section id="web" data-scene="3" className="relative">
      {/* ── small screens: plain stacked cards ────────────────────────── */}
      <div className="lg:hidden">
        <div className="px-6 pb-8 pt-20">
          <StageCopy accent={ACCENT} meta={t.web} />
        </div>
        <div className="space-y-6 px-6 pb-16">
          {webProjects.map((p, i) => (
            <Reveal key={p.id} variant="up" duration={850} delay={i * 100}>
              <BrowserCard project={p} index={i} lang={lang} view={t.project.open} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── desktop: sticky stage, cloud left, windows dealing right ─── */}
      <div
        ref={wrapRef}
        className="relative hidden lg:block"
        style={{ height: (N + 1) * 88 + "vh" }}
      >
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div
            ref={stageRef}
            className="mx-auto grid w-full max-w-[1560px] grid-cols-[minmax(0,26%)_minmax(0,74%)] items-center gap-10 px-10"
          >
            <SideLabel
              index={t.web.index}
              kicker={t.web.kicker}
              caption={t.web.sideNote}
              accent={ACCENT}
            />

            <div className="grid grid-cols-[minmax(0,320px)_minmax(0,1fr)] items-center gap-10">
              <div className="copy-plate">
                <StageCopy accent={ACCENT} meta={t.web} />
                <p className="mt-8 border-t border-bone/10 pt-5 font-mono text-[10px] leading-6 tracking-[0.2em] text-dim ltr">
                  {t.web.stack}
                </p>
              </div>

              <div className="relative h-[66vh]">
                {webProjects.map((p, i) => (
                  <div
                    key={p.id}
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 will-change-transform"
                    style={{ transition: "opacity 180ms linear" }}
                  >
                    <BrowserCard project={p} index={i} lang={lang} view={t.project.open} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function slug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function BrowserCard({
  project,
  index,
  lang,
  view,
}: {
  project: Project;
  index: number;
  lang: "en" | "fa";
  view: string;
}) {
  return (
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
      className="group block cursor-pointer overflow-hidden rounded-xl border border-bone/12 bg-ink/90 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-md transition-colors duration-300 hover:border-bone/30"
    >
      {/* window chrome */}
      <div dir="ltr" className="flex items-center gap-3 border-b border-bone/10 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f5c518]/70" />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: ACCENT, opacity: 0.75 }} />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-bone/5 px-3 py-1 font-mono text-[10px] tracking-wider text-dim">
          <Lock size={9} style={{ color: ACCENT }} />
          <span className="truncate">github.com/ParsaVictor/{slug(project.title)}</span>
        </div>
        <RotateCw
          size={11}
          className="text-dim transition-transform duration-700 group-hover:rotate-180"
        />
      </div>

      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            loading={index === 0 ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-display text-6xl font-bold opacity-25"
            style={{ color: project.accent }}
          >
            {project.title.slice(0, 2).toUpperCase()}
          </div>
        )}
        <span
          className="absolute bottom-3 start-3 rounded-md px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur-sm ltr"
          style={{ background: "rgba(8,7,6,0.72)", color: project.accent }}
        >
          {project.stat}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-bone sm:text-xl ltr">{project.title}</h3>
          <p className="mt-2 max-w-xl text-[14.5px] leading-7 text-bone/85">
            {desc(project, lang)}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-bone/10 px-2.5 py-1 font-mono text-[10px] text-bone/85 ltr"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <span
          className="flex shrink-0 items-center gap-1.5 text-xs font-semibold"
          style={{ color: project.accent }}
        >
          {view}
          <ArrowUpRight size={14} />
        </span>
      </div>
    </a>
  );
}
