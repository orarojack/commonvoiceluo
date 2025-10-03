# Voice Platform Supabase Database Setup

This guide will help you set up your Voice Platform database tables in Supabase.

## Quick Setup Methods

### Method 1: PowerShell Script (Recommended)
```powershell
# Make sure your environment variables are set first
$env:NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-supabase-anon-key"

# Run the setup script
.\setup_supabase_tables.ps1 -SupabaseMode
```

### Method 2: Batch Script
```cmd
REM Set environment variables first
set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

REM Run the setup script
setup_supabase_database.bat
```

### Method 3: Node.js Script
```bash
# Set environment variables first
$env:NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Run the Node.js setup script
node setup_supabase_database.js
```

## Manual Setup (Supabase Dashboard)

If you prefer to set up manually via the Supabase dashboard:

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Sign in to your account

2. **Select Your Project**
   - Choose the project where you want to set up the tables

3. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar

4. **Create New Query**
   - Click "New query" button
   - Paste the contents from `complete_database_setup.sql`

5. **Execute Setup**
   - Click the "Run" button to execute all SQL commands

6. **Verify Setup**
   - Run this query to verify tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```

## Environment Variables Required

Make sure these environment variables are set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these values in your Supabase project settings under "API".

## Tables Created

The setup creates the following tables:

### 1. `users`
- User accounts with roles (contributor, reviewer, admin)
- Demographic information (age, gender, languages, etc.)
- Connection details (location, constituency, phone, etc.)

### 2. `recordings`
- Voice recordings submitted by contributors
- Audio metadata and URLs
- Review status and quality assessment

### 3. `reviews`
- Detailed review information for recordings
- Reviewer decisions and feedback
- Confidence scores and time tracking

### 4. `sentences`
- Sentences from Mozilla Common Voice API
- Multi-language support with difficulty levels
- Full-text search capabilities

## Sample Data

The setup includes sample accounts:

- **Admin**: `admin@{commonvoice.org` / `admin123`
- **Reviewer**: `reviewer@example.com` / `reviewer123`
- **Contributor**: `contributor@example.com` / `contributor123`
- **Contributor**: `alice@example.com` / `alice123`

## Verification

After setup, verify your database by running these queries in the Supabase SQL Editor:

```sql
-- Check table counts
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'recordings', COUNT(*) FROM recordings
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'sentences', COUNT(*) FROM sentences;

-- Check users by role
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- Check recordings by status
SELECT status, COUNT(*) as count FROM recordings GROUP BY status;
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   ```
   Error: NEXT_PUBLIC_SUPABASE_URL environment variable not set
   ```
   **Solution**: Set the required environment variables before running the script

2. **Connection Issues**
   ```
   Error: Could not connect to Supabase
   ```
   **Solution**: Verify your Supabase URL and API key are correct

3. **Permission Denied**
   ```
   Error: Permission denied to create tables
   ```
   **Solution**: Ensure you're using the correct API key with sufficient permissions

4. **Tables Already Exist**
   ```
   Error: relation "users" already exists
   ```
   **Solution**: This is normal - the script uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times

### Manual Database Query

If automated setup fails, you can manually execute the SQL:

1. Copy the contents of `complete_database_setup.sql`
2. Paste into Supabase SQL Editor
3. Run the query step by step if needed

## Next Steps

After successful database setup:

1. **Test Application**: Start your Voice Platform application and test login functionality
2. **Verify Pages**: Visit different pages (speak, listen, dashboard) to ensure everything works
3. **Check Data**: Verify that sample data appears correctly in the application

## Security Notes

⚠️ **Important**: The sample accounts use plain text passwords for demonstration only. In production:

- Implement proper password hashing (bcrypt, argon2, etc.)
- Use environment variables for sensitive data
- Implement Row Level Security (RLS) policies
- Regular security audits and backups

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your Supabase project is active and accessible
3. Review the Supabase console logs for detailed error messages
4. Ensure you have the necessary permissions to create tables and insert data

---

**Success!** Your Voice Platform database should now be ready to use! 🎉
