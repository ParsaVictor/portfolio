import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dict, type Dict, type Lang } from "./dict";

type Ctx = {
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
  toggle: () => void;
};

const LangContext = createContext<Ctx | null>(null);
const KEY = "mpk-lang";

function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(KEY);
  return saved === "fa" || saved === "en" ? saved : "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = dict[lang].dir;
    html.dataset.lang = lang;
    try {
      window.localStorage.setItem(KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(
    () => setLangState((p) => (p === "en" ? "fa" : "en")),
    []
  );

  const value = useMemo<Ctx>(
    () => ({ lang, t: dict[lang], setLang, toggle }),
    [lang, setLang, toggle]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
