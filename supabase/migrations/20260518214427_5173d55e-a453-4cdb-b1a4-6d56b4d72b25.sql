
-- Conversations: one per match
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL UNIQUE,
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_user_a ON public.conversations(user_a);
CREATE INDEX idx_conversations_user_b ON public.conversations(user_b);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations select participants"
ON public.conversations FOR SELECT TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages select participants"
ON public.messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
));

CREATE POLICY "messages insert sender participant"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  )
);

CREATE POLICY "messages update read participants"
ON public.messages FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = conversation_id AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
));

-- Auto-create conversation when a match is created
CREATE OR REPLACE FUNCTION public.handle_new_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.conversations (match_id, user_a, user_b)
  VALUES (NEW.id, NEW.user_a, NEW.user_b)
  ON CONFLICT (match_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS matches_after_insert ON public.matches;
CREATE TRIGGER matches_after_insert
AFTER INSERT ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.handle_new_match();

-- Bump last_message_at when a message is inserted
CREATE OR REPLACE FUNCTION public.bump_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_bump_conversation ON public.messages;
CREATE TRIGGER messages_bump_conversation
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_last_message();

-- Also wire the missing likes trigger (was reported missing earlier)
DROP TRIGGER IF EXISTS likes_after_insert ON public.likes;
CREATE TRIGGER likes_after_insert
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_like();

-- Backfill conversations for existing matches
INSERT INTO public.conversations (match_id, user_a, user_b)
SELECT m.id, m.user_a, m.user_b FROM public.matches m
ON CONFLICT (match_id) DO NOTHING;

-- Enable realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
