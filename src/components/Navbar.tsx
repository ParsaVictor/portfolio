import { useEffect, useState } from "react";
import { useLang } from "../i18n/LangProvider";
import { identity, socials } from "../config";
import { scrollToId } from "../scroll/useSmoothScroll";

export default function Navbar() {
  const { t, lang, toggle } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { id: "about", label: t.nav.about },
    { id: "cv", label: t.nav.cv },
    { id: "data", label: t.nav.data },
    { id: "web", label: t.nav.web },
    { id: "contact", label: t.nav.contact },
  ];
  const gh = socials.find((s) => s.key === "github")!;

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b border-bone/10 bg-ink/60 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <button
          onClick={() => go("hero")}
          data-cursor-hover
          className="font-mono text-sm font-bold tracking-widest text-bone"
        >
          <span className="text-cyanx">M</span>PK
          <span className="text-dim">.dev</span>
        </button>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              data-cursor-hover
              className="relative text-xs tracking-wide text-bone/70 transition-colors hover:text-bone after:absolute after:-bottom-1 after:start-0 after:h-px after:w-0 after:bg-cyanx after:transition-all after:duration-300 hover:after:w-full"
            >
              {l.label}
            </button>
          ))}
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
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={toggle}
            className="rounded-full border border-bone/20 px-2.5 py-1 font-mono text-[10px] text-bone/80"
          >
            {lang === "en" ? "FA" : "EN"}
          </button>
          <button
            className="flex flex-col gap-1.5"
            onClick={() => setOpen((v) => !v)}
            aria-label="menu"
          >
            <span className={`h-px w-6 bg-bone transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`h-px w-6 bg-bone transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`h-px w-6 bg-bone transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      <div
        className={`grid overflow-hidden border-t border-bone/10 bg-ink/95 px-6 backdrop-blur-xl transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] border-transparent opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-4 py-5">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                tabIndex={open ? 0 : -1}
                className="text-start text-sm text-bone/80"
              >
                {l.label}
              </button>
            ))}
            <a
              href={gh.href}
              target="_blank"
              rel="noreferrer"
              tabIndex={open ? 0 : -1}
              className="text-start text-sm text-cyanx ltr"
            >
              {identity.handle}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
