
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_contact text,
  ADD COLUMN IF NOT EXISTS contact_visible_to_matches boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved';

-- Ensure review_status only takes known values
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_review_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_review_status_check
  CHECK (review_status IN ('approved','pending_minor_review','rejected'));

-- Trigger: when a profile is inserted/updated with age < 18, hold it for review
CREATE OR REPLACE FUNCTION public.enforce_minor_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.age IS NOT NULL AND NEW.age < 18 THEN
    -- Only auto-set if not already explicitly approved/rejected by an admin path
    IF NEW.review_status = 'approved' THEN
      NEW.review_status := 'pending_minor_review';
      NEW.onboarded := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_minor_review ON public.profiles;
CREATE TRIGGER trg_enforce_minor_review
  BEFORE INSERT OR UPDATE OF age, onboarded ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_minor_review();

-- Admins can update any profile (needed to approve/reject minors)
DROP POLICY IF EXISTS "profiles update admin" ON public.profiles;
CREATE POLICY "profiles update admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
