import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useId, useMemo, useCallback, cloneElement, isValidElement } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { submitOnboarding } from "@/lib/onboarding.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CITIES } from "@/lib/cities";
import { GUESTS_OPTIONS, ALCOHOL_OPTIONS, PRAYER_OPTIONS, FOOD_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/cultural";
import { toast } from "sonner";
import { NEIGHBORHOODS, getCoordinatesForNeighborhood } from "@/lib/neighborhoods";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — Roomies" },
      { name: "description", content: "Tell us about yourself, your budget, and your lifestyle so Roomies can match you with compatible roommates." },
      { property: "og:title", content: "Set up your profile — Roomies" },
      { property: "og:description", content: "Tell us about yourself, your budget, and your lifestyle so Roomies can match you with compatible roommates." },
      { property: "og:url", content: "https://smartko.shop/onboarding" },
    ],
    links: [{ rel: "canonical", href: "https://smartko.shop/onboarding" }],
  }),
  component: Onboarding,
});

type Form = {
  display_name: string;
  age: number | "";
  gender: string;
  occupation: string;
  city: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  cndp_consent_accepted: boolean;
  budget_min: number;
  budget_max: number;
  smoking: string;
  drinking: string;
  sleep_schedule: string;
  social_level: string;
  cleanliness: number;
  pets: string;
  guests_frequency: string;
  alcohol_in_house: string;
  prayer_at_home: string;
  food_sharing: string;
  languages: string[];
  bio: string;
  email_contact: string;
  phone: string;
  contact_handle: string;
  contact_visible_to_matches: boolean;
};

const STEPS = ["About you", "Where & budget", "Lifestyle", "Cultural fit", "Bio & contact"];

