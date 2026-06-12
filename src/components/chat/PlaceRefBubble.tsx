import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type Meta = {
  place_id?: string;
  title?: string;
  city?: string;
  rent_monthly?: number;
  currency?: string;
  photo?: string | null;
};

export function PlaceRefBubble({ metadata, mine }: { metadata: unknown; mine: boolean }) {
  const m = (metadata ?? {}) as Meta;
  if (!m.place_id) return <span className="text-xs italic opacity-70">Shared a place</span>;
  return (
    <Link
      to="/places/$id"
      params={{ id: m.place_id }}
      className={cn(
        "block w-56 overflow-hidden rounded-lg border",
        mine ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-background",
      )}
    >
      {m.photo ? (
        <img src={m.photo} alt={m.title ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
      ) : (
        <div className="aspect-[4/3] w-full bg-muted" />
      )}
      <div className="space-y-0.5 p-2">
        <div className="truncate text-xs font-semibold">{m.title ?? "Room"}</div>
        <div className={cn("flex items-center gap-1 text-[11px]", mine ? "opacity-90" : "text-muted-foreground")}>
          <MapPin className="h-3 w-3" />
          <span className="truncate">{m.city ?? ""}</span>
          {m.rent_monthly ? (
            <span className="ml-auto font-semibold">
              {m.rent_monthly} {m.currency}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
