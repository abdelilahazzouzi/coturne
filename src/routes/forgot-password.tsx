import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { useT, LanguageSwitcher } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — Roomies" },
      { name: "description", content: "Réinitialisez votre mot de passe Roomies. Nous vous enverrons un lien sécurisé par e-mail." },
      { property: "og:title", content: "Mot de passe oublié — Roomies" },
      { property: "og:description", content: "Réinitialisez votre mot de passe Roomies. Nous vous enverrons un lien sécurisé par e-mail." },
      { property: "og:url", content: "https://smartko.shop/forgot-password" },
    ],
    links: [{ rel: "canonical", href: "https://smartko.shop/forgot-password" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const submittedEmail = String(new FormData(form).get("email") ?? "").trim().toLowerCase();

    if (!submittedEmail) {
      toast.error(t("fp.enterEmail"));
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(submittedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmail(submittedEmail);
    setSent(true);
    toast.success(t("fp.sent.success"));
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
          <h1 className="text-2xl font-semibold tracking-tight">{t("fp.title")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("fp.sub")}</p>
        </div>
        {sent ? (
          <div className="space-y-3 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">{t("fp.sent.line1", { email })}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("fp.sent.line2")}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input id="email" name="email" type="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? t("fp.sending") : t("fp.send")}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("fp.remember")}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("fp.back")}
          </Link>
        </p>
      </Card>
    </main>
  );
}

