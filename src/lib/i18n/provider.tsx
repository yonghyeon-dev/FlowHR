"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { createTranslator, type MessageKey } from "@/lib/i18n/messages";
import { DEFAULT_LOCALE, type FlowLocale, normalizeLocale } from "@/lib/i18n/locales";

type I18nContextValue = {
  locale: FlowLocale;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  t: createTranslator(DEFAULT_LOCALE)
});

type I18nProviderProps = {
  initialLocale: FlowLocale;
  children: ReactNode;
};

export function I18nProvider({ initialLocale, children }: I18nProviderProps) {
  const [locale, setLocale] = useState<FlowLocale>(initialLocale);

  useEffect(() => {
    function syncFromBrowserLanguage() {
      const browserLocale = normalizeLocale(window.navigator.language);
      if (!browserLocale) {
        return;
      }
      setLocale((previous) => {
        if (previous === browserLocale) {
          return previous;
        }
        document.documentElement.lang = browserLocale;
        return browserLocale;
      });
    }

    syncFromBrowserLanguage();
    window.addEventListener("languagechange", syncFromBrowserLanguage);
    return () => {
      window.removeEventListener("languagechange", syncFromBrowserLanguage);
    };
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      t: createTranslator(locale)
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
