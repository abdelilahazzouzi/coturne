-- Fix onboarding loop for new users
-- The trigger reset_profile_review_on_change should only reset review_status and onboarded 
-- if the user was ALREADY onboarded (OLD.onboarded = true). Otherwise, new users changing their 
-- default display name/photo during onboarding get stuck in a closed loop.

CREATE OR REPLACE FUNCTION public.reset_profile_review_on_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.onboarded = true AND OLD.review_status = 'approved' AND (
     OLD.display_name IS DISTINCT FROM NEW.display_name OR
     OLD.photo_url IS DISTINCT FROM NEW.photo_url
  ) THEN
    NEW.review_status := 'pending_minor_review';
    NEW.onboarded := false;
  END IF;
  RETURN NEW;
END;
$$;
