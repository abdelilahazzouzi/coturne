
-- Enums
CREATE TYPE public.user_intent AS ENUM ('has_place','searching','both');
CREATE TYPE public.place_status AS ENUM ('draft','published','paused');
CREATE TYPE public.room_type AS ENUM ('private','shared');
CREATE TYPE public.message_kind AS ENUM ('text','place_ref');

-- profiles.user_intent
ALTER TABLE public.profiles
  ADD COLUMN user_intent public.user_intent NOT NULL DEFAULT 'searching';

-- messages.kind + metadata
ALTER TABLE public.messages
  ADD COLUMN kind public.message_kind NOT NULL DEFAULT 'text',
  ADD COLUMN metadata jsonb;

-- places
CREATE TABLE public.places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  city text NOT NULL,
  neighborhood text,
  rent_monthly integer NOT NULL,
  currency text NOT NULL DEFAULT 'MAD',
  available_from date,
  min_stay_months integer,
  room_type public.room_type NOT NULL DEFAULT 'private',
  furnished boolean NOT NULL DEFAULT false,
  bills_included boolean NOT NULL DEFAULT false,
  photos text[] NOT NULL DEFAULT '{}',
  status public.place_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX places_city_status_idx ON public.places (city, status, available_from);
CREATE INDEX places_host_idx ON public.places (host_id);

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places select published or own" ON public.places
FOR SELECT TO authenticated
USING (status = 'published' OR host_id = auth.uid());

CREATE POLICY "places insert own" ON public.places
FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());

CREATE POLICY "places update own" ON public.places
FOR UPDATE TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());

CREATE POLICY "places delete own" ON public.places
FOR DELETE TO authenticated USING (host_id = auth.uid());

CREATE TRIGGER places_touch_updated_at
BEFORE UPDATE ON public.places
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- place_saves
CREATE TABLE public.place_saves (
  user_id uuid NOT NULL,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, place_id)
);
CREATE INDEX place_saves_user_idx ON public.place_saves (user_id);

ALTER TABLE public.place_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "place_saves select own" ON public.place_saves
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "place_saves insert own" ON public.place_saves
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "place_saves delete own" ON public.place_saves
FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('place-photos','place-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "place-photos read" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'place-photos');

CREATE POLICY "place-photos insert own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'place-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "place-photos update own" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'place-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "place-photos delete own" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'place-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
