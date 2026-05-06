/* eslint-disable react-refresh/only-export-components -- useTranslation is tied to this context module */

import {
  createContext,
  type JSX,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import type { TranslationArgs, TranslationArgsWithJSX, TranslationKey, Translations } from './translations';
import { getByPath, hasByPath } from '../lib/get-by-path';
import { SessionStorageService } from '../lib/session-storage-service';
import { useAsync } from '../hooks/use-async';
import type { AppLocaleKey } from '../lib/date-locale';

function translation(translationsRoot: Translations) {
  function t<K extends TranslationKey>(key: K, ...params: TranslationArgs<K>): string;
  function t<K extends TranslationKey>(key: K, ...params: TranslationArgsWithJSX<K>): ReactNode;
  function t<K extends TranslationKey>(
    key: K,
    ...params: TranslationArgs<K> | TranslationArgsWithJSX<K>
  ) {
    const resolved = getByPath(translationsRoot, key);
    if (typeof resolved !== 'string') throw new Error(`Translation key ${key} not found`);
    if (params.length === 0) return resolved;

    const p = params[0] as Record<string, string | number | JSX.Element>;

    const result = resolved.split(/(%\{.+?\})/).map((word: string) => {
      if (word.startsWith('%{') && word.endsWith('}')) {
        const param = word.slice(2, -1) as keyof typeof p;
        if (param in p) {
          const val = p[param];
          if (!isNumberOrString(val)) {
            assertHasKey(val as JSX.Element);
          }
          return val;
        }
      }
      return word;
    });

    if (result.every((word: string | number | JSX.Element) => isNumberOrString(word))) {
      return result.join('');
    }

    return <>{result}</>;
  }

  function isTranslationKey(key: string): key is TranslationKey {
    return hasByPath(translationsRoot, key);
  }

  return { t, isTranslationKey };
}

type TranslationFn = ReturnType<typeof translation>;

const locales = [
  {
    key: 'bg' as const,
    label: 'Български',
  },
  {
    key: 'en' as const,
    label: 'English',
  },
] as const;

export type SupportedLocale = (typeof locales)[number];

type SetLocale = (locale: SupportedLocale['key']) => unknown;

export interface I18nState {
  setLocale: SetLocale;
  locale: SupportedLocale;
  locales: typeof locales;
  localeKey: AppLocaleKey;
  t: TranslationFn['t'];
  isTranslationKey: TranslationFn['isTranslationKey'];
  loading: boolean;
}

const CHOSEN_LANGUAGE_KEY = 'chosen_language';

const storage = new SessionStorageService<AppLocaleKey>(CHOSEN_LANGUAGE_KEY);

function isNumberOrString(element: string | number | JSX.Element): element is string | number {
  return typeof element === 'string' || typeof element === 'number';
}

function assertHasKey(element: JSX.Element) {
  if (!element.key) {
    throw new Error('Element key is not defined');
  }
}

const I18nContext = createContext<I18nState | null>(null);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocale] = useState<SupportedLocale>(
    () => locales.find(({ key }) => key === storage.data) ?? locales[0],
  );

  const setLocaleCallback = useCallback((newLocale: SupportedLocale['key']) => {
    setLocale((currentLocale) => {
      const next = locales.find((l) => l.key === newLocale) ?? locales[0];
      if (next.key !== currentLocale.key) {
        storage.save(next.key);
      }
      return next;
    });
  }, []);

  const { data: translationFunctions, loading, error } = useAsync(async () => {
    const localeSpecificTranslations = (
      await import(`./translations/${locale.key}/index.ts`)
    ).translations as Translations;
    return translation(localeSpecificTranslations);
  }, [locale.key]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !translationFunctions) {
    throw new Error(`Could not load translations for locale ${locale.label}`);
  }

  return (
    <I18nContext.Provider
      value={{
        setLocale: setLocaleCallback,
        locale,
        localeKey: locale.key,
        t: translationFunctions.t,
        isTranslationKey: translationFunctions.isTranslationKey,
        locales,
        loading,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within a I18nProvider');
  }
  return context;
}
