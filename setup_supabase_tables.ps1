# PowerShell Script to Set Up Voice Platform Database Tables in Supabase
# This script creates all necessary tables, indexes, triggers, and sample data

param(
    [string]$ConnectionString = "",
    [string]$DatabaseName = "voice_platform",
    [switch]$SupabaseMode = $false,
    [string]$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL,
    [string]$SupabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
)

Write-Host "🚀 Voice Platform Supabase Database Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if we're in Supabase mode
if ($SupabaseMode -or ($SupabaseUrl -and $SupabaseKey)) {
    Write-Host "✨ Setting up Supabase database..." -ForegroundColor Green
    
    # Validate required environment variables
    if (-not $SupabaseUrl) {
        Write-Host "❌ Error: NEXT_PUBLIC_SUPABASE_URL environment variable not set" -ForegroundColor Red
        Write-Host "Please set your Supabase URL and retry" -ForegroundColor Yellow
        exit 1
    }
    
    if (-not $SupabaseKey) {
        Write-Host "❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable not set" -ForegroundColor Red
        Write-Host "Please set your Supabase key and retry" -ForegroundColor Yellow
        exit 1
    }
    
    SetUpSupabaseTables -SupabaseUrl $SupabaseUrl -SupabaseKey $SupabaseKey
    return
}

# Standard PostgreSQL setup (legacy)
if (-not $ConnectionString) {
    Write-Host "❌ Error: Connection string required for PostgreSQL setup" -ForegroundColor Red
    Write-Host "Usage: .\setup_supabase_tables.ps1 -ConnectionString 'postgresql://user:pass@host:port/db'" -ForegroundColor Yellow
    Write-Host "Or for Supabase: .\setup_supabase_tables.ps1 -SupabaseMode" -ForegroundColor Yellow
    exit 1
}

Write-Host "📡 Connecting to database: $DatabaseName" -ForegroundColor Yellow

function SetUpSupabaseTables {
    param(
        [string]$SupabaseUrl,
        [string]$SupabaseKey
    )
    
    Write-Host "🔧 Creating Supabase setup script..." -ForegroundColor Green
    
    # Read the existing complete database setup SQL
    $sqlContent = Get-Content -Path "complete_database_setup.sql" -Raw -ErrorAction SilentlyContinue
    
    if (-not $sqlContent) {
        Write-Host "⚠️  complete_database_setup.sql not found, creating comprehensive SQL..." -ForegroundColor Yellow
        
        # Create the complete SQL setup inline if file doesn't exist
        $sqlContent = @"
-- Complete Database Setup for Voice Platform (Supabase Compatible)
-- Enable UUID extension (Supabase has this enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CREATE MAIN TABLES
-- =============================================

-- Create users table with all fields
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('contributor', 'reviewer', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected')),
    profile_complete BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    age VARCHAR(20),
    gender VARCHAR(50),
    languages TEXT[],
    location VARCHAR(100),
    language_dialect VARCHAR(50) CHECK (language_dialect IN ('Milambo', 'Nyanduat')),
    educational_background VARCHAR(50) CHECK (educational_background IN ('primary', 'secondary', 'tertiary', 'graduate', 'postgraduate')),
    employment_status VARCHAR(50) CHECK (employment_status IN ('employed', 'self-employed', 'unemployed', 'student')),
    phone_number VARCHAR(20),
    constituency TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sentence TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    audio_blob TEXT,
    duration DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'reested')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quality VARCHAR(20) DEFAULT 'good' CHECK (quality IN ('good', 'fair', 'poor')),
    metadata JSONB DEFAULT '{}'
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected')),
    notes TEXT,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent INTEGER NOT NULL DEFAULT 0
);

-- Create sentences table for Mozilla API statements
CREATE TABLE IF NOT EXISTS sentences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mozilla_id VARCHAR(50) UNIQUE NOT NULL,
    text TEXT NOT NULL,
    language_code VARCHAR(10) NOT NULL DEFAULT 'luo',
    source VARCHAR(100),
    bucket VARCHAR(100),
    hash VARCHAR(100),
    version INTEGER DEFAULT 1,
    clips_count INTEGER DEFAULT 0,
    has_valid_clip BOOLEAN DEFAULT FALSE,
    is_validated BOOLEAN DEFAULT FALSE,
    taxonomy JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('basic', 'medium', 'advanced')),
    word_count INTEGER,
    character_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);
CREATE INDEX IF NOT EXISTS idx_users_language_dialect ON users(language_dialect);
CREATE INDEX IF NOT EXISTS idx_users_educational_background ON users(educational_background);
CREATE INDEX IF NOT EXISTS idx_users_employment_status ON users(employment_status);
CREATE INDEX IF NOT EXISTS idx_users_constituency ON users(constituency);

-- Recording indexes
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
CREATE INDEX IF NOT EXISTS idx_recordings_reviewed_by ON recordings(reviewed_by);