function Onboarding() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const submitFn = useServerFn(submitOnboarding);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Form>({
    display_name: "",
    age: "",
    gender: "",
    occupation: "",
    city: "",
    neighborhood: "",
    latitude: null,
    longitude: null,
    cndp_consent_accepted: false,
    budget_min: 500,
    budget_max: 1500,
    smoking: "",
    drinking: "",
    sleep_schedule: "",
    social_level: "",
    cleanliness: 3,
    pets: "",
    guests_frequency: "",
    alcohol_in_house: "",
    prayer_at_home: "",
    food_sharing: "",
    languages: [],
    bio: "",
    email_contact: "",
    phone: "",
    contact_handle: "",
    contact_visible_to_matches: true,
  });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("profile_contacts").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([{ data }, { data: c }]) => {
      setForm((f) => ({
        ...f,
        display_name: data?.display_name || f.display_name,
        bio: data?.bio || f.bio,
        city: data?.city || f.city,
        neighborhood: data?.neighborhood || f.neighborhood,
        latitude: data?.latitude ?? f.latitude,
        longitude: data?.longitude ?? f.longitude,
        cndp_consent_accepted: data?.cndp_consent_accepted ?? f.cndp_consent_accepted,
        email_contact: c?.email_contact || user.email || "",
        phone: c?.phone || "",
        contact_handle: c?.contact_handle || "",
        contact_visible_to_matches: c?.contact_visible_to_matches ?? f.contact_visible_to_matches,
      }));
    });
  }, [user]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const stepValid = (s: number): boolean => {
    if (s === 0) return !!form.display_name.trim() && form.age !== "" && Number(form.age) >= 13 && !!form.gender && !!form.occupation.trim();
    if (s === 1) {
      const cityHasNeighborhoods = form.city in NEIGHBORHOODS;
      if (cityHasNeighborhoods) {
        return !!form.city && !!form.neighborhood;
      }
      return !!form.city;
    }
    if (s === 2) return !!form.smoking && !!form.drinking && !!form.sleep_schedule && !!form.social_level && !!form.pets;
    if (s === 3) return true; // cultural fit fields are optional
    if (s === 4) return (!!form.email_contact.trim() || !!form.phone.trim()) && form.cndp_consent_accepted;
    return true;
  };

  const handleNeighborhoodChange = (n: string) => {
    set("neighborhood", n);
    const coords = getCoordinatesForNeighborhood(form.city, n);
    if (coords) {
      set("latitude", coords.lat);
      set("longitude", coords.lng);
    } else {
      set("latitude", null);
      set("longitude", null);
    }
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const ageNum = form.age === "" ? null : Number(form.age);
    try {
      const res = await submitFn({
        data: {
          profile: {
            display_name: form.display_name,
            age: ageNum,
            gender: (form.gender || null) as any,
            occupation: form.occupation,
            city: form.city,
            neighborhood: form.neighborhood || null,
            latitude: form.latitude,
            longitude: form.longitude,
            cndp_consent_accepted: form.cndp_consent_accepted,
            budget_min: form.budget_min,
            budget_max: form.budget_max,
            smoking: (form.smoking || null) as any,
            drinking: (form.drinking || null) as any,
            sleep_schedule: (form.sleep_schedule || null) as any,
            social_level: (form.social_level || null) as any,
            cleanliness: form.cleanliness,
            pets: (form.pets || null) as any,
            guests_frequency: form.guests_frequency || null,
            alcohol_in_house: form.alcohol_in_house || null,
            prayer_at_home: form.prayer_at_home || null,
            food_sharing: form.food_sharing || null,
            languages: form.languages,
            bio: form.bio,
          },
          contacts: {
            email_contact: form.email_contact || null,
            phone: form.phone || null,
            contact_handle: form.contact_handle || null,
            contact_visible_to_matches: form.contact_visible_to_matches,
          },
        },
      });
      setBusy(false);
      if (res.isMinor) {
        toast.success("Profile submitted for review");
        nav({ to: "/pending-review" });
      } else {
        toast.success("Profile saved!");
        nav({ to: "/profile/$id", params: { id: user.id }, search: { welcome: 1 } as any });
      }
    } catch (e: any) {
      setBusy(false);
      toast.error(e?.message || "Could not save profile");
    }
  };

  if (!user) return null;

  const canContinue = stepValid(step);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue || busy) return;
    if (step < STEPS.length - 1) next();
    else submit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30 px-4 py-10">
      <Card className="mx-auto max-w-md p-8 sm:p-10">
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{STEPS[step]}</h1>
          <Progress className="mt-4" value={((step + 1) / STEPS.length) * 100} />
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
        {step === 0 && (
          <div className="space-y-5">
            <Field label="Display name">
              <Input autoFocus value={form.display_name} onChange={(e) => set("display_name", e.target.value)} />
            </Field>
            <Field label="Age">
              <Input type="number" min={18} max={99} value={form.age} onChange={(e) => set("age", e.target.value === "" ? "" : Number(e.target.value))} />
            </Field>
            <Field label="Gender">
              <>
                <SelectField label="Gender" value={form.gender} onValueChange={(v) => set("gender", v)} options={[
                  ["female","Female"],["male","Male"],["nonbinary","Non-binary"],["other","Other"],
                ]} />
                <p className="mt-1.5 text-xs text-muted-foreground">Roomies only matches roommates of the same gender. Photos of female members are only visible to other female members.</p>
              </>
            </Field>
            <Field label="Occupation">
              <Input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="Student, designer, nurse…" />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>City</Label>
              <CityCombobox value={form.city} onChange={(v) => { set("city", v); set("neighborhood", ""); }} />
            </div>
            {form.city in NEIGHBORHOODS && (
              <div className="space-y-2">
                <Label>Neighborhood</Label>
                <Select value={form.neighborhood} onValueChange={handleNeighborhoodChange}>
                  <SelectTrigger aria-label="Neighborhood"><SelectValue placeholder="Select a neighborhood…" /></SelectTrigger>
                  <SelectContent>
                    {NEIGHBORHOODS[form.city].map((n) => (
                      <SelectItem key={n.name} value={n.name}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="mb-3 block">Budget range (per month)</Label>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">From</span>
                <span className="font-semibold">{form.budget_min} – {form.budget_max} MAD</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <Slider min={100} max={5000} step={50} minStepsBetweenThumbs={1} value={[form.budget_min, form.budget_max]}
                onValueChange={([a,b]) => setForm(f => ({ ...f, budget_min: Math.min(a,b), budget_max: Math.max(a,b) }))} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field label="Smoking">
              <SelectField label="Smoking" value={form.smoking} onValueChange={(v) => set("smoking", v)} options={[["no","No"],["occasionally","Occasionally"],["yes","Yes"]]} />
            </Field>
            <Field label="Drinking">
              <SelectField label="Drinking" value={form.drinking} onValueChange={(v) => set("drinking", v)} options={[["no","No"],["socially","Socially"],["often","Often"]]} />
            </Field>
            <Field label="Sleep schedule">
              <SelectField label="Sleep schedule" value={form.sleep_schedule} onValueChange={(v) => set("sleep_schedule", v)} options={[["early","Early bird"],["late","Night owl"],["flexible","Flexible"]]} />
            </Field>
            <Field label="Social level">
              <SelectField label="Social level" value={form.social_level} onValueChange={(v) => set("social_level", v)} options={[["homebody","Homebody"],["balanced","Balanced"],["social","Very social"]]} />
            </Field>
            <Field label="Pets">
              <SelectField label="Pets" value={form.pets} onValueChange={(v) => set("pets", v)} options={[["none","No pets"],["have","I have a pet"],["ok_with","OK with pets"]]} />
            </Field>
            <div>
              <Label className="mb-3 block">Cleanliness ({form.cleanliness}/5)</Label>
              <Slider min={1} max={5} step={1} value={[form.cleanliness]} onValueChange={([v]) => set("cleanliness", v)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              All optional, but answering helps us find someone you'd actually live well with.
            </p>
            <Field label="Guests at home">
              <SelectField label="Guests" value={form.guests_frequency} onValueChange={(v) => set("guests_frequency", v)} options={GUESTS_OPTIONS} />
            </Field>
            <Field label="Alcohol in the house">
              <SelectField label="Alcohol" value={form.alcohol_in_house} onValueChange={(v) => set("alcohol_in_house", v)} options={ALCOHOL_OPTIONS} />
            </Field>
            <Field label="Prayer at home">
              <SelectField label="Prayer" value={form.prayer_at_home} onValueChange={(v) => set("prayer_at_home", v)} options={PRAYER_OPTIONS} />
            </Field>
            <Field label="Food sharing">
              <SelectField label="Food" value={form.food_sharing} onValueChange={(v) => set("food_sharing", v)} options={FOOD_OPTIONS} />
            </Field>
            <div>
              <Label className="mb-2 block">Languages you speak</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((l) => {
                  const active = form.languages.includes(l);
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => set("languages", active ? form.languages.filter((x) => x !== l) : [...form.languages, l])}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent",
                      )}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <Field label="Bio">
              <Textarea rows={5} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A few sentences about you and what you're looking for…" />
            </Field>
            <Field label="Contact email">
              <Input type="email" value={form.email_contact} onChange={(e) => set("email_contact", e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Phone (optional)">
              <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+212 600 000 000" />
            </Field>
            <Field label="Other handle (optional)">
              <Input value={form.contact_handle} onChange={(e) => set("contact_handle", e.target.value)} placeholder="@telegram, WhatsApp, Instagram…" />
            </Field>
            <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm animate-pulse">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary"
                checked={form.contact_visible_to_matches}
                onChange={(e) => set("contact_visible_to_matches", e.target.checked)}
              />
              <span className="text-muted-foreground text-xs leading-relaxed">
                Share my contact details with confirmed matches. You can change this any time.
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary"
                checked={form.cndp_consent_accepted}
                onChange={(e) => set("cndp_consent_accepted", e.target.checked)}
                required
              />
              <span className="text-[11px] leading-relaxed text-muted-foreground">
                Je consens explicitement au traitement de mes données personnelles (nom, âge, coordonnées) par Roomies, conformément à la loi marocaine 09-08 de la CNDP relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel.
              </span>
            </label>
            <p className="text-xs text-muted-foreground">
              At least one of email or phone is required so matches can reach you.
            </p>
          </div>
        )}

        {!canContinue && (
          <p className="text-xs text-muted-foreground">Please fill in all fields on this step to continue.</p>
        )}

        <div className="flex gap-3 pt-2">
          {step > 0 && <Button type="button" variant="outline" onClick={back} className="flex-1">Back</Button>}
          {step < STEPS.length - 1 ? (
            <Button type="submit" disabled={!canContinue} className="flex-1">Continue</Button>
          ) : (
            <Button type="submit" disabled={busy || !canContinue} className="flex-1">{busy ? "Saving…" : "Finish"}</Button>
          )}
        </div>
        </form>
      </Card>
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactElement }) {
  const id = useId();
  const child = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, { id, "aria-label": label })
    : children;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {child}
    </div>
  );
}

function SelectField({ value, onValueChange, options, label }: { value: string; onValueChange: (v: string) => void; options: [string, string][]; label?: string }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={label}><SelectValue placeholder="Select…" /></SelectTrigger>
      <SelectContent>
        {options.map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function CityCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const handleSelect = useCallback((c: string) => {
    onChange(c);
    setOpen(false);
  }, [onChange]);
  const items = useMemo(
    () => CITIES.map((c) => (
      <CommandItem key={c} value={c} onSelect={() => handleSelect(c)}>
        <Check className={cn("me-2 h-4 w-4", value === c ? "opacity-100" : "opacity-0")} />
        {c}
      </CommandItem>
    )),
    [value, handleSelect],
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="City"
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
        >
          {value || "Select a city…"}
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search city…" />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup>{items}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
