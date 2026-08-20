import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LanguageCode } from '@/types';
import bs from '@/locales/bs';
import hr from '@/locales/hr';
import sr from '@/locales/sr';
import en from '@/locales/en';
import type { LocaleDict } from '@/locales/bs';

const dictionaries: Record<LanguageCode, LocaleDict> = { bs, hr, sr, en };

const STORAGE_KEY = 'shopos-lang';

interface I18nContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: LocaleDict;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLang(): LanguageCode {
  if (typeof window === 'undefined') return 'bs';
  const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
  if (stored && ['bs', 'hr', 'sr', 'en'].includes(stored)) return stored;
  return 'bs';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(getInitialLang);

  const setLang = useCallback((next: LanguageCode) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t: dictionaries[lang] }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
