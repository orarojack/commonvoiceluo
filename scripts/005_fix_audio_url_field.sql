-- Fix audio_url field to handle longer data URLs
-- Data URLs can be very long (base64 encoded audio), so we need a larger field

-- Update the audio_url field to TEXT instead of VARCHAR(500)
ALTER TABLE recordings ALTER COLUMN audio_url TYPE TEXT;

-- Add a comment to explain the change
COMMENT ON COLUMN recordings.audio_url IS 'Audio URL or data URL (base64 encoded audio data) - can be very long'; 