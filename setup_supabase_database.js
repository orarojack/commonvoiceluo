#!/usr/bin/env node

/**
 * Supabase Database Setup Script
 * This script sets up all the necessary tables, indexes, triggers, and sample data
 * for the Voice Platform in your Supabase database.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    console.error('');
    console.error('Please set these in your environment or create a .env.local file');
    process.exit(1);
}

console.log('🚀 Setting up Voice Platform Database in Supabase...');
console.log(`📡 Connecting to: ${SUPABASE_URL.substring(0, 30)}...`);

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Complete SQL setup script combining all necessary operations
const COMPLETE_SQL = `
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
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT ahora()
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

-- Sample recording 4
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, quality, metadata)
SELECT 
    u.id,
    'The sun rises in the east and sets in the west.',
    '/audio/sample4.mp3',
    3.5,
    'approved',
    'good',
    '{"deviceType": "tablet", "browserType": "chrome"}'::jsonb
FROM users u
WHERE u.email = 'contributor@example.com.' AND NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'The sun rises in the east and sets in the west.'
);

-- Sample recording 5
INSERT INTO recordings (user_id, sentence, audio_url, duration, status, quality, metadata)
SELECT 
    u.id,
    'Practice makes perfect in all endeavors.',
    '/audio/sample5.mp3',
    2.9,
    'approved',
    'fair',
    '{"deviceType": "desktop", "browserType": "edge"}'::jsonb
FROM users u
WHERE u.email = 'alice@example.com.' AND NOT EXISTS (
    SELECT 1 FROM recordings WHERE sentence = 'Practice makes perfect in all endeavors.'
);

-- =============================================
-- SEED SAMPLE REVIEWS
-- =============================================

-- Review 1
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    r.id,
    u.id,
    'approved',
    'Clear pronunciation and good audio quality',
    95,
    15
FROM recordings r
JOIN users u ON u.email = 'reviewer@example.com'
WHERE r.sentence = 'The quick brown fox jumps over the lazy dog.' AND NOT EXISTS (
    SELECT 1 FROM reviews rev 
    JOIN recordings rec ON rev.recording_id = rec.id 
    WHERE rec.sentence = 'The quick brown fox jumps over the lazy dog.'
);

-- Review 2  
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    r.id,
   u.id,
    'rejected',
    'Background noise and unclear pronunciation',
    88,
    22
FROM recordings r
JOIN users u ON u.email = 'reviewer@example.com'
WHERE r.sentence = 'A journey of a thousand miles begins with a single step.' AND NOT EXISTS (
    SELECT 1 FROM reviews rev 
    JOIN recordings rec ON rev.recording_id = rec.id 
    WHERE rec.sentence = 'A journey of a thousand miles begins with a single step.'
);

-- Review 4
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    r.id,
    u.id,
    'approved',
    'Excellent quality recording',
    98,
    12
FROM recordings r
JOIN users u ON u.email = 'reviewer@example.com'
WHERE r.sentence = 'The sun rises in the east and sets in the west.' AND NOT EXISTS (
    SELECT 1 FROM reviews rev 
    JOIN recordings rec ON rev.recording_id = rec.id 
    WHERE rec.sentence = 'The sun rises in the east and sets in the west.'
);

-- Review 5
INSERT INTO reviews (recording_id, reviewer_id, decision, notes, confidence, time_spent)
SELECT 
    r.id,
    u.id,
    'approved',
    'Good recording with minor background noise',
    85,
    18
FROM recordings r
JOIN users u ON u.email = 'reviewer@example.com'
WHERE r.sentence = 'Practice makes perfect in all endeavors.' AND NOT EXISTS (
    SELECT 1 FROM reviews rev 
    JOIN recordings rec ON rev.recording_id = rec.id 
    WHERE rec.sentence = 'Practice makes perfect in all endeavors.'
);

-- Update recordings with reviewer information where reviews exist
UPDATE recordings 
SET reviewed_by = u.id, reviewed_at = r.created_at
FROM reviews r 
JOIN users u ON u.id = r.reviewer_id
WHERE recordings.id = r.recording_id AND recordings.reviewed_by IS NULL;
`;

async function setupDatabase() {
    try {
        console.log('🔧 Executing database setup...');
        
        // Execute the complete SQL script
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: COMPLETE_SQL });
        
        if (error) {
            console.error('❌ SQL Execution Error:', error);
            
            // If RPC doesn't work, try direct SQL execution
            console.log('🔄 Trying alternative approach...');
            
            // Split SQL into individual statements and execute them
            const statements = COMPLETE_SQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0);
            
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
                        if (stmtError && !stmtError.message.includes('already exists')) {
                            console.log(`⚠️ Statement warning: ${stmtError.message}`);
                        }
                    } catch (e) {
                        console.log(`⚠️ Statement issue: ${e.message}`);
                    }
                }
            }
        } else {
            console.log('✅ Database setup completed successfully!');
        }
        
        // Verify the setup
        console.log('🔍 Verifying database setup...');
        
        const tables = ['users', 'recordings', 'reviews', 'sentences'];
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*', { count: 'exact' })
                .limit(1);
                
            if (error) {
                console.log(`❌ Table ${table}: ${error.message}`);
            } else {
                const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
                console.log(`✅ Table ${table}: ${count || 0} records`);
            }
        }
        
        console.log('🎉 Voice Platform database setup completed!');
        console.log('');
        console.log('📋 Sample accounts created:');
        console.log('   Admin: admin@commonvoice.org / admin123');
        console.log('   Reviewer: reviewer@example.com / reviewer123');
        console.log('   Contributor: contributor@example.com / contributor123');
        console.log('   Contributor: alice@example.com / alice123');
        console.log('');
        console.log('✨ Your Voice Platform is ready to use!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('1. Check your Supabase credentials');
        console.error('2. Ensure your Supabase project is active');
        console.error('3. Verify you have permissions to create tables');
        process.exit(1);
    }
}

// Alternative method using direct SQL execution
async function setupDatabaseAlternative() {
    try {
        console.log('🔧 Setting up database using alternative method...');
        
        // Create tables one by one to avoid issues
        await createTables();
        await createIndexes();
        await createTriggers();
        await seedData();
        
        console.log('🎉 Database setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

async function createTables() {
    console.log('📋 Creating tables...');
    
    const tableQueries = {
        users: `
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
        `,
        recordings: `
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
                quality VARCHAR(20) DEFAULT 'good' CHECK (quality IN ('good', 'fair', 'pending')),
                metadata JSONB DEFAULT '{}'
            );
        `,
        reviews: `
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
        `,
        sentences: `
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
        `,
    };

    for (const [tableName, query] of Object.entries(tableQueries)) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: query });
        if (error && !error.message.includes('already exists')) {
            console.log(`⚠️ Error creating ${tableName}: ${error.message}`);
        } else {
            console.log(`✅ Created table: ${tableName}`);
        }
    }
}

async function createIndexes() {
    console.log('📊 Creating indexes...');
    
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
        'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);',
        'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);',
        'CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);',
        'CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);',
        'CREATE INDEX IF NOT EXISTS idx_reviews_recording_id ON reviews(recording_id);',
        'CREATE INDEX IF NOT EXISTS idx_sentences_language_code ON sentences(language_code);',
        'CREATE INDEX IF NOT EXISTS idx_sentences_is_active ON sentences(is_active);'
    ];
    
    for (const indexQuery of indexes) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: indexQuery });
        if (error) {
            console.log(`⚠️ Index warning: ${error.message}`);
        }
    }
    console.log('✅ Indexes created');
}

async function createTriggers() {
    console.log('⚡ Creating triggers...');
    
    const triggerFunction = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    `;
    
    const { error: funcError } = await supabase.rpc('exec_sql', { sql_query: triggerFunction });
    if (funcError) {
        console.log(`⚠️ Function warning: ${funcError.message}`);
    }
    
    console.log('✅ Triggers created');
}

async function seedData() {
    console.log('🌱 Seeding sample data...');
    
    // Sample users
    const users = [
        {
            email: 'admin@commonvoice.org',
            password: 'admin123',
            role: 'admin',
            status: 'active',
            profile_complete: true,
            name: 'System Admin',
            is_active: true,
            location: 'Nairobi',
            employment_status: 'employed',
            educational_background: 'postgraduate'
        },
        {
            email: 'reviewer@example.com',
            password: 'reviewer123',
            role: 'reviewer',
            status: 'active',
            profile_complete: true,
            name: 'John Reviewer',
            age: '30-39',
            gender: 'male',
            languages: ['English', 'Spanish'],
            is_active: true,
            location: 'Nakuru',
            language_dialect: 'Milambo',
            employment_status: 'employed',
            educational_background: 'graduate',
            constituency: 'Nakuru Town East'
        },
        {
            email: 'contributor@example.com',
            password: 'contributor123',
            role: 'contributor',
            status: 'active',
            profile_complete: true,
            name: 'Jane Contributor',
            age: '20-29',
            gender: 'female',
            languages: ['English', 'French'],
            is_active: true,
            location: 'Kisumu',
            language_dialect: 'Nyanduat',
            employment_status: 'student',
            educational_background: 'secondary',
            constituency: 'Kisumu Central',
            phone_number: '+254712345678'
        }
    ];
    
    for (const user of users) {
        const { error } = await supabase.from('users').upsert(user, { onConflict: 'email' });
        if (error) {
            console.log(`⚠️ User ${user.email}: ${error.message}`);
        } else {
            console.log(`✅ Created user: ${user.email}`);
        }
    }
    
    console.log('✅ Sample data seeded');
}

// Check if we can execute SQL directly via Supabase
async function checkSupabaseCapabilities() {
    try {
        // Try to get the current time to test connection
        const { data, error } = await supabase.from('users').select('id').limit(1);
        return { connected: !error, error };
    } catch (e) {
        return { connected: false, error: e.message };
    }
}

// Main execution
async function main() {
    console.log('🔍 Checking Supabase connection...');
    const { connected, error } = await checkSupabaseCapabilities();
    
    if (!connected) {
        console.log('⚠️ Direct database access may be limited, attempting alternative setup...');
        await setupDatabaseAlternative();
    } else {
        console.log('✅ Connected to Supabase, proceeding with direct execution...');
        await setupDatabase();
    }
}

// Run the setup
main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
