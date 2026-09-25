import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, MoveHorizontal, Star } from "lucide-react";
import Reveal from "./Reveal";
import Scramble from "./Scramble";
import SideLabel from "./SideLabel";
import FeaturedBadge from "./FeaturedBadge";
import ParallaxCardCarousel, { type CarouselCard } from "./ParallaxCardCarousel";
import { useLang } from "../i18n/LangProvider";
import { cvProjects, desc, type Project } from "../data/projects";
import { STAGE_COLORS } from "../config";
import { useHandover } from "../scroll/useHandover";
import { clamp } from "../lib/num";
import { openProject, shouldOpenInPage } from "../state/projectModal";
import { digits } from "../lib/num";

const ACCENT = STAGE_COLORS.cv;
const N = cvProjects.length;

/**
 * Computer vision — the flagship section.
 *
 * Desktop: a 3D card deck that leans into the cursor and fans out behind the
 * focused project — autoplaying, click-to-focus, arrow/dot controls. Mobile
 * keeps the native snap-scroll rail below, since touch already does momentum
 * and snapping better than anything scripted.
 */
export default function VisionRail() {
  const { t, lang } = useLang();
  const [active, setActive] = useState(0);
  const stageRef = useHandover<HTMLDivElement>(1);
  const railRef = useRef<HTMLDivElement>(null);

  // Which card sits in the rail's focus slot on touch screens. Drives the
  // counter, the dots and the arrows — the affordances that tell a first-time
  // visitor there is more than one project here.
  const [mActive, setMActive] = useState(0);

  const railTo = useCallback((i: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const child = rail.children[clamp(i, 0, N - 1)] as HTMLElement | undefined;
    if (!child) return;
    rail.scrollTo({
      left: child.offsetLeft + child.offsetWidth / 2 - rail.clientWidth / 2,
      behavior: "smooth",
    });
  }, []);

  // Touch screens keep native scrolling — momentum and snapping are better than
  // anything I would write — but the cards still ride the same arc, driven off
  // the rail's own scroll position rather than the page's.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paint = () => {
      const mid = rail.scrollLeft + rail.clientWidth / 2;
      let best = 0;
      let bestD = Infinity;
      Array.from(rail.children).forEach((c, i) => {
        const el = c as HTMLElement;
        const dd = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
        if (dd < bestD) {
          bestD = dd;
          best = i;
        }
      });
      setMActive(best);
      if (reduced) return;
      for (const child of Array.from(rail.children) as HTMLElement[]) {
        const c = child.offsetLeft + child.offsetWidth / 2;
        const d = (c - mid) / Math.max(1, child.offsetWidth);
        const ad = Math.min(Math.abs(d), 2);
        child.style.transform =
          "rotateY(" + -d * 15 + "deg) translateZ(" + -ad * 80 + "px) scale(" + (1 - ad * 0.05) + ")";
        child.style.opacity = String(Math.max(0.25, 1 - ad * 0.42));

        // the card nearest center gets the same "focused" look hover gives
        // it on desktop — a zoomed still and bright brackets — since touch
        // never fires :hover to trigger that on its own.
        const focus = Math.max(0, 1 - ad);
        const media = child.querySelector<HTMLElement>("[data-media]");
        if (media) media.style.transform = "scale(" + (1 + focus * 0.05) + ")";
        for (const b of child.querySelectorAll<HTMLElement>("[data-bracket]")) {
          b.style.opacity = String(0.7 + focus * 0.3);
        }
      }
    };

    paint();
    rail.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
    const settle = window.setTimeout(paint, 600);

    // The first time the rail scrolls into view it nudges itself sideways and
    // settles back: a wordless "this moves" that a peeking edge alone never
    // managed to say. Once, and only if nobody has already touched it.
    let touched = false;
    let nudge = 0;
    let undo = 0;
    const onTouch = () => {
      touched = true;
    };
    rail.addEventListener("touchstart", onTouch, { passive: true, once: true });
    rail.addEventListener("pointerdown", onTouch, { passive: true, once: true });
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (reduced || touched || rail.scrollLeft > 4) return;
        nudge = window.setTimeout(() => {
          if (touched || rail.scrollLeft > 4) return;
          rail.scrollTo({ left: rail.clientWidth * 0.22, behavior: "smooth" });
          undo = window.setTimeout(() => {
            if (!touched) rail.scrollTo({ left: 0, behavior: "smooth" });
          }, 560);
        }, 700);
      },
      { threshold: 0.55 }
    );
    io.observe(rail);

    return () => {
      rail.removeEventListener("scroll", paint);
      rail.removeEventListener("touchstart", onTouch);
      rail.removeEventListener("pointerdown", onTouch);
      window.removeEventListener("resize", paint);
      window.clearTimeout(settle);
      window.clearTimeout(nudge);
      window.clearTimeout(undo);
      io.disconnect();
    };
  }, []);
  const current = cvProjects[clamp(active, 0, N - 1)];

  const carouselCards: CarouselCard[] = useMemo(
    () =>
      cvProjects.map((p) => ({
        id: p.id,
        title: p.title,
        description: desc(p, lang),
        imageUrl: p.image,
        tags: p.tags,
        stat: p.stat,
        accent: p.accent,
        featured: p.featured,
        actionLabel: t.project.open,
        featuredLabel: t.project.featured,
        onAction: () => openProject(p),
      })),
    [lang, t.project.open, t.project.featured]
  );

  return (
    <section id="cv" data-scene="1" className="relative">
      {/* ── small screens: a native horizontal snap rail ──────────────── */}
      <div className="lg:hidden">
        <div className="px-6 pb-6 pt-20">
          <StageCopy accent={ACCENT} meta={t.cv} />
        </div>

        {/* the read-out: which detection is in the slot, out of how many */}
        <div className="mx-6 mb-5 flex items-end justify-between gap-4 border-t border-bone/10 pt-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 font-mono text-[11px] tracking-[0.24em] text-dim ltr">
              <span className="text-2xl font-bold tabular-nums" style={{ color: ACCENT }}>
                {digits(String(mActive + 1).padStart(2, "0"), lang)}
              </span>
              <span>/ {digits(String(N).padStart(2, "0"), lang)}</span>
            </div>
            <div className="mt-1 truncate font-mono text-[11px] tracking-wider text-bone/80 ltr">
              {cvProjects[mActive].title}
            </div>
          </div>
          <div dir="ltr" className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => railTo(mActive - 1)}
              disabled={mActive === 0}
              aria-label={t.cv.prev}
              className="grid h-10 w-10 place-items-center rounded-full border border-bone/15 text-bone transition-opacity disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => railTo(mActive + 1)}
              disabled={mActive === N - 1}
              aria-label={t.cv.next}
              className="grid h-10 w-10 place-items-center rounded-full border text-ink transition-opacity disabled:opacity-30"
              style={{ background: ACCENT, borderColor: ACCENT }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          dir="ltr"
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[11vw] pb-6 [-ms-overflow-style:none] [perspective:1100px] [scrollbar-width:none] sm:px-[21vw]"
        >
          {cvProjects.map((p, i) => (
            <div
              key={p.id}
              className="w-[78vw] shrink-0 snap-center will-change-transform sm:w-[58vw]"
              style={{ transition: "opacity 220ms linear" }}
            >
              <VisionCard project={p} index={i} lang={lang} view={t.project.open} featuredLabel={t.project.featured} />
            </div>
          ))}
        </div>

        {/* dots + the hint, together: the dots say "there are N", the hint says "swipe" */}
        <div className="flex flex-col items-center gap-3 px-6 pb-16 pt-2">
          <div dir="ltr" className="flex items-center gap-2">
            {cvProjects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => railTo(i)}
                aria-label={p.title}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === mActive ? 22 : 6,
                  background: i === mActive ? ACCENT : "rgba(242,236,225,0.22)",
                }}
              />
            ))}
          </div>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.26em] text-dim">
            <MoveHorizontal size={12} className="animate-[mpk-nudge_1.8s_ease-in-out_infinite]" />
            {t.cv.swipeHint}
          </p>
        </div>
      </div>

      {/* ── desktop: the deck — cloud left, content right ───────────── */}
      <div className="relative hidden py-24 lg:block xl:py-28">
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

          <div className="flex flex-col justify-center">
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
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.26em] text-dim">
                  {t.cv.railHint}
                </p>
              </div>
            </div>

            {/* the deck gets the whole column width */}
            <div className="mt-10">
              <ParallaxCardCarousel
                cards={carouselCards}
                cardWidth={340}
                cardHeight={440}
                gap={26}
                perspective={1400}
                maxRotation={14}
                onActiveChange={(i) => setActive(i)}
              />
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
  featuredLabel,
  focus = false,
}: {
  project: Project;
  index: number;
  lang: "en" | "fa";
  view: string;
  featuredLabel: string;
  focus?: boolean;
}) {
  const rootRef = useRef<HTMLAnchorElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const finePointer = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // A light mouse-parallax tilt on the focused desktop card: the card leans
  // into the cursor and a soft sheen follows it, like light off glass. It
  // rides on top of the scroll-driven position transform (set on this card's
  // parent wrapper), not instead of it — and it stays off the image's own
  // overflow-hidden box, since a rotated element that also clips its own
  // content gets hit-tested at its pre-transform rect in Chromium.
  const handlePointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!focus || !finePointer.current) return;
    const el = rootRef.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--tilt-x", (py * -7).toFixed(2) + "deg");
      el.style.setProperty("--tilt-y", (px * 7).toFixed(2) + "deg");
      el.style.setProperty("--glow-x", (px * 100 + 50).toFixed(1) + "%");
      el.style.setProperty("--glow-y", (py * 100 + 50).toFixed(1) + "%");
    });
  };

  const handlePointerLeave = () => {
    if (!focus) return;
    rootRef.current?.style.setProperty("--tilt-x", "0deg");
    rootRef.current?.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <a
      ref={rootRef}
      href={project.url}
      target="_blank"
      rel="noreferrer"
      data-cursor-hover
      onClick={(e) => {
        if (!shouldOpenInPage(e)) return;
        e.preventDefault();
        openProject(project);
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={
        "group relative flex cursor-pointer flex-col rounded-2xl border border-bone/12 bg-ink/85 backdrop-blur-md transition-colors duration-300 hover:border-bone/30" +
        (project.featured ? " mpk-featured" : "")
      }
      style={{
        boxShadow: focus ? "0 30px 90px -40px " + project.accent : undefined,
        transform: focus
          ? "rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))"
          : undefined,
        transition: focus ? "transform 300ms cubic-bezier(0.22, 1, 0.36, 1), border-color 300ms" : undefined,
      }}
    >
      {/* the sheen: a soft highlight that tracks the cursor, only on the focused card */}
      {focus && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(255,255,255,0.16), transparent 55%)",
          }}
        />
      )}

      {/* the read-out — the image stays at full brightness, only the HUD sits over it */}
      <div data-media className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-t-2xl bg-black">
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

        {project.featured && (
          <FeaturedBadge label={featuredLabel} className="absolute top-3 start-3" />
        )}

        <span
          className="absolute bottom-3 start-3 rounded-md px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur-sm ltr"
          style={{ background: "rgba(8,7,6,0.72)", color: project.accent }}
        >
          {project.stat}
        </span>
        <span className="absolute bottom-3 end-3 flex items-center gap-1 rounded-md bg-[rgba(8,7,6,0.72)] px-2 py-1 font-mono text-[10px] tracking-widest text-bone/80 backdrop-blur-sm ltr">
          <Star size={9} fill="currentColor" style={{ color: project.accent }} />
          {digits(project.stars, lang)}
        </span>
      </div>

      <div className="flex flex-col p-5">
        <h3 className="text-lg font-bold text-bone sm:text-xl ltr">{project.title}</h3>
        <p className="mt-2.5 line-clamp-3 text-[14px] leading-6 text-bone/85">
          {desc(project, lang)}
        </p>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
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
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold"
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
        data-bracket
        className={base + " left-3 top-3 border-l-2 border-t-2 group-hover:left-2 group-hover:top-2"}
        style={{ borderColor: color }}
      />
      <span
        data-bracket
        className={base + " right-3 top-3 border-r-2 border-t-2 group-hover:right-2 group-hover:top-2"}
        style={{ borderColor: color }}
      />
      <span
        data-bracket
        className={base + " bottom-12 left-3 border-b-2 border-l-2 group-hover:bottom-11 group-hover:left-2"}
        style={{ borderColor: color }}
      />
      <span
        data-bracket
        className={base + " bottom-12 right-3 border-b-2 border-r-2 group-hover:bottom-11 group-hover:right-2"}
        style={{ borderColor: color }}
      />
    </>
  );
}
