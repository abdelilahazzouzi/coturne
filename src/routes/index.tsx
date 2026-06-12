import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useT, LanguageSwitcher } from "@/i18n/LocaleProvider";
import { ExpandableFeatureCards } from "@/components/ui/expandable-feature-cards";
import {
  Heart,
  MapPin,
  ShieldCheck,
  MessageCircle,
  UserCheck,
  Users,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roomies — Zéro samsar. Colocataires compatibles au Maroc." },
      { name: "description", content: "Zéro commission. Zéro samsar. Roomies vous matche avec des colocataires compatibles et vérifiés à Casablanca, Rabat, Marrakech et partout au Maroc — selon votre style de vie." },
      { property: "og:title", content: "Roomies — Zéro samsar. Colocataires compatibles au Maroc." },
      { property: "og:description", content: "Zéro commission. Zéro samsar. Roomies vous matche avec des colocataires compatibles à Casablanca, Rabat, Marrakech et partout au Maroc." },
      { property: "og:url", content: "https://domicile-date.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://domicile-date.lovable.app/" }],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const t = useT();

  const { data: profile, isLoading: pLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (loading || !user) return;
    if (pLoading) return;
    if (profile && !profile.onboarded) {
      nav({ to: "/onboarding" });
    } else {
      nav({ to: "/discover" });
    }
  }, [user, loading, profile, pLoading, nav]);

  if (loading || (user && pLoading) || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Heart className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Roomies</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t("landing.cta.signin")}
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("landing.cta.start")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="hero" className="relative overflow-hidden border-b border-border bg-background px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("landing.badge")}
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            {t("landing.hero.h1.part1")} <span className="text-primary">{t("landing.hero.h1.samsar")}</span>{t("landing.hero.h1.part2")}
            <br className="hidden sm:block" />
            {t("landing.hero.h1.part3")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg font-medium text-foreground/80">
            {t("landing.hero.sub")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {t("landing.hero.cta.start")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-accent"
            >
              {t("landing.hero.cta.have")}
            </Link>
          </div>
          <div className="mt-10">
            <ExpandableFeatureCards
              items={[
                {
                  title: t("landing.feature.nobroker"),
                  description: t("landing.feature.nobroker.desc"),
                  ctaText: t("landing.hero.cta.start"),
                  ctaHref: "/signup",
                  icon: <ShieldCheck />,
                  content: (
                    <p>{t("landing.feature.nobroker.desc")} {t("landing.why.body")}</p>
                  ),
                },
                {
                  title: t("landing.feature.gender"),
                  description: t("landing.feature.gender.desc"),
                  ctaText: t("landing.hero.cta.start"),
                  ctaHref: "/signup",
                  icon: <Users />,
                  content: (
                    <p>{t("landing.feature.gender.desc")} {t("landing.f.twoway.desc")}</p>
                  ),
                },
                {
                  title: t("landing.feature.score"),
                  description: t("landing.feature.score.desc"),
                  ctaText: t("landing.hero.cta.start"),
                  ctaHref: "/signup",
                  icon: <Heart />,
                  content: (
                    <p>{t("landing.feature.score.desc")} {t("landing.f.smart.desc")}</p>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Why we built it */}
      <section className="border-t border-border bg-accent/30 px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("landing.why.kicker")}
          </p>
          <p className="mt-3 text-base text-foreground sm:text-lg">{t("landing.why.body")}</p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">{t("landing.how.title")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">{t("landing.how.sub")}</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <StepCard number="1" icon={<UserCheck className="h-6 w-6" />} title={t("landing.step1.title")} description={t("landing.step1.desc")} />
            <StepCard number="2" icon={<MapPin className="h-6 w-6" />} title={t("landing.step2.title")} description={t("landing.step2.desc")} />
            <StepCard number="3" icon={<MessageCircle className="h-6 w-6" />} title={t("landing.step3.title")} description={t("landing.step3.desc")} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">{t("landing.features.title")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">{t("landing.features.sub")}</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title={t("landing.f.email")} description={t("landing.f.email.desc")} />
            <FeatureCard icon={<Heart className="h-5 w-5" />} title={t("landing.f.smart")} description={t("landing.f.smart.desc")} />
            <FeatureCard icon={<Users className="h-5 w-5" />} title={t("landing.f.twoway")} description={t("landing.f.twoway.desc")} />
            <FeatureCard icon={<MapPin className="h-5 w-5" />} title={t("landing.f.city")} description={t("landing.f.city.desc")} />
            <FeatureCard icon={<MessageCircle className="h-5 w-5" />} title={t("landing.f.chat")} description={t("landing.f.chat.desc")} />
            <FeatureCard icon={<UserCheck className="h-5 w-5" />} title={t("landing.f.profiles")} description={t("landing.f.profiles.desc")} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-4 py-16 sm:py-20">
        <div
          className="mx-auto max-w-2xl rounded-3xl p-8 text-center text-primary-foreground sm:p-12"
          style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-glow))" }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("landing.cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-md text-primary-foreground/90">{t("landing.cta.sub")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-foreground px-6 py-3 text-base font-semibold text-primary transition-transform hover:scale-105 active:scale-95"
            >
              {t("landing.cta.create")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Heart className="h-3 w-3" />
            </div>
            <span className="text-sm font-semibold">Roomies</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/safety" className="hover:text-foreground">{t("landing.footer.safety")}</Link>
            <Link to="/login" className="hover:text-foreground">{t("common.signin")}</Link>
            <Link to="/signup" className="hover:text-foreground">{t("common.signup")}</Link>
          </div>
          <p className="text-xs text-muted-foreground">{t("landing.footer.rights", { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 text-center">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {number}
      </div>
      <div className="mx-auto mt-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
