import { Link } from "@tanstack/react-router";
import { MapPin, Home } from "lucide-react";
import { useT } from "@/i18n/LocaleProvider";

export type PlaceCardData = {
  id: string;
  title: string;
  city: string;
  neighborhood: string | null;
  rent_monthly: number;
  currency: string;
  photos: string[];
  room_type: "private" | "shared";
};

export function PlaceCard({ place }: { place: PlaceCardData }) {
  const cover = place.photos[0];
  const t = useT();
  return (
    <Link
      to="/places/$id"
      params={{ id: place.id }}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={place.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary/10 via-accent/20 to-primary/5 text-primary/70">
            <Home className="h-8 w-8" />
            <span className="text-[10px] font-medium uppercase tracking-wide">
              {t("place.photosComingSoon") ?? "Photos coming soon"}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-sm font-semibold">{place.title}</h3>
          <span className="shrink-0 text-sm font-semibold text-primary">
            {place.rent_monthly} {place.currency}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">
            {place.neighborhood ? `${place.neighborhood}, ` : ""}
            {place.city}
          </span>
          <span className="ml-auto capitalize">{place.room_type} room</span>
        </div>
      </div>
    </Link>
  );
}
