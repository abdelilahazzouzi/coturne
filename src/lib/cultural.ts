// Cultural option value codes + labels. Provides both the legacy
// English-label arrays (for existing call sites) and a locale-aware hook.

export const GUESTS_VALUES = ["rarely", "occasionally", "often"] as const;
export const ALCOHOL_VALUES = ["not_ok", "discreet", "fine"] as const;
export const PRAYER_VALUES = ["yes", "no", "no_pref"] as const;
export const FOOD_VALUES = ["share_all", "share_some", "separate"] as const;

export const LANGUAGE_OPTIONS = ["Darija", "Arabic", "French", "English", "Amazigh", "Spanish"];

// Legacy English option arrays (kept for back-compat — prefer useCulturalOptions in new code)
export const GUESTS_OPTIONS: [string, string][] = [
  ["rarely", "Rarely"],
  ["occasionally", "Occasionally"],
  ["often", "Often"],
];
export const ALCOHOL_OPTIONS: [string, string][] = [
  ["not_ok", "Not OK"],
  ["discreet", "OK if discreet"],
  ["fine", "Fine"],
];
export const PRAYER_OPTIONS: [string, string][] = [
  ["yes", "Yes — I pray at home"],
  ["no", "I don't"],
  ["no_pref", "No preference"],
];
export const FOOD_OPTIONS: [string, string][] = [
  ["share_all", "Share everything"],
  ["share_some", "Share some"],
  ["separate", "Separate"],
];

import { useT } from "@/i18n/LocaleProvider";

type T = (k: string, v?: Record<string, string | number>) => string;

export function useCulturalOptions() {
  const t = useT();
  return {
    guests: GUESTS_VALUES.map((v) => [v, t(`opt.guests.${v}`)]) as [string, string][],
    alcohol: ALCOHOL_VALUES.map((v) => [v, t(`opt.alcohol.${v}`)]) as [string, string][],
    prayer: PRAYER_VALUES.map((v) => [v, t(`opt.prayer.${v}`)]) as [string, string][],
    food: FOOD_VALUES.map((v) => [v, t(`opt.food.${v}`)]) as [string, string][],
  };
}

const lookup = (opts: [string, string][], v?: string | null) =>
  v ? opts.find((o) => o[0] === v)?.[1] ?? v : null;

// Both legacy (no t) and i18n (with t) call sigs supported.
export function labelGuests(v?: string | null, t?: T): string | null {
  if (!v) return null;
  if (t && (GUESTS_VALUES as readonly string[]).includes(v)) return t("tag.guests", { v: t(`opt.guests.${v}`).toLowerCase() });
  const l = lookup(GUESTS_OPTIONS, v);
  return l ? `Guests: ${l.toLowerCase()}` : null;
}
export function labelAlcohol(v?: string | null, t?: T): string | null {
  if (!v) return null;
  if (t && (ALCOHOL_VALUES as readonly string[]).includes(v)) return t("tag.alcohol", { v: t(`opt.alcohol.${v}`).toLowerCase() });
  const l = lookup(ALCOHOL_OPTIONS, v);
  return l ? `Alcohol: ${l.toLowerCase()}` : null;
}
export function labelPrayer(v?: string | null, t?: T): string | null {
  if (t) {
    if (v === "yes") return t("tag.prayer.yes");
    if (v === "no") return t("tag.prayer.no");
    if (v === "no_pref") return t("tag.prayer.no_pref");
    return null;
  }
  if (v === "yes") return "Prays at home";
  if (v === "no") return "Doesn't pray at home";
  if (v === "no_pref") return "Prayer: no preference";
  return null;
}
export function labelFood(v?: string | null, t?: T): string | null {
  if (!v) return null;
  if (t && (FOOD_VALUES as readonly string[]).includes(v)) return t("tag.food", { v: t(`opt.food.${v}`).toLowerCase() });
  const l = lookup(FOOD_OPTIONS, v);
  return l ? `Food: ${l.toLowerCase()}` : null;
}
