# Voice Platform Database Setup Guide

This guide will help you set up the complete database structure and seed data for your Voice Platform application after updating the database connection string.

## Overview

The Voice Platform uses PostgreSQL with the following main tables:
- **users** - User accounts with roles (contributor, reviewer, admin) and demographic information
- **recordings** - Voice recordings submitted by contributors
- **reviews** - Review decisions and feedback for recordings

## Files Included

### Core Setup Files
- `complete_database_setup.sql` - Complete SQL script with all tables, constraints, and sample data
- `setup_database.ps1` - PowerShell setup script for Windows
- `setup_database.bat` - Batch file setup script for Windows

### Mozilla Integration Files
- `populate_mozilla_sentences.js` - Node.js script to fetch and populate Mozilla statements
- `populate_sentences.ps1` - PowerShell script for sentence population
- `populate_sentences.bat` - Batch script for sentence population

### Master Automation Scripts
- `complete_setup.ps1` - Master PowerShell script (database + sentences)
- `complete_setup.bat` - Master batch script (database + sentences)

## Prerequisites

1. **PostgreSQL Client Tools**: Install PostgreSQL client tools to run the setup scripts
   - Download from: https://www.postgresql.org/download/
   - Ensure `psql` command is available in your PATH

2. **Database Connection**: Have your database connection details ready
   - Host/Server address
   - Port (usually 5432)
   - Username and password
   - Database name

## Setup Methods

### Method 1: Complete Automated Setup (Recommended) 

**🔄 Master PowerShell Script (Everything Automated):**
```powershell
.\complete_setup.ps1 -ConnectionString "postgresql://username:password@host:port/database" -DatabaseName "voice_platform" -Language "luo"
```

**🔄 Master Batch Script (Everything Automated):**
```cmd
complete_setup.bat luo 1000
```

**⚡ Quick Setup (Curated sentences only):**
```powershell
.\complete_setup.ps1 -QuickSetup -Language "luo"
```

### Method 2: Database Setup Only

**PowerShell (Database Tables Only):**
```powershell
.\setup_database.ps1 -ConnectionString "postgresql://username:password@host:port/database" -DatabaseName "voice_platform"
```

**Batch File (Database Tables Only):**
```cmd
setup_database.bat "postgresql://username:password@host:port/database" "voice_platform"
```

**Manual SQL Execution:**
```bash
psql "postgresql://username:password@host:port/database" -f complete_database_setup.sql
```

### Method 3: Mozilla Sentences Population Only

**From Mozilla API:**
```powershell
.\populate_sentences.ps1 -Command "mozilla" -Language "luo" -MaxSentences 1000
```

**Use Node.js Direct:**
```bash
node populate_mozilla_sentences.js mozilla luo 1000
```

### Method 4: Using Supabase Dashboard

If using Supabase:
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `complete_database_setup.sql`
4. Execute the query
5. Run the Mozilla population script separately

## Database Schema Details

### Users Table Features
- UUID primary keys for security
- Role-based access (contributor, reviewer, admin)
- Status management (active, pending, rejected)
- Demographic fields (age, gender, languages, location, etc.)
- Constituency field for geographic organization
- Phone number support
- Automatic timestamp management

### Recordings Table Features
- Voice recording metadata
- Audio URL and blob storage options
- Quality assessment (good, fair, poor)
- Review status tracking
- Flexible JSON metadata field

### Reviews Table Features
- Detailed review decisions
- Confidence scoring (0-100)
- Reviewer notes and time tracking
- Complete audit trail

### Sentences Table Features (NEW!)
- **Mozilla API Integration**: Stores sentences from Mozilla Common Voice API
- **Multi-language Support**: Supports various languages (Luo, English, etc.)
- **Flexible Content**: Includes source tracking, taxonomy, and metadata
- **Smart Analysis**: Automatic word count, character count, and difficulty assessment
- **Filtering & Search**: Full-text search capabilities and advanced filtering
- **Quality Control**: Validation status and clip availability tracking

