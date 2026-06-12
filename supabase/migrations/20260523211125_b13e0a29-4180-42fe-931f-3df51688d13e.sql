
-- ============================================================
-- 1) Separate sensitive contact fields into profile_contacts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profile_contacts (
  user_id uuid PRIMARY KEY,
  phone text,
  email_contact text,
  contact_handle text,
  phone_verified boolean NOT NULL DEFAULT false,
  phone_visible_to_matches boolean NOT NULL DEFAULT false,
  contact_visible_to_matches boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.profile_contacts
  (user_id, phone, email_contact, contact_handle, phone_verified, phone_visible_to_matches, contact_visible_to_matches)
SELECT id, phone, email_contact, contact_handle, phone_verified, phone_visible_to_matches, contact_visible_to_matches
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS email_contact,
  DROP COLUMN IF EXISTS contact_handle,
  DROP COLUMN IF EXISTS phone_verified,
  DROP COLUMN IF EXISTS phone_visible_to_matches,
  DROP COLUMN IF EXISTS contact_visible_to_matches;

ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

-- Helper: are two users matched?
CREATE OR REPLACE FUNCTION public.users_matched(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches
    WHERE user_a = LEAST(_a,_b) AND user_b = GREATEST(_a,_b)
  );
$$;
REVOKE EXECUTE ON FUNCTION public.users_matched(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.users_matched(uuid, uuid) TO authenticated;

CREATE POLICY "contacts select own"
  ON public.profile_contacts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "contacts select matched visible"
  ON public.profile_contacts FOR SELECT TO authenticated
  USING (
    contact_visible_to_matches = true
    AND public.users_matched(auth.uid(), user_id)
  );

CREATE POLICY "contacts insert own"
  ON public.profile_contacts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "contacts update own"
  ON public.profile_contacts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER profile_contacts_touch_updated_at
BEFORE UPDATE ON public.profile_contacts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Ensure a contacts row is created for every new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  insert into public.profile_contacts (user_id, email_contact)
    values (new.id, new.email) on conflict (user_id) do nothing;
  return new;
end $$;

-- ============================================================
-- 2) Lock down messages UPDATE: recipients can only mark read
-- ============================================================
DROP POLICY IF EXISTS "messages update read participants" ON public.messages;

CREATE POLICY "messages update participants"
  ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c
                 WHERE c.id = messages.conversation_id
                   AND auth.uid() IN (c.user_a, c.user_b)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c
                      WHERE c.id = messages.conversation_id
                        AND auth.uid() IN (c.user_a, c.user_b)));

CREATE OR REPLACE FUNCTION public.messages_guard_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> OLD.sender_id THEN
    IF NEW.body IS DISTINCT FROM OLD.body
       OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
       OR NEW.kind IS DISTINCT FROM OLD.kind
       OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
       OR COALESCE(NEW.metadata::text,'') IS DISTINCT FROM COALESCE(OLD.metadata::text,'')
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'Only the sender may modify message content';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS messages_guard_update_trg ON public.messages;
CREATE TRIGGER messages_guard_update_trg
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.messages_guard_update();

-- ============================================================
-- 3) handle_like: skip match creation if either user blocked
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_like()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
declare a uuid; b uuid;
begin
  if new.kind = 'like' then
    if exists (
      select 1 from public.blocks
      where (blocker_id = new.from_user and blocked_id = new.to_user)
         or (blocker_id = new.to_user and blocked_id = new.from_user)
    ) then
      return new;
    end if;
    if exists (select 1 from public.likes
               where from_user = new.to_user and to_user = new.from_user and kind='like') then
      a := least(new.from_user, new.to_user);
      b := greatest(new.from_user, new.to_user);
      insert into public.matches (user_a, user_b) values (a,b)
      on conflict do nothing;
    end if;
  end if;
  return new;
end $$;

-- ============================================================
-- 4) Lock down Realtime broadcast/presence on messages table
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='realtime' AND table_name='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    -- No policies = deny all client subscribe/broadcast/presence writes.
    -- Postgres_changes uses underlying table RLS and is unaffected.
  END IF;
END $$;

-- ============================================================
-- 5) Revoke EXECUTE on trigger-only SECURITY DEFINER functions
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_match() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_conversation_last_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_minor_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.messages_guard_update() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 6) Restrict place-photos bucket to direct path reads only
-- ============================================================
DROP POLICY IF EXISTS "place-photos read" ON storage.objects;
CREATE POLICY "place-photos read by path"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'place-photos'
    AND name IS NOT NULL
    AND POSITION('/' IN name) > 0
  );
