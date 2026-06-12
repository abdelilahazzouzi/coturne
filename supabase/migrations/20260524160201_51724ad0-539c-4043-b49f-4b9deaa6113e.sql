
-- 1. Revoke EXECUTE on internal trigger SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.messages_guard_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_minor_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_conversation_last_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_match() FROM PUBLIC, anon, authenticated;

-- 2. profile_contacts: allow matched users to read contact fields when owner has opted in
CREATE POLICY "contacts select matched visible"
ON public.profile_contacts
FOR SELECT
TO authenticated
USING (
  user_id <> auth.uid()
  AND (contact_visible_to_matches = true OR phone_visible_to_matches = true)
  AND public.users_matched(auth.uid(), user_id)
);

-- 3. viewings: restrict UPDATE — proposer can edit; other participant can only change status
DROP POLICY IF EXISTS "viewings update participants" ON public.viewings;

CREATE POLICY "viewings update by proposer"
ON public.viewings
FOR UPDATE
TO authenticated
USING (proposed_by = auth.uid())
WITH CHECK (proposed_by = auth.uid());

CREATE POLICY "viewings update status by other participant"
ON public.viewings
FOR UPDATE
TO authenticated
USING (
  proposed_by <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = viewings.conversation_id
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  )
)
WITH CHECK (
  proposed_by <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = viewings.conversation_id
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  )
);

-- Trigger guard: non-proposer can only change status/updated_at
CREATE OR REPLACE FUNCTION public.viewings_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> OLD.proposed_by THEN
    IF NEW.proposed_by IS DISTINCT FROM OLD.proposed_by
       OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
       OR NEW.place_id IS DISTINCT FROM OLD.place_id
       OR NEW.proposed_for IS DISTINCT FROM OLD.proposed_for
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'Only the proposer may modify viewing details';
    END IF;
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.viewings_guard_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS viewings_guard_update_trg ON public.viewings;
CREATE TRIGGER viewings_guard_update_trg
BEFORE UPDATE ON public.viewings
FOR EACH ROW
EXECUTE FUNCTION public.viewings_guard_update();
