import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CITIES } from "@/lib/cities";
import { toast } from "sonner";
import { Lock, Sparkles } from "lucide-react";
import { useT } from "@/i18n/LocaleProvider";

type PlaceForm = {
  id?: string;
  title: string;
  description: string;
  city: string;
  neighborhood: string;
  rent_monthly: number;
  currency: string;
  available_from: string;
  min_stay_months: number | null;
  room_type: "private" | "shared";
  furnished: boolean;
  bills_included: boolean;
  photos: string[];
  status: "draft" | "published" | "paused";
};

const empty: PlaceForm = {
  title: "",
  description: "",
  city: CITIES[0],
  neighborhood: "",
  rent_monthly: 2000,
  currency: "MAD",
  available_from: "",
  min_stay_months: null,
  room_type: "private",
  furnished: false,
  bills_included: false,
  photos: [],
  status: "draft",
};

export function PlaceEditor({ initial }: { initial?: PlaceForm }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const t = useT();
  const [form, setForm] = useState<PlaceForm>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  const { data: meProfile } = useQuery({
    queryKey: ["me-review-status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("review_status").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const canPublish = !meProfile?.review_status || meProfile.review_status === "approved";

  const set = <K extends keyof PlaceForm>(k: K, v: PlaceForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async (status: "draft" | "published") => {
    if (!user) return;
    if (!form.title.trim() || !form.city || !form.rent_monthly) {
      toast.error("Title, city and rent are required.");
      return;
    }
    if (status === "published" && !canPublish) {
      toast.error(t("pe.cannotPublish") ?? "Your profile must be approved before publishing a listing.");
      return;
    }
    setSaving(true);
    const payload = {
      host_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city,
      neighborhood: form.neighborhood.trim() || null,
      rent_monthly: form.rent_monthly,
      currency: form.currency,
      available_from: form.available_from || null,
      min_stay_months: form.min_stay_months,
      room_type: form.room_type,
      furnished: form.furnished,
      bills_included: form.bills_included,
      photos: form.photos,
      status,
    };
    if (isEdit) {
      const { error } = await supabase
        .from("places")
        .update(payload)
        .eq("id", form.id!);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Saved");
      nav({ to: "/places/$id", params: { id: form.id! } });
    } else {
      const { data, error } = await supabase
        .from("places")
        .insert(payload)
        .select("id")
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success(status === "published" ? "Published!" : "Saved as draft");
      nav({ to: "/places/$id", params: { id: data.id } });
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    save("published");
  };

  return (
    <div className="mx-auto max-w-md space-y-6 p-5 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isEdit ? "Edit listing" : "List a room"}
      </h1>

      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/20 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t("pe.photosPremiumTitle") ?? "Photos · Premium"}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("pe.photosPremiumBody") ??
                "Listing photos are coming soon with Roomies Premium. For now your listing will use a clean default visual."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              className="mt-3"
            >
              {t("pe.upgradePremium") ?? "Coming soon"}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="pe-title">Title</Label>
          <Input
            id="pe-title"
            autoFocus
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Sunny room in central Casablanca"
            maxLength={120}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pe-city">City</Label>
            <select
              id="pe-city"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pe-neigh">Neighborhood</Label>
            <Input
              id="pe-neigh"
              value={form.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)}
              placeholder="Maarif"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pe-rent">Rent / month</Label>
            <Input
              id="pe-rent"
              type="number"
              inputMode="numeric"
              value={form.rent_monthly}
              onChange={(e) => set("rent_monthly", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pe-curr">Currency</Label>
            <select
              id="pe-curr"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="MAD">MAD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pe-from">Available from</Label>
            <Input
              id="pe-from"
              type="date"
              value={form.available_from}
              onChange={(e) => set("available_from", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pe-stay">Min stay (months)</Label>
            <Input
              id="pe-stay"
              type="number"
              inputMode="numeric"
              value={form.min_stay_months ?? ""}
              onChange={(e) =>
                set("min_stay_months", e.target.value ? parseInt(e.target.value) : null)
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Room type</Label>
          <div className="flex gap-2">
            {(["private", "shared"] as const).map((rt) => (
              <button
                key={rt}
                type="button"
                onClick={() => set("room_type", rt)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize ${
                  form.room_type === rt
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border"
                }`}
              >
                {rt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.furnished}
              onChange={(e) => set("furnished", e.target.checked)}
            />
            Furnished
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.bills_included}
              onChange={(e) => set("bills_included", e.target.checked)}
            />
            Bills included
          </label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pe-desc">Description</Label>
          <Textarea
            id="pe-desc"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={5}
            placeholder="Tell potential roommates about the place, the vibe, and what you're looking for."
            maxLength={2000}
          />
        </div>

        <div className="flex gap-3 pb-6 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => save("draft")}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={saving}
          >
            {saving ? "Saving…" : isEdit ? "Save & publish" : "Publish"}
          </Button>
        </div>
      </form>
    </div>
  );
}



export { empty as emptyPlaceForm };
export type { PlaceForm };
