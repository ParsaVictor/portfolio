import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import InteractivePhoto from "./InteractivePhoto";
import Magnetic from "./Magnetic";
import Reveal from "./Reveal";
import { GithubIcon, LinkedinIcon } from "./icons";
import { useLang } from "../i18n/LangProvider";
import { identity, socials } from "../config";
import { scrollToId } from "../scroll/useSmoothScroll";

/** CSS-transition rotator — keeps working even when rAF is throttled. */
function RoleRotator({ roles }: { roles: readonly string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % roles.length), 2800);
    return () => window.clearInterval(id);
  }, [roles.length]);

  return (
    <span className="relative block h-8 min-w-0 flex-1 overflow-hidden">
      {roles.map((r, k) => (
        <span
          key={r}
          className="absolute inset-x-0 top-0 whitespace-nowrap text-cyanx transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            opacity: k === i ? 1 : 0,
            transform: k === i ? "translateY(0)" : k < i ? "translateY(-100%)" : "translateY(100%)",
          }}
          aria-hidden={k !== i}
        >
          {r}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const { t, lang } = useLang();
  const gh = socials.find((s) => s.key === "github")!;
  const li = socials.find((s) => s.key === "linkedin")!;
  const first = lang === "fa" ? identity.firstFa : identity.firstEn;
  const last = lang === "fa" ? identity.lastFa : identity.lastEn;

  return (
    <section
      id="hero"
      data-scene="0"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pb-16 pt-28 md:pt-32"
    >
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-y-10 px-6 md:gap-x-10 lg:grid-cols-[1.08fr_0.92fr] lg:grid-rows-[auto_auto] lg:px-10">
        {/* ── A · identity ─────────────────────────────── */}
        <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
          <Reveal variant="fade" duration={700} delay={60}>
            <p className="mb-5 flex items-center gap-3 font-mono text-[10px] tracking-[0.24em] text-cyanx sm:text-[11px] sm:tracking-[0.28em] ltr">
              <span className="h-px w-6 bg-cyanx sm:w-8" />
              {t.hero.kicker}
            </p>
          </Reveal>

          <h1 className="font-display text-[clamp(3rem,11vw,7.5rem)] font-bold leading-[0.92] tracking-tight text-bone">
            <Reveal variant="clip" as="span" className="block" duration={1000} delay={120}>
              {first}
            </Reveal>
            <Reveal variant="clip" as="span" className="block" duration={1000} delay={240}>
              <span className="bg-gradient-to-r from-cyanx via-violetx to-rose bg-clip-text text-transparent">
                {last}
              </span>
            </Reveal>
          </h1>

          <Reveal variant="fade" duration={700} delay={420}>
            <div className="mt-5 flex items-start gap-2 text-base text-dim sm:text-lg">
              <span aria-hidden>—</span>
              <RoleRotator roles={t.hero.roles} />
            </div>
          </Reveal>
        </div>

        {/* ── B · portrait ─────────────────────────────── */}
        <Reveal
          variant="scale"
          duration={1100}
          delay={300}
          className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
        >
          <InteractivePhoto src="/images/portrait.jpg" />
        </Reveal>

        {/* ── C · pitch + actions ──────────────────────── */}
        <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
          <Reveal variant="up" duration={800} delay={480}>
            <p className="max-w-xl text-balance text-[15px] leading-8 text-bone/60 sm:text-base">
              {t.hero.lead}{" "}
              {t.hero.leadWords.map((w, i) => (
                <span key={w}>
                  <span className="text-bone">{w}</span>
                  {i < t.hero.leadWords.length - 1 ? (lang === "fa" ? "، " : ", ") : ""}
                </span>
              ))}
              {t.hero.leadTail}
            </p>
          </Reveal>

          <Reveal variant="up" duration={800} delay={600}>
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <Magnetic>
                <button
                  onClick={() => scrollToId("cv")}
                  data-cursor-hover
                  className="group relative overflow-hidden rounded-full bg-bone px-6 py-3.5 text-sm font-bold text-ink sm:px-7"
                >
                  <span className="relative z-10">{t.hero.cta}</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-cyanx to-violetx transition-transform duration-500 group-hover:translate-x-0" />
                  <span className="absolute inset-0 z-10 flex translate-x-full items-center justify-center text-sm font-bold text-ink transition-transform duration-500 group-hover:translate-x-0">
                    {t.hero.cta}
                  </span>
                </button>
              </Magnetic>
              <Magnetic>
                <a
                  href={gh.href}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor-hover
                  aria-label="GitHub"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors hover:border-cyanx hover:text-cyanx"
                >
                  <GithubIcon size={18} />
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href={li.href}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor-hover
                  aria-label="LinkedIn"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors hover:border-violetx hover:text-violetx"
                >
                  <LinkedinIcon size={18} />
                </a>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </div>

      <button
        onClick={() => scrollToId("about")}
        data-cursor-hover
        className="relative z-10 mx-auto mt-10 flex animate-[mpk-bob_1.9s_ease-in-out_infinite] flex-col items-center gap-2 text-dim transition-colors hover:text-bone"
      >
        <span className="font-mono text-[10px] tracking-[0.3em] ltr">{t.hero.scroll}</span>
        <ArrowDown size={15} />
      </button>
    </section>
  );
}
