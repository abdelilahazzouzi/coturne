import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Meta = { viewing_id?: string; action?: string; proposed_for?: string };

export function ViewingBubble({
  metadata,
  conversationId,
  mine,
}: {
  metadata: unknown;
  conversationId: string;
  mine: boolean;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const m = (metadata ?? {}) as Meta;

  const { data: viewing } = useQuery({
    queryKey: ["viewing", m.viewing_id],
    enabled: !!m.viewing_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("viewings")
        .select("id, proposed_by, proposed_for, status")
        .eq("id", m.viewing_id!)
        .maybeSingle();
      return data;
    },
  });

  const respond = async (status: "accepted" | "declined" | "cancelled") => {
    if (!viewing || !user) return;
    const { error } = await supabase.from("viewings").update({ status }).eq("id", viewing.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    const when = new Date(viewing.proposed_for);
    const verb = status === "accepted" ? "Accepted" : status === "declined" ? "Declined" : "Cancelled";
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: `${verb} viewing for ${format(when, "PPp")}`,
      kind: "viewing",
      metadata: { viewing_id: viewing.id, action: status },
    });
    qc.invalidateQueries({ queryKey: ["viewing", viewing.id] });
  };

  const when = viewing?.proposed_for ?? m.proposed_for;
  const status = viewing?.status ?? m.action ?? "proposed";
  const isProposer = viewing && user && viewing.proposed_by === user.id;
  const showActions = m.action === "proposed" && status === "proposed";

  return (
    <div
      className={cn(
        "w-60 rounded-lg border p-3",
        mine ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-background text-foreground",
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold">
        <CalendarClock className="h-4 w-4" />
        Viewing {status !== "proposed" ? `(${status})` : ""}
      </div>
      {when && <div className="mt-1 text-sm">{format(new Date(when), "PPp")}</div>}
      {showActions && (
        <div className="mt-2 flex gap-2">
          {isProposer ? (
            <Button size="sm" variant="outline" onClick={() => respond("cancelled")}>
              Cancel
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={() => respond("accepted")}>
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => respond("declined")}>
                Decline
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
