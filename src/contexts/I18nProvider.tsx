/* eslint-disable react-refresh/only-export-components -- hook co-located with provider */
import {
  createContext,
  type JSX,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Locale } from 'date-fns';
import { bg } from 'date-fns/locale/bg';
import { enUS } from 'date-fns/locale';
import type {
  TranslationArgs,
  TranslationArgsWithJSX,
  TranslationKey,
  Translations,
} from './translations';
import { get, has } from '../lib/object-path';
import { SessionStorageService } from '../services/session-storage';
import { useAsync } from '../hooks/use-async';

const locales = [
  { key: 'bg', label: 'Български' },
  { key: 'en', label: 'English' },
] as const;

const DATE_LOCALE_MAP = {
  bg,
  en: enUS,
} as const satisfies Record<(typeof locales)[number]['key'], Locale>;

function translation(tree: Translations) {
  function t<K extends TranslationKey>(key: K, ...params: TranslationArgs<K>): string;
  function t<K extends TranslationKey>(key: K, ...params: TranslationArgsWithJSX<K>): ReactNode;
  function t<K extends TranslationKey>(
    key: K,
    ...params: TranslationArgs<K> | TranslationArgsWithJSX<K>
  ) {
    const value = get(tree, key as string);
    if (typeof value !== 'string') throw new Error(`Translation key ${String(key)} not found`);
    if (params.length === 0) return value;

    const p = params[0] as Record<string, string | number | JSX.Element>;

    const result = value.split(/(%\{.+?\})/).map((word: string) => {
      if (word.startsWith('%{') && word.endsWith('}')) {
        const param = word.slice(2, -1) as keyof typeof p;
        if (param in p) {
          if (!isNumberOrString(p[param])) {
            assertHasKey(p[param] as JSX.Element);
          }
          return p[param];
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
    return has(tree, key);
  }

  return { t, isTranslationKey };
}

type TranslationFn = ReturnType<typeof translation>;

type SupportedLocale = (typeof locales)[number];

type SetLocale = (locale: SupportedLocale['key']) => unknown;

interface I18nState {
  setLocale: SetLocale;
  locale: SupportedLocale;
  locales: typeof locales;
  t: TranslationFn['t'];
  isTranslationKey: TranslationFn['isTranslationKey'];
  loading: boolean;
  dateLocale: Locale;
}

const CHOSEN_LANGUAGE_KEY = 'chosen_language';

const storage = new SessionStorageService<SupportedLocale['key']>(CHOSEN_LANGUAGE_KEY);

function isNumberOrString(element: string | number | JSX.Element): element is string | number {
  return ['string', 'number'].includes(typeof element);
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
      if (newLocale !== currentLocale.key) {
        storage.save(newLocale);
      }

      return locales.find((l) => l.key === newLocale) ?? locales[0];
    });
  }, []);

  const { data: translationBundle, loading, error } = useAsync(async () => {
    const module = (await import(`./translations/${locale.key}/index.ts`)) as {
      translations: Translations;
    };
    return translation(module.translations);
  }, [locale.key]);

  useEffect(() => {
    document.documentElement.lang = locale.key;
  }, [locale.key]);

  if (loading || !translationBundle) {
    return null;
  }

  if (error) {
    throw new Error(`Could not load translations for locale ${locale.label}`);
  }

  return (
    <I18nContext.Provider
      value={{
        setLocale: setLocaleCallback,
        locale,
        t: translationBundle.t,
        isTranslationKey: translationBundle.isTranslationKey,
        locales,
        loading,
        dateLocale: DATE_LOCALE_MAP[locale.key],
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

/** @internal exported hook — paired with {@link I18nProvider} */
export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within a I18nProvider');
  }
  return context;
}
