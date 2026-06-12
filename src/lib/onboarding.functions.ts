import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ProfileSchema = z.object({
  display_name: z.string().min(1).max(120),
  age: z.number().int().min(13).max(120).nullable(),
  gender: z.enum(["female", "male", "nonbinary", "other"]).nullable(),
  occupation: z.string().max(200).optional().default(""),
  city: z.string().max(120).optional().default(""),
  neighborhood: z.string().max(120).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  cndp_consent_accepted: z.boolean().optional().default(false),
  budget_min: z.number().int().min(0).max(100000),
  budget_max: z.number().int().min(0).max(100000),
  smoking: z.enum(["no", "occasionally", "yes"]).nullable(),
  drinking: z.enum(["no", "socially", "often"]).nullable(),
  sleep_schedule: z.enum(["early", "late", "flexible"]).nullable(),
  social_level: z.enum(["homebody", "balanced", "social"]).nullable(),
  cleanliness: z.number().int().min(1).max(5),
  pets: z.enum(["none", "have", "ok_with"]).nullable(),
  guests_frequency: z.string().max(60).nullable(),
  alcohol_in_house: z.string().max(60).nullable(),
  prayer_at_home: z.string().max(60).nullable(),
  food_sharing: z.string().max(60).nullable(),
  languages: z.array(z.string().min(1).max(60)).max(30),
  bio: z.string().max(2000).optional().default(""),
});

const ContactsSchema = z.object({
  email_contact: z.string().email().max(320).nullable(),
  phone: z.string().max(40).nullable(),
  contact_handle: z.string().max(120).nullable(),
  contact_visible_to_matches: z.boolean(),
});

export const submitOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ profile: ProfileSchema, contacts: ContactsSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;

    // Defence-in-depth: refuse to set onboarded=true for rejected users.
    const { data: current, error: readErr } = await supabase
      .from("profiles")
      .select("review_status")
      .eq("id", userId)
      .maybeSingle();
    if (readErr) {
      console.error("[submitOnboarding] read error:", readErr);
      throw new Response("Could not load profile", { status: 500 });
    }
    if (current?.review_status === "rejected") {
      throw new Response("Profile is not eligible to onboard", { status: 403 });
    }

    const { error: pErr } = await supabase
      .from("profiles")
      .update({ ...data.profile, onboarded: true } as any)
      .eq("id", userId);
    if (pErr) {
      console.error("[submitOnboarding] profile update error:", pErr);
      throw new Response("Could not save profile", { status: 400 });
    }

    const { error: cErr } = await supabase
      .from("profile_contacts")
      .upsert({ user_id: userId, ...data.contacts }, { onConflict: "user_id" });
    if (cErr) {
      console.error("[submitOnboarding] contacts upsert error:", cErr);
      throw new Response("Could not save contact info", { status: 400 });
    }

    const isMinor = data.profile.age != null && data.profile.age < 18;
    return { ok: true, isMinor };
  });
