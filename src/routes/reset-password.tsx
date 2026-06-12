import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Définir un nouveau mot de passe — Roomies" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const t = useT();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const markReady = () => { if (!cancelled) setStatus("ready"); };
    const markError = (msg: string) => { if (!cancelled) { setErrorMsg(msg); setStatus("error"); } };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) markReady();
    });

    const init = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      const errDesc = url.searchParams.get("error_description") || hash.get("error_description");
      if (errDesc) return markError(errDesc);

      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) return markError(error.message);
        window.history.replaceState({}, "", url.pathname);
        return markReady();
      }

      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "recovery" });
        if (cancelled) return;
        if (error) return markError(error.message);
        window.history.replaceState({}, "", url.pathname);
        return markReady();
      }

      const hasHashTokens = hash.get("access_token") || hash.get("refresh_token") || hash.get("type");
      const deadline = Date.now() + (hasHashTokens ? 5000 : 1500);
      while (!cancelled && Date.now() < deadline) {
        const { data } = await supabase.auth.getSession();
        if (data.session) return markReady();
        await new Promise((r) => setTimeout(r, 150));
      }
      if (!cancelled) markError(t("rp.invalid"));
    };

    init();
    return () => { cancelled = true; subscription.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error(t("rp.tooShort"));
    if (password !== confirm) return toast.error(t("rp.mismatch"));
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("rp.updated"));
    await supabase.auth.signOut();
    nav({ to: "/login" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4 sm:p-6">
      <Card className="w-full max-w-md p-8 sm:p-10">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Heart className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("rp.title")}</h1>
        </div>
        {status === "loading" ? (
          <p className="text-center text-sm text-muted-foreground">{t("rp.verifying")}</p>
        ) : status === "error" ? (
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            {errorMsg ?? t("rp.invalid")}{" "}
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              {t("rp.requestNew")}
            </Link>
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">{t("rp.newPwd")}</Label>
              <Input id="password" type="password" autoFocus required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t("rp.confirmPwd")}</Label>
              <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? t("common.saving") : t("rp.update")}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}

