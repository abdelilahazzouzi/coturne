import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  MapPin,
  Calendar,
  Pencil,
  MessageCircle,
  Home,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/LocaleProvider";

export const Route = createFileRoute("/places/$id")({
  head: () => ({
    meta: [
      { title: "Room details — Roomies" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <PlaceDetail />
      </AppLayout>
    </RequireAuth>
  ),
});

function PlaceDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const t = useT();
  const [photoIdx, setPhotoIdx] = useState(0);

  const { data: place, isLoading } = useQuery({
    queryKey: ["place", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: host } = useQuery({
    queryKey: ["host", place?.host_id],
    enabled: !!place?.host_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, photo_url, city, age")
        .eq("id", place!.host_id)
        .maybeSingle();
      return data;
    },
  });

  const { data: saved } = useQuery({
    queryKey: ["place-save", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("place_saves")
        .select("place_id")
        .eq("place_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  const toggleSave = async () => {
    if (!user) return;
    if (saved) {
      await supabase
        .from("place_saves")
        .delete()
        .eq("place_id", id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("place_saves")
        .insert({ place_id: id, user_id: user.id });
    }
    qc.invalidateQueries({ queryKey: ["place-save", id] });
  };

  const shareOnWhatsApp = () => {
    if (!place) return;
    const url = window.location.href;
    const title = place.title || "Colocation sur Roomies";
    const location = [place.neighborhood, place.city].filter(Boolean).join(", ");
    const price = `${place.rent_monthly} ${place.currency}/mois`;

    const text = `🏠 *${title}*\n📍 ${location}\n💰 ${price}\n\nTrouvez cette colocation sur Roomies : ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const messageHost = async () => {
    if (!user || !place) return;
    // Find an existing conversation via match
    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .or(
        `and(user_a.eq.${user.id},user_b.eq.${place.host_id}),and(user_a.eq.${place.host_id},user_b.eq.${user.id})`,
      )
      .maybeSingle();
    if (!match) {
      // Send a like first; if reciprocal exists, trigger creates the match + conversation
      const { error } = await supabase
        .from("likes")
        .insert({ from_user: user.id, to_user: place.host_id, kind: "like" });
      if (error && !error.message.includes("duplicate")) {
        toast.error(error.message);
        return;
      }
      toast.success("Interest sent! You'll be able to chat once they like you back.");
      return;
    }
    const { data: convo } = await supabase
      .from("conversations")
      .select("id")
      .eq("match_id", match.id)
      .maybeSingle();
    if (convo) nav({ to: "/chat/$id", params: { id: convo.id } });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }
  if (!place) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p>Listing not found.</p>
        <Button asChild variant="link" className="mt-4">
          <Link to="/places">Back to rooms</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === place.host_id;
  const cover = place.photos[photoIdx] ?? place.photos[0];

  return (
    <div className="mx-auto max-w-md">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <button
          onClick={() => nav({ to: "/places" })}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Button
            onClick={shareOnWhatsApp}
            variant="outline"
            size="sm"
            className="gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/50 font-medium"
          >
            <Share2 className="h-4 w-4" /> Share
          </Button>
          {isOwner && (
            <Button asChild variant="outline" size="sm">
              <Link to="/places/$id/edit" params={{ id: place.id }}>
                <Pencil className="me-1 h-3 w-3" /> Edit
              </Link>
            </Button>
          )}
          {!isOwner && (
            <Button onClick={toggleSave} variant="outline" size="sm">
              {saved ? (
                <>
                  <BookmarkCheck className="me-1 h-4 w-4" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="me-1 h-4 w-4" /> Save
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="aspect-[4/3] w-full bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={place.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 via-accent/20 to-primary/5 text-primary/70">
            <Home className="h-12 w-12" />
            <span className="text-xs font-medium uppercase tracking-wide">
              {t("place.photosComingSoon") ?? "Photos coming soon"}
            </span>
          </div>
        )}
      </div>
      {place.photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2">
          {place.photos.map((p: string, i: number) => (
            <button
              key={p}
              onClick={() => setPhotoIdx(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${
                i === photoIdx ? "border-primary" : "border-transparent"
              }`}
            >
              <img src={p} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-baseline justify-between">
            <h1 className="text-xl font-semibold">{place.title}</h1>
            <div className="text-lg font-bold text-primary">
              {place.rent_monthly} {place.currency}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {place.neighborhood ? `${place.neighborhood}, ` : ""}
            {place.city}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-2 py-1 capitalize">
            {place.room_type} room
          </span>
          {place.furnished && (
            <span className="rounded-full bg-muted px-2 py-1">Furnished</span>
          )}
          {place.bills_included && (
            <span className="rounded-full bg-muted px-2 py-1">Bills included</span>
          )}
          {place.min_stay_months && (
            <span className="rounded-full bg-muted px-2 py-1">
              Min {place.min_stay_months} mo
            </span>
          )}
        </div>

        {place.available_from && (
          <p className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Available from {new Date(place.available_from).toLocaleDateString()}
          </p>
        )}

        {place.description && (
          <div>
            <h2 className="mb-1 text-sm font-semibold">About this place</h2>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {place.description}
            </p>
          </div>
        )}

        {host && !isOwner && (
          <div className="rounded-lg border border-border p-3">
            <h2 className="mb-2 text-sm font-semibold">Hosted by</h2>
            <Link
              to="/profile/$id"
              params={{ id: host.id }}
              className="flex items-center gap-3"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-accent to-primary/40">
                {host.photo_url ? (
                  <img
                    src={host.photo_url}
                    alt={host.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-semibold text-primary-foreground">
                    {host.display_name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium">
                  {host.display_name}
                  {host.age ? `, ${host.age}` : ""}
                </div>
                <div className="text-xs text-muted-foreground">{host.city}</div>
              </div>
            </Link>
            <Button onClick={messageHost} className="mt-3 w-full">
              <MessageCircle className="me-2 h-4 w-4" /> Message host
            </Button>
          </div>
        )}

        <Button
          onClick={shareOnWhatsApp}
          variant="outline"
          className="w-full gap-2.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 font-medium h-11 transition-all"
        >
          <svg className="h-5 w-5 fill-current text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.852 0-3.664-.497-5.253-1.442l-.376-.225-3.903 1.024 1.042-3.805-.246-.391c-1.036-1.648-1.583-3.595-1.583-5.592 0-5.787 4.708-10.495 10.495-10.495 2.799 0 5.431 1.09 7.41 3.069 1.979 1.979 3.069 4.611 3.069 7.41 0 5.789-4.708 10.495-10.495 10.495m0-19.387c-6.84 0-12.408 5.568-12.408 12.408 0 2.188.572 4.324 1.658 6.205l-1.761 6.43 6.581-1.726c1.815.991 3.864 1.514 5.93 1.514 6.84 0 12.408-5.568 12.408-12.408 0-3.314-1.291-6.425-3.636-8.77-2.345-2.345-5.456-3.636-8.77-3.636" />
          </svg>
          Partager sur WhatsApp
        </Button>

        <div className="h-4" />
      </div>
    </div>
  );
}
