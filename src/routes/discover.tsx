import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Heart, X, MapPin, Briefcase, Sparkles, SlidersHorizontal, Check, ChevronsUpDown, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CITIES } from "@/lib/cities";
import { canSeePhoto, canMatch } from "@/lib/visibility";
import { score, type Profile } from "@/lib/matching";
import { labelGuests, labelAlcohol, labelPrayer, labelFood } from "@/lib/cultural";
import { toast } from "sonner";
import { useT } from "@/i18n/LocaleProvider";
import { PaywallModal } from "@/components/paywall/PaywallModal";
import { getDistanceInKm, NEIGHBORHOODS } from "@/lib/neighborhoods";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover roommates — Roomies" },
      { name: "description", content: "Browse compatible roommate profiles in your city. Filter by budget, lifestyle, and habits, then like to match." },
      { property: "og:title", content: "Discover roommates — Roomies" },
      { property: "og:description", content: "Browse compatible roommate profiles in your city. Filter by budget, lifestyle, and habits, then like to match." },
      { property: "og:url", content: "https://domicile-date.lovable.app/discover" },
    ],
    links: [{ rel: "canonical", href: "https://domicile-date.lovable.app/discover" }],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <Discover />
      </AppLayout>
    </RequireAuth>
  ),
});

type Filters = {
  city: string;
  budget: [number, number];
  ageMin: number;
  ageMax: number;
  smoking: string[];
  pets: string[];
  sleep: string[];
  social: string[];
  maxDistance: number;
};

const DEFAULT_FILTERS: Filters = {
  city: "",
  budget: [0, 5000],
  ageMin: 18,
  ageMax: 99,
  smoking: [],
  pets: [],
  sleep: [],
  social: [],
  maxDistance: 30,
};

