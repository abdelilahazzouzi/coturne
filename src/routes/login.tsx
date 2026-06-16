import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { useT, LanguageSwitcher } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Roomies" },
      { name: "description", content: "Connectez-vous à Roomies pour continuer à découvrir, discuter avec vos matchs et mettre à jour votre profil colocataire." },
      { property: "og:title", content: "Connexion — Roomies" },
      { property: "og:description", content: "Connectez-vous à Roomies pour continuer à découvrir, discuter avec vos matchs et mettre à jour votre profil colocataire." },
      { property: "og:url", content: "https://smartko.shop/login" },
    ],
    links: [{ rel: "canonical", href: "https://smartko.shop/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [needsMfa, setNeedsMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    if (!loading && user) {
      supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
        if (data?.nextLevel === "aal2" && data?.currentLevel === "aal1") {
          setNeedsMfa(true);
        } else {
          nav({ to: "/" });
        }
      });
    }
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!password) {
      const msg = t("auth.passwordRequired");
      setLoginError(msg);
      toast.error(msg);
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const msg = t("auth.invalidCredentials");
      setLoginError(msg);
      toast.error(msg);
      return;
    }
    // The useEffect will handle AAL check and navigation automatically because `user` updates
  };

  const submitMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.[0];
    if (!totpFactor) {
      setBusy(false);
      return toast.error("No TOTP factor found");
    }

    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeErr) {
      setBusy(false);
      return toast.error(challengeErr.message);
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challenge.id,
      code: mfaCode,
    });
    setBusy(false);
    
    if (verifyErr) {
      return toast.error(verifyErr.message);
    }
    
    nav({ to: "/" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4 sm:p-6">
      <Card className="w-full max-w-md p-8 sm:p-10">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Heart className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("auth.welcomeBack")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("auth.signinEmail")}</p>
        </div>
        {needsMfa ? (
          <form onSubmit={submitMfa} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="mfa">Enter 6-digit code from your authenticator app</Label>
              <Input 
                id="mfa" 
                type="text" 
                autoFocus 
                required 
                value={mfaCode} 
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-lg tracking-widest font-mono"
                placeholder="000000"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy || mfaCode.length !== 6}>
              {busy ? "Verifying..." : "Verify"}
            </Button>
            <Button type="button" variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => supabase.auth.signOut()}>
              Cancel and sign out
            </Button>
          </form>
        ) : (
          <>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input id="email" type="email" autoFocus required value={email} onChange={(e) => { setEmail(e.target.value); setLoginError(""); }} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("common.password")}</Label>
                  <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    {t("auth.forgot")}
                  </Link>
                </div>
                <Input id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(""); }} />
              </div>
              {loginError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive" role="alert">
                  {loginError}
                </div>
              )}
              <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
                {busy ? t("auth.signingIn") : t("auth.signinEmail")}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.newHere")}{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                {t("auth.createAccount")}
              </Link>
            </p>
          </>
        )}
      </Card>
    </main>
  );
}

