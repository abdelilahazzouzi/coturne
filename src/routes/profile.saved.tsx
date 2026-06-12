import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { PlaceCard, type PlaceCardData } from "@/components/PlaceCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/profile/saved")({
  head: () => ({
    meta: [
      { title: "Saved places — Roomies" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <SavedPlaces />
      </AppLayout>
    </RequireAuth>
  ),
});

function SavedPlaces() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["saved-places", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: saves, error } = await supabase
        .from("place_saves")
        .select("place_id, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (saves ?? []).map((s) => s.place_id);
      if (ids.length === 0) return [] as PlaceCardData[];
      const { data: places } = await supabase
        .from("places")
        .select("id, title, city, neighborhood, rent_monthly, currency, photos, room_type")
        .in("id", ids)
        .eq("status", "published");
      return (places ?? []) as PlaceCardData[];
    },
  });

  return (
    <div className="mx-auto max-w-md space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/profile" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Saved places</h1>
      </div>
      {(data?.length ?? 0) === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No saved places yet. Tap the bookmark on a listing to save it.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {data!.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>
      )}
    </div>
  );
}
