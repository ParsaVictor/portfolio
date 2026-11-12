import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Globe, ImageIcon, Lock, Play, Send, Star, X } from "lucide-react";
import { GithubIcon } from "./icons";
import ProjectCover from "./ProjectCover";
import { useLang } from "../i18n/LangProvider";
import { allProjects, clock, desc, domain, groupOf, kindMeta } from "../data/projects";
import { closeProject, openProject, takeAutoplay, useActiveProject } from "../state/projectModal";
import { identity } from "../config";
import { setScrollLocked } from "../scroll/useSmoothScroll";
import { digits } from "../lib/num";

/**
 * The project detail overlay.
 *
 * A floating panel, not a takeover: capped in both directions and centred, with
 * the description in its own scroll area so long copy is always reachable while
 * the actions stay pinned to the bottom. The scroller carries
 * `data-lenis-prevent` — Lenis owns the wheel on this page, and without that
 * attribute it swallows the event and the panel cannot be scrolled at all.
 *
 * A project with a recorded demo opens on its cover, with a play button on it.
 * Pressing play swaps the cover for the film in place: the header grows, the
 * panel widens, and a blurred copy of the cover glows behind the frame so a
 * portrait or 4:3 clip never sits in a black box. The arrow keys (and the two
 * side buttons) walk through every project without closing the overlay.
 */
export default function ProjectModal() {
  const { t, lang } = useLang();
  const project = useActiveProject();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const [playing, setPlaying] = useState(false);
  // the film's own shape, so the frame hugs it — a 16:9 clip on a phone must
  // not sit in a tall black box, and a portrait one must not be squashed
  const [ratio, setRatio] = useState(16 / 9);
  const isOpen = !!project;
  const rtl = lang === "fa";

  const step = (dir: 1 | -1) => {
    if (!project) return;
    const i = allProjects.findIndex((p) => p.id === project.id);
    const n = allProjects.length;
    openProject(allProjects[(i + dir + n) % n]);
  };
  const stepRef = useRef(step);
  stepRef.current = step;

  // the film belongs to one project: moving on stops it, and a project opened
  // from its play button starts already rolling
  useEffect(() => {
    setPlaying(project ? takeAutoplay() : false);
    setRatio(16 / 9);
  }, [project]);

  useEffect(() => {
    if (!isOpen) {
      setOpen(false);
      return;
    }
    restoreTo.current = document.activeElement as HTMLElement;
    const id = window.setTimeout(() => setOpen(true), 20);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setScrollLocked(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      setScrollLocked(false);
      document.body.style.overflow = prev;
      restoreTo.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeProject();
        return;
      }
      // the arrows browse — unless the player has focus, where they scrub
      if (
        (e.key === "ArrowRight" || e.key === "ArrowLeft") &&
        !(document.activeElement instanceof HTMLVideoElement)
      ) {
        e.preventDefault();
        const forward = (e.key === "ArrowRight") !== (document.documentElement.dir === "rtl");
        stepRef.current(forward ? 1 : -1);
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!project) return null;
  const accent = project.accent;
  const at = allProjects.findIndex((p) => p.id === project.id);
  const isPrivate = project.access === "private";
  const similarHref =
    "mailto:" +
    identity.email +
    "?subject=" +
    encodeURIComponent(t.project.similarSubject + " " + project.title);
  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <div
      className="fixed inset-0 z-[600] grid place-items-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <button
        aria-label={t.project.close}
        onClick={closeProject}
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-ink/85 backdrop-blur-md transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0 }}
      />

      <div
        ref={panelRef}
        className="relative flex w-full flex-col rounded-2xl border border-bone/15 bg-ink-2/97"
        style={{
          maxWidth: playing ? "min(94vw, 900px)" : "min(94vw, 620px)",
          maxHeight: playing ? "min(90vh, 860px)" : "min(84vh, 760px)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(22px) scale(0.96)",
          boxShadow:
            "0 40px 120px -30px rgba(0,0,0,0.95)" + (playing ? ", 0 0 120px -30px " + accent : ""),
          transition:
            "opacity 360ms ease, transform 560ms cubic-bezier(0.22,1,0.36,1), max-width 520ms cubic-bezier(0.22,1,0.36,1), max-height 520ms cubic-bezier(0.22,1,0.36,1), box-shadow 600ms ease",
        }}
      >
        {/* browse without closing — the buttons hang just outside the panel */}
        {([-1, 1] as const).map((dir) => {
          const Icon = dir === -1 ? PrevIcon : NextIcon;
          return (
            <button
              key={dir}
              onClick={() => step(dir)}
              data-cursor-hover
              aria-label={dir === -1 ? t.project.prev : t.project.next}
              className={
                "absolute top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-bone/15 bg-ink/80 text-bone/80 backdrop-blur transition-all hover:scale-110 hover:border-bone/45 hover:text-bone md:grid " +
                (dir === -1 ? "-start-16" : "-end-16")
              }
            >
              <Icon size={18} />
            </button>
          );
        })}

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
        <button
          ref={closeRef}
          onClick={closeProject}
          data-cursor-hover
          aria-label={t.project.close}
          className="absolute end-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full border border-bone/15 bg-ink/80 text-bone/85 backdrop-blur transition-colors hover:border-bone/40 hover:text-bone"
        >
          <X size={16} />
        </button>

        {/* ── header visual — the cover, or the film once play is pressed ── */}
        <div
          key={project.id}
          className="relative w-full shrink-0 overflow-hidden bg-black"
          style={
            playing
              ? { aspectRatio: String(Math.max(ratio, 1.2)), maxHeight: "min(56vh, 540px)" }
              : { height: "clamp(170px, 32vh, 300px)" }
          }
        >
          {project.image ? (
            <>
              {/* the cover, blurred, as the film's own ambient light */}
              {playing && (
                <img
                  src={project.image}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-125 object-cover opacity-45 blur-3xl"
                />
              )}
              <img
                src={project.image}
                alt={project.title}
                className="absolute inset-0 h-full w-full object-contain"
                style={{
                  opacity: playing ? 0 : 1,
                  transform: open ? "scale(1)" : "scale(1.05)",
                  transition: "transform 800ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease",
                }}
              />
            </>
          ) : (
            <ProjectCover seed={project.id} accent={accent} variant="mesh" />
          )}

          {!playing && (
            <>
              <span
                aria-hidden
                className="mpk-sweep pointer-events-none absolute inset-y-0 start-0 w-1/3"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)",
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-2 via-transparent to-transparent" />
            </>
          )}

          {project.video && playing && (
            <video
              key={project.video}
              src={project.video}
              poster={project.image}
              controls
              autoPlay
              loop
              muted
              playsInline
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight);
              }}
              className="absolute inset-0 h-full w-full object-contain"
            />
          )}

          {project.video && !playing && (
            <button
              onClick={() => setPlaying(true)}
              data-cursor-hover
              aria-label={t.project.play}
              className="group/play absolute inset-0 z-10 grid place-items-center"
            >
              <span
                aria-hidden
                className="absolute inset-0 transition-opacity duration-300 group-hover/play:opacity-100"
                style={{
                  background: "radial-gradient(circle at 50% 50%, rgba(8,7,6,0.5), transparent 52%)",
                  opacity: 0.75,
                }}
              />
              <span className="relative flex flex-col items-center gap-3">
                <span
                  className="mpk-play relative grid h-[68px] w-[68px] place-items-center rounded-full border border-white/50 bg-black/50 text-white backdrop-blur-md transition-transform duration-300 group-hover/play:scale-110"
                  style={{ ["--play" as string]: accent, boxShadow: "0 14px 44px -8px rgba(0,0,0,0.9)" }}
                >
                  <Play size={26} fill="currentColor" className="translate-x-[2px]" />
                </span>
                <span
                  dir="ltr"
                  className="flex items-center gap-2 rounded-full bg-[rgba(8,7,6,0.78)] px-3 py-1 font-mono text-[10px] tracking-[0.22em] text-bone backdrop-blur-sm"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: "0 0 8px " + accent }} />
                  {t.project.play.toUpperCase()}
                  {project.videoSec ? (
                    <span className="text-bone/60">{digits(clock(project.videoSec), lang)}</span>
                  ) : null}
                </span>
              </span>
            </button>
          )}

          {playing && (
            <button
              onClick={() => setPlaying(false)}
              data-cursor-hover
              className="absolute start-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-bone/15 bg-ink/80 px-3 py-1.5 font-mono text-[10px] tracking-widest text-bone/85 backdrop-blur transition-colors hover:border-bone/40 hover:text-bone"
            >
              <ImageIcon size={12} />
              {t.project.poster}
            </button>
          )}

          {!playing && (
            <span
              className="pointer-events-none absolute bottom-3 start-4 z-10 rounded-md px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur-sm ltr"
              style={{ background: "rgba(8,7,6,0.72)", color: accent }}
            >
              {project.stat}
            </span>
          )}
          {isPrivate && !playing && (
            <span className="pointer-events-none absolute bottom-3 end-4 z-10 flex items-center gap-1.5 rounded-md bg-[rgba(8,7,6,0.78)] px-2 py-1 font-mono text-[10px] tracking-widest text-bone/85 backdrop-blur-sm">
              <Lock size={10} />
              {t.index.access.private}
            </span>
          )}
        </div>

        {/* ── scrollable body ─────────────────────────────────────────── */}
        <div
          data-lenis-prevent
          className="mpk-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-7"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] tracking-[0.26em] text-dim">
            {project.access !== "private" && (
              <>
                <Star size={10} fill="currentColor" style={{ color: accent }} />
                <span className="ltr">{digits(project.stars, lang)}</span>
                <span>·</span>
              </>
            )}
            <span style={{ color: accent }}>{t[groupOf(project.id)].kicker}</span>
            <span>·</span>
            <span style={{ color: kindMeta(project.kind).color }}>
              {lang === "fa" ? kindMeta(project.kind).fa : kindMeta(project.kind).en}
            </span>
            <span>·</span>
            <span className="text-bone/70">{domain(project, lang)}</span>
            <span className="ms-auto tabular-nums text-bone/45 ltr">
              {digits(String(at + 1).padStart(2, "0"), lang)} / {digits(allProjects.length, lang)}
            </span>
          </div>

          <h2 className="mt-2 text-xl font-bold leading-tight text-bone sm:text-2xl ltr">
            {project.title}
          </h2>

          <p className="mt-3 text-[15px] leading-7 text-bone/85">{desc(project, lang)}</p>

          {project.video && (
            <p className="mt-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-dim">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
              {t.project.realFootage}
            </p>
          )}

          {isPrivate && (
            <div
              className="mt-5 flex items-start gap-3 rounded-xl border px-4 py-3.5"
              style={{ borderColor: accent + "40", background: accent + "0f" }}
            >
              <Lock size={15} className="mt-1 shrink-0" style={{ color: accent }} />
              <p className="text-[13.5px] leading-6 text-bone/80">{t.project.privateNote}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-bone/12 px-3 py-1 font-mono text-[10px] text-bone/80 ltr"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── actions stay put, whatever the copy does ────────────────── */}
        <div className="flex shrink-0 flex-wrap gap-2.5 border-t border-bone/10 bg-ink-2/95 px-6 py-4 sm:px-7">
          {project.access === "private" ? (
            <>
              {project.website && (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor-hover
                  className="flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-[13px] font-bold text-ink transition-transform hover:scale-[1.03]"
                >
                  <Globe size={14} />
                  {t.project.live}
                  <ArrowUpRight size={13} />
                </a>
              )}
              <a
                href={similarHref}
                data-cursor-hover
                className={
                  "flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] transition-all hover:-translate-y-0.5 " +
                  (project.website ? "border font-semibold" : "bg-bone font-bold text-ink hover:scale-[1.03]")
                }
                style={project.website ? { borderColor: accent + "80", color: accent } : undefined}
              >
                <Send size={14} />
                {t.project.similar}
              </a>
              <span className="flex items-center gap-2 rounded-full border border-bone/12 px-5 py-2.5 text-[13px] font-medium text-dim">
                <Lock size={13} />
                {t.project.privateRepo}
              </span>
            </>
          ) : (
          <>
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            data-cursor-hover
            className="flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-[13px] font-bold text-ink transition-transform hover:scale-[1.03]"
          >
            <GithubIcon size={14} />
            {t.project.github}
            <ArrowUpRight size={13} />
          </a>

          {project.website ? (
            <a
              href={project.website}
              target="_blank"
              rel="noreferrer"
              data-cursor-hover
              className="flex items-center gap-2 rounded-full border px-5 py-2.5 text-[13px] font-semibold transition-all hover:-translate-y-0.5"
              style={{ borderColor: accent + "80", color: accent }}
            >
              <Globe size={14} />
              {t.project.website}
              <ArrowUpRight size={13} />
            </a>
          ) : (
            <span className="flex items-center gap-2 rounded-full border border-bone/10 px-5 py-2.5 text-[13px] font-medium text-dim">
              <Globe size={14} />
              {t.project.websiteSoon}
            </span>
          )}
          </>
          )}
          <span
            className={
              "ms-auto hidden self-center font-mono text-[9.5px] tracking-[0.16em] text-dim/70 " +
              (isPrivate && !playing ? "" : "lg:block")
            }
          >
            {t.project.keys}
          </span>
        </div>
        </div>
      </div>
    </div>
  );
}

