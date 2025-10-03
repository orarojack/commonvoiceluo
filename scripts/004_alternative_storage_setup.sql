-- Alternative Storage Setup for Audio Recordings
-- This script provides multiple approaches to handle RLS policy issues

-- Approach 1: Create bucket without RLS (simplest)
-- Uncomment the following lines if you want to disable RLS entirely
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm']
) ON CONFLICT (id) DO NOTHING;

-- Disable RLS on the bucket
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
*/

-- Approach 2: Create bucket with permissive RLS policies
-- This is the recommended approach for production
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm']
) ON CONFLICT (id) DO NOTHING;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own audio files" ON storage.objects;

-- Create very permissive policies for development
CREATE POLICY "Allow all authenticated operations" ON storage.objects
FOR ALL USING (
  bucket_id = 'audio-recordings' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audio-recordings'
);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Approach 3: Create a service role function for uploads
-- This creates a function that can be called with elevated privileges
CREATE OR REPLACE FUNCTION upload_audio_file(
  file_name text,
  file_data bytea,
  content_type text DEFAULT 'audio/wav'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_url text;
BEGIN
  -- Insert the file into storage
  INSERT INTO storage.objects (
    bucket_id,
    name,
    owner,
    metadata,
    media_type
  ) VALUES (
    'audio-recordings',
    file_name,
    auth.uid(),
    jsonb_build_object('size', octet_length(file_data)),
    content_type
  );
  
  -- Return the public URL
  SELECT storage.get_public_url('audio-recordings', file_name) INTO file_url;
  RETURN file_url;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upload_audio_file TO authenticated;

-- Create a function to get public URLs
CREATE OR REPLACE FUNCTION get_audio_url(file_name text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT storage.get_public_url('audio-recordings', file_name);
$$;

GRANT EXECUTE ON FUNCTION get_audio_url TO authenticated; 