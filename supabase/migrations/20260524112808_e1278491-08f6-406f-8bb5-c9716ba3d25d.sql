
-- 1) Field-level gating of phone for matched contacts via a security-invoker view
DROP POLICY IF EXISTS "contacts select matched visible" ON public.profile_contacts;

CREATE OR REPLACE VIEW public.profile_contacts_view
WITH (security_invoker=on) AS
SELECT
  pc.user_id,
  pc.email_contact,
  pc.contact_handle,
  CASE
    WHEN pc.user_id = auth.uid() THEN pc.phone
    WHEN pc.phone_visible_to_matches = true
         AND public.users_matched(auth.uid(), pc.user_id) THEN pc.phone
    ELSE NULL
  END AS phone,
  pc.phone_verified,
  pc.phone_visible_to_matches,
  pc.contact_visible_to_matches,
  pc.created_at,
  pc.updated_at
FROM public.profile_contacts pc
WHERE
  pc.user_id = auth.uid()
  OR (pc.contact_visible_to_matches = true AND public.users_matched(auth.uid(), pc.user_id));

GRANT SELECT ON public.profile_contacts_view TO authenticated;

-- 2) Realtime channel authorization: restrict subscriptions on messages to conversation participants
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime messages participants only" ON realtime.messages;

CREATE POLICY "realtime messages participants only"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id::text = realtime.topic()
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  )
);
