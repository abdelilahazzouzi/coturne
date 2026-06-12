import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Response("Forbidden", { status: 403 });
  if (!data) throw new Response("Forbidden", { status: 403 });
}

export const decideMinorReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; approve: boolean }) => {
    if (!input || typeof input.id !== "string" || typeof input.approve !== "boolean") {
      throw new Response("Bad request", { status: 400 });
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await assertAdmin(supabase, userId);
    const update = data.approve
      ? { review_status: "approved", onboarded: true }
      : { review_status: "rejected", onboarded: false };
    const { error } = await supabase.from("profiles").update(update).eq("id", data.id);
    if (error) {
      console.error("[decideMinorReview] DB error:", error);
      throw new Response("Update failed", { status: 400 });
    }
    return { ok: true };
  });
