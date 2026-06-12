-- Add notification preference columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_match_notif BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_message_notif BOOLEAN DEFAULT true;
