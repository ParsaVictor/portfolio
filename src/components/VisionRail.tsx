import { useCallback, useRef, useState } from "react";
import { ArrowUpRight, Star } from "lucide-react";
import Reveal from "./Reveal";
import Scramble from "./Scramble";
import SideLabel from "./SideLabel";
import { useLang } from "../i18n/LangProvider";
import { cvProjects, desc, type Project } from "../data/projects";
import { STAGE_COLORS } from "../config";
import { useScrub } from "../scroll/useScrub";
import { useHandover } from "../scroll/useHandover";
import { clamp } from "../lib/num";
import { openProject, shouldOpenInPage } from "../state/projectModal";
import { digits } from "../lib/num";

const ACCENT = STAGE_COLORS.cv;
const N = cvProjects.length;

/**
 * Computer vision — the flagship section.
 *
 * A sticky stage: copy holds one side while the projects ride a horizontal arc
 * on the other, scrubbed by scroll. Each card is framed like a detector
 * read-out, which is what these projects actually are.
 */
export default function VisionRail() {
  const { t, lang } = useLang();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScrub = useCallback((p: number) => {
    const pos = p * (N - 1);
    for (let i = 0; i < N; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const d = i - pos; // signed distance from the focus slot
      const ad = Math.abs(d);
      el.style.transform =
        "translate3d(" + d * 74 + "%, " + ad * 2.4 + "%, " + -ad * 230 + "px) " +
        "rotateY(" + -d * 24 + "deg) scale(" + (1 - Math.min(ad, 3) * 0.08) + ")";
      el.style.opacity = String(clamp(1 - ad * 0.34, 0, 1));
      el.style.zIndex = String(100 - Math.round(ad * 10));
      el.style.pointerEvents = ad < 0.5 ? "auto" : "none";
    }
    if (barRef.current) {
      barRef.current.style.transform = "scaleX(" + clamp(p, 0.02, 1) + ")";
    }
    setActive(Math.round(pos));
  }, []);

  const wrapRef = useScrub(onScrub);
  const stageRef = useHandover<HTMLDivElement>(1);
  const current = cvProjects[clamp(active, 0, N - 1)];

  return (
    <section id="cv" data-scene="1" className="relative">
      {/* ── small screens: a native horizontal snap rail ──────────────── */}
      <div className="lg:hidden">
        <div className="px-6 pb-8 pt-20">
          <StageCopy accent={ACCENT} meta={t.cv} />
        </div>
        <div
          dir="ltr"
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-16 [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {cvProjects.map((p, i) => (
            <div key={p.id} className="w-[82vw] shrink-0 snap-center sm:w-[60vw]">
              <VisionCard project={p} index={i} lang={lang} view={t.project.open} />
            </div>
          ))}
        </div>
      </div>

      {/* ── desktop: sticky stage — cloud left, content right ───────── */}
      <div
        ref={wrapRef}
        className="relative hidden lg:block"
        style={{ height: N * 62 + 90 + "vh" }}
      >
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div
            ref={stageRef}
            className="mx-auto grid w-full max-w-[1600px] grid-cols-[minmax(0,31%)_minmax(0,69%)] items-center gap-8 px-10"
          >
            {/* the swarm owns this column — only a plate marks it */}
            <SideLabel
              index={t.cv.index}
              kicker={t.cv.kicker}
              caption={t.cv.sideNote}
              accent={ACCENT}
            />

            <div className="flex h-[82vh] flex-col justify-center">
              {/* header + live read-out share one compact band */}
              <div className="flex items-end justify-between gap-8 border-b border-bone/10 pb-6">
                <div className="copy-plate min-w-0">
                  <StageCopy accent={ACCENT} meta={t.cv} />
                </div>

                <div className="w-[220px] shrink-0 text-end">
                  <div className="flex items-baseline justify-end gap-2 font-mono text-[11px] tracking-[0.24em] text-dim ltr">
                    <span className="text-3xl font-bold tabular-nums" style={{ color: ACCENT }}>
                      {digits(String(active + 1).padStart(2, "0"), lang)}
                    </span>
                    <span>/ {digits(String(N).padStart(2, "0"), lang)}</span>
                  </div>
                  <div className="mt-2 truncate font-mono text-[11px] tracking-wider text-bone/80 ltr">
                    {current.title}
                  </div>
                  <div className="mt-3 h-px w-full overflow-hidden bg-bone/10">
                    <div
                      ref={barRef}
                      className="h-full origin-left"
                      style={{ background: ACCENT, transform: "scaleX(0.02)" }}
                    />
                  </div>
                  <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.26em] text-dim">
                    {t.cv.railHint}
                  </p>
                </div>
              </div>

              {/* the arc gets the whole column width */}
              <div
                dir="ltr"
                className="relative mt-6 h-[54vh] [perspective:1700px]"
              >
                {cvProjects.map((p, i) => (
                  <div
                    key={p.id}
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    className="absolute inset-y-0 left-1/2 w-[min(27vw,430px)] -translate-x-1/2 will-change-transform"
                    style={{ transition: "opacity 200ms linear" }}
                  >
                    <VisionCard project={p} index={i} lang={lang} view={t.project.open} focus />
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

/* ------------------------------------------------------------------ pieces */

export function StageCopy({
  accent,
  meta,
  align = "start",
}: {
  accent: string;
  meta: { index: string; kicker: string; titleA: string; titleHi: string; desc: string };
  align?: "start" | "center";
}) {
  const centered = align === "center";
  return (
    <>
      <Reveal variant="fade" duration={700}>
        <p
          className={
            "mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] tracking-[0.26em] sm:text-[11px] sm:tracking-[0.3em] ltr " +
            (centered ? "justify-center" : "")
          }
          style={{ color: accent }}
        >
          <span className="font-bold">{meta.index}</span>
          <span className="h-px w-8" style={{ backgroundColor: accent }} />
          <Scramble text={meta.kicker} />
        </p>
      </Reveal>
      <Reveal variant="clip" duration={950} delay={80}>
        <h2 className="text-[clamp(1.75rem,4.2vw,3rem)] font-bold leading-[1.12] text-bone">
          {meta.titleA}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, " + accent + ", #fff)" }}
          >
            {meta.titleHi}
          </span>
        </h2>
      </Reveal>
      <Reveal variant="up" duration={850} delay={180}>
        <p
          className={
            "mt-5 text-[16px] leading-8 text-bone/85 " + (centered ? "mx-auto max-w-2xl" : "max-w-md")
          }
        >
          {meta.desc}
        </p>
      </Reveal>
    </>
  );
}

function VisionCard({
  project,
  index,
  lang,
  view,
  focus = false,
}: {
  project: Project;
  index: number;
  lang: "en" | "fa";
  view: string;
  focus?: boolean;
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
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-bone/12 bg-ink/85 backdrop-blur-md transition-colors duration-300 hover:border-bone/30"
      style={{ boxShadow: focus ? "0 30px 90px -40px " + project.accent : undefined }}
    >
      {/* the read-out — the image stays at full brightness, only the HUD sits over it */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-black">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            loading={index < 2 ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-display text-6xl font-bold opacity-25"
            style={{ color: project.accent }}
          >
            {project.title.slice(0, 2).toUpperCase()}
          </div>
        )}

        <Brackets color={project.accent} />

        <span
          className="absolute bottom-3 left-3 rounded-md px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur-sm ltr"
          style={{ background: "rgba(8,7,6,0.72)", color: project.accent }}
        >
          {project.stat}
        </span>
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-[rgba(8,7,6,0.72)] px-2 py-1 font-mono text-[10px] tracking-widest text-bone/80 backdrop-blur-sm ltr">
          <Star size={9} fill="currentColor" style={{ color: project.accent }} />
          {digits(project.stars, lang)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-lg font-bold text-bone sm:text-xl ltr">{project.title}</h3>
        <p className="mt-3 flex-1 text-[14.5px] leading-7 text-bone/85">{desc(project, lang)}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-bone/10 px-2.5 py-1 font-mono text-[10px] text-bone/85 ltr"
            >
              {tag}
            </span>
          ))}
        </div>
        <div
          className="mt-5 flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: project.accent }}
        >
          <span>{view}</span>
          <ArrowUpRight size={14} />
        </div>
      </div>
    </a>
  );
}

/** Detector-style corner brackets that tighten on hover. */
function Brackets({ color }: { color: string }) {
  const base =
    "pointer-events-none absolute h-6 w-6 opacity-70 transition-all duration-500 group-hover:opacity-100";
  return (
    <>
      <span
        className={base + " left-3 top-3 border-l-2 border-t-2 group-hover:left-2 group-hover:top-2"}
        style={{ borderColor: color }}
      />
      <span
        className={base + " right-3 top-3 border-r-2 border-t-2 group-hover:right-2 group-hover:top-2"}
        style={{ borderColor: color }}
      />
      <span
        className={base + " bottom-12 left-3 border-b-2 border-l-2 group-hover:bottom-11 group-hover:left-2"}
        style={{ borderColor: color }}
      />
      <span
        className={base + " bottom-12 right-3 border-b-2 border-r-2 group-hover:bottom-11 group-hover:right-2"}
        style={{ borderColor: color }}
      />
    </>
  );
}
