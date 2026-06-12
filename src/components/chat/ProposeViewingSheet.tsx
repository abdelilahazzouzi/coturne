import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function ProposeViewingSheet({
  conversationId,
  defaultPlaceId,
  trigger,
}: {
  conversationId: string;
  defaultPlaceId?: string | null;
  trigger: React.ReactNode;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("18:00");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || !date || busy) return;
    setBusy(true);
    const [h, mm] = time.split(":").map((n) => parseInt(n, 10));
    const when = new Date(date);
    when.setHours(h || 0, mm || 0, 0, 0);

    const { data: v, error } = await supabase
      .from("viewings")
      .insert({
        conversation_id: conversationId,
        place_id: defaultPlaceId ?? null,
        proposed_by: user.id,
        proposed_for: when.toISOString(),
      })
      .select("id")
      .single();
    if (error || !v) {
      setBusy(false);
      toast.error(error?.message ?? "Failed");
      return;
    }
    const { error: mErr } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: `Proposed a viewing for ${format(when, "PPp")}`,
      kind: "viewing",
      metadata: { viewing_id: v.id, action: "proposed", proposed_for: when.toISOString() },
    });
    setBusy(false);
    if (mErr) {
      toast.error(mErr.message);
      return;
    }
    setOpen(false);
    setDate(undefined);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || busy) return;
    submit();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Propose a viewing</SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs text-muted-foreground">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="me-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <label htmlFor="pv-time" className="block text-xs text-muted-foreground">Time</label>
            <Input id="pv-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={!date || busy}>
            {busy ? "Sending…" : "Send proposal"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

