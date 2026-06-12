ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS guests_frequency text,
  ADD COLUMN IF NOT EXISTS alcohol_in_house text,
  ADD COLUMN IF NOT EXISTS prayer_at_home text,
  ADD COLUMN IF NOT EXISTS food_sharing text;