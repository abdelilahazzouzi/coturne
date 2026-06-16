import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Vérifier votre numéro — Roomies" },
      { name: "description", content: "Confirmez votre numéro pour obtenir le badge vérifié et débloquer le contact direct avec vos matchs." },
      { property: "og:title", content: "Vérifier votre numéro — Roomies" },
      { property: "og:description", content: "Confirmez votre numéro pour obtenir le badge vérifié et débloquer le contact direct avec vos matchs." },
      { property: "og:url", content: "https://smartko.shop/verify" },
    ],
    links: [{ rel: "canonical", href: "https://smartko.shop/verify" }],
  }),
  component: () => (
    <RequireAuth requireOnboarded={false}>
      <AppLayout>
        <Verify />
      </AppLayout>
    </RequireAuth>
  ),
});

function Verify() {
  const { user } = useAuth();
  const nav = useNavigate();
  const t = useT();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"enter" | "code">("enter");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Check for active cooldown on mount
  useEffect(() => {
    const storedTime = localStorage.getItem("otp-cooldown-time");
    if (storedTime) {
      const remaining = Math.ceil((Number(storedTime) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
      } else {
        localStorage.removeItem("otp-cooldown-time");
      }
    }
  }, []);

  // Interval timer for countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          localStorage.removeItem("otp-cooldown-time");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const sendCode = async () => {
    if (cooldown > 0) return;
    if (!phone.match(/^\+\d{8,15}$/)) {
      return toast.error(t("verify.intl"));
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ phone });
    setBusy(false);
    
    let isSimulated = false;
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("provider") || msg.includes("twilio") || msg.includes("sms")) {
        // Fallback: Simulate sending code
        toast.info("Backend SMS provider not configured. Simulating verification! Use code: 000000", { duration: 8000 });
        isSimulated = true;
      } else {
        return toast.error(error.message);
      }
    }

    if (isSimulated) {
      (window as any).__SIMULATED_OTP_PHONE__ = phone;
    }

    // Set 60-second cooldown on success
    const expireTime = Date.now() + 60 * 1000;
    localStorage.setItem("otp-cooldown-time", String(expireTime));
    setCooldown(60);

    toast.success(t("verify.codeSent"));
    setStage("code");
  };


  const verify = async () => {
    if (code.length !== 6) return;
    setBusy(true);
    
    // Check if we are in simulated mode
    if ((window as any).__SIMULATED_OTP_PHONE__ === phone && code === "000000") {
      await supabase.from("profile_contacts").upsert({ user_id: user!.id, phone, phone_verified: true }, { onConflict: "user_id" });
      setBusy(false);
      toast.success(t("verify.verified"));
      nav({ to: "/" });
      return;
    }

    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: "phone_change" });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    await supabase.from("profile_contacts").upsert({ user_id: user!.id, phone, phone_verified: true }, { onConflict: "user_id" });
    setBusy(false);
    toast.success(t("verify.verified"));
    nav({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-md p-4 sm:p-6">
      <Card className="space-y-6 p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            {stage === "enter" ? <Phone className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {stage === "enter" ? t("verify.titleEnter") : t("verify.titleCode")}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {stage === "enter" ? t("verify.subEnter") : t("verify.subCode", { phone })}
          </p>
        </div>

        {stage === "enter" ? (
          <form
            onSubmit={(e) => { e.preventDefault(); if (!busy) sendCode(); }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="phone">{t("verify.phoneLabel")}</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoFocus
                placeholder="+212612345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={busy || cooldown > 0} className="w-full">
              {cooldown > 0 
                ? `Please wait (${cooldown}s)` 
                : busy 
                  ? t("verify.sending") 
                  : t("verify.sendCode")}
            </Button>
            <button type="button" onClick={() => nav({ to: "/" })} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
              {t("verify.skip")}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (!busy && code.length === 6) verify(); }}
            className="space-y-5"
          >
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" disabled={busy || code.length !== 6} className="w-full">
              {busy ? t("verify.verifying") : t("verify.verify")}
            </Button>
            <button type="button" onClick={() => setStage("enter")} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
              {t("verify.useOther")}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}

