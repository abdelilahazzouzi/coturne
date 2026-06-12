import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { PlaceCard, type PlaceCardData } from "@/components/PlaceCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

export const Route = createFileRoute("/profile/listings")({
  head: () => ({
    meta: [
      { title: "My listings — Roomies" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <MyListings />
      </AppLayout>
    </RequireAuth>
  ),
});

function MyListings() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("places")
        .select("id, title, city, neighborhood, rent_monthly, currency, photos, room_type, status")
        .eq("host_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (PlaceCardData & { status: string })[];
    },
  });

  return (
    <div className="mx-auto max-w-md space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">My listings</h1>
        </div>
        <Button size="sm" asChild>
          <Link to="/places/new">
            <Plus className="me-1 h-4 w-4" /> New
          </Link>
        </Button>
      </div>
      {(data?.length ?? 0) === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          You haven't listed any rooms yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {data!.map((p) => (
            <div key={p.id} className="relative">
              <PlaceCard place={p} />
              <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium capitalize">
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
