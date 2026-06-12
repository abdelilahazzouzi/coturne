
-- Strengthen viewings update trigger: even the proposer cannot change conversation_id/place_id after creation
CREATE OR REPLACE FUNCTION public.viewings_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Immutable for everyone after creation
  IF NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.place_id IS DISTINCT FROM OLD.place_id
     OR NEW.proposed_by IS DISTINCT FROM OLD.proposed_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'conversation_id, place_id, proposed_by and created_at are immutable on viewings';
  END IF;

  -- Non-proposer can only change status
  IF auth.uid() IS NOT NULL AND auth.uid() <> OLD.proposed_by THEN
    IF NEW.proposed_for IS DISTINCT FROM OLD.proposed_for THEN
      RAISE EXCEPTION 'Only the proposer may change the proposed time';
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- Drop the over-broad matched-contact policy and replace with a SECURITY DEFINER accessor that returns only opted-in fields
DROP POLICY IF EXISTS "contacts select matched visible" ON public.profile_contacts;

CREATE OR REPLACE FUNCTION public.get_visible_contact(_target uuid)
RETURNS TABLE (
  user_id uuid,
  email_contact text,
  contact_handle text,
  phone text,
  phone_verified boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  IF auth.uid() = _target THEN
    RETURN QUERY
      SELECT pc.user_id, pc.email_contact, pc.contact_handle, pc.phone, pc.phone_verified
      FROM public.profile_contacts pc
      WHERE pc.user_id = _target;
    RETURN;
  END IF;
  IF NOT public.users_matched(auth.uid(), _target) THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT
      pc.user_id,
      CASE WHEN pc.contact_visible_to_matches THEN pc.email_contact ELSE NULL END,
      CASE WHEN pc.contact_visible_to_matches THEN pc.contact_handle ELSE NULL END,
      CASE WHEN pc.phone_visible_to_matches   THEN pc.phone          ELSE NULL END,
      CASE WHEN pc.phone_visible_to_matches   THEN pc.phone_verified ELSE NULL END
    FROM public.profile_contacts pc
    WHERE pc.user_id = _target;
END $$;

GRANT EXECUTE ON FUNCTION public.get_visible_contact(uuid) TO authenticated;

-- Prevent users from self-promoting through profiles update own (WITH CHECK on review_status/onboarded for non-admins)
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;

CREATE POLICY "profiles update own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND review_status = (SELECT review_status FROM public.profiles WHERE id = auth.uid())
);
