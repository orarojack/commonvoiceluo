@echo off
REM Batch script to set up Voice Platform database tables in Supabase
REM This script provides instructions for setting up tables in Supabase

echo.
echo ==================================================
echo Voice Platform Supabase Database Setup
echo ==================================================
echo.

REM Check if environment variables are set
if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo [ERROR] NEXT_PUBLIC_SUPABASE_URL environment variable not set
    echo Please set your Supabase URL and retry
    echo.
    echo Example: set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    pause
    exit /b 1
)

if "%NEXT_PUBLIC_SUPABASE_ANON_KEY%"=="" (
    echo [ERROR] NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable not set
    echo Please set your Supabase key and retry
    echo.
    echo Example: set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    pause
    exit /b 1
)

echo [INFO] Supabase URL: %NEXT_PUBLIC_SUPABASE_URL%
echo [INFO] Setting up database tables...
echo.

REM Generate the SQL setup file
echo Creating SQL setup file...

(
echo -- Complete Database Setup for Voice Platform ^(Supabase Compatible^)
echo -- Enable UUID extension ^(Supabase has this enabled by default^)
echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
echo.
echo -- Create users table with all fields
echo CREATE TABLE IF NOT EXISTS users ^(
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4^(^),
echo     email VARCHAR^(255^) UNIQUE NOT NULL,
echo     password VARCHAR^(255^) NOT NULL,
echo     role VARCHAR^(20^) NOT NULL CHECK ^(role IN ^('contributor', 'reviewer', 'admin'^)^),
echo     status VARCHAR^(20^) NOT NULL DEFAULT 'active' CHECK ^(status IN ^('active', 'pending', 'rejected'^)^),
echo     profile_complete BOOLEAN DEFAULT FALSE,
echo     name VARCHAR^(255^),
echo     age VARCHAR^(20^),
echo     gender VARCHAR^(50^),
echo     languages TEXT[],
echo     location VARCHAR^(100^),
echo     language_dialect VARCHAR^(50^) CHECK ^(language_dialect IN ^('Milambo', 'Nyanduat'^)^),
echo     educational_background VARCHAR^(50^) CHECK ^(educational_background IN ^('primary', 'secondary', 'tertiary', 'graduate', 'postgraduate'^)^),
echo     employment_status VARCHAR^(50^) CHECK ^(employment_status IN ^('employed', 'self-employed', 'unemployed', 'student'^)^),
echo     phone_number VARCHAR^(20^),
echo     constituency TEXT,
echo     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
echo     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
echo     last_login_at TIMESTAMP WITH TIME ZONE,
echo     is_active BOOLEAN DEFAULT TRUE
echo ^);
echo.
echo -- Create recordings table
echo CREATE TABLE IF NOT EXISTS recordings ^(
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4^(^),
echo     user_id UUID NOT NULL REFERENCES users^(id^) ON DELETE CASCADE,
echo     sentence TEXT NOT NULL,
echo     audio_url TEXT NOT NULL,
echo     audio_blob TEXT,
echo     duration DECIMAL^(5,2^) NOT NULL,
echo     status VARCHAR^(20^) NOT NULL DEFAULT 'pending' CHECK ^(status IN ^('pending', 'approved', 'rejected'^)^),
echo     reviewed_by UUID REFERENCES users^(id^),
echo     reviewed_at TIMESTAMP WITH TIME ZONE,
echo     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
echo     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
echo     quality VARCHAR^(20^) DEFAULT 'good' CHECK ^(quality IN ^('good', 'fair', 'poor'^)^),
echo     metadata JSONB DEFAULT '{}'
echo ^);
echo.
echo -- Create reviews table
echo CREATE TABLE IF NOT EXISTS reviews ^(
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4^(^),
echo     recording_id UUID NOT NULL REFERENCES recordings^(id^) ON DELETE CASCADE,
echo     reviewer_id UUID NOT NULL REFERENCES users^(id^) ON DELETE CASCADE,
echo     decision VARCHAR^(20^) NOT NULL CHECK ^(decision IN ^('approved', 'rejected'^)^),
echo     notes TEXT,
echo     confidence INTEGER NOT NULL CHECK ^(confidence >= 0 AND confidence <= 100^),
echo     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
echo     time_spent INTEGER NOT NULL DEFAULT 0
echo ^);
echo.
echo -- Create sentences table for Mozilla API statements
echo CREATE TABLE IF NOT EXISTS sentences ^(
echo     id UUID PRIMARY KEY DEFAULT uuid_generate_v4^(^),
echo     mozilla_id VARCHAR^(50^) UNIQUE NOT NULL,
echo     text TEXT NOT NULL,
echo     language_code VARCHAR^(10^) NOT NULL DEFAULT 'luo',
echo     source VARCHAR^(100^),
echo     bucket VARCHAR^(100^),
echo     hash VARCHAR^(100^),
echo     version INTEGER DEFAULT 1,
echo     clips_count INTEGER DEFAULT 0,
echo     has_valid_clip BOOLEAN DEFAULT FALSE,
echo     is_validated BOOLEAN DEFAULT FALSE,
echo     taxonomy JSONB DEFAULT '{}',
echo     metadata JSONB DEFAULT '{}',
echo     is_active BOOLEAN DEFAULT TRUE,
echo     difficulty_level VARCHAR^(20^) DEFAULT 'medium' CHECK ^(difficulty_level IN ^('basic', 'medium', 'advanced'^)^),
echo     word_count INTEGER,
echo     character_count INTEGER,
echo     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
echo     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^),
echo     imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^)
echo ^);
echo.
echo -- =============================================
echo -- CREATE INDEXES FOR PERFORMANCE
echo -- =============================================
echo.
echo CREATE INDEX IF NOT EXISTS idx_users_email ON users^(email);
echo CREATE INDEX IF NOT EXISTS idx_users_role ON users^(role);
echo CREATE INDEX IF NOT EXISTS idx_users_status ON users^(status);
echo CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings^(user_id);
echo CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings^(status);
echo CREATE INDEX IF NOT EXISTS idx_reviews_recording_id ON reviews^(recording_id);
echo CREATE INDEX IF NOT EXISTS idx_sentences_language_code ON sentences^(language_code);
echo CREATE INDEX IF NOT EXISTS idx_sentences_is_active ON sentences^(is_active);
echo.
echo -- =============================================
echo -- SEED SAMPLE DATA
echo -- =============================================
echo.
echo INSERT INTO users ^(email, password, role, status, profile_complete, name, is_active, location, employment_status, educational_background^)
echo VALUES ^(
echo     'admin@commonvoice.org',
echo     'admin123',
echo     'admin',
echo     'active',
echo     true,
echo     'System Admin',
echo     true,
echo     'Nairobi',
echo     'employed',
echo     'postgraduate'
echo ^) ON CONFLICT ^(email^) DO NOTHING;
echo.
echo INSERT INTO users ^(email, password, role, status, profile_complete, name, age, gender, languages, last_login_at, is_active, location, employment_status, educational_background^)
echo VALUES ^(
echo     'contributor@example.com',
echo     'contributor123',
echo     'contributor',
echo     'active',
echo     true,
echo     'Jane Contributor',
echo     '20-29',
echo     'female',
echo     ARRAY['English'],
echo     NOW^(^),
echo     true,
echo     'Kisumu',
echo     'student',
echo     'secondary'
echo ^) ON CONFLICT ^(email^) DO NOTHING;
echo.
echo SELECT 'Voice Platform database setup completed!' as status;
) > voice_platform_setup.sql