function Discover() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const t = useT();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error && !error.message.includes("does not exist")) throw error;
      return data ?? { tier: "free", status: "active" };
    },
  });

  const { data: swipeCount = 0 } = useQuery({
    queryKey: ["swipes-24h", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("from_user", user!.id)
        .gte("created_at", yesterday);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Seed filters from the user's own profile once it loads
  useEffect(() => {
    if (!me) return;
    setFilters((f) => ({
      ...f,
      city: f.city || me.city || "",
      budget: [me.budget_min ?? 0, me.budget_max ?? 5000],
    }));
  }, [me]);

  const filterKey = JSON.stringify(filters);

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["candidates", user?.id, filterKey],
    enabled: !!user && !!me,
    queryFn: async () => {
      const [{ data: profiles }, { data: likes }, { data: blocks }] = await Promise.all([
        supabase.from("profiles").select("*").eq("onboarded", true).neq("id", user!.id),
        supabase.from("likes").select("to_user").eq("from_user", user!.id),
        supabase.from("blocks").select("blocked_id").eq("blocker_id", user!.id),
      ]);
      const skip = new Set<string>([
        ...(likes ?? []).map((l) => l.to_user),
        ...(blocks ?? []).map((b) => b.blocked_id),
      ]);
      const filtered = (profiles ?? []).filter((p) => !skip.has(p.id));
      const matched = filtered.filter((p) => {
        // Hide non-approved profiles (e.g. minors pending review)
        if ((p as any).review_status && (p as any).review_status !== "approved") return false;
        if (filters.city && p.city && filters.city.trim().toLowerCase() !== p.city.trim().toLowerCase()) return false;
        
        // Proximity calculation:
        if (me?.latitude && me?.longitude && p.latitude && p.longitude) {
          const dist = getDistanceInKm(
            { lat: me.latitude, lng: me.longitude },
            { lat: p.latitude, lng: p.longitude }
          );
          if (dist > filters.maxDistance) return false;
        }

        // Budget overlap with filter range
        const [bMin, bMax] = filters.budget;
        if (p.budget_min != null && p.budget_max != null) {
          if (Math.min(bMax, p.budget_max) < Math.max(bMin, p.budget_min)) return false;
        }
        if (p.age != null && (p.age < filters.ageMin || p.age > filters.ageMax)) return false;
        // Same-gender matching only: this is a roommate app, not a dating app.
        if (!canMatch(me?.gender, p.gender)) return false;
        if (filters.smoking.length && (!p.smoking || !filters.smoking.includes(p.smoking as string))) return false;
        if (filters.pets.length && (!p.pets || !filters.pets.includes(p.pets as string))) return false;
        if (filters.sleep.length && (!p.sleep_schedule || !filters.sleep.includes(p.sleep_schedule as string))) return false;
        if (filters.social.length && (!p.social_level || !filters.social.includes(p.social_level as string))) return false;
        return true;
      });
      return matched
        .map((p) => {
          let distance: number | null = null;
          if (me?.latitude && me?.longitude && p.latitude && p.longitude) {
            distance = getDistanceInKm(
              { lat: me.latitude, lng: me.longitude },
              { lat: p.latitude, lng: p.longitude }
            );
          }
          return {
            p: p as Profile,
            s: score(me!, p as Profile),
            distance,
          };
        })
        .sort((a, b) => b.s - a.s);
    },
  });

  const [idx, setIdx] = useState(0);
  // Reset index when filters change
  useEffect(() => { setIdx(0); }, [filterKey]);

  const stack = candidates ?? [];
  const current = stack[idx];

  const act = useMutation({
    mutationFn: async ({ to_user, kind }: { to_user: string; kind: "like" | "pass" }) => {
      const { error } = await supabase.from("likes").insert({ from_user: user!.id, to_user, kind });
      if (error) throw error;
      if (kind === "like") {
        const { data } = await supabase
          .from("matches")
          .select("id")
          .or(`and(user_a.eq.${user!.id},user_b.eq.${to_user}),and(user_a.eq.${to_user},user_b.eq.${user!.id})`)
          .maybeSingle();
        return !!data;
      }
      return false;
    },
    onSuccess: (isMatch) => {
      if (isMatch) toast.success(t("disc.match.toast"), { description: t("disc.match.toast.sub") });
      setIdx((i) => i + 1);
      qc.invalidateQueries({ queryKey: ["candidates"] });
      qc.invalidateQueries({ queryKey: ["swipes-24h", user?.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSwipe = (to_user: string, kind: "like" | "pass") => {
    if (subscription?.tier !== "premium" && swipeCount >= 5) {
      setPaywallOpen(true);
      return;
    }
    act.mutate({ to_user, kind });
  };

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">{t("disc.title")}</h1>
        <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)}>
          <SlidersHorizontal className="me-1.5 h-4 w-4" /> {t("disc.filters")}
        </Button>
      </div>

      {showFilters && (
        <FiltersPanel filters={filters} onChange={setFilters} onReset={() => setFilters({ ...DEFAULT_FILTERS, city: me?.city ?? "", budget: [me?.budget_min ?? 0, me?.budget_max ?? 5000] })} me={me} />
      )}

      {isLoading ? (
        <Loader />
      ) : !current ? (
        <div className="p-6 pt-12 text-center">
          <h2 className="text-xl font-semibold">{t("disc.allCaught")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("disc.allCaught.sub")}</p>
          <Button variant="outline" className="mt-4" onClick={() => setFilters(DEFAULT_FILTERS)}>
            {t("disc.loosen")}
          </Button>
        </div>
      ) : (
        <>
          <CandidateCard profile={current.p} score={current.s} distance={current.distance} viewerGender={me?.gender} />
          {subscription?.tier !== "premium" && swipeCount >= 5 && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-600 dark:text-yellow-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Crown className="h-4 w-4" /> Daily limit reached ({swipeCount}/5)
              </span>
              <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold text-yellow-700 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300" onClick={() => setPaywallOpen(true)}>
                Upgrade
              </Button>
            </div>
          )}
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => handleSwipe(current.p.id, "pass")}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card shadow transition-transform hover:scale-105 active:scale-95"
              aria-label={t("disc.pass")}
            >
              <X className="h-7 w-7 text-muted-foreground" />
            </button>
            <button
              onClick={() => handleSwipe(current.p.id, "like")}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label={t("disc.like")}
            >
              <Heart className="h-7 w-7" fill="currentColor" />
            </button>
          </div>
          {user && (
            <PaywallModal
              open={paywallOpen}
              onOpenChange={setPaywallOpen}
              userId={user.id}
            />
          )}
        </>
      )}
    </div>
  );
}

function FiltersPanel({ filters, onChange, onReset, me }: { filters: Filters; onChange: (f: Filters) => void; onReset: () => void; me?: Profile }) {
  const t = useT();
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...filters, [k]: v });
  const toggle = (k: "smoking" | "pets" | "sleep" | "social", v: string) => {
    const cur = filters[k];
    set(k, cur.includes(v) ? cur.filter((x: string) => x !== v) : [...cur, v]);
  };
  return (
    <Card className="mb-4 space-y-4 p-4">
      <div className="space-y-1.5">
        <Label>{t("ob.city")}</Label>
        <CityCombobox value={filters.city} onChange={(v) => set("city", v)} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>{t("disc.budget")}</Label>
          <span className="text-sm font-medium">{filters.budget[0]} – {filters.budget[1]} MAD</span>
        </div>
        <Slider min={0} max={5000} step={50} minStepsBetweenThumbs={1} value={filters.budget}
          onValueChange={([a,b]) => set("budget", [Math.min(a,b), Math.max(a,b)])} />
      </div>

      {me?.latitude && me?.longitude && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>{t("disc.maxDistance")}</Label>
            <span className="text-sm font-medium">{filters.maxDistance} km</span>
          </div>
          <Slider min={1} max={50} step={1} value={[filters.maxDistance]}
            onValueChange={([val]) => set("maxDistance", val)} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("disc.ageMin")}</Label>
          <Input type="number" min={18} max={99} value={filters.ageMin} onChange={(e) => set("ageMin", Math.max(18, Number(e.target.value) || 18))} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("disc.ageMax")}</Label>
          <Input type="number" min={18} max={99} value={filters.ageMax} onChange={(e) => set("ageMax", Math.min(99, Number(e.target.value) || 99))} />
        </div>
      </div>

      <p className="rounded-md border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">{t("disc.sameGender")}</p>
      <ChipGroup label={t("disc.chip.smoking")} options={[["no",t("ob.smoking.no")],["occasionally",t("ob.smoking.occasionally")],["yes",t("ob.smoking.yes")]]} selected={filters.smoking} onToggle={(v) => set("smoking", filters.smoking.includes(v) ? [] : [v])} />
      <ChipGroup label={t("disc.chip.pets")} options={[["none",t("ob.pets.none")],["have",t("ob.pets.have")],["ok_with",t("ob.pets.ok_with")]]} selected={filters.pets} onToggle={(v) => set("pets", filters.pets.includes(v) ? [] : [v])} />
      <ChipGroup label={t("disc.chip.sleep")} options={[["early",t("ob.sleep.early")],["flexible",t("ob.sleep.flexible")],["late",t("ob.sleep.late")]]} selected={filters.sleep} onToggle={(v) => set("sleep", filters.sleep.includes(v) ? [] : [v])} />
      <ChipGroup label={t("disc.chip.social")} options={[["homebody",t("ob.social.homebody")],["balanced",t("ob.social.balanced")],["social",t("ob.social.social")]]} selected={filters.social} onToggle={(v) => set("social", filters.social.includes(v) ? [] : [v])} />

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onReset}>{t("disc.reset")}</Button>
      </div>
    </Card>
  );
}

