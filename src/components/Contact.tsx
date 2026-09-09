import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import Magnetic from "./Magnetic";
import Reveal from "./Reveal";
import { GithubIcon, LinkedinIcon, MailIcon } from "./icons";
import { useLang } from "../i18n/LangProvider";
import { identity, socials } from "../config";
import { digits } from "../lib/num";

const ICONS: Record<string, typeof GithubIcon> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  email: MailIcon,
};

function useLocalTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: identity.timezone,
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());
    setTime(fmt());
    const id = window.setInterval(() => setTime(fmt()), 20000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

export default function Contact() {
  const { t, lang } = useLang();
  const [copied, setCopied] = useState(false);
  const localTime = useLocalTime();

  function copyEmail() {
    navigator.clipboard?.writeText(identity.email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section id="contact" data-scene="4" className="relative overflow-hidden py-24 md:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(255,77,109,0.12),transparent)]" />
      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-10">
        <Reveal variant="fade" duration={700}>
          <div className="mb-5 flex items-center justify-center gap-3 font-mono text-[10px] tracking-[0.28em] text-rose sm:text-[11px] sm:tracking-[0.3em] ltr">
            <span className="h-px w-8 bg-rose" />
            {t.contact.kicker}
          </div>
        </Reveal>

        <Reveal variant="clip" duration={1000} delay={80}>
          <h2 className="text-[clamp(2.25rem,8vw,5rem)] font-bold leading-[1.05] text-bone">
            {t.contact.titleA}
            <span className="bg-gradient-to-r from-cyanx via-violetx to-rose bg-clip-text text-transparent">
              {t.contact.titleHi}
            </span>
            {t.contact.titleB}
          </h2>
        </Reveal>

        <Reveal variant="up" duration={850} delay={180}>
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-8 text-bone/72 sm:text-base">
            {t.contact.desc}
          </p>
        </Reveal>

        <Reveal variant="up" duration={850} delay={280}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Magnetic>
              <button
                onClick={copyEmail}
                data-cursor-hover
                className="flex max-w-full items-center gap-3 rounded-full bg-bone px-5 py-3.5 text-[13px] font-bold text-ink transition-transform hover:scale-[1.03] sm:px-7 sm:py-4 sm:text-sm ltr"
              >
                {copied ? <Check size={15} className="shrink-0" /> : <Copy size={15} className="shrink-0" />}
                <span className="truncate">{copied ? t.contact.copied : identity.email}</span>
              </button>
            </Magnetic>

            {socials
              .filter((s) => s.key !== "email")
              .map((s) => {
                const Icon = ICONS[s.key];
                return (
                  <Magnetic key={s.key}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor-hover
                      className="flex items-center gap-2.5 rounded-full border border-bone/20 px-5 py-3.5 text-[13px] font-semibold text-bone transition-all hover:-translate-y-0.5 hover:border-rose hover:text-rose sm:px-6 sm:py-4 sm:text-sm"
                    >
                      <Icon size={16} />
                      {lang === "fa" ? s.labelFa : s.labelEn}
                    </a>
                  </Magnetic>
                );
              })}
          </div>
        </Reveal>

        <Reveal variant="fade" duration={800} delay={380}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[10px] tracking-widest text-dim sm:text-[11px] ltr">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-limex opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-limex" />
              </span>
              {t.contact.available}
            </span>
            <span>
              {t.contact.localTime}: {digits(localTime, lang)} · ISFAHAN
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
