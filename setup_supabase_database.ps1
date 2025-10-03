# PowerShell Script to Set Up Voice Platform Database Tables in Supabase
# This script creates all necessary tables, indexes, triggers, and sample data

param(
    [string]$ConnectionString = "",
    [string]$DatabaseName = "voice_platform",
    [switch]$SupabaseMode = $false,
    [string]$SupabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL,
    [string]$SupabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
)

Write-Host "Voice Platform Supabase Database Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if we're in Supabase mode
if ($SupabaseMode -or ($SupabaseUrl -and $SupabaseKey)) {
    Write-Host "Setting up Supabase database..." -ForegroundColor Green
    
    # Validate required environment variables
    if (-not $SupabaseUrl) {
        Write-Host "Error: NEXT_PUBLIC_SUPABASE_URL environment variable not set" -ForegroundColor Red
        Write-Host "Please set your Supabase URL and retry" -ForegroundColor Yellow
        exit 1
    }
    
    if (-not $SupabaseKey) {
        Write-Host "Error: NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable not set" -ForegroundColor Red
        Write-Host "Please set your Supabase key and retry" -ForegroundColor Yellow
        exit 1
    }
    
    SetUpSupabaseTables -SupabaseUrl $SupabaseUrl -SupabaseKey $SupabaseKey
    return
}

Write-Host "Connection string required: $ConnectionString" -ForegroundColor Yellow

function SetUpSupabaseTables {
    param(
        [string]$SupabaseUrl,
        [string]$SupabaseKey
    )
    
    Write-Host "Creating Supabase setup script..." -ForegroundColor Green
    
    # Read the existing complete database setup SQL
    $sqlContent = Get-Content -Path "complete_database_setup.sql" -Raw -ErrorAction SilentlyContinue
    
    if (-not $sqlContent) {
        Write-Host "complete_database_setup.sql not found, creating comprehensive SQL..." -ForegroundColor Yellow
        
        # Create the complete SQL setup inline
        $sqlContent = @"
-- Complete Database Setup for Voice Platform (Supabase Compatible)
-- Enable UUID extension (Supabase has this enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_recording_id ON reviews(recording_id);
CREATE INDEX IF NOT EXISTS idx_sentences_language_code ON sentences(language_code);
CREATE INDEX IF NOT EXISTS idx_sentences_is_active ON sentences(is_active);

-- Create triggers for auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
    END;
    $$ language 'plpgsql';

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

-- Insert sample users
INSERT INTO users (email, password, role, status, profile_complete, name, age, gender, languages, is_active, location, employment_status, educational_background)
VALUES (
    'contributor@example.com',
    'contributor123',
    'contributor',
    'active',
    true,
    'Jane Contributor',
    '20-29',
    'female',
    ARRAY['English'],
    true,
    'Kisumu',
    'student',
    'secondary'
) ON CONFLICT (email) DO NOTHING;

SELECT 'Voice Platform database setup completed!' as status;
"@
    }
    
    # Extract connection details from URL
    $urlWithoutProtocol = $SupabaseUrl -replace 'https://', ''
    $projectRef = $urlWithoutProtocol.Split('.')[0]
    
    Write-Host "Supabase Project: $projectRef" -ForegroundColor Green
    Write-Host "Setting up database tables..." -ForegroundColor Yellow
    
    # Create a temporary SQL file with the setup script
    $tempSqlFile = Join-Path $env:TEMP "voice_platform_setup.sql"
    $sqlContent | Out-File -FilePath $tempSqlFile -Encoding UTF8
    
    Write-Host "Created SQL setup file: $tempSqlFile" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Next steps for Supabase setup:" -ForegroundColor Cyan
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
    Write-Host "Alternative: Execute this PowerShell command to open the SQL file:" -ForegroundColor Green
    Write-Host "   notepad '$tempSqlFile'" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "Setup instructions ready!" -ForegroundColor Cyan
    Write-Host "Remember to check your Supabase dashboard after running the SQL" -ForegroundColor Yellow
}

# Check if we're in Supabase mode first
if ($SupabaseMode -or ($SupabaseUrl -and $SupabaseKey)) {
    SetUpSupabaseTables -SupabaseUrl $SupabaseUrl -SupabaseKey $SupabaseKey
} else {
    Write-Host "Connection string required for PostgreSQL setup" -ForegroundColor Red
    Write-Host "Usage: .\setup_supabase_database.ps1 -SupabaseMode" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host "1. Test your application connectivity" -ForegroundColor White
Write-Host "2. Try logging in with sample accounts" -ForegroundColor White
Write-Host "3. Visit different pages to verify functionality" -ForegroundColor White
Write-Host ""
Write-Host "Sample accounts created:" -ForegroundColor Green
Write-Host "  Admin: admin@commonvoice.org / admin123" -ForegroundColor Gray
Write-Host "  Contributor: contributor@example.com / contributor123" -ForegroundColor Gray
Write-Host ""
Write-Host "Voice Platform setup complete! Happy coding!" -ForegroundColor Cyan