-- Review indexes
CREATE INDEX IF NOT EXISTS idx_reviews_recording_id ON reviews(recording_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

-- Sentences indexes
CREATE INDEX IF NOT EXISTS idx_sentences_mozilla_id ON sentences(mozilla_id);
CREATE INDEX IF NOT EXISTS idx_sentences_language_code ON sentences(language_code);
CREATE INDEX IF NOT EXISTS idx_sentences_is_active ON sentences(is_active);
CREATE INDEX IF NOT EXISTS idx_sentences_difficulty_level ON sentences(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_sentences_source ON sentences(source);
CREATE INDEX IF NOT EXISTS idx_sentences_text_search ON sentences USING gin(to_tsvector('english', text));

-- =============================================
-- CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recordings_updated_at ON recordings;
CREATE TRIGGER update_recordings_updated_at 
    BEFORE UPDATE ON recordings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sentences_updated_at ON sentences;
CREATE TRIGGER update_sentences_updated_at 
    BEFORE UPDATE ON sentences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED INITIAL DATA
-- =============================================

-- Insert default admin user
INSERT INTO users (email, password, role, status, profile_complete, name, is_active, location, employment_status, educational_background)
VALUES (
    'admin@commonvoice.org',
    'admin123',
    'admin',
    'active',
    true,
    'System Admin',
    true,
    'Nairobi',
    'employed',
    'postgraduate'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample reviewer
INSERT INTO users (email, password, role, status, profile_complete, name, age, gender, languages, last_login_at, is_active, location, language_dialect, employment_status, educational_background, constituency)
VALUES (
    'reviewer@example.com',
    'reviewer123',
    'reviewer',
    'active',
    true,
    'John Reviewer',
    '30-39',
    'male',
    ARRAY['English', 'Spanish'],
    NOW(),
    true,
    'Nakuru',
    'Milambo',
    'employed',
    'graduate',
    'Nakuru Town East'
) ON CONFLICT (email) DO NOTHING;

-- Insert pending reviewer
INSERT INTO users (email, password, role, status, profile_complete, name, age, gender, languages, is_active, location, employment_status, educational_background)
VALUES (
    'pending@example.com',
    'pending123',
    'reviewer',
    'pending',
    true,
    'Pending Reviewer',
    '25-29',
    'female',
    ARRAY['English'],
    false,
    'Mombasa',
    'self-employed',
    'tertiary'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample contributor 1
INSERT INTO users (email, password, role, status, profile_complete, name, age, gender, languages, last_login_at, is_active, location, language_dialect, employment_status, educational_background, constituency, phone_number)
VALUES (
    'contributor@example.com',
    'contributor123',
    'contributor',
    'active',
    true,
    'Jane Contributor',
    '20-29',
    'female',
    ARRAY['English', 'French'],
    NOW(),
    true,
    'Kisumu',
    'Nyanduat',
    'student',
    'secondary',
    'Kisumu Central',
    '+254712345678'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample contributor 2
INSERT INTO users (email, password, role, status, profile_complete, name, age, gender, languages, last_login_at, is_active, location, employment_status, educational_background, phone_number)
VALUES (
    'alice@example.com',
    'alice123',
    'contributor',
    'active',
    true,
    'Alice Johnson',
    '30-39',
    'female',
    ARRAY['English'],
    NOW() - INTERVAL '1 day',
    true,
    'Eldoret',
    'unemployed',
    'graduate',
    '+254798765432'
) ON CONFLICT (email) DO NOTHING;

-- =============================================
-- SEED SAMPLE RECORDINGS
-- =============================================

-- Sample recording 1
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, quality, metadata)
SELECT 
    u.id,
    'The quick brown fox jumps over the lazy dog.',
    '/audio/sample1.mp3',
    3.2,
    'approved',
    'good',
    '{"deviceType": "desktop", "browserType": "chrome"}'::jsonb
FROM users u
WHERE u.email = 'contributor@example.com' AND NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'The quick brown fox jumps over the lazy dog.'
);

-- Sample recording 2
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, quality, metadata)
SELECT 
    u.id,
    'A journey of a thousand miles begins with a single step.',
    '/audio/sample2.mp3',
    4.1,
    'rejected',
    'poor',
    '{"deviceType": "mobile", "browserType": "safari"}'::jsonb
FROM users u
WHERE u.email = 'contributor@example.com' AND NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'A journey of a thousand miles begins with a single step.'
);

-- Sample recording 3
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, quality, metadata)
SELECT 
    u.id,
    'To be or not to be, that is the question.',
    '/audio/sample3.mp3',
    2.8,
    'pending',
    'good',
    '{"deviceType": "desktop", "browserType": "firefox"}'::jsonb
FROM users u
WHERE u.email = 'alice@example.com' AND NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'To be or not to be, that is the question.'
);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Show table counts
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'recordings' as table_name, COUNT(*) as record_count FROM recordings
UNION ALL
SELECT 'reviews' as table_name, COUNT(*) as record_count FROM reviews
UNION ALL
SELECT 'sentences' as table_name, COUNT(*) as record_count FROM sentences;

-- Show users by role
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- Show recordings by status
SELECT status, COUNT(*) as count FROM recordings GROUP BY status;

