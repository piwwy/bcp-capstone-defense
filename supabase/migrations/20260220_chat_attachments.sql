-- 1. I-update ang messages table para sa attachments
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- 2. Siguraduhin na ang profiles table ay may dpa_consented_at para sa modal natin
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dpa_consented_at TIMESTAMP WITH TIME ZONE;

-- 3. Mag-create ng Storage Policy para sa chat-attachments
-- Note: Make sure the 'chat-attachments' bucket exists in your Supabase Storage.
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('chat-attachments', 'chat-attachments', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

CREATE POLICY "Allow Authenticated Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Allow Public Read" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat-attachments');
