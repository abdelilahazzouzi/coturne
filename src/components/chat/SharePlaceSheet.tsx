import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { toast } from "sonner";

type MyPlace = {
  id: string;
  title: string;
  city: string;
  rent_monthly: number;
  currency: string;
  photos: string[];
};

export function SharePlaceSheet({
  conversationId,
  trigger,
}: {
  conversationId: string;
  trigger: React.ReactNode;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: places, isLoading } = useQuery({
    queryKey: ["my-published-places", user?.id],
    enabled: !!user && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("places")
        .select("id, title, city, rent_monthly, currency, photos")
        .eq("host_id", user!.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MyPlace[];
    },
  });

  const share = async (p: MyPlace) => {
    if (!user || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: p.title,
      kind: "place_ref",
      metadata: {
        place_id: p.id,
        title: p.title,
        city: p.city,
        rent_monthly: p.rent_monthly,
        currency: p.currency,
        photo: p.photos[0] ?? null,
      },
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Share a place</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (places?.length ?? 0) === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <Home className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">You have no published rooms.</p>
              <Button asChild size="sm" className="mt-3" onClick={() => setOpen(false)}>
                <Link to="/places/new">List a room</Link>
              </Button>
            </div>
          ) : (
            places!.map((p) => (
              <button
                key={p.id}
                onClick={() => share(p)}
                disabled={sending}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-2 text-left hover:bg-accent"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.photos[0] ? (
                    <img src={p.photos[0]} alt={p.title} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.city} • {p.rent_monthly} {p.currency}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