function ChipGroup({ label, options, selected, onToggle }: { label: string; options: [string, string][]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => {
          const active = selected.includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onToggle(v)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent",
              )}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CityCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}>
          {value || t("disc.anyCity")}
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("ob.city.search")} />
          <CommandList>
            <CommandEmpty>{t("ob.city.none")}</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__any" onSelect={() => { onChange(""); setOpen(false); }}>
                <Check className={cn("me-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")} />
                {t("disc.anyCity")}
              </CommandItem>
              {CITIES.map((c) => (
                <CommandItem key={c} value={c} onSelect={() => { onChange(c); setOpen(false); }}>
                  <Check className={cn("me-2 h-4 w-4", value === c ? "opacity-100" : "opacity-0")} />
                  {c}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CandidateCard({ profile, score, distance, viewerGender }: { profile: Profile; score: number; distance: number | null; viewerGender?: string | null }) {
  const t = useT();
  const lifestyle = useMemo(() => {
    const tags: string[] = [];
    if (profile.smoking) tags.push(t(`tag.smoking.${profile.smoking}`));
    if (profile.sleep_schedule) tags.push(t(`tag.sleep.${profile.sleep_schedule}`));
    if (profile.social_level) tags.push(t(`tag.social.${profile.social_level}`));
    if (profile.pets) tags.push(t(`tag.pets.${profile.pets}`));
    const p = profile as any;
    [labelGuests(p.guests_frequency), labelAlcohol(p.alcohol_in_house), labelPrayer(p.prayer_at_home), labelFood(p.food_sharing)]
      .forEach((l) => { if (l) tags.push(l); });
    const langs = (profile.languages ?? []) as string[];
    if (langs.length) tags.push(t("tag.languages", { v: langs.slice(0, 3).join(", ") }));
    return tags;
  }, [profile, t]);

  const showPhoto = canSeePhoto(viewerGender, profile.gender);

  const scoreClass =
    score >= 80
      ? "bg-emerald-500 text-white"
      : score >= 60
      ? "bg-amber-500 text-white"
      : "bg-background/90 text-muted-foreground";

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-accent to-primary/30">
        {showPhoto && profile.photo_url ? (
          <img src={profile.photo_url} alt={profile.display_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl font-semibold text-primary-foreground">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className={cn("absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow backdrop-blur", scoreClass)}>
          {score}% {t("disc.match")}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-semibold">{profile.display_name}</h2>
            {profile.age && <span className="text-lg">{profile.age}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm opacity-90">
            {profile.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />{" "}
                {profile.city}
                {profile.neighborhood ? `, ${profile.neighborhood}` : ""}
                {distance !== null && distance !== undefined ? ` (${distance.toFixed(1)} km)` : ""}
              </span>
            )}
            {profile.occupation && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {profile.occupation}</span>}
          </div>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {profile.budget_min != null && profile.budget_max != null && (
          <div className="text-sm">
            <span className="font-medium">{t("disc.budgetLabel")}</span>{" "}
            <span className="text-muted-foreground">{profile.budget_min} – {profile.budget_max} MAD{t("ob.budget.mo")}</span>
          </div>
        )}
        {profile.bio && <p className="text-sm leading-relaxed text-foreground">{profile.bio}</p>}
        {lifestyle.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {lifestyle.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
            ))}
          </div>
        )}
        <Link to="/profile/$id" params={{ id: profile.id }} className="block text-center text-sm font-medium text-primary hover:underline">
          {t("disc.viewFull")}
        </Link>
      </div>
    </Card>
  );
}

function Loader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
