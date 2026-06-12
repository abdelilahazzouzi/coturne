import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dict, type Locale } from "./dict";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleCtx = createContext<Ctx | null>(null);

function readInitial(): Locale {
  if (typeof window === "undefined") return "fr";
  try {
    const v = window.localStorage.getItem("locale");
    if (v === "ar" || v === "fr") return v;
  } catch {}
  // Detect from browser
  if (typeof navigator !== "undefined") {
    const lang = (navigator.language || "").toLowerCase();
    if (lang.startsWith("ar")) return "ar";
  }
  return "fr";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  // Set actual initial on mount (avoids SSR/CSR mismatch)
  useEffect(() => {
    const initial = readInitial();
    setLocaleState(initial);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem("locale", l);
    } catch {}
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    const entry = dict[key];
    let s = entry ? entry[locale] : key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return s;
  };

  return <LocaleCtx.Provider value={{ locale, setLocale, t }}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): Ctx {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}

export function useT() {
  return useLocale().t;
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="flex items-center rounded-full border border-border bg-card p-0.5 text-xs">
      <button
        type="button"
        onClick={() => setLocale("fr")}
        className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
          locale === "fr" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={locale === "fr"}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLocale("ar")}
        className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
          locale === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={locale === "ar"}
      >
        ع
      </button>
    </div>
  );
}
