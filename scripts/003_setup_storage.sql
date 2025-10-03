-- Create storage bucket for audio recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own audio files" ON storage.objects;

-- Create storage policy to allow authenticated users to upload audio files
CREATE POLICY "Allow authenticated users to upload audio files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audio-recordings' 
  AND auth.role() = 'authenticated'
);

-- Create storage policy to allow public read access to audio files
CREATE POLICY "Allow public read access to audio files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio-recordings'
);

-- Create storage policy to allow users to update their own audio files
CREATE POLICY "Allow users to update their own audio files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'audio-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policy to allow users to delete their own audio files
CREATE POLICY "Allow users to delete their own audio files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'audio-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 