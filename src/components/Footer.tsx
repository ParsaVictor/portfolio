import { useLang } from "../i18n/LangProvider";
import { identity } from "../config";
import { digits } from "../lib/num";

export default function Footer() {
  const { t, lang } = useLang();
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-bone/10 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 font-mono text-[11px] text-dim sm:flex-row lg:px-10">
        <span className="ltr">
          © {digits(year, lang)} {identity.nameEn} — {t.footer.rights}
        </span>
        <span className="ltr">{t.footer.built}</span>
      </div>
    </footer>
  );
}
