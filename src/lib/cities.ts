import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_CITIES = ["Rabat", "Casablanca", "Tangier", "Marrakech"];

export function useCities() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["dynamic-cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("places")
        .select("description")
        .eq("title", "SYSTEM_SETTINGS_CITIES")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data || !data.description) {
        return DEFAULT_CITIES;
      }

      try {
        const parsed = JSON.parse(data.description);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
      } catch (e) {
        console.error("Failed to parse cities JSON", e);
      }
      return DEFAULT_CITIES;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  const mutation = useMutation({
    mutationFn: async ({ cities, userId }: { cities: string[]; userId: string }) => {
      const { error } = await supabase.from("places").insert({
        title: "SYSTEM_SETTINGS_CITIES",
        description: JSON.stringify(cities),
        city: "SYSTEM",
        rent_monthly: 0,
        host_id: userId,
        status: "published",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dynamic-cities"] });
    },
  });

  return {
    cities: query.data ?? DEFAULT_CITIES,
    isLoading: query.isLoading,
    saveCities: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
