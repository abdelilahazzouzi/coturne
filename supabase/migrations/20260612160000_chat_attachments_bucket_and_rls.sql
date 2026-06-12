-- Migration to create secure private chat-attachments bucket and configure RLS
-- Allows authenticated users to upload and view attachments only if they are participants of the conversation.

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage.objects on the chat-attachments bucket

-- 1. SELECT policy: Allow conversation participants to read attachments
DROP POLICY IF EXISTS "chat-attachments select" ON storage.objects;
CREATE POLICY "chat-attachments select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  )
);

-- 2. INSERT policy: Allow conversation participants to upload attachments
DROP POLICY IF EXISTS "chat-attachments insert" ON storage.objects;
CREATE POLICY "chat-attachments insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  )
);

-- 3. DELETE policy: Allow users to delete their own uploaded attachments
DROP POLICY IF EXISTS "chat-attachments delete" ON storage.objects;
CREATE POLICY "chat-attachments delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND name IS NOT NULL
  AND auth.uid()::text = owner::text
);
