import type { LanguageCode } from '@/types';

export function formatKM(amount: number, lang: LanguageCode = 'bs'): string {
  const localeMap: Record<LanguageCode, string> = {
    bs: 'bs-BA',
    hr: 'hr-HR',
    sr: 'sr-Latn-BA',
    en: 'en-US',
  };
  const formatted = new Intl.NumberFormat(localeMap[lang], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} KM`;
}

export function formatNumber(n: number, lang: LanguageCode = 'bs'): string {
  const localeMap: Record<LanguageCode, string> = {
    bs: 'bs-BA',
    hr: 'hr-HR',
    sr: 'sr-Latn-BA',
    en: 'en-US',
  };
  return new Intl.NumberFormat(localeMap[lang]).format(n);
}

export function formatDate(iso: string, lang: LanguageCode = 'bs'): string {
  const localeMap: Record<LanguageCode, string> = {
    bs: 'bs-BA',
    hr: 'hr-HR',
    sr: 'sr-Latn-BA',
    en: 'en-US',
  };
  return new Intl.DateTimeFormat(localeMap[lang], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, lang: LanguageCode = 'bs'): string {
  const localeMap: Record<LanguageCode, string> = {
    bs: 'bs-BA',
    hr: 'hr-HR',
    sr: 'sr-Latn-BA',
    en: 'en-US',
  };
  return new Intl.DateTimeFormat(localeMap[lang], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export function orderTotal(items: { quantity: number; price: number }[], shipping: number): number {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  return subtotal + shipping;
}

export function orderSubtotal(items: { quantity: number; price: number }[]): number {
  return items.reduce((sum, i) => sum + i.quantity * i.price, 0);
}
