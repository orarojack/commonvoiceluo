# Audio Storage Setup Guide

This guide explains how to set up audio file storage for the voice platform so that reviewers can hear the recordings made by contributors.

## Prerequisites

1. Supabase project with Storage enabled
2. Database tables already created (run `001_create_tables.sql` and `002_seed_data.sql`)

## Setup Steps

### 1. Database Migration (Required)

First, run the database migration to fix the audio_url field:

```sql
-- Run scripts/005_fix_audio_url_field.sql in your Supabase SQL editor
-- This changes audio_url from VARCHAR(500) to TEXT to handle data URLs
```

### 2. Enable Supabase Storage (Optional)

1. Go to your Supabase dashboard
2. Navigate to Storage in the left sidebar
3. Make sure Storage is enabled for your project

### 3. Create Storage Bucket (Optional)

If you want to use Supabase Storage instead of data URLs, run:

```sql
-- Run scripts/003_setup_storage.sql in your Supabase SQL editor
-- This script creates the audio-recordings bucket and sets up proper policies
```

### 3. Configure Storage Policies

The script above creates the following policies:

- **Upload Policy**: Authenticated users can upload audio files
- **Read Policy**: Public read access to audio files (so reviewers can play them)
- **Update Policy**: Users can update their own audio files
- **Delete Policy**: Users can delete their own audio files

### 4. Environment Variables

Make sure your environment variables are properly set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Current Implementation

### Data URL Approach (Currently Active)

Due to RLS policy issues with Supabase Storage, the current implementation uses a **data URL approach**:

1. **Recording Process (Contributors)**:
   - User records audio using the browser's MediaRecorder API
   - Audio is converted to a Blob object
   - Blob is converted to a data URL (base64 encoded)
   - Data URL is stored directly in the database
   - No external storage required

2. **Playback Process (Reviewers)**:
   - Reviewer loads pending recordings from the database
   - Audio data URL is retrieved from the recording record
   - Audio element is created with the data URL
   - Reviewer can play/pause the actual audio file

### Supabase Storage Approach (Alternative)

For production use with proper storage, follow these steps:

1. **Recording Process (Contributors)**:
   - User records audio using the browser's MediaRecorder API
   - Audio is converted to a Blob object
   - Blob is uploaded to Supabase Storage in the `audio-recordings` bucket
   - File path follows the pattern: `recordings/{user_id}/{timestamp}.wav`
   - Public URL is generated and stored in the database

2. **Playback Process (Reviewers)**:
   - Reviewer loads pending recordings from the database
   - Audio URL is retrieved from the recording record
   - Audio element is created with the public URL
   - Reviewer can play/pause the actual audio file

## File Structure

```
audio-recordings/
├── recordings/
│   ├── user_id_1/
│   │   ├── 1703123456789.wav
│   │   └── 1703123456790.wav
│   └── user_id_2/
│       └── 1703123456791.wav
```

## Troubleshooting

### Common Issues

1. **"new row violates row-level security policy" error**
   - This is the most common issue with Supabase Storage
   - Run the alternative setup script: `scripts/004_alternative_storage_setup.sql`
   - Or use the data URL approach (currently implemented in the code)
   - Check that RLS policies are properly configured

2. **"No audio file available" error**
   - Check if the audio file was uploaded successfully
   - Verify the storage bucket exists and is public
   - Check browser console for upload errors

3. **Audio won't play**
   - Ensure the audio URL is accessible (try opening in new tab)
   - Check if the file format is supported by the browser
   - Verify CORS settings in Supabase

4. **Upload fails**
   - Check file size (limit is 50MB)
   - Verify file format is allowed (wav, mp3, mpeg, ogg, webm)
   - Ensure user is authenticated

### Debug Steps

1. Check browser console for errors
2. Verify Supabase Storage bucket exists
3. Test file upload manually in Supabase dashboard
4. Check network tab for failed requests

## Security Considerations

- Audio files are stored in a public bucket for easy access
- Files are organized by user ID for potential future access control
- File size is limited to 50MB
- Only authenticated users can upload files
- Users can only update/delete their own files

## Performance Notes

- Audio files are preloaded with metadata for faster playback
- Files are cached for 1 hour (3600 seconds)
- Consider implementing audio compression for large files
- Monitor storage usage as the platform grows 