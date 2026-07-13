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
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={async () => {
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/` },
                });
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuer avec Google
            </Button>
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

