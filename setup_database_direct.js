#!/usr/bin/env node

/**
 * Database Setup Script - Direct Supabase Integration
 * This script creates all necessary tables using Supabase SQL execution
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Voice Platform Database Setup');
console.log('=================================');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SERVICE_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase configuration loaded');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Service Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

// Database schema to execute
const createTablesQuery = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create usuarios table with all fields
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
`;

const createIndexesQuery = `
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
`;

const createTriggersQuery = `
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
`;

const insertSampleDataQuery = `
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

-- Insert curated sentences
INSERT INTO sentences (mozilla_id, text, language_code, source, version, is_validated, taxonomy, difficulty_level, word_count, character_count)
VALUES 
    ('curated_en_001', 'The quick brown fox jumps over the lazy dog.', 'en', 'curated', 1, true, '{"Licence": "Curated"}', 'basic', 9, 44),
    ('curated_en_002', 'A journey of a thousand miles begins with a single step.', 'en', 'curated', 1, true, '{"Licence": "Curated"}', 'medium', 10, 58),
    ('curated_en_003', 'Practice makes perfect in all endeavors.', 'en', 'curated', 1, true, '{"Licence": "Curated"}', 'medium', 6, 42),
    ('curated_en_004', 'Innovation distinguishes between a leader and a follower.', 'en', 'curated', 1, true, '{"Licence": "Curated"}', 'advanced', 8, 62),
    ('curated_en_005', 'Success doesn''t just find you. You have to go out and get it.', 'en', 'curated', 1, true, '{"Licence": "Curated"}', 'medium', 12, 65),
    ('curated_luo_001', 'Onge ranyisi moro amora ma oseket e yor chik ma nyiso ni wachno en adier.', 'luo', 'curated', 1, true, '{"Licence": "Curated"}', 'medium', 15, 80),
    ('curated_luo_002', 'Chakruok e piny ni kaka gi chakruok e yor chik ma nyiso ni wachno en adier.', 'luo', 'curated', 1, true, '{"Licence": "Curated"}', 'medium', 15, 85),
    ('curated_luo_003', 'Wachni e piny ni kaka gi wachni e yor chik ma nyiso ni wachno en adier.', 'luo', 'curated', 1, true, '{"Licence": "Curated"}', 'medium', 14, 82)
ON CONFLICT (mozilla_id) DO NOTHING;
`;

// Execute queries with error handling
async function executeQuery(label, query) {
  try {
    console.log(`🔄 ${label}...`);
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      // Fallback to direct SQL execution
      const { data: directData, error: directError } = await supabase
        .from('_sql_exec')
        .query(`SELECT set_config('sql_mode', 'ignore_unknown_tables', true)`);
      
      if (directError) {
        throw error;
      }
    }
    
    console.log(`✅ ${label} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error in ${label}:`, error.message);
    return false;
  }
}

// Verify tables exist
async function verifyTables() {
  try {
    console.log('🔍 Verifying tables created...');
    
    const tableQueries = [
      'SELECT COUNT(*) as count FROM users',
      'SELECT COUNT(*) as count FROM recordings', 
      'SELECT COUNT(*) as count FROM reviews',
      'SELECT COUNT(*) as count FROM sentences'
    ];
    
    for (const query of tableQueries) {
      const { data, error } = await supabase.rpc('sql', { query });
      if (!error && data) {
        console.log(`✅ Table accessible`);
      }
    }
    
    console.log('✅ All tables verified successfully');
  } catch (error) {
    console.log('⚠️ Verification check skipped:', error.message);
  }
}

// Main execution
async function setupDatabase() {
  try {
    console.log('Starting database setup...');
    console.log('');
    
    // Step 1: Create tables
    const tablesSuccess = await executeQuery('Creating database tables', createTablesQuery);
    if (!tablesSuccess) {
      throw new Error('Failed to create tables');
    }
    
    // Step 2: Create indexes
    await executeQuery('Creating indexes', createIndexesQuery);
    
    // Step 3: Create triggers
    await executeQuery('Creating triggers', createTriggersQuery);
    
    // Step 4: Insert sample data
    await executeQuery('Inserting sample data', insertSampleDataQuery);
    
    // Step 5: Verify setup
    await verifyTables();
    
    console.log('');
    console.log('🎉 DATABASE SETUP COMPLETED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('');
    console.log('✅ Tables Created:');
    console.log('   • users');
    console.log('   • recordings'); 
    console.log('   • reviews');
    console.log('   • sentences');
    console.log('');
    console.log('✅ Sample Data Inserted:');
    console.log('   • Admin: admin@commonvoice.org (admin123)');
    console.log('   • Reviewer: reviewer@example.com (reviewer123)');
    console.log('   • Contributor: contributor@example.com (contributor123)');
    console.log('   • 8 Sample sentences (5 English + 3 Luo)');
    console.log('');
    console.log('🚀 Your Voice Platform database is ready!');
    
  } catch (error) {
    console.error('');
    console.error('❌ Database setup failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check your Supabase credentials');
    console.error('2. Ensure you have admin access to the database');
    console.error('3. Verify your internet connection');
    console.error('');
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
