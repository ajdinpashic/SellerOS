import { useState, useRef, useEffect } from 'react';
import { Check, Globe } from 'lucide-react';
import { useI18n } from '@/locales';
import type { LanguageCode } from '@/types';
import { classNames } from '@/utils/format';

const languages: { code: LanguageCode; label: string; full: string }[] = [
  { code: 'bs', label: 'BS', full: 'Bosanski' },
  { code: 'hr', label: 'HR', full: 'Hrvatski' },
  { code: 'sr', label: 'SR', full: 'Srpski' },
  { code: 'en', label: 'EN', full: 'English' },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = languages.find((l) => l.code === lang)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center gap-1 rounded-lg text-content-secondary transition-colors hover:bg-surface-2 hover:text-content md:h-8 md:w-auto md:rounded md:px-1.5"
      >
        <Globe className="h-5 w-5 text-content-tertiary md:h-3.5 md:w-3.5" />
        <span className="hidden md:inline text-[12px] font-medium">{current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 animate-slide-up rounded-md border border-border bg-surface-0 py-0.5 shadow-popover">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={classNames(
                'flex w-full items-center justify-between px-3 py-2.5 text-[13px] transition-colors min-h-[44px]',
                l.code === lang ? 'text-accent' : 'text-content hover:bg-surface-1',
              )}
            >
              <span>
                <span className="font-medium">{l.label}</span>
                <span className="ml-1.5 text-content-tertiary">{l.full}</span>
              </span>
              {l.code === lang && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
