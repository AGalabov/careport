import type { Locale } from 'date-fns';
import { bg } from 'date-fns/locale/bg';
import { enUS } from 'date-fns/locale/en-US';

export type AppLocaleKey = 'bg' | 'en';

export function getDateFnsLocale(localeKey: AppLocaleKey): Locale {
  return localeKey === 'bg' ? bg : enUS;
}

export function getIntlLocale(localeKey: AppLocaleKey): string {
  return localeKey === 'bg' ? 'bg-BG' : 'en-US';
}
