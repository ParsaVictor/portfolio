import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "../i18n/LangProvider";
import { identity, socials, STAGE_COLORS } from "../config";
import { scrollToId, setScrollLocked } from "../scroll/useSmoothScroll";
import { onScroll } from "../scroll/scrollStore";
import LimelightNav from "./LimelightNav";

const STAGE_COUNT = 5; // hero, cv, data, web, contact — mirrors STAGES in config.ts

export default function Navbar() {
  const { t, lang, toggle } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const spineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onWinScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onWinScroll, { passive: true });
    onWinScroll();
    return () => window.removeEventListener("scroll", onWinScroll);
  }, []);

  // Phones have no side rail, so the page's progress lives in a hairline
  // under the header instead — the same cyan→violet→rose spine, laid flat.
  // Desktop gets its own echo of that spine: a limelight under the active
  // nav label, so the top bar always agrees with what the particles are doing.
  useEffect(() => {
    return onScroll((s) => {
      if (spineRef.current) {
        spineRef.current.style.transform = "scaleX(" + Math.max(0, Math.min(1, s.progress)) + ")";
      }
      setActiveStage(Math.max(0, Math.min(STAGE_COUNT - 1, Math.round(s.stage))));
    });
  }, []);

  // The page must not scroll under an open menu (Lenis owns the scroll, so
  // the lock has to go through it), and Escape closes it.
  useEffect(() => {
    setScrollLocked(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { id: "about", short: t.nav.about, label: t.rail.about, index: "00", color: STAGE_COLORS.hero },
    { id: "cv", short: t.nav.cv, label: t.rail.cv, index: t.cv.index, color: STAGE_COLORS.cv },
    { id: "data", short: t.nav.data, label: t.rail.data, index: t.data.index, color: STAGE_COLORS.data },
    { id: "web", short: t.nav.web, label: t.rail.web, index: t.web.index, color: STAGE_COLORS.web },
    { id: "contact", short: t.nav.contact, label: t.rail.contact, index: "04", color: STAGE_COLORS.contact },
  ];
  const gh = socials.find((s) => s.key === "github")!;

  const go = (id: string) => {
    setOpen(false);
    // let the lock lift before the scroll starts, or Lenis swallows it
    window.setTimeout(() => scrollToId(id), 30);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled && !open ? "border-b border-bone/10 bg-ink/60 backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <button
            onClick={() => go("hero")}
            data-cursor-hover
            className="relative z-10 font-mono text-sm font-bold tracking-widest text-bone"
          >
            <span className="text-cyanx">M</span>PK
            <span className="text-dim">.dev</span>
          </button>

          <div className="hidden items-center gap-7 md:flex">
            <LimelightNav
              className="gap-7"
              items={links.map((l) => ({ id: l.id, label: l.short, color: l.color }))}
              activeIndex={activeStage}
              onSelect={go}
            />
            <button
              onClick={toggle}
              data-cursor-hover
              className="rounded-full border border-bone/20 px-3 py-1.5 font-mono text-[11px] text-bone/80 transition-colors hover:border-cyanx hover:text-cyanx"
            >
              {t.langToggle}
            </button>
            <a
              href={gh.href}
              target="_blank"
              rel="noreferrer"
              data-cursor-hover
              className="rounded-full border border-bone/20 px-4 py-1.5 text-xs text-bone transition-colors hover:border-cyanx hover:text-cyanx"
            >
              {t.nav.resume}
            </a>
          </div>

          <div className="relative z-10 flex items-center gap-3 md:hidden">
            <button
              onClick={toggle}
              className="rounded-full border border-bone/20 px-2.5 py-1 font-mono text-[10px] text-bone/80"
            >
              {lang === "en" ? "FA" : "EN"}
            </button>
            <button
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
              onClick={() => setOpen((v) => !v)}
              aria-label="menu"
              aria-expanded={open}
            >
              <span className={`h-px w-6 bg-bone transition-transform duration-300 ${open ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`h-px w-6 bg-bone transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
              <span className={`h-px w-6 bg-bone transition-transform duration-300 ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </button>
          </div>
        </div>

        {/* the flat spine — phones only */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-bone/5 lg:hidden">
          <div
            ref={spineRef}
            className="h-full w-full origin-left bg-gradient-to-r from-cyanx via-violetx to-rose"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </header>

      {/* ── the phone menu: a full sheet, chapters as a numbered index ──── */}
      <div
        className="fixed inset-0 z-40 flex flex-col bg-ink/[0.97] px-6 pb-8 pt-24 backdrop-blur-2xl md:hidden"
        style={{
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          // show at once, fade in; fade out, then hide
          transition: open
            ? "opacity 400ms ease, visibility 0s"
            : "opacity 320ms ease, visibility 0s linear 320ms",
        }}
        aria-hidden={!open}
      >
        <nav className="flex flex-1 flex-col justify-center gap-1">
          {links.map((l, i) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              tabIndex={open ? 0 : -1}
              className="group flex items-center gap-4 border-b border-bone/8 py-4 text-start transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                transform: open ? "translateX(0)" : "translateX(-18px)",
                opacity: open ? 1 : 0,
                transitionDelay: open ? 60 + i * 55 + "ms" : "0ms",
              }}
            >
              <span className="w-8 font-mono text-[11px] tabular-nums tracking-[0.2em] ltr" style={{ color: l.color }}>
                {l.index}
              </span>
              <span className="flex-1 text-2xl font-bold text-bone">{l.label}</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: l.color, boxShadow: `0 0 10px 1px ${l.color}88` }}
              />
            </button>
          ))}
        </nav>

        <div
          className="flex items-center justify-between gap-4 pt-6 transition-opacity duration-500"
          style={{ opacity: open ? 1 : 0, transitionDelay: open ? "380ms" : "0ms" }}
        >
          <a
            href={gh.href}
            target="_blank"
            rel="noreferrer"
            tabIndex={open ? 0 : -1}
            className="flex items-center gap-1.5 font-mono text-xs text-cyanx ltr"
          >
            {identity.handle}
            <ArrowUpRight size={13} />
          </a>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dim ltr">
            {identity.cityShort}
          </span>
        </div>
      </div>
    </>
  );
}
