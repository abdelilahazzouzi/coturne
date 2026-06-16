import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Heart, Sparkles, User as UserIcon, LogOut, MessageCircle, Home } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useT, LanguageSwitcher } from "@/i18n/LocaleProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const { signOut, user } = useAuth();
  const t = useT();
  const qc = useQueryClient();

  const { data: unreadTotal = 0 } = useQuery({
    queryKey: ["unread-total", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`);
      const ids = (convos ?? []).map((c) => c.id);
      if (ids.length === 0) return 0;
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", ids)
        .is("read_at", null)
        .neq("sender_id", user!.id);
      return count ?? 0;
    },
  });

  // Refresh badge on new messages anywhere
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`unread:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["unread-total", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const tabs = [
    { to: "/discover", labelKey: "nav.discover", icon: Sparkles, badge: 0 },
    { to: "/places", labelKey: "nav.places", icon: Home, badge: 0 },
    { to: "/matches", labelKey: "nav.matches", icon: Heart, badge: 0 },
    { to: "/chats", labelKey: "nav.chats", icon: MessageCircle, badge: unreadTotal },
    { to: "/profile", labelKey: "nav.profile", icon: UserIcon, badge: 0 },
  ] as const;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(to bottom, color-mix(in oklab, var(--background) 12%, transparent), color-mix(in oklab, var(--background) 68%, transparent) 62%, var(--background))`
        }}
      />
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/70 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Heart className="h-4 w-4" />
          </div>
          <Link to="/" className="text-lg font-semibold tracking-tight">Roomies</Link>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={async () => {
              await signOut();
              nav({ to: "/login" });
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t("common.signout")}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="relative z-0 flex-1 pb-20">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/88 backdrop-blur-md">
        <div className="mx-auto flex max-w-md justify-around">
          {tabs.map((tab) => {
            const active = loc.pathname === tab.to;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {tab.badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 min-w-[1.1rem] rounded-full bg-primary px-1 text-[10px] font-semibold leading-[1.1rem] text-primary-foreground">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </span>
                {t(tab.labelKey)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
