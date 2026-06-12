
CREATE TYPE public.viewing_status AS ENUM ('proposed','accepted','declined','cancelled');

CREATE TABLE public.viewings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  place_id uuid REFERENCES public.places(id) ON DELETE SET NULL,
  proposed_by uuid NOT NULL,
  proposed_for timestamptz NOT NULL,
  status public.viewing_status NOT NULL DEFAULT 'proposed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_viewings_conversation ON public.viewings(conversation_id);

ALTER TABLE public.viewings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "viewings select participants" ON public.viewings
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c
    WHERE c.id = viewings.conversation_id
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b))
);

CREATE POLICY "viewings insert participants" ON public.viewings
FOR INSERT TO authenticated WITH CHECK (
  proposed_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.conversations c
    WHERE c.id = viewings.conversation_id
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b))
);

CREATE POLICY "viewings update participants" ON public.viewings
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c
    WHERE c.id = viewings.conversation_id
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations c
    WHERE c.id = viewings.conversation_id
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b))
);

CREATE TRIGGER viewings_touch_updated_at
  BEFORE UPDATE ON public.viewings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TYPE public.message_kind ADD VALUE IF NOT EXISTS 'viewing';
