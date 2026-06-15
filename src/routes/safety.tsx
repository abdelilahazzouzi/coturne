import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Users,
  MapPin,
  Wallet,
  ShieldAlert,
  Flag,
  Phone,
} from "lucide-react";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Conseils de sécurité — Roomies" },
      {
        name: "description",
        content:
          "Comment rencontrer un futur colocataire en toute sécurité, repérer les samsara et éviter les arnaques sur Roomies.",
      },
      { property: "og:title", content: "Conseils de sécurité — Roomies" },
      {
        property: "og:description",
        content:
          "Comment rencontrer un futur colocataire en toute sécurité, repérer les samsara et éviter les arnaques.",
      },
      { property: "og:url", content: "https://smartko.shop/safety" },
    ],
    links: [{ rel: "canonical", href: "https://smartko.shop/safety" }],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  const t = useT();
  const nav = useNavigate();

  const tips = [
    { icon: Users, title: t("safety.meet.title"), body: t("safety.meet.body") },
    { icon: MapPin, title: t("safety.share.title"), body: t("safety.share.body") },
    { icon: Wallet, title: t("safety.money.title"), body: t("safety.money.body") },
    { icon: ShieldAlert, title: t("safety.samsar.title"), body: t("safety.samsar.body") },
    { icon: Flag, title: t("safety.report.title"), body: t("safety.report.body") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2"
          onClick={() => (history.length > 1 ? history.back() : nav({ to: "/" }))}
        >
          <ArrowLeft className="me-1 h-4 w-4" /> {t("safety.back")}
        </Button>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("safety.title")}</h1>
          <p className="text-muted-foreground">{t("safety.intro")}</p>
        </header>

        <div className="space-y-3">
          {tips.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <Card key={i} className="flex gap-3 p-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-foreground">{tip.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{tip.body}</p>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="space-y-2 border-primary/30 bg-primary/5 p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Phone className="h-4 w-4 text-primary" /> {t("safety.emergency.title")}
          </h2>
          <ul className="space-y-1 text-sm text-foreground">
            <li>{t("safety.emergency.police")}</li>
            <li>{t("safety.emergency.gendarmerie")}</li>
            <li>{t("safety.emergency.samu")}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
