-- Migration to add CNDP Data Privacy consent column to profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cndp_consent_accepted boolean NOT NULL DEFAULT false;
