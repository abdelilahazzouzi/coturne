import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { PlaceEditor, type PlaceForm } from "@/components/PlaceEditor";

export const Route = createFileRoute("/places/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit listing — Roomies" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <EditPlace />
      </AppLayout>
    </RequireAuth>
  ),
});

function EditPlace() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["place-edit", id],
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

  if (isLoading) return <p className="p-8 text-center text-muted-foreground">Loading…</p>;
  if (!data) return <p className="p-8 text-center">Not found.</p>;

  const initial: PlaceForm = {
    id: data.id,
    title: data.title,
    description: data.description ?? "",
    city: data.city,
    neighborhood: data.neighborhood ?? "",
    rent_monthly: data.rent_monthly,
    currency: data.currency,
    available_from: data.available_from ?? "",
    min_stay_months: data.min_stay_months,
    room_type: data.room_type,
    furnished: data.furnished,
    bills_included: data.bills_included,
    photos: data.photos ?? [],
    status: data.status,
  };

  return <PlaceEditor initial={initial} />;
}
