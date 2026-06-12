-- Migration to add coordinates and calculate_distance function for proximity matching

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Proximity distance calculation helper function (Haversine formula in km)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r double precision := 6371.0; -- Earth radius in km
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2.0) * sin(dlat/2.0) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2.0) * sin(dlon/2.0);
  c := 2.0 * atan2(sqrt(a), sqrt(1.0-a));
  RETURN r * c;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.calculate_distance(double precision, double precision, double precision, double precision) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_distance(double precision, double precision, double precision, double precision) TO authenticated;