-- Show setup completion
SELECT 'Voice Platform database setup completed successfully!' as status;
"@
    }
    
    # Extract connection details from URL
    $urlWithoutProtocol = $SupabaseUrl -replace 'https://', ''
    $projectRef = $urlWithoutProtocol.Split('.')[0]
    
    Write-Host "📊 Supabase Project: $projectRef" -ForegroundColor Green
    Write-Host "🔧 Setting up database tables..." -ForegroundColor Yellow
    
    # Create a temporary SQL file with the setup script
    $tempSqlFile = Join-Path $env:TEMP "voice_platform_setup.sql"
    $sqlContent | Out-File -FilePath $tempSqlFile -Encoding UTF8
    
    Write-Host "📝 Created SQL setup file: $tempSqlFile" -ForegroundColor Green
    
    try {
        # Try to execute the SQL setup using Supabase SQL Editor instructions
        Write-Host "📋 Next steps for Supabase setup:" -ForegroundColor Cyan
        Write-Host "=================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Go to your Supabase dashboard" -ForegroundColor White
        Write-Host "   URL: https://supabase.com/dashboard" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Navigate to your project: $projectRef" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Go to the SQL Editor (left sidebar)" -ForegroundColor White
        Write-Host ""
        Write-Host "4. Create a new query and paste the contents of:" -ForegroundColor White
        Write-Host "   $tempSqlFile" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "5. Click 'Run' to execute the setup" -ForegroundColor White
        Write-Host ""
        Write-Host "6. Verify tables were created by running this query in SQL Editor:" -ForegroundColor White
        Write-Host "   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" -ForegroundColor Gray
        Write-Host ""
        Write-Host "✨ Alternative: Execute this PowerShell command to open the SQL file:" -ForegroundColor Green
        Write-Host "   notepad '$tempSqlFile'" -ForegroundColor Yellow
        
    } catch {
        Write-Host "❌ Error preparing Supabase setup: $_" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "🎉 Setup instructions ready!" -ForegroundColor Cyan
    Write-Host "👍 Remember to check your Supabase dashboard after running the SQL" -ForegroundColor Yellow
}

function InstallRequiredPackages {
    Write-Host "🔧 Checking Node.js packages..." -ForegroundColor Yellow
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Host "❌ package.json not found. Please run this from your project root." -ForegroundColor Red
        exit 1
    }
    
    # Install Supabase client if not already installed
    Write-Host "📦 Installing Supabase client..." -ForegroundColor Green
    try {
        npm install @supabase/supabase-js --save-dev
        Write-Host "✅ Supabase client installed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Could not install Supabase client: $_" -ForegroundColor Yellow
        Write-Host "You may need to install it manually: npm install @supabase/supabase-js" -ForegroundColor Gray
    }
}

# Check if we're in Supabase mode first
if ($SupabaseMode -or ($SupabaseUrl -and $SupabaseKey)) {
    InstallRequiredPackages
    SetUpSupabaseTables -SupabaseUrl $SupabaseUrl -SupabaseKey $SupabaseKey
} else {
    Write-Host "🔄 Setting up standard PostgreSQL..." -ForegroundColor Green
    
    # Check for psql command
    try {
        $null = Get-Command psql -ErrorAction Stop
    } catch {
        Write-Host "❌ PostgreSQL client (psql) not found in PATH" -ForegroundColor Red
        Write-Host "Please install PostgreSQL client tools or use Supabase mode:" -ForegroundColor Yellow
        Write-Host "  .\setup_supabase_tables.ps1 -SupabaseMode" -ForegroundColor Gray
        exit 1
    }
    
    # Execute the database setup using the connection string
    Write-Host "🚀 Creating database tables..." -ForegroundColor Green
    
    try {
        # Read SQL content
        $sqlContent = Get-Content -Path "complete_database_setup.sql" -Raw -ErrorAction Stop
        
        # Write to temporary file for psql
        $tempFile = Join-Path $env:TEMP "db_setup.sql"
        $sqlContent | Out-File -FilePath $tempFile -Encoding UTF8
        
        # Execute via psql
        psql $ConnectionString -f $tempFile
        
        # Clean up temp file
        Remove-Item $tempFile -ErrorAction SilentlyContinue
        
        Write-Host "✅ Database setup completed!" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Setup failed: $_" -ForegroundColor Red
        Write-Host "💡 Try using Supabase mode instead:" -ForegroundColor Yellow
        Write-Host "  .\setup_supabase_tables.ps1 -SupabaseMode" -ForegroundColor Gray
        exit 1
    }
}

Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host "1. Test your application connectivity" -ForegroundColor White
Write-Host "2. Try logging in with sample accounts" -ForegroundColor White
Write-Host "3. Visit different pages to verify functionality" -ForegroundColor White
Write-Host ""
Write-Host "📋 Sample accounts created:" -ForegroundColor Green
Write-Host "  Admin: admin@commonvoice.org / admin123" -ForegroundColor Gray
Write-Host "  Reviewer: reviewer@example.com / reviewer123" -ForegroundColor Gray
Write-Host "  Contributor: contributor@example.com / contributor123" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Voice Platform setup complete! Happy coding! 🚀" -ForegroundColor Cyan