## Sample Data Included

### Users Created
1. **Admin User**
   - Email: `admin@commonvoice.org`
   - Password: `admin123`
   - Role: Admin

2. **Active Reviewer**
   - Email: `reviewer@example.com`
   - Password: `reviewer123`
   - Role: Reviewer (active)

3. **Pending Reviewer**
   - Email: `pending@example.com`
   - Password: `pending123`
   - Role: Reviewer (pending)

4. **Contributor 1**
   - Email: `contributor@example.com`
   - Password: `contributor123`
   - Role: Contributor

5. **Contributor 2**
   - Email: `alice@example.com`
   - Password: `alice123`
   - Role: Contributor

### Sample Recordings
- Multiple recordings with different statuses (approved, rejected, pending)
- Reviews with detailed feedback and confidence scores
- Realistic metadata and timestamps

### Mozilla Sentences (NEW!)
- **API Integration**: Fetches live sentences from Mozilla Common Voice API
- **Multi-language**: Supports Luo, English, and other languages
- **Quality Filtered**: Only suitable sentences for voice recording
- **Categorized**: Basic, medium, and advanced difficulty levels
- **Comprehensive**: Thousands of sentences available for voice recording

## Verification

After running the setup, you can verify the installation by checking:

1. **Table Creation**: Verify all tables exist
2. **Sample Data**: Confirm users, recordings, and reviews were created
3. **Login Test**: Test logging in with the sample users

### Quick Verification Queries

```sql
-- Check table counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'recordings', COUNT(*) FROM recordings
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'sentences', COUNT(*) FROM sentences;

-- Check users by role
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- Check recording statuses
SELECT status, COUNT(*) as count FROM recordings GROUP BY status;

-- Check sentences by language and source
SELECT language_code, COUNT(*) as count FROM sentences GROUP BY language_code;
SELECT difficulty_level, COUNT(*) as count FROM sentences GROUP BY difficulty_level;

-- Show random sentences for testing
SELECT text, language_code, difficulty_level FROM sentences 
WHERE is_active = true 
ORDER BY RANDOM() 
LIMIT 5;
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify connection string format
   - Check if PostgreSQL server is running
   - Confirm database exists and user has permissions

2. **psql Command Not Found**
   - Install PostgreSQL client tools
   - Add PostgreSQL bin directory to your PATH

3. **Permission Denied**
   - Ensure user has CREATE privileges on the database
   - Check if user can create tables and insert data

4. **Schema Already Exists**
   - The script uses `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT DO NOTHING`
   - Safe to run multiple times

### Connection String Formats

**Standard PostgreSQL:**
```
postgresql://username:password@hostname:port/database
```

**Supabase:**
```
postgresql://postgres:[password]@[host]:5432/postgres
```

## Next Steps

After successful setup:

1. **Update Application Connection**: Ensure your application uses the new connection string
2. **Test Authentication**: Try logging in with the sample users
3. **Test Sentence Loading**: Visit `/speak` page to verify Mozilla sentences are loading
4. **Customize Data**: Modify demographic options, constituencies, or other fields as needed
5. **Production Considerations**: For production, consider:
   - Password hashing (currently uses plain text for demo)
   - Row Level Security policies
   - Backup strategies
   - Performance monitoring
   - **Mozilla API Rate Limiting**: Implement caching for sentence fetching
   - **Content Moderation**: Review imported sentences for appropriateness

## Security Notes

⚠️ **Important**: This setup uses plain text passwords for demonstration purposes only. In production:
- Implement proper password hashing (bcrypt, argon2, etc.)
- Use environment variables for sensitive data
- Implement Row Level Security (RLS) policies
- Regular security audits and backups

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your PostgreSQL installation and connectivity
3. Review the PostgreSQL logs for detailed error messages
4. Ensure you have the necessary permissions to create tables and insert data

---

**Setup completed successfully?** Your Voice Platform database is now ready to use! 🎉
