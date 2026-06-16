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

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Créer un compte Roomies" },
      { name: "description", content: "Inscrivez-vous sur Roomies en moins d'une minute et commencez à matcher avec des colocataires compatibles dans votre ville." },
      { property: "og:title", content: "Créer un compte Roomies" },
      { property: "og:description", content: "Inscrivez-vous sur Roomies en moins d'une minute et commencez à matcher avec des colocataires compatibles dans votre ville." },
      { property: "og:url", content: "https://smartko.shop/signup" },
    ],
    links: [{ rel: "canonical", href: "https://smartko.shop/signup" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signupError, setSignupError] = useState("");

  useEffect(() => {
    if (!loading && user) nav({ to: "/" });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
    });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase().includes("already registered")
        ? t("auth.emailInUse")
        : error.message;
      setSignupError(msg);
      toast.error(msg);
      return;
    }
    toast.success(t("auth.createdToast"));
    nav({ to: "/onboarding" });
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
          <h1 className="text-2xl font-semibold tracking-tight">{t("auth.createTitle")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("auth.createEmail")}</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">{t("auth.firstName")}</Label>
            <Input id="name" autoFocus required value={name} onChange={(e) => { setName(e.target.value); setSignupError(""); }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("common.email")}</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setSignupError(""); }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("common.password")}</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => { setPassword(e.target.value); setSignupError(""); }} />
          </div>
          {signupError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive" role="alert">
              {signupError}
            </div>
          )}
          <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
            {busy ? t("auth.creating") : t("auth.createEmail")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.alreadyHave")}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("common.signin")}
          </Link>
        </p>
      </Card>
    </main>
  );
}

