import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function RequireAuth({ children, requireOnboarded = true }: { children: ReactNode; requireOnboarded?: boolean }) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [checkingAal, setCheckingAal] = useState(true);

  const { data: profile, isLoading: pLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setCheckingAal(false);
      nav({ to: "/login" });
      return;
    }
    
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      if (data?.nextLevel === "aal2" && data?.currentLevel === "aal1") {
        nav({ to: "/login" });
      } else {
        setCheckingAal(false);
        if (requireOnboarded && profile && !profile.onboarded) {
          nav({ to: "/onboarding" });
        }
      }
    });
  }, [user, loading, profile, requireOnboarded, nav]);

  if (loading || (user && pLoading) || checkingAal) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return null;
  if (requireOnboarded && profile && !profile.onboarded) return null;
  return <>{children}</>;
}
