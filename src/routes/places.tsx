import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCities } from "@/lib/cities";
import { PlaceCard, type PlaceCardData } from "@/components/PlaceCard";
import { Plus, Home } from "lucide-react";

export const Route = createFileRoute("/places")({
  head: () => ({
    meta: [
      { title: "Browse rooms — Roomies" },
      {
        name: "description",
        content:
          "Find a room offered by other roommates. Filter by city and budget.",
      },
      { property: "og:title", content: "Browse rooms — Roomies" },
      {
        property: "og:description",
        content:
          "Find a room offered by other roommates. Filter by city and budget.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <PlacesBrowse />
      </AppLayout>
    </RequireAuth>
  ),
});

const PAGE_SIZE = 12;

function PlacesBrowse() {
  const { user } = useAuth();
  const { cities: dynamicCities } = useCities();
  const [city, setCity] = useState<string>("");
  const [maxRent, setMaxRent] = useState<string>("");
  const [minRent, setMinRent] = useState<string>("");
  const [moveInBy, setMoveInBy] = useState<string>("");
  const [roomType, setRoomType] = useState<"" | "private" | "shared">("");
  const [furnished, setFurnished] = useState(false);
  const [billsIncluded, setBillsIncluded] = useState(false);
  const [maxMinStay, setMaxMinStay] = useState<string>("");
  const [page, setPage] = useState(0);

  const { data: meProfile } = useQuery({
    queryKey: ["me-intent", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_intent")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const canHost =
    meProfile?.user_intent === "has_place" ||
    meProfile?.user_intent === "both";

  const { data: placesRaw, isLoading } = useQuery({
    queryKey: ["places", city, minRent, maxRent, moveInBy, roomType, furnished, billsIncluded, maxMinStay, page],
    queryFn: async () => {
      let q = supabase
        .from("places")
        .select("id, title, city, neighborhood, rent_monthly, currency, photos, room_type, host_id")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (city) q = q.eq("city", city);
      if (minRent) q = q.gte("rent_monthly", parseInt(minRent, 10));
      if (maxRent) q = q.lte("rent_monthly", parseInt(maxRent, 10));
      if (moveInBy) q = q.lte("available_from", moveInBy);
      if (roomType) q = q.eq("room_type", roomType);
      if (furnished) q = q.eq("furnished", true);
      if (billsIncluded) q = q.eq("bills_included", true);
      if (maxMinStay) q = q.or(`min_stay_months.is.null,min_stay_months.lte.${parseInt(maxMinStay, 10)}`);
      const { data, error } = await q;
      if (error) throw error;
      return data as (PlaceCardData & { host_id: string })[];
    },
  });

  // Fetch host review statuses to filter out underage/rejected hosts
  const { data: hostProfiles } = useQuery({
    queryKey: ["place-hosts", placesRaw?.map((p) => p.host_id).join(",")],
    enabled: !!placesRaw && placesRaw.length > 0,
    queryFn: async () => {
      const hostIds = [...new Set(placesRaw!.map((p) => p.host_id))];
      const { data } = await supabase.from("profiles").select("id, review_status").in("id", hostIds);
      return (data ?? []) as { id: string; review_status: string | null }[];
    },
  });

  const approvedHostIds = useMemo(() => {
    const set = new Set<string>();
    for (const h of hostProfiles ?? []) {
      if (!h.review_status || h.review_status === "approved") set.add(h.id);
    }
    return set;
  }, [hostProfiles]);

  const filteredPlaces = useMemo(() => {
    if (!placesRaw) return [];
    if (!hostProfiles) return placesRaw;
    return placesRaw.filter((p) => approvedHostIds.has(p.host_id));
  }, [placesRaw, hostProfiles, approvedHostIds]);

  const hasMore = useMemo(() => (placesRaw?.length ?? 0) === PAGE_SIZE, [placesRaw]);
  const resetPage = () => setPage(0);

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
        {canHost && (
          <Button asChild size="sm">
            <Link to="/places/new">
              <Plus className="me-1 h-4 w-4" /> List a room
            </Link>
          </Button>
        )}
      </div>

      {!canHost && (
        <p className="text-xs text-foreground/80">
          Have a place to share?{" "}
          <Link to="/profile" className="underline">
            Update your profile
          </Link>{" "}
          to list a room.
        </p>
      )}

      <div className="space-y-2 rounded-lg border border-border bg-background/95 p-3">
        <div className="flex gap-2">
          <select
            value={city}
            onChange={(e) => { setCity(e.target.value); resetPage(); }}
            className="flex-1 rounded-md border border-input bg-background px-2 py-2 text-sm"
          >
            <option value="">All cities</option>
            {dynamicCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={roomType}
            onChange={(e) => { setRoomType(e.target.value as "" | "private" | "shared"); resetPage(); }}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm"
          >
            <option value="">Any room</option>
            <option value="private">Private</option>
            <option value="shared">Shared</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Input type="number" inputMode="numeric" placeholder="Min" value={minRent}
            onChange={(e) => { setMinRent(e.target.value); resetPage(); }} className="w-20" />
          <Input type="number" inputMode="numeric" placeholder="Max" value={maxRent}
            onChange={(e) => { setMaxRent(e.target.value); resetPage(); }} className="w-20" />
          <Input type="number" inputMode="numeric" placeholder="Max min-stay (mo)" value={maxMinStay}
            onChange={(e) => { setMaxMinStay(e.target.value); resetPage(); }} className="flex-1" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-foreground/80">Move in by</label>
          <Input type="date" value={moveInBy}
            onChange={(e) => { setMoveInBy(e.target.value); resetPage(); }} className="flex-1" />
        </div>
        <div className="flex gap-4 text-xs text-foreground/80">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={furnished}
              onChange={(e) => { setFurnished(e.target.checked); resetPage(); }} />
            Furnished
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={billsIncluded}
              onChange={(e) => { setBillsIncluded(e.target.checked); resetPage(); }} />
            Bills included
          </label>
        </div>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (filteredPlaces?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-background/90 p-8 text-center">
          <Home className="mx-auto h-10 w-10 text-foreground/70" />
          <p className="mt-3 text-sm text-foreground/80">
            No rooms match your filters yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredPlaces.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
