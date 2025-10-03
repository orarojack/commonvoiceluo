-- Complete Database Setup for Voice Platform
-- This script creates all necessary tables, constraints, indexes, and seeds initial data

-- Enable UUID extension
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
    mozilla_id VARCHAR(50) UNIQUE NOT NULL, -- Mozilla's unique sentence ID
    text TEXT NOT NULL,
    language_code VARCHAR(10) NOT NULL DEFAULT 'luo',
    source VARCHAR(100), -- Source of the sentence (e.g., 'community', 'curated', 'mozilla')
    bucket VARCHAR(100),
    hash VARCHAR(100),
    version INTEGER DEFAULT 1,
    clips_count INTEGER DEFAULT 0,
    has_valid_clip BOOLEAN DEFAULT FALSE,
    is_validated BOOLEAN DEFAULT FALSE,
    taxonomy JSONB DEFAULT '{}', -- Full taxonomy info from Mozilla
    metadata JSONB DEFAULT '{}', -- Additional metadata
    is_active BOOLEAN DEFAULT TRUE, -- Whether sentence is available for recording
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
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recordings_updated_at 
    BEFORE UPDATE ON recordings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Insert sample recordings using subqueries to get proper user IDs
WITH contributor1 AS (
    SELECT id FROM users WHERE email = 'contributor@example.com' LIMIT 1
),
contributor2 AS (
    SELECT id FROM users WHERE email = 'alice@example.com' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, reviewed_by, reviewed_at, quality, metadata)
SELECT 
    contributor1.id,
    'The quick brown fox jumps over the lazy dog.',
    '/audio/sample1.mp3',
    3.2,
    'approved',
    reviewer1.id,
    NOW() - INTERVAL '1 hour',
    'good',
    '{"deviceType": "desktop", "browserType": "chrome"}'::jsonb
FROM contributor1, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'The quick brown fox jumps over the lazy dog.'
);

WITH contributor1 AS (
    SELECT id FROM users WHERE email = 'contributor@example.com' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, reviewed_by, reviewed_at, quality, metadata)
SELECT 
    contributor1.id,
    'A journey of a thousand miles begins with a single step.',
    '/audio/sample2.mp3',
    4.1,
    'rejected',
    reviewer1.id,
    NOW() - INTERVAL '30 minutes',
    'poor',
    '{"deviceType": "mobile", "browserType": "safari"}'::jsonb
FROM contributor1, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'A journey of a thousand miles begins with a single step.'
);

WITH contributor2 AS (
    SELECT id FROM users WHERE email = 'alice@example.com' LIMIT 1
)
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, quality, metadata)
SELECT 
    contributor2.id,
    'To be or not to be, that is the question.',
    '/audio/sample3.mp3',
    2.8,
    'pending',
    'good',
    '{"deviceType": "desktop", "browserType": "firefox"}'::jsonb
FROM contributor2
WHERE NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'To be or not to be, that is the question.'
);

WITH contributor1 AS (
    SELECT id FROM users WHERE email = 'contributor@example.com' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, reviewed_by, reviewed_at, quality, metadata)
SELECT 
    contributor1.id,
    'The sun rises in the east and sets in the west.',
    '/audio/sample4.mp3',
    3.5,
    'approved',
    reviewer1.id,
    NOW() - INTERVAL '45 minutes',
    'good',
    '{"deviceType": "tablet", "browserType": "chrome"}'::jsonb
FROM contributor1, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'The sun rises in the east and sets in the west.'
);

WITH contributor2 AS (
    SELECT id FROM users WHERE email = 'alice@example.com' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, reviewed_by, reviewed_at, quality, metadata)
SELECT 
    contributor2.id,
    'Practice makes perfect in all endeavors.',
    '/audio/sample5.mp3',
    2.9,
    'approved',
    reviewer1.id,
    NOW() - INTERVAL '20 minutes',
    'fair',
    '{"deviceType": "desktop", "browserType": "edge"}'::jsonb
FROM contributor2, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'Practice makes perfect in all endeavors.'
);

-- =============================================
-- SEED SAMPLE REVIEWS
-- =============================================

-- Insert sample reviews using proper foreign key relationships
WITH recording1 AS (
    SELECT id FROM recordings WHERE sentence = 'The quick brown fox jumps over the lazy dog.' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    recording1.id,
    reviewer1.id,
    'approved',
    'Clear pronunciation and good audio quality',
    95,
    15
FROM recording1, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r 
    JOIN recordings rec ON r.recording_id = rec.id 
    WHERE rec.sentence = 'The quick brown fox jumps over the lazy dog.'
);

WITH recording2 AS (
    SELECT id FROM recordings WHERE sentence = 'A journey of a thousand miles begins with a single step.' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    recording2.id,
    reviewer1.id,
    'rejected',
    'Background noise and unclear pronunciation',
    88,
    22
FROM recording2, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r 
    JOIN recordings rec ON r.recording_id = rec.id 
    WHERE rec.sentence = 'A journey of a thousand miles begins with a single step.'
);

WITH recording4 AS (
    SELECT id FROM recordings WHERE sentence = 'The sun rises in the east and sets in the west.' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    recording4.id,
    reviewer1.id,
    'approved',
    'Excellent quality recording',
    98,
    12
FROM recording4, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r 
    JOIN recordings rec ON r.recording_id = rec.id 
    WHERE rec.sentence = 'The sun rises in the east and sets in the west.'
);

WITH recording5 AS (
    SELECT id FROM recordings WHERE sentence = 'Practice makes perfect in all endeavors.' LIMIT 1
),
reviewer1 AS (
    SELECT id FROM users WHERE email = 'reviewer@example.com' LIMIT 1
)
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    recording5.id,
    reviewer1.id,
    'approved',
    'Good recording with minor background noise',
    85,
    18
FROM recording5, reviewer1
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r 
    JOIN recordings rec ON r.recording_id = rec.id 
    WHERE rec.sentence = 'Practice makes perfect in all endeavors.'
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

-- Show sentences by language and source
SELECT language_code, COUNT(*) as count FROM sentences GROUP BY language_code;
SELECT source, COUNT(*) as count FROM sentences GROUP BY source;

-- Show sentences by difficulty level
SELECT difficulty_level, COUNT(*) as count FROM sentences GROUP BY difficulty_level;

-- Show completed setup confirmation
SELECT 'Database setup completed successfully!' as status;
