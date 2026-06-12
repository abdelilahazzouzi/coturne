import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Camera, Home, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Roomies" },
      { name: "description", content: "Manage your Roomies profile: photo, bio, contact details, and what you share with matches." },
      { property: "og:title", content: "Your profile — Roomies" },
      { property: "og:description", content: "Manage your Roomies profile: photo, bio, contact details, and what you share with matches." },
      { property: "og:url", content: "https://domicile-date.lovable.app/profile" },
    ],
    links: [{ rel: "canonical", href: "https://domicile-date.lovable.app/profile" }],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <ProfilePage />
      </AppLayout>
    </RequireAuth>
  ),
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useT();

  const [enrollData, setEnrollData] = useState<{ id: string; qr_code: string; secret: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyingMfa, setVerifyingMfa] = useState(false);

  const { data: mfaFactors, refetch: refetchMfa } = useQuery({
    queryKey: ["mfa-factors", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data;
    },
  });

  const activeTotp = mfaFactors?.totp?.[0];

  const startEnrollMfa = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Roomies",
        friendlyName: user?.email || "Roomies Admin",
      });
      if (error) throw error;
      setEnrollData({
        id: data.id,
        qr_code: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const verifyMfaCode = async () => {
    if (!enrollData) return;
    setVerifyingMfa(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollData.id,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollData.id,
        challengeId: challengeData.id,
        code: verificationCode,
      });
      if (verifyError) throw verifyError;

      toast.success("Two-factor authentication enrolled successfully!");
      setEnrollData(null);
      setVerificationCode("");
      refetchMfa();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setVerifyingMfa(false);
    }
  };

  const unenrollMfa = async (factorId: string) => {
    if (!confirm("Are you sure you want to disable 2FA? This will reduce your account security.")) return;
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success("Two-factor authentication disabled.");
      refetchMfa();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: contacts } = useQuery({
    queryKey: ["profile-contacts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profile_contacts").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? "");
      setName(profile.display_name ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (contacts) setContact(contacts.contact_handle ?? "");
  }, [contacts]);

  const upload = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ photo_url: url }).eq("id", user.id);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success(t("profile.photoUpdated"));
  };

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      display_name: name, bio,
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    const { error: cErr } = await supabase.from("profile_contacts").upsert({
      user_id: user.id, contact_handle: contact,
    }, { onConflict: "user_id" });
    if (cErr) return toast.error(cErr.message);
    toast.success(t("profile.saveChanges"));
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["profile-contacts"] });
  };

  if (!profile) return null;

  const [saving, setSaving] = useState(false);
  const onAboutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    await save();
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-md space-y-5 p-5 sm:p-6">
      <Card className="p-8 text-center">
        <button onClick={() => fileRef.current?.click()} aria-label={t("profile.photoUpdated")} className="group relative mx-auto block h-28 w-28">
          <div className="h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-accent to-primary/40">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.display_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl font-semibold text-primary-foreground">
                {profile.display_name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <h1 className="mt-4 text-xl font-semibold">{profile.display_name}</h1>
        <p className="text-sm text-muted-foreground">{profile.city}{profile.age ? ` · ${profile.age}` : ""}</p>
      </Card>

      <Card className="p-6">
        <form onSubmit={onAboutSubmit} className="space-y-4">
          <h2 className="text-base font-semibold">{t("profile.about")}</h2>
          <div className="space-y-2">
            <Label htmlFor="profile-name">{t("profile.name")}</Label>
            <Input id="profile-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-bio">{t("profile.bio")}</Label>
            <Textarea id="profile-bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-contact">{t("profile.contactHandle")}</Label>
            <Input id="profile-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t("profile.contactHandle.ph")} />
          </div>
          <Button type="submit" disabled={saving} className="w-full">{saving ? "Saving…" : t("profile.saveChanges")}</Button>
        </form>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-base font-semibold">{t("profile.privacy")}</h2>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label className="text-sm font-medium">{t("profile.showPhone")}</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              {contacts?.phone_verified
                ? t("profile.showPhone.on")
                : t("profile.showPhone.verifyFirst")}
            </p>
          </div>
          <Switch
            checked={!!contacts?.phone_visible_to_matches}
            disabled={!contacts?.phone_verified}
            onCheckedChange={async (checked) => {
              const { error } = await supabase
                .from("profile_contacts")
                .update({ phone_visible_to_matches: checked })
                .eq("user_id", user!.id);
              if (error) return toast.error(error.message);
              qc.invalidateQueries({ queryKey: ["profile-contacts"] });
              toast.success(checked ? t("profile.phoneVisible") : t("profile.phoneHidden"));
            }}
          />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-base font-semibold">{t("profile.situation")}</h2>
        <p className="text-xs text-muted-foreground">
          {t("profile.situation.sub")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["searching", "has_place", "both"] as const).map((v) => (
            <button
              key={v}
              onClick={async () => {
                const { error } = await supabase
                  .from("profiles")
                  .update({ user_intent: v })
                  .eq("id", user!.id);
                if (error) return toast.error(error.message);
                qc.invalidateQueries({ queryKey: ["profile"] });
                qc.invalidateQueries({ queryKey: ["me-intent"] });
              }}
              className={`rounded-md border px-2 py-2 text-xs ${
                profile.user_intent === v
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border"
              }`}
            >
              {v === "searching"
                ? t("profile.situation.searching")
                : v === "has_place"
                  ? t("profile.situation.has")
                  : t("profile.situation.both")}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" size="sm" asChild>
            <Link to="/profile/listings">
              <Home className="me-1 h-4 w-4" /> {t("profile.myListings")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/profile/saved">
              <Bookmark className="me-1 h-4 w-4" /> {t("profile.saved")}
            </Link>
          </Button>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-base font-semibold">{t("profile.notifications")}</h2>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label className="text-sm font-medium">{t("profile.matchEmail")}</Label>
            <p className="mt-1 text-xs text-muted-foreground">{t("profile.matchEmail.desc")}</p>
          </div>
          <Switch
            checked={!!profile.email_match_notif}
            onCheckedChange={async (checked) => {
              const { error } = await supabase.from("profiles").update({ email_match_notif: checked }).eq("id", user!.id);
              if (error) return toast.error(error.message);
              qc.invalidateQueries({ queryKey: ["profile"] });
            }}
          />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label className="text-sm font-medium">{t("profile.messageEmail")}</Label>
            <p className="mt-1 text-xs text-muted-foreground">{t("profile.messageEmail.desc")}</p>
          </div>
          <Switch
            checked={!!profile.email_message_notif}
            onCheckedChange={async (checked) => {
              const { error } = await supabase.from("profiles").update({ email_message_notif: checked }).eq("id", user!.id);
              if (error) return toast.error(error.message);
              qc.invalidateQueries({ queryKey: ["profile"] });
            }}
          />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-base font-semibold">{t("profile.mfa.title")}</h2>
        {activeTotp ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500">{t("profile.mfa.enabled")}</p>
              <p className="text-xs text-muted-foreground">{t("profile.mfa.desc.enabled")}</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => unenrollMfa(activeTotp.id)}>{t("profile.mfa.disable")}</Button>
          </div>
        ) : enrollData ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{t("profile.mfa.scanHint")}</p>
            <div className="flex justify-center bg-white p-3 rounded-lg border border-border">
              {enrollData.qr_code && (
                <img src={enrollData.qr_code} alt="QR Code" className="mx-auto h-40 w-40" />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("profile.mfa.secret")}</Label>
              <div className="flex gap-2">
                <Input readOnly value={enrollData.secret} className="font-mono text-xs select-all bg-muted" />
                <Button size="sm" variant="outline" type="button" onClick={() => {
                  navigator.clipboard.writeText(enrollData.secret);
                  toast.success("Copied!");
                }}>{t("common.copy")}</Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mfa-code">{t("profile.mfa.code")}</Label>
              <div className="flex gap-2">
                <Input
                  id="mfa-code"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center font-mono tracking-widest"
                />
                <Button onClick={verifyMfaCode} disabled={verificationCode.length !== 6 || verifyingMfa}>
                  {verifyingMfa ? t("profile.mfa.verifying") : t("profile.mfa.verify")}
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" type="button" onClick={() => setEnrollData(null)}>{t("common.cancel")}</Button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground mb-3">{t("profile.mfa.desc")}</p>
            <Button variant="outline" className="w-full" onClick={startEnrollMfa}>{t("profile.mfa.enroll")}</Button>
          </div>
        )}
      </Card>

      <Card className="space-y-2 p-4">
        <h2 className="text-base font-semibold">{t("profile.preferences")}</h2>
        <Button variant="outline" className="w-full" onClick={() => nav({ to: "/onboarding" })}>
          {t("profile.editLifestyle")}
        </Button>
      </Card>

      {!contacts?.phone_verified && (
        <Card className="space-y-2 border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-sm font-medium">{t("profile.verifyTrust")}</p>
          <p className="text-xs text-muted-foreground">{t("profile.verifyTrust.sub")}</p>
          <Button size="sm" onClick={() => nav({ to: "/verify" })} className="mt-1">{t("profile.verifyNow")}</Button>
        </Card>
      )}
    </div>
  );
}
