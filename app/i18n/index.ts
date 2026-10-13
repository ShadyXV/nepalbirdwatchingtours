import { en } from "./en";

export const locale = "en";

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends readonly unknown[]
      ? never
      : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type StringKey = Leaves<typeof en>;

/** Look up a UI string by dot path; `{name}` placeholders are filled from `vars`. */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const value = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], en);
  const text = String(value);
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => String(vars[name] ?? match));
}
