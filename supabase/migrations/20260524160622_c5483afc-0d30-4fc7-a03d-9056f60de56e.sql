
-- Tighten messages update RLS to sender-only at the policy layer
DROP POLICY IF EXISTS "messages update participants" ON public.messages;

CREATE POLICY "messages update sender only"
ON public.messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Allow read_at acknowledgement by the other participant (separate narrow policy)
CREATE POLICY "messages update read_at by recipient"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  )
)
WITH CHECK (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  )
);

-- Lock down `onboarded` flag in profiles update own
DROP POLICY IF EXISTS "profiles update own" ON public.profiles;

CREATE POLICY "profiles update own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND review_status = (SELECT review_status FROM public.profiles WHERE id = auth.uid())
  AND (
    -- allow first-time onboarding (false -> true), but never flipping back
    onboarded = (SELECT onboarded FROM public.profiles WHERE id = auth.uid())
    OR (
      onboarded = true
      AND (SELECT onboarded FROM public.profiles WHERE id = auth.uid()) = false
      AND (SELECT review_status FROM public.profiles WHERE id = auth.uid()) = 'approved'
    )
  )
);