echo [SUCCESS] SQL setup file created: voice_platform_setup.sql
echo.

REM Extract project reference from URL
for /f "tokens=1 delims=." %%a in ("%NEXT_PUBLIC_SUPABASE_URL:https://=_%") do set PROJECT_REF=%%a

echo ============================================
echo Next Steps for Supabase Setup:
echo ============================================
echo.
echo 1. Go to your Supabase dashboard
echo    URL: https://supabase.com/dashboard
echo.
echo 2. Navigate to your project: %PROJECT_REF%
echo.
echo 3. Go to the SQL Editor (left sidebar)
echo.
echo 4. Create a new query and paste the contents of:
echo    %CD%\voice_platform_setup.sql
echo.
echo 5. Click 'Run' to execute the setup
echo.
echo 6. Verify tables were created by running this query:
echo    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
echo.

REM Ask if user wants to open the SQL file
set /p OPEN_FILE="Would you like to open the SQL file now? (y/n): "
if /i "%OPEN_FILE%"=="y" (
    echo Opening SQL file...
    notepad voice_platform_setup.sql
)

echo.
echo ============================================
echo Sample accounts that will be created:
echo ============================================
echo   Admin: admin@commonvoice.org / admin123
echo   Contributor: contributor@example.com / contributor123
echo.
echo ============================================
echo Voice Platform database setup instructions
echo completed successfully!
echo ============================================
echo.

pause
