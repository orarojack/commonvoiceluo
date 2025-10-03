-- COMPLETE VOICE PLATFORM DATABASE SETUP
-- Copy and paste this EXACTLY into your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CREATE USERS TABLE
-- =============================================
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
    employment_status VARCHAR(50) CHECK (employment_status IN ('employed', 'self-employed', 'unemployed')),
    phone_number VARCHAR(20),
    constituency TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================
-- CREATE RECORDINGS TABLE
-- =============================================
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

-- =============================================
-- CREATE REVIEWS TABLE
-- =============================================
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

-- =============================================
-- CREATE SENTENCES TABLE
-- =============================================
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_recording_id ON reviews(recording_id);
CREATE INDEX IF NOT EXISTS idx_sentences_language_code ON sentences(language_code);
CREATE INDEX IF NOT EXISTS idx_sentences_is_active ON sentences(is_active);

-- = placeholder for trigger functions
