import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/chats")({
  head: () => ({
    meta: [
      { title: "Vos discussions — Roomies" },
      { name: "description", content: "Toutes vos conversations avec vos matchs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <Chats />
      </AppLayout>
    </RequireAuth>
  ),
});

function Chats() {
  const { user } = useAuth();
  const t = useT();

  const { data, isLoading } = useQuery({
    queryKey: ["chats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: convos, error } = await supabase
        .from("conversations")
        .select("id, user_a, user_b, last_message_at")
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const otherIds = (convos ?? []).map((c) => (c.user_a === user!.id ? c.user_b : c.user_a));
      if (otherIds.length === 0) return [];

      const [{ data: profiles }, { data: lastMsgs }, { data: unread }, { data: blocksOut }, { data: blocksIn }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, photo_url, review_status").in("id", otherIds),
        supabase
          .from("messages")
          .select("conversation_id, body, created_at, sender_id")
          .in("conversation_id", (convos ?? []).map((c) => c.id))
          .order("created_at", { ascending: false }),
        supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", (convos ?? []).map((c) => c.id))
          .is("read_at", null)
          .neq("sender_id", user!.id),
        supabase.from("blocks").select("blocked_id").eq("blocker_id", user!.id),
        supabase.from("blocks").select("blocker_id").eq("blocked_id", user!.id),
      ]);

      const hidden = new Set<string>([
        ...(blocksOut ?? []).map((b) => b.blocked_id),
        ...(blocksIn ?? []).map((b) => b.blocker_id),
      ]);

      const lastByConvo = new Map<string, { body: string; created_at: string; sender_id: string }>();
      (lastMsgs ?? []).forEach((m) => {
        if (!lastByConvo.has(m.conversation_id)) lastByConvo.set(m.conversation_id, m);
      });
      const unreadCount = new Map<string, number>();
      (unread ?? []).forEach((m) => {
        unreadCount.set(m.conversation_id, (unreadCount.get(m.conversation_id) ?? 0) + 1);
      });

      return (convos ?? []).map((c) => {
        const otherId = c.user_a === user!.id ? c.user_b : c.user_a;
        const profile = (profiles ?? []).find((p) => p.id === otherId);
        return {
          id: c.id,
          otherId,
          profile,
          last: lastByConvo.get(c.id),
          unread: unreadCount.get(c.id) ?? 0,
        };
      }).filter((x) =>
        x.profile &&
        !hidden.has(x.otherId) &&
        (!(x.profile as any).review_status || (x.profile as any).review_status === "approved"),
      );
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md p-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("chats.title")}</h1>
        <p className="mt-4 text-center text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="mx-auto max-w-md p-6 pt-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("chats.title")}</h1>
        <MessageCircle className="mx-auto mt-6 h-12 w-12 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">{t("chats.empty")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("chats.empty.sub")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-3 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t("chats.title")}</h1>
      {data.map((row) => {
        const p = row.profile!;
        return (
          <Link key={row.id} to="/chat/$id" params={{ id: row.id }}>
            <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-accent/40">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-accent to-primary/40">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.display_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-semibold text-primary-foreground">
                    {p.display_name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-semibold">{p.display_name}</div>
                  {row.unread > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                      {row.unread}
                    </span>
                  )}
                </div>
                <div className="truncate text-sm text-muted-foreground">
                  {row.last ? row.last.body : t("chats.noMessages")}
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
