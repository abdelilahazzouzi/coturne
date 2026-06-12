import { createFileRoute, Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/pending-review")({
  head: () => ({
    meta: [
      { title: "Profil en révision — Roomies" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <RequireAuth requireOnboarded={false}>
      <AppLayout>
        <Pending />
      </AppLayout>
    </RequireAuth>
  ),
});

function Pending() {
  const t = useT();
  return (
    <div className="mx-auto max-w-md p-6 pt-12">
      <Card className="p-6 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-xl font-semibold">{t("pending.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("pending.body")}</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          {t("pending.home")}
        </Link>
      </Card>
    </div>
  );
}
