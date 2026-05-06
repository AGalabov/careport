import type { Translations } from './en';
import type { JSX } from 'react';

/** Dot-path keys for nested string records (replaces react-hook-form `Path` — no extra dependency). */
export type TranslationKeyPath<T, Prefix extends string = ''> = T extends object
  ? T extends readonly unknown[]
    ? never
    : {
        [K in keyof T & string]: T[K] extends string | number | bigint | boolean
          ? Prefix extends ''
            ? `${K}`
            : `${Prefix}.${K}`
          : T[K] extends object
            ? TranslationKeyPath<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
            : Prefix extends ''
              ? `${K}`
              : `${Prefix}.${K}`;
      }[keyof T & string]
  : never;

export type { Translations };

export type TranslationKey = TranslationKeyPath<Translations>;

type Head<T extends string> = T extends `${infer First}.${string}` ? First : T;

type Tail<T extends string> = T extends `${string}.${infer Rest}` ? Rest : never;

// Gets a value from a nested object by a key path.
type GetValueByPath<T, Key extends string> = T extends object
  ? Head<Key> extends ''
    ? never
    : Head<Key> extends keyof T
      ? Tail<Key> extends ''
        ? T[Head<Key> & keyof T]
        : GetValueByPath<T[Head<Key> & keyof T], Tail<Key>>
      : never
  : Head<Key> extends ''
    ? T
    : never;

type TranslationParamsWithValue<
  Types,
  T extends string,
> = T extends `${string}%{${infer P}}${infer Rest}`
  ? Record<P, Types> & TranslationParamsWithValue<Types, Rest>
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {};

type TranslationTemplateString = `${string}%{${string}}${string}`;

type TranslationValue<Key extends TranslationKey> = GetValueByPath<Translations, Key>;

export type TranslationArgsWithValues<Key extends TranslationKey, Values> =
  TranslationValue<Key> extends never
    ? []
    : TranslationValue<Key> extends TranslationTemplateString
      ? [TranslationParamsWithValue<Values, TranslationValue<Key>>]
      : [];

export type TranslationArgs<Key extends TranslationKey> = TranslationArgsWithValues<
  Key,
  string | number
>;
export type TranslationArgsWithJSX<Key extends TranslationKey> = TranslationArgsWithValues<
  Key,
  string | number | JSX.Element
>;

type NestedObjectToStringValues<T extends object> = {
  [K in keyof T]: T[K] extends object ? NestedObjectToStringValues<T[K]> : string;
};

export type TranslationsTemplate = NestedObjectToStringValues<Translations>;
