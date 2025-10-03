# Voice Platform Supabase Database Setup - FINAL INSTRUCTIONS

## ✅ Setup Files Ready

All database setup files have been created and are ready to use:

- ✅ `setup_supabase_database.ps1` - PowerShell setup script
- ✅ `setup_supabase_database.bat` - Batch file setup script  
- ✅ `setup_supabase_database.js` - Node.js setup script
- ✅ `complete_database_setup.sql` - Complete SQL setup file
- ✅ `verify_database_setup.js` - Verification script
- ✅ `SUPABASE_SETUP_README.md` - Detailed documentation
- ✅ `lib/supabase.ts` - Updated TypeScript types

## 🚀 NEXT STEPS TO COMPLETE SETUP

### Step 1: Get Your Supabase Credentials
You need to get these from your Supabase project:

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your Voice Platform project
3. Go to **Settings** → **API**
4. Copy these two values:
   - `URL` (something like `https://your-project.supabase.co`)
   - `anon public` key (long string starting with `eyJ...`)

### Step 2: Choose Your Setup Method

#### Method A: Using PowerShell (Recommended)
```powershell
# Set your Supabase credentials
$env:NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key-here"

# Run the setup script
.\setup_supabase_database.ps1 -SupabaseMode
```

#### Method B: Using Batch File
```cmd
# Set environment variables
set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Run the batch file
setup_supabase_database.bat
```

#### Method C: Manual Setup via Supabase Dashboard
1. Open your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Create a **New query**
4. Copy all content from `complete_database_setup.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute

### Step 3: Verify Setup
After running the setup, verify it worked:

```bash
# Run verification script
node verify_database_setup.js
```

Or check manually in Supabase SQL Editor:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check sample data
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'recordings', COUNT(*) FROM recordings
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'sentences', COUNT(*) FROM sentences;
```

## 📊 What Gets Created

### Tables:
- `users` - User accounts with roles (contributor, reviewer, admin)
- `recordings` - Voice recordings submitted by contributors  
- `reviews` - Review decisions and feedback
- `sentences` - Mozilla Common Voice sentences

### Sample Data:
- **5 users** (1 admin, 2 reviewers, 2 contributors)
- **5 recordings** with different statuses
- **4 reviews** with feedback
- **Proper indexes** for performance
- **Triggers** for automatic timestamp updates

### Sample Accounts:
- Admin: `admin@commonvoice.org` / `admin123`
- Reviewer: `reviewer@example.com` / `reviewer123`  
- Contributor: `contributor@example.com` / `contributor123`
- Contributor: `alice@example.com` / `alice123`

## 🎯 After Setup Completion

1. **Test your application**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or  
   pnpm dev
   ```

2. **Try logging in** with the sample accounts

3. **Visit different pages** to verify functionality:
   - `/` - Home page
   - `/speak` - Record voice sentences
   - `/listen` - Review recordings
   - `/dashboard` - User dashboard
   - `/profile` - User profile

4. **Check that data appears correctly** in each section

## 🔧 Troubleshooting

### If Setup Scripts Don't Work:
- Use **Method C** (Manual SQL execution) instead
- Copy `complete_database_setup.sql` content directly to Supabase dashboard

### If You Get Permission Errors:
- Make sure you're using the correct Supabase URL and API key
- Verify your Supabase project is accessible
- Check that you have owner/admin permissions on the project

### If Tables Already Exist:
- **Safe to run multiple times** - scripts use "IF NOT EXISTS" clauses
- No data will be lost if you re-run the setup

## 📞 Support

If you encounter any issues:

1. Check the detailed `SUPABASE_SETUP_README.svg` file
2. Try the manual SQL execution method
3. Verify your Supabase credentials are correct
4. Make sure your Supabase project is active and accessible

---

**You're all set!** Your Voice Platform database setup is ready to go - just follow one of the methods above to complete the setup in Supabase. 🚀
