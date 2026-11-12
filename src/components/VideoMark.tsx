import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { clock, type Project } from "../data/projects";
import { openProject } from "../state/projectModal";
import { useLang } from "../i18n/LangProvider";
import { digits } from "../lib/num";

/**
 * The play button a project's cover wears when a recorded demo sits behind it.
 *
 * The cover itself is untouched — it is still the face of the project. This
 * only lays two things over it: a glass play button, and (for a mouse, after a
 * moment's rest on the card) a silent preview of the clip itself, so the still
 * comes alive under the pointer. Pressing the button opens the project with the
 * film already rolling; pressing anywhere else on the card opens it on its
 * cover, with the same button waiting there.
 *
 * Drop it inside a card's media box (a positioned, clipped element). It finds
 * the card — the nearest link — on its own.
 */
export default function VideoMark({
  project,
  size = "md",
  peek = true,
}: {
  project: Project;
  size?: "sm" | "md" | "lg";
  /** allow the hover preview (off for thumbnails too small to read) */
  peek?: boolean;
}) {
  const { t, lang } = useLang();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [hot, setHot] = useState(false);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (!peek || !project.video) return;
    const card = anchorRef.current?.closest("a");
    if (!card) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // metered or data-saving connections keep their megabytes
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;

    let timer = 0;
    const enter = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setHot(true), 420);
    };
    const leave = () => {
      window.clearTimeout(timer);
      setHot(false);
      setRolling(false);
    };
    card.addEventListener("pointerenter", enter);
    card.addEventListener("pointerleave", leave);
    return () => {
      window.clearTimeout(timer);
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointerleave", leave);
    };
  }, [peek, project.video]);

  if (!project.video) return null;

  const dim = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-9 w-9" : "h-[52px] w-[52px]";
  const icon = size === "lg" ? 24 : size === "sm" ? 13 : 19;

  return (
    <>
      <span ref={anchorRef} hidden />

      {hot && (
        <video
          src={project.video}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-hidden
          tabIndex={-1}
          onPlaying={() => setRolling(true)}
          className="pointer-events-none absolute inset-0 z-[5] h-full w-full bg-black object-contain transition-opacity duration-500"
          style={{ opacity: rolling ? 1 : 0 }}
        />
      )}

      {/* a soft pool of dark so the button reads on any cover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[6] transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(8,7,6,0.42), transparent 46%)",
          opacity: rolling ? 0 : 1,
        }}
      />

      <span
        role="button"
        tabIndex={0}
        aria-label={t.project.play + " — " + project.title}
        data-cursor-hover
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openProject(project, { autoplay: true });
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          e.stopPropagation();
          openProject(project, { autoplay: true });
        }}
        className={
          "mpk-play absolute left-1/2 top-1/2 z-[7] grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/45 bg-black/45 text-white backdrop-blur-md transition-[transform,opacity,background-color] duration-300 hover:scale-110 hover:bg-black/60 " +
          dim
        }
        style={{
          ["--play" as string]: project.accent,
          opacity: rolling ? 0.0 : 1,
          boxShadow: "0 10px 34px -8px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.35)",
        }}
      >
        <Play size={icon} fill="currentColor" className="translate-x-[1.5px]" />
      </span>

      {size !== "sm" && (
        <span
          dir="ltr"
          className="pointer-events-none absolute end-3 top-3 z-[7] flex items-center gap-1.5 rounded-md bg-[rgba(8,7,6,0.74)] px-2 py-1 font-mono text-[10px] tracking-widest text-bone/90 backdrop-blur-sm"
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: rolling ? "#ff5a4e" : project.accent,
              boxShadow: "0 0 8px " + (rolling ? "#ff5a4e" : project.accent),
            }}
          />
          {rolling ? t.project.preview : t.project.playShort}
          {project.videoSec ? <span className="text-bone/60">{digits(clock(project.videoSec), lang)}</span> : null}
        </span>
      )}
    </>
  );
}
