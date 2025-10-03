# Common Voice Luo

A voice contribution and validation platform built with Next.js, Supabase, and TypeScript.

## Features

- User authentication (email/password)
- Voice recording and validation
- Admin dashboard with analytics
- User management
- Profile setup and management

## Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration (Optional - currently disabled)
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## Google OAuth Setup (Currently Disabled)

Google OAuth functionality has been removed from this application. The platform now uses email/password authentication only.

### Vercel Deployment Setup

1. **Add environment variables to Vercel:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to "Settings" → "Environment Variables"
   - Add the following variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     # NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
     ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

### 3. Database Setup

Run the database setup scripts in the `scripts/` directory:

```bash
# Run the scripts in order
psql -h your_supabase_host -U postgres -d postgres -f scripts/001_create_tables.sql
psql -h your_supabase_host -U postgres -d postgres -f scripts/002_seed_data.sql
psql -h your_supabase_host -U postgres -d postgres -f scripts/003_setup_storage.sql
```

### 4. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication

The platform supports email/password authentication:

1. **Email/Password**: Traditional authentication using email and password
2. **User Registration**: Users can create accounts with email and password
3. **Role-based Access**: Contributors, Reviewers, and Admins with different permissions

### Authentication Flow

1. User enters email and password
2. System validates credentials against database
3. Redirects based on user role:
   - Contributors → `/speak` (record voice samples)
   - Reviewers → `/listen` (review recordings)
   - Admins → `/admin` (admin dashboard)
   - Incomplete profiles → `/profile/setup`

## Admin Access

Default admin credentials:
- Email: `admin@commonvoice.org`
- Password: `admin123`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. 