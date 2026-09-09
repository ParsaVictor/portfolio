import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Globe, Star, X } from "lucide-react";
import { GithubIcon } from "./icons";
import { useLang } from "../i18n/LangProvider";
import { desc } from "../data/projects";
import { closeProject, useActiveProject } from "../state/projectModal";
import { setScrollLocked } from "../scroll/useSmoothScroll";
import { digits } from "../lib/num";

/**
 * The project detail overlay.
 *
 * Cards are still real links, so a middle-click or ⌘-click goes straight to
 * GitHub; a plain click opens this instead and keeps the visitor on the page.
 */
export default function ProjectModal() {
  const { t, lang } = useLang();
  const project = useActiveProject();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  // drive the enter transition one frame after mount
  useEffect(() => {
    if (!project) {
      setOpen(false);
      return;
    }
    restoreTo.current = document.activeElement as HTMLElement;
    const id = window.setTimeout(() => setOpen(true), 20);
    return () => window.clearTimeout(id);
  }, [project]);

  // freeze the page behind the overlay
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

  // esc to close, and keep tab focus inside the panel
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
      className="fixed inset-0 z-[600] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <button
        aria-label={t.project.close}
        onClick={closeProject}
        tabIndex={-1}
        className="fixed inset-0 cursor-default bg-ink/80 backdrop-blur-md transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0 }}
      />

      <div
        ref={panelRef}
        className="relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-bone/15 bg-ink-2/95 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)]"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(26px) scale(0.97)",
          clipPath: open ? "inset(0 0 0% 0 round 1rem)" : "inset(0 0 26% 0 round 1rem)",
          transition:
            "opacity 420ms ease, transform 620ms cubic-bezier(0.22,1,0.36,1), clip-path 620ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <button
          ref={closeRef}
          onClick={closeProject}
          data-cursor-hover
          aria-label={t.project.close}
          className="absolute end-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-bone/15 bg-ink/70 text-bone/70 backdrop-blur transition-colors hover:border-bone/40 hover:text-bone"
        >
          <X size={16} />
        </button>

        {project.image && (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
            <img
              src={project.image}
              alt={project.title}
              className="h-full w-full object-cover"
              style={{
                transform: open ? "scale(1)" : "scale(1.06)",
                transition: "transform 900ms cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-2 via-transparent to-transparent" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] tracking-[0.26em] ltr">
            <span style={{ color: accent }}>{project.stat}</span>
            <span className="text-dim">·</span>
            <span className="flex items-center gap-1 text-dim">
              <Star size={10} fill="currentColor" style={{ color: accent }} />
              {digits(project.stars, lang)}
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold leading-tight text-bone sm:text-3xl ltr">
            {project.title}
          </h2>

          <p className="mt-4 text-[15px] leading-8 text-bone/75">{desc(project, lang)}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-bone/12 px-3 py-1 font-mono text-[10px] text-bone/60 ltr"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-bone/10 pt-6">
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              data-cursor-hover
              className="flex items-center gap-2 rounded-full bg-bone px-5 py-3 text-[13px] font-bold text-ink transition-transform hover:scale-[1.03]"
            >
              <GithubIcon size={15} />
              {t.project.github}
              <ArrowUpRight size={14} />
            </a>

            {project.website ? (
              <a
                href={project.website}
                target="_blank"
                rel="noreferrer"
                data-cursor-hover
                className="flex items-center gap-2 rounded-full border px-5 py-3 text-[13px] font-semibold transition-all hover:-translate-y-0.5"
                style={{ borderColor: accent + "80", color: accent }}
              >
                <Globe size={15} />
                {t.project.website}
                <ArrowUpRight size={14} />
              </a>
            ) : (
              <span
                className="flex items-center gap-2 rounded-full border border-bone/10 px-5 py-3 text-[13px] font-medium text-dim"
                title={t.project.websiteSoon}
              >
                <Globe size={15} />
                {t.project.websiteSoon}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
