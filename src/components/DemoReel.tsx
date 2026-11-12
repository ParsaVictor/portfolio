import { Clapperboard } from "lucide-react";
import Reveal from "./Reveal";
import Scramble from "./Scramble";
import VideoMark from "./VideoMark";
import { useLang } from "../i18n/LangProvider";
import { domain, videoProjects, type Project } from "../data/projects";
import { digits } from "../lib/num";
import { useQuietZone } from "../state/quietZone";
import { openProject, shouldOpenInPage } from "../state/projectModal";

const ACCENT = "#ff6a5e";

/**
 * The reel — every project that has a recorded demo, on one strip of film.
 *
 * The chapters above explain the work; this is the proof it runs. Each frame
 * is the project's own cover with its play button: rest the pointer on one and
 * the clip previews in place, click and it opens already playing. On a phone
 * the strip is swiped, the way film moves.
 */
export default function DemoReel() {
  const { t, lang } = useLang();
  const quietRef = useQuietZone<HTMLDivElement>();
  if (!videoProjects.length) return null;

  return (
    <section id="reel" className="relative py-20 md:py-24">
      <div ref={quietRef} className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Reveal variant="fade" duration={700}>
              <p
                className="mb-3 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] ltr sm:text-[11px]"
                style={{ color: ACCENT }}
              >
                <Clapperboard size={13} />
                <span className="h-px w-8" style={{ backgroundColor: ACCENT }} />
                <Scramble text={t.reel.kicker} />
              </p>
            </Reveal>
            <Reveal variant="clip" duration={900} delay={80}>
              <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.12] text-bone">
                {t.reel.titleA}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg, " + ACCENT + ", #ffb454)" }}
                >
                  {t.reel.titleHi}
                </span>
              </h2>
            </Reveal>
            <Reveal variant="up" duration={800} delay={140}>
              <p className="mt-3 max-w-xl text-[14px] leading-7 text-bone/70">{t.reel.desc}</p>
            </Reveal>
          </div>
          <Reveal variant="up" duration={800} delay={180}>
            <p className="flex shrink-0 items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums leading-none text-bone">
                {digits(videoProjects.length, lang)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">{t.reel.count}</span>
            </p>
          </Reveal>
        </div>

        <Reveal variant="up" duration={900} delay={120}>
          <div className="mt-9 overflow-hidden rounded-2xl border border-bone/10 bg-[rgba(12,10,9,0.86)]">
            <div aria-hidden className="mpk-perf h-4 border-b border-bone/8" />
            <div
              data-lenis-prevent-touch
              className="mpk-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto p-3 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4"
            >
              {videoProjects.map((p, i) => (
                <Frame key={p.id} project={p} index={i} />
              ))}
            </div>
            <div aria-hidden className="mpk-perf h-4 border-t border-bone/8" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Frame({ project, index }: { project: Project; index: number }) {
  const { lang } = useLang();
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noreferrer"
      data-cursor-hover
      onClick={(e) => {
        if (!shouldOpenInPage(e)) return;
        e.preventDefault();
        openProject(project, { autoplay: true });
      }}
      className={
        "group relative block w-[78vw] max-w-[340px] shrink-0 snap-center overflow-hidden rounded-xl border border-bone/10 bg-black transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-bone/35 sm:w-auto sm:max-w-none" +
        // an odd count would leave a hole in the grid — the lead frame takes two
        (index === 0 && videoProjects.length % 2 === 1 ? " sm:col-span-2" : "")
      }
      style={{ boxShadow: "0 24px 60px -34px " + project.accent }}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-auto sm:h-[200px]">
        {project.image && (
          <img
            src={project.image}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        )}
        <VideoMark project={project} />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[8] bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3.5 pb-3 pt-10">
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] tabular-nums tracking-[0.2em] ltr" style={{ color: project.accent }}>
              {digits(String(index + 1).padStart(2, "0"), lang)}
            </span>
            <span className="truncate text-[14px] font-bold text-bone ltr">{project.title}</span>
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] text-bone/60">{domain(project, lang)}</span>
        </span>
      </div>
    </a>
  );
}
