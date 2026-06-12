import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type ScoreBreakdown = {
  score: number;
  reasons: { label: string; ok: boolean; weight: number }[];
};

// Compatibility scoring 0..100. Hard filters (city, budget overlap) handled separately.
export function scoreDetail(me: Profile, other: Profile): ScoreBreakdown {
  let pts = 0;
  let max = 0;
  const reasons: ScoreBreakdown["reasons"] = [];

  const w = (label: string, cond: boolean | null | undefined, weight: number, applicable = true) => {
    if (!applicable) return;
    max += weight;
    const ok = !!cond;
    if (ok) pts += weight;
    reasons.push({ label, ok, weight });
  };

  w("Same smoking habits", me.smoking === other.smoking, 18, !!(me.smoking && other.smoking));
  w("Same sleep schedule", me.sleep_schedule === other.sleep_schedule, 12, !!(me.sleep_schedule && other.sleep_schedule));
  w("Similar social level", me.social_level === other.social_level, 12, !!(me.social_level && other.social_level));
  w(
    "Similar cleanliness",
    me.cleanliness != null && other.cleanliness != null && Math.abs(me.cleanliness - other.cleanliness) <= 1,
    12,
    me.cleanliness != null && other.cleanliness != null,
  );
  w("Drinking compatible", me.drinking === other.drinking, 8, !!(me.drinking && other.drinking));
  w(
    "Pets compatible",
    me.pets === other.pets ||
      (me.pets === "ok_with" && other.pets === "have") ||
      (me.pets === "have" && other.pets === "ok_with"),
    8,
    !!(me.pets && other.pets),
  );

  // Morocco-specific cultural fit
  const meAny = me as any;
  const otherAny = other as any;
  w(
    "Guests frequency aligned",
    meAny.guests_frequency === otherAny.guests_frequency,
    8,
    !!(meAny.guests_frequency && otherAny.guests_frequency),
  );
  w(
    "Alcohol-in-house compatible",
    meAny.alcohol_in_house === otherAny.alcohol_in_house,
    8,
    !!(meAny.alcohol_in_house && otherAny.alcohol_in_house),
  );
  w(
    "Prayer-at-home compatible",
    meAny.prayer_at_home === otherAny.prayer_at_home || meAny.prayer_at_home === "no_pref" || otherAny.prayer_at_home === "no_pref",
    5,
    !!(meAny.prayer_at_home && otherAny.prayer_at_home),
  );
  w(
    "Food sharing aligned",
    meAny.food_sharing === otherAny.food_sharing,
    5,
    !!(meAny.food_sharing && otherAny.food_sharing),
  );

  // Language overlap
  const myLangs = (me.languages ?? []) as string[];
  const otherLangs = (other.languages ?? []) as string[];
  if (myLangs.length && otherLangs.length) {
    const overlap = myLangs.filter((l) => otherLangs.includes(l));
    max += 6;
    if (overlap.length > 0) pts += 6;
    reasons.push({
      label: overlap.length > 0 ? `Shared language${overlap.length > 1 ? "s" : ""}: ${overlap.join(", ")}` : "No shared language",
      ok: overlap.length > 0,
      weight: 6,
    });
  }

  // Budget overlap
  if (me.budget_min != null && me.budget_max != null && other.budget_min != null && other.budget_max != null) {
    const overlap = Math.min(me.budget_max, other.budget_max) - Math.max(me.budget_min, other.budget_min);
    max += 12;
    let earned = 0;
    if (overlap > 0) {
      const span = Math.max(me.budget_max - me.budget_min, other.budget_max - other.budget_min, 1);
      earned = Math.round(12 * Math.min(1, overlap / span));
      pts += earned;
    }
    reasons.push({ label: overlap > 0 ? "Budgets overlap" : "Budgets don't overlap", ok: overlap > 0, weight: 12 });
  }

  const final = max === 0 ? 0 : Math.round((pts / max) * 100);
  return { score: final, reasons };
}

export function score(me: Profile, other: Profile): number {
  return scoreDetail(me, other).score;
}

export function budgetsOverlap(me: Profile, other: Profile): boolean {
  if (me.budget_min == null || me.budget_max == null || other.budget_min == null || other.budget_max == null) return true;
  return Math.min(me.budget_max, other.budget_max) >= Math.max(me.budget_min, other.budget_min);
}
