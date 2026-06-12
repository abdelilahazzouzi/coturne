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
                    {host.display_name.charAt(0).toUpperCase()}
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

        <div className="h-4" />
      </div>
    </div>
  );
}
