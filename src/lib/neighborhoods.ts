export type Coordinates = {
  lat: number;
  lng: number;
};

export type NeighborhoodInfo = {
  name: string;
  coords: Coordinates;
};

export const NEIGHBORHOODS: Record<string, NeighborhoodInfo[]> = {
  Casablanca: [
    { name: "Maarif", coords: { lat: 33.5822, lng: -7.6322 } },
    { name: "Gauthier", coords: { lat: 33.5898, lng: -7.6256 } },
    { name: "Racine", coords: { lat: 33.5880, lng: -7.6360 } },
    { name: "Palmiers", coords: { lat: 33.5780, lng: -7.6280 } },
    { name: "Bourgogne", coords: { lat: 33.5933, lng: -7.6450 } },
    { name: "Sidi Maarouf", coords: { lat: 33.5358, lng: -7.6433 } },
    { name: "Casablanca Finance City (CFC)", coords: { lat: 33.5625, lng: -7.6580 } },
    { name: "Beauséjour", coords: { lat: 33.5680, lng: -7.6520 } },
    { name: "Hay Hassani", coords: { lat: 33.5550, lng: -7.6650 } },
    { name: "Oulfa", coords: { lat: 33.5580, lng: -7.6745 } },
    { name: "2 Mars", coords: { lat: 33.5740, lng: -7.6180 } },
    { name: "Hermitage", coords: { lat: 33.5690, lng: -7.6210 } },
    { name: "Belvédère", coords: { lat: 33.5956, lng: -7.6033 } },
    { name: "Roches Noires", coords: { lat: 33.6020, lng: -7.5920 } },
    { name: "Ain Sebaa", coords: { lat: 33.6120, lng: -7.5450 } },
    { name: "Ain Diab", coords: { lat: 33.5962, lng: -7.6834 } },
    { name: "California", coords: { lat: 33.5434, lng: -7.6200 } },
    { name: "Polo", coords: { lat: 33.5560, lng: -7.6120 } },
    { name: "CIL", coords: { lat: 33.5710, lng: -7.6450 } },
    { name: "Maarif Extension", coords: { lat: 33.5710, lng: -7.6380 } },
    { name: "Anfa Superieur", coords: { lat: 33.5850, lng: -7.6600 } },
    { name: "Centre Ville", coords: { lat: 33.5920, lng: -7.6150 } },
    { name: "Mers Sultan", coords: { lat: 33.5800, lng: -7.6100 } },
  ],
  Rabat: [
    { name: "Agdal", coords: { lat: 33.9984, lng: -6.8483 } },
    { name: "Hay Riad", coords: { lat: 33.9688, lng: -6.8778 } },
    { name: "Hassan", coords: { lat: 34.0205, lng: -6.8285 } },
    { name: "Souissi", coords: { lat: 33.9780, lng: -6.8290 } },
    { name: "L'Ocean", coords: { lat: 34.0260, lng: -6.8480 } },
  ],
  Marrakech: [
    { name: "Gueliz", coords: { lat: 31.6348, lng: -8.0150 } },
    { name: "Hivernage", coords: { lat: 31.6215, lng: -8.0143 } },
    { name: "Medina", coords: { lat: 31.6295, lng: -7.9811 } },
    { name: "Daoudiate", coords: { lat: 31.6534, lng: -7.9944 } },
  ],
  Tangier: [
    { name: "City Center", coords: { lat: 35.7725, lng: -5.8010 } },
    { name: "Malabata", coords: { lat: 35.7798, lng: -5.7765 } },
    { name: "Iberia", coords: { lat: 35.7788, lng: -5.8115 } },
    { name: "Val Fleuri", coords: { lat: 35.7680, lng: -5.8150 } },
  ],
};

export function getCoordinatesForNeighborhood(city: string, neighborhood: string): Coordinates | null {
  const list = NEIGHBORHOODS[city];
  if (!list) return null;
  const found = list.find((n) => n.name.toLowerCase() === neighborhood.toLowerCase());
  return found ? found.coords : null;
}

// Client-side Haversine distance calculator (returns distance in km)
export function getDistanceInKm(coords1: Coordinates, coords2: Coordinates): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const dLon = ((coords2.lng - coords1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coords1.lat * Math.PI) / 180) *
      Math.cos((coords2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
