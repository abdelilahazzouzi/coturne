import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle } from "lucide-react";
import { canSeePhoto } from "@/lib/visibility";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Vos matchs — Roomies" },
      { name: "description", content: "Découvrez les colocataires qui vous ont aussi liké(e). Ouvrez un match pour voir son profil et ses contacts." },
      { property: "og:title", content: "Vos matchs — Roomies" },
      { property: "og:description", content: "Découvrez les colocataires qui vous ont aussi liké(e). Ouvrez un match pour voir son profil et ses contacts." },
      { property: "og:url", content: "https://smartko.shop/matches" },
    ],
    links: [{ rel: "canonical", href: "https://smartko.shop/matches" }],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <Matches />
      </AppLayout>
    </RequireAuth>
  ),
});

function Matches() {
  const { user } = useAuth();
  const t = useT();

  const { data, isLoading } = useQuery({
    queryKey: ["matches", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: matches, error } = await supabase
        .from("matches")
        .select("id, user_a, user_b, created_at")
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const otherIds = (matches ?? []).map((m) => (m.user_a === user!.id ? m.user_b : m.user_a));
      if (otherIds.length === 0) return { rows: [], viewerGender: null as string | null };
      const matchIds = (matches ?? []).map((m) => m.id);
      const [{ data: profiles }, { data: me }, { data: convos }, { data: blocksOut }, { data: blocksIn }] = await Promise.all([
        supabase.from("profiles").select("*").in("id", otherIds),
        supabase.from("profiles").select("gender").eq("id", user!.id).maybeSingle(),
        supabase.from("conversations").select("id, match_id").in("match_id", matchIds),
        supabase.from("blocks").select("blocked_id").eq("blocker_id", user!.id),
        supabase.from("blocks").select("blocker_id").eq("blocked_id", user!.id),
      ]);
      const hidden = new Set<string>([
        ...(blocksOut ?? []).map((b) => b.blocked_id),
        ...(blocksIn ?? []).map((b) => b.blocker_id),
      ]);
      const convoByMatch = new Map((convos ?? []).map((c) => [c.match_id, c.id]));
      const rows = (matches ?? []).map((m) => {
        const otherId = m.user_a === user!.id ? m.user_b : m.user_a;
        return {
          match: m,
          otherId,
          profile: (profiles ?? []).find((p) => p.id === otherId)!,
          conversationId: convoByMatch.get(m.id) ?? null,
        };
      }).filter((x) =>
        x.profile &&
        !hidden.has(x.otherId) &&
        (!(x.profile as any).review_status || (x.profile as any).review_status === "approved"),
      );
      return { rows, viewerGender: me?.gender ?? null };
    },
  });

  if (isLoading) return <div className="mx-auto max-w-md p-4"><h1 className="text-2xl font-semibold tracking-tight">{t("matches.title")}</h1><p className="mt-4 text-center text-muted-foreground">{t("common.loading")}</p></div>;

  if (!data || data.rows.length === 0) {
    return (
      <div className="mx-auto max-w-md p-6 pt-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("matches.title")}</h1>
        <Heart className="mx-auto mt-6 h-12 w-12 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">{t("matches.empty")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("matches.empty.sub")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-3 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t("matches.title")}</h1>
      {data.rows.map(({ match, profile, conversationId }) => {
        const showPhoto = canSeePhoto(data.viewerGender, profile.gender);
        return (
          <Card key={match.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-accent/40">
            <Link to="/profile/$id" params={{ id: profile.id }} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-accent to-primary/40">
                {showPhoto && profile.photo_url ? (
                  <img src={profile.photo_url} alt={profile.display_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xl font-semibold text-primary-foreground">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{profile.display_name}{profile.age ? `, ${profile.age}` : ""}</div>
                <div className="truncate text-sm text-muted-foreground">{profile.city ?? ""}</div>
              </div>
            </Link>
            {conversationId && (
              <Link
                to="/chat/$id"
                params={{ id: conversationId }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                aria-label={t("matches.message", { name: profile.display_name })}
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            )}
          </Card>
        );
      })}
    </div>
  );
}
