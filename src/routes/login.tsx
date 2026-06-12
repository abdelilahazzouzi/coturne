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
import { GoogleButton } from "@/components/GoogleButton";
import { useT, LanguageSwitcher } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Roomies" },
      { name: "description", content: "Connectez-vous à Roomies pour continuer à découvrir, discuter avec vos matchs et mettre à jour votre profil colocataire." },
      { property: "og:title", content: "Connexion — Roomies" },
      { property: "og:description", content: "Connectez-vous à Roomies pour continuer à découvrir, discuter avec vos matchs et mettre à jour votre profil colocataire." },
      { property: "og:url", content: "https://domicile-date.lovable.app/login" },
    ],
    links: [{ rel: "canonical", href: "https://domicile-date.lovable.app/login" }],
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

  useEffect(() => {
    if (!loading && user) nav({ to: "/" });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
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
          <p className="text-sm leading-relaxed text-muted-foreground">{t("auth.oneTap")}</p>
        </div>
        <GoogleButton label={t("auth.google.signin")} />
        <div className="my-6 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> {t("auth.orEmail")} <div className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">{t("common.email")}</Label>
            <Input id="email" type="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("common.password")}</Label>
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                {t("auth.forgot")}
              </Link>
            </div>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
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
      </Card>
    </main>
  );
}

