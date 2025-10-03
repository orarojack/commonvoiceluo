# Supabase Setup Guide

## Issue
The dashboard is loading indefinitely because Supabase environment variables are not configured.

## Solution

### 1. Create Environment File
Create a `.env.local` file in the project root directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Get Your Supabase Credentials

1. Go to [Supabase](https://supabase.com) and sign in
2. Create a new project or select an existing one
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key
5. Replace the placeholder values in your `.env.local` file

### 3. Set Up Database Tables

Run these SQL scripts in your Supabase SQL editor:

1. **Create tables**: Run `scripts/001_create_tables.sql`
2. **Seed data**: Run `scripts/002_seed_data.sql`
3. **Fix audio URL field**: Run `scripts/005_fix_audio_url_field.sql`

### 4. Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart it
pnpm dev
```

### 5. Test the Dashboard

Navigate to the dashboard page. It should now load properly without infinite loading.

## Troubleshooting

- **Still loading**: Check browser console for errors
- **Database errors**: Ensure all SQL scripts have been run
- **Environment variables**: Make sure `.env.local` is in the project root
- **Restart required**: Environment variables require a server restart

## Default Test Credentials

After running the seed data script, you can use these test accounts:

- **Contributor**: `contributor@example.com` / `password123`
- **Reviewer**: `reviewer@example.com` / `password123`
- **Admin**: `admin@commonvoice.org` / `admin123` 