# Common Voice Luo - Login Setup Guide

## Issues Fixed
✅ **Removed Google OAuth functionality** - Google login buttons and methods have been completely removed from:
- Sign-in page (`app/auth/signin/page.tsx`)
- Sign-up page (`app/auth/signup/page.tsx`) 
- Auth provider (`components/auth-provider.tsx`)

## Current Login System
The application now uses a **custom database authentication system** with Supabase as the backend database.

## Required Setup

### 1. Create Environment File
Create a `.env.local` file in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Get Supabase Credentials
1. Go to [Supabase](https://supabase.com) and sign in
2. Create a new project or select existing one
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key
5. Replace the placeholder values in your `.env.local` file

### 3. Set Up Database
Run these SQL scripts in your Supabase SQL editor:
1. `scripts/001_create_tables.sql` - Creates the database tables
2. `scripts/002_seed_data.sql` - Adds test users and sample data

### 4. Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

## Test Credentials
After running the seed data script, you can use:

- **Contributor**: `contributor@example.com` / `contributor123`
- **Reviewer**: `reviewer@example.com` / `reviewer123`  
- **Admin**: `admin@commonvoice.org` / `admin123`
- **Pending Reviewer**: `pending@example.com` / `pending123`

## What Was Removed
- Google OAuth login buttons
- Google OAuth authentication methods
- Google OAuth error handling
- References to `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Current Authentication Flow
1. User enters email → validates format
2. User enters password → validates against database
3. System checks user status (active/pending/rejected)
4. Redirects based on role and profile completion:
   - Contributors → `/speak`
   - Reviewers → `/listen`
   - Incomplete profiles → `/profile/setup`

The login system should now work properly once Supabase is configured!
