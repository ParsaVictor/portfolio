import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Globe, Star, X } from "lucide-react";
import { GithubIcon } from "./icons";
import ProjectCover from "./ProjectCover";
import { useLang } from "../i18n/LangProvider";
import { desc } from "../data/projects";
import { closeProject, useActiveProject } from "../state/projectModal";
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
 */
export default function ProjectModal() {
  const { t, lang } = useLang();
  const project = useActiveProject();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!project) {
      setOpen(false);
      return;
    }
    restoreTo.current = document.activeElement as HTMLElement;
    const id = window.setTimeout(() => setOpen(true), 20);
    return () => window.clearTimeout(id);
  }, [project]);

  useEffect(() => {
    if (!project) return;
    setScrollLocked(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      setScrollLocked(false);
      document.body.style.overflow = prev;
      restoreTo.current?.focus?.();
    };
  }, [project]);

  useEffect(() => {
    if (!project) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeProject();
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
  }, [project]);

  if (!project) return null;
  const accent = project.accent;

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
        className="relative flex w-full max-w-[min(94vw,620px)] flex-col overflow-hidden rounded-2xl border border-bone/15 bg-ink-2/97 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)]"
        style={{
          maxHeight: "min(84vh, 760px)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(22px) scale(0.96)",
          transition:
            "opacity 360ms ease, transform 560ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <button
          ref={closeRef}
          onClick={closeProject}
          data-cursor-hover
          aria-label={t.project.close}
          className="absolute end-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full border border-bone/15 bg-ink/80 text-bone/85 backdrop-blur transition-colors hover:border-bone/40 hover:text-bone"
        >
          <X size={16} />
        </button>

        {/* ── header visual — capped so it can never crowd out the copy ── */}
        <div
          className="relative w-full shrink-0 overflow-hidden bg-black"
          style={{ height: "clamp(170px, 32vh, 300px)" }}
        >
          {project.image ? (
            <img
              src={project.image}
              alt={project.title}
              className="h-full w-full object-contain"
              style={{
                transform: open ? "scale(1)" : "scale(1.05)",
                transition: "transform 800ms cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          ) : (
            <ProjectCover seed={project.id} accent={accent} variant="mesh" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-2 via-transparent to-transparent" />
          <span
            className="absolute bottom-3 start-4 rounded-md px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur-sm ltr"
            style={{ background: "rgba(8,7,6,0.72)", color: accent }}
          >
            {project.stat}
          </span>
        </div>

        {/* ── scrollable body ─────────────────────────────────────────── */}
        <div
          data-lenis-prevent
          className="mpk-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-7"
        >
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.26em] text-dim ltr">
            <Star size={10} fill="currentColor" style={{ color: accent }} />
            {digits(project.stars, lang)}
            <span>·</span>
            <span style={{ color: accent }}>{t[groupOf(project.id)]?.kicker ?? ""}</span>
          </div>

          <h2 className="mt-2 text-xl font-bold leading-tight text-bone sm:text-2xl ltr">
            {project.title}
          </h2>

          <p className="mt-3 text-[15px] leading-7 text-bone/85">{desc(project, lang)}</p>

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
        </div>
      </div>
    </div>
  );
}

/** Which chapter a project belongs to, for the kicker line. */
function groupOf(id: string): "cv" | "data" | "web" {
  if (["pointcloud", "ai-template", "neuromesh"].includes(id)) return "data";
  if (["b2b", "melkai"].includes(id)) return "web";
  return "cv";
}
