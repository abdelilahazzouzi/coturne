-- Migration to prevent post-verification profile spoofing
-- If an approved user changes their display_name or photo_url, their review_status is reset to 'pending_minor_review'
-- and their onboarded status is set to false, taking them offline until re-approved by an admin.

CREATE OR REPLACE FUNCTION public.reset_profile_review_on_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.review_status = 'approved' AND (
     OLD.display_name IS DISTINCT FROM NEW.display_name OR
     OLD.photo_url IS DISTINCT FROM NEW.photo_url
  ) THEN
    NEW.review_status := 'pending_minor_review';
    NEW.onboarded := false;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_profile_review_on_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_reset_profile_review_on_change ON public.profiles;
CREATE TRIGGER trg_reset_profile_review_on_change
  BEFORE UPDATE OF display_name, photo_url ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_profile_review_on_change();

-- Re-write RLS policy to allow these secure transitions while blocking manual escalation
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;

CREATE POLICY "profiles update own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (
    -- Case A: review_status and onboarded remain unchanged
    (
      review_status = (SELECT review_status FROM public.profiles WHERE id = auth.uid())
      AND onboarded = (SELECT onboarded FROM public.profiles WHERE id = auth.uid())
    )
    OR
    -- Case B: The trigger resets status to pending_minor_review and onboarded to false on name/photo change
    (
      (SELECT review_status FROM public.profiles WHERE id = auth.uid()) = 'approved'
      AND review_status = 'pending_minor_review'
      AND onboarded = false
    )
    OR
    -- Case C: Allowing initial onboarding transition (false -> true) for approved users
    (
      onboarded = true
      AND (SELECT onboarded FROM public.profiles WHERE id = auth.uid()) = false
      AND (SELECT review_status FROM public.profiles WHERE id = auth.uid()) = 'approved'
    )
  )
);
