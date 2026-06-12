import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Flag, Ban, MapPin, Briefcase, PartyPopper, Check, X as XIcon, MessageCircle } from "lucide-react";
import { canSeePhoto } from "@/lib/visibility";
import { scoreDetail, type Profile } from "@/lib/matching";
import { labelGuests, labelAlcohol, labelPrayer, labelFood } from "@/lib/cultural";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/profile_/$id")({
  validateSearch: (search: Record<string, unknown>): { welcome?: 1 } => ({
    welcome: search.welcome === 1 || search.welcome === "1" ? 1 : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: "Roommate profile — Roomies" },
      { name: "description", content: "View this Roomies member's lifestyle, budget, and contact details to decide if you'd be a good roommate fit." },
      { property: "og:title", content: "Roommate profile — Roomies" },
      { property: "og:description", content: "View this Roomies member's lifestyle, budget, and contact details to decide if you'd be a good roommate fit." },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: `https://domicile-date.lovable.app/profile/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `https://domicile-date.lovable.app/profile/${params.id}` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            identifier: params.id,
            description: "Roomies member profile",
          },
        }),
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <ProfileDetail />
      </AppLayout>
    </RequireAuth>
  ),
});

function ProfileDetail() {
  const { id } = Route.useParams();
  const search = Route.useSearch() as { welcome?: 1 };
  const { user } = useAuth();
  const nav = useNavigate();
  const t = useT();
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("inappropriate");
  const [details, setDetails] = useState("");
  const isOwner = !!user && user.id === id;
  const showWelcome = isOwner && search.welcome === 1;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: viewer } = useQuery({
    queryKey: ["profile-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: isMatched } = useQuery({
    queryKey: ["matched", user?.id, id],
    enabled: !!user && !!id && id !== user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("id")
        .or(`and(user_a.eq.${user!.id},user_b.eq.${id}),and(user_a.eq.${id},user_b.eq.${user!.id})`)
        .maybeSingle();
      return !!data;
    },
  });

  const { data: conversationId } = useQuery({
    queryKey: ["conversation-for", user?.id, id],
    enabled: !!user && !!id && id !== user?.id && !!isMatched,
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(user_a.eq.${user!.id},user_b.eq.${id}),and(user_a.eq.${id},user_b.eq.${user!.id})`)
        .maybeSingle();
      return data?.id ?? null;
    },
  });

  const { data: contacts } = useQuery({
    queryKey: ["profile-contacts", id],
    enabled: !!user && !!id && (isOwner || !!isMatched),
    queryFn: async () => {
      const { data } = await (supabase as any).from("profile_contacts_view").select("*").eq("user_id", id).maybeSingle();
      return data;
    },
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">{t("chat.loading")}</div>;
  if (!profile) return <div className="p-8 text-center">{t("pd.notFound")}</div>;
  // Hide non-approved profiles from non-owners (e.g. minors pending review)
  if (!isOwner && (profile as any).review_status && (profile as any).review_status !== "approved") {
    return <div className="p-8 text-center text-muted-foreground">{t("chat.unavailable")}</div>;
  }

  const block = async () => {
    if (!user) return;
    const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: id });
    if (error) return toast.error(error.message);
    toast.success(t("pd.blocked"));
    nav({ to: "/" });
  };

  const submitReport = async () => {
    if (!user) return;
    const { error } = await supabase.from("reports").insert({ reporter_id: user.id, reported_id: id, reason, details });
    if (error) return toast.error(error.message);
    setReportOpen(false);
    toast.success(t("pd.report.thanks"));
  };

  const tags: string[] = [];
  if (profile.smoking) tags.push(profile.smoking === "no" ? "Non-smoker" : profile.smoking === "yes" ? "Smoker" : "Smokes occasionally");
  if (profile.drinking) tags.push(profile.drinking === "no" ? "No alcohol" : profile.drinking === "often" ? "Drinks often" : "Drinks socially");
  if (profile.sleep_schedule) tags.push(profile.sleep_schedule === "early" ? "Early bird" : profile.sleep_schedule === "late" ? "Night owl" : "Flexible sleeper");
  if (profile.social_level) tags.push(profile.social_level === "homebody" ? "Homebody" : profile.social_level === "social" ? "Very social" : "Balanced");
  if (profile.cleanliness != null) tags.push(`Cleanliness ${profile.cleanliness}/5`);
  if (profile.pets) tags.push(profile.pets === "have" ? "Has a pet" : profile.pets === "ok_with" ? "OK with pets" : "No pets");
  const p = profile as any;
  [labelGuests(p.guests_frequency), labelAlcohol(p.alcohol_in_house), labelPrayer(p.prayer_at_home), labelFood(p.food_sharing)]
    .forEach((l) => { if (l) tags.push(l); });
  const langs = (profile.languages ?? []) as string[];
  if (langs.length) tags.push(`Speaks ${langs.join(", ")}`);

  const breakdown = !isOwner && viewer ? scoreDetail(viewer as Profile, profile as Profile) : null;
  const scoreClass =
    breakdown && breakdown.score >= 80
      ? "bg-emerald-500 text-white"
      : breakdown && breakdown.score >= 60
      ? "bg-amber-500 text-white"
      : "bg-muted text-foreground";

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      {showWelcome ? (
        <Card className="border-primary/30 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <PartyPopper className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-foreground">{t("pd.welcome.title")}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{t("pd.welcome.sub")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {t("pd.welcome.start")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {t("pd.welcome.edit")}
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => history.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </button>
          {!isOwner && (
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("pd.viewing", { name: profile.display_name })}
            </div>
          )}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="relative aspect-[3/4] bg-gradient-to-br from-accent to-primary/30">
          {canSeePhoto(isOwner ? profile.gender : viewer?.gender, profile.gender) && profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.display_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl font-semibold text-primary-foreground">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-semibold">{profile.display_name}</h1>
              {profile.age && <span className="text-lg">{profile.age}</span>}
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-sm opacity-90">
              {profile.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.city}</span>}
              {profile.occupation && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {profile.occupation}</span>}
            </div>
          </div>
        </div>
        <div className="space-y-3 p-4">
          {profile.budget_min != null && profile.budget_max != null && (
            <div className="text-sm"><span className="font-medium">{t("pd.budget")}</span> <span className="text-muted-foreground">{profile.budget_min} – {profile.budget_max} MAD{t("ob.budget.mo")}</span></div>
          )}
          {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">{tags.map((tag) => <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>)}</div>
          )}
        </div>
      </Card>

      {breakdown && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold shadow", scoreClass)}>
              {breakdown.score}%
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t("pd.compat.title")}</div>
              <p className="text-xs text-muted-foreground">{t("pd.compat.sub")}</p>
            </div>
          </div>
          {breakdown.reasons.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {breakdown.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {r.ok ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={r.ok ? "text-foreground" : "text-muted-foreground"}>{r.label}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}


      {isMatched && (
        <Card className="space-y-3 border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-primary">{t("pd.matched")}</div>
            {conversationId && (
              <Link
                to="/chat/$id"
                params={{ id: conversationId }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <MessageCircle className="h-4 w-4" /> {t("pd.message")}
              </Link>
            )}
          </div>
          {contacts?.contact_visible_to_matches !== false ? (
            <>
              {contacts?.email_contact && (
                <ContactRow label={t("common.email")} value={contacts.email_contact} href={`mailto:${contacts.email_contact}`} />
              )}
              {contacts?.phone && contacts?.phone_visible_to_matches && (
                <ContactRow label={t("common.phone")} value={contacts.phone} href={`tel:${contacts.phone}`} />
              )}
              {contacts?.contact_handle && (
                <ContactRow label={t("pd.handle")} value={contacts.contact_handle} />
              )}
              {!(contacts?.email_contact || (contacts?.phone && contacts?.phone_visible_to_matches) || contacts?.contact_handle) && (
                <p className="text-sm text-muted-foreground">{t("pd.noContactYet")}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("pd.privateContacts")}</p>
          )}
        </Card>
      )}

      {user && id !== user.id && (
        <Card className="flex gap-2 p-4">
          <Button variant="outline" className="flex-1" onClick={() => setReportOpen(true)}>
            <Flag className="me-1 h-4 w-4" /> {t("pd.report")}
          </Button>
          <Button variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={block}>
            <Ban className="me-1 h-4 w-4" /> {t("pd.block")}
          </Button>
        </Card>
      )}

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("pd.report.title")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger aria-label={t("pd.report.title")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inappropriate">{t("pd.report.reason.inappropriate")}</SelectItem>
                <SelectItem value="fake">{t("pd.report.reason.fake")}</SelectItem>
                <SelectItem value="harassment">{t("pd.report.reason.harassment")}</SelectItem>
                <SelectItem value="spam">{t("pd.report.reason.spam")}</SelectItem>
                <SelectItem value="other">{t("pd.report.reason.other")}</SelectItem>
              </SelectContent>
            </Select>
            <Textarea rows={3} placeholder={t("pd.report.details.ph")} value={details} onChange={(e) => setDetails(e.target.value)} aria-label={t("pd.report.details.ph")} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={submitReport}>{t("pd.report.submit")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const t = useT();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("common.copied", { label }));
    } catch {
      toast.error(t("common.copyFail"));
    }
  };
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-2">
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        {href ? (
          <a href={href} className="block truncate font-mono text-sm text-primary hover:underline">{value}</a>
        ) : (
          <div className="truncate font-mono text-sm">{value}</div>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={copy}>{t("common.copy")}</Button>
    </div>
  );
}

