import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, MapPin, Briefcase, X } from "lucide-react";
import { toast } from "sonner";
import { decideMinorReview } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";
import { useCities } from "@/lib/cities";
import { Input } from "@/components/ui/input";

const BANNER_TEXT = {
  EN: {
    text: "Two-factor authentication is strongly recommended for admin accounts. Enroll a TOTP factor from your profile to add a second layer of protection.",
    cta: "Enroll 2FA →",
  },
  FR: {
    text: "L'authentification à deux facteurs est fortement recommandée pour les comptes administrateurs. Activez un facteur TOTP depuis votre profil pour ajouter une couche de protection supplémentaire.",
    cta: "Activer la 2FA →",
  },
  AR: {
    text: "يُنصح بشدة باستخدام المصادقة ثنائية العامل لحسابات المسؤولين. قم بتنشيط عامل TOTP من ملفك الشخصي لإضافة طبقة حماية ثانية.",
    cta: "تفعيل المصادقة ثنائية العامل ←",
  },
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin reports — Roomies" },
      { name: "description", content: "Review user reports and moderate Roomies activity. Restricted to administrators." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <RequireAuth requireOnboarded={false}>
      <AppLayout>
        <Admin />
      </AppLayout>
    </RequireAuth>
  ),
});

function Admin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [bannerLang, setBannerLang] = useState<"EN" | "AR" | "FR">("EN");
  const { cities, saveCities, isSaving } = useCities();
  const [newCity, setNewCity] = useState("");

  const handleAddCity = async () => {
    if (!newCity.trim() || !user) return;
    const city = newCity.trim();
    if (cities.includes(city)) return toast.error("City already exists");
    try {
      await saveCities({ cities: [...cities, city], userId: user.id });
      setNewCity("");
      toast.success("City added successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to add city");
    }
  };

  const handleRemoveCity = async (cityToRemove: string) => {
    if (!user) return;
    try {
      await saveCities({ cities: cities.filter((c) => c !== cityToRemove), userId: user.id });
      toast.success("City removed successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to remove city");
    }
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const { data: mfaFactors } = useQuery({
    queryKey: ["admin-mfa-factors", user?.id],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data;
    },
  });

  const has2FA = !!(mfaFactors?.totp && mfaFactors.totp.length > 0);

  const { data: reports } = useQuery({
    queryKey: ["admin-reports"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data: rs, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((rs ?? []).flatMap((r) => [r.reporter_id, r.reported_id])));
      const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, display_name").in("id", ids) : { data: [] };
      const byId = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.display_name]));
      return (rs ?? []).map((r) => ({ ...r, reporter_name: byId[r.reporter_id] ?? "—", reported_name: byId[r.reported_id] ?? "—" }));
    },
  });

  const { data: minorQueue } = useQuery({
    queryKey: ["admin-minor-queue"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("review_status", "pending_minor_review")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const decideFn = useServerFn(decideMinorReview);
  const decide = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      await decideFn({ data: { id, approve } });
    },
    onSuccess: (_d, v) => {
      toast.success(v.approve ? "Profile approved" : "Profile rejected");
      qc.invalidateQueries({ queryKey: ["admin-minor-queue"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isAdmin === null) return <div className="p-8 text-center text-muted-foreground">Checking…</div>;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-6 pt-12 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-3 text-lg font-semibold">Admins only</h2>
        <p className="mt-1 text-sm text-muted-foreground">You don't have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      {!has2FA && (
        <Card className="relative border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 p-5 text-amber-900 dark:text-amber-200">
          <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold">
            <button
              onClick={() => setBannerLang("EN")}
              className={cn(
                "px-2 py-0.5 rounded transition-colors cursor-pointer",
                bannerLang === "EN" ? "bg-amber-500/25 text-amber-900 dark:text-amber-200" : "opacity-55 hover:opacity-100"
              )}
            >
              EN
            </button>
            <button
              onClick={() => setBannerLang("AR")}
              className={cn(
                "px-2 py-0.5 rounded transition-colors cursor-pointer",
                bannerLang === "AR" ? "bg-amber-500/25 text-amber-900 dark:text-amber-200" : "opacity-55 hover:opacity-100"
              )}
            >
              ع
            </button>
            <button
              onClick={() => setBannerLang("FR")}
              className={cn(
                "px-2 py-0.5 rounded transition-colors cursor-pointer",
                bannerLang === "FR" ? "bg-amber-500/25 text-amber-900 dark:text-amber-200" : "opacity-55 hover:opacity-100"
              )}
            >
              FR
            </button>
          </div>
          
          <div className="flex items-start gap-3.5 pr-20">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-3">
              <p className="text-sm font-medium leading-relaxed">
                {BANNER_TEXT[bannerLang].text}
              </p>
              <Link
                to="/profile"
                className="inline-block text-sm font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 underline underline-offset-4 decoration-2 transition-colors"
              >
                {BANNER_TEXT[bannerLang].cta}
              </Link>
            </div>
          </div>
        </Card>
      )}

      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Minor review queue</h1>
        <p className="text-sm text-muted-foreground">Profiles of users under 18 are held here until you approve or reject them.</p>
        {(!minorQueue || minorQueue.length === 0) && (
          <p className="text-sm text-muted-foreground">Queue is empty.</p>
        )}
        {minorQueue?.map((p) => (
          <Card key={p.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-semibold">{p.display_name || "(no name)"}</h2>
                  {p.age != null && <Badge variant="secondary">Age {p.age}</Badge>}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {p.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.city}</span>}
                  {p.occupation && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {p.occupation}</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: p.id, approve: false })} disabled={decide.isPending}>Reject</Button>
                <Button size="sm" onClick={() => decide.mutate({ id: p.id, approve: true })} disabled={decide.isPending}>Approve</Button>
              </div>
            </div>
            {p.bio && <p className="text-sm text-foreground/80">{p.bio}</p>}
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
        {(!reports || reports.length === 0) && (
          <p className="text-sm text-muted-foreground">No reports yet.</p>
        )}
        {reports?.map((r) => (
          <Card key={r.id} className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{r.reason}</Badge>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">{r.reporter_name}</span>
              <span className="text-muted-foreground"> reported </span>
              <span className="font-medium">{r.reported_name}</span>
            </div>
            {r.details && <p className="text-sm text-muted-foreground">{r.details}</p>}
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Manage Cities</h2>
        <p className="text-sm text-muted-foreground">Add or remove cities available for selection across the app.</p>
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Input 
              placeholder="e.g. Agadir" 
              value={newCity} 
              onChange={(e) => setNewCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCity()}
            />
            <Button onClick={handleAddCity} disabled={!newCity.trim() || isSaving}>Add City</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <Badge key={city} variant="secondary" className="px-3 py-1 text-sm flex items-center gap-2">
                {city}
                <button 
                  onClick={() => handleRemoveCity(city)}
                  disabled={isSaving}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted p-0.5 rounded-full"
                  aria-label={`Remove ${city}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {cities.length === 0 && <span className="text-sm text-muted-foreground">No cities configured.</span>}
          </div>
        </Card>
      </section>
    </div>
  );
}
