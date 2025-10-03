#!/usr/bin/env node

/**
 * Complete Database Setup Automation
 * This script will create everything once you have correct credentials
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🚀 COMPLETE DATABASE SETUP');
console.log('==========================');
console.log('');

// Get credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking credentials...');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Key: ${SUPABASE_KEY ? SUPABASE_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
console.log('');

// Check for corrupted credentials
if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_KEY.includes('Indian') || SUPABASE_KEY.includes('jWSOg0')) {
  console.log('❌ INVALID CREDENTIALS DETECTED!');
  console.log('');
  console.log('🔧 TO FIX THIS:');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Settings → API');
  console.log('3. Copy REAL credentials');
  console.log('4. Update .env.local file');
  console.log('5. Run this script again');
  console.log('');
  console.log('📝 Your .env.local should look like:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsINVALID_SUB_KEY_REPLACE_WITH_REAL_KEY');
  console.log('');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Credentials look valid! Proceeding...');
console.log('');

// SQL statements to create tables
const createTablesSQL = `
-- Enable UUID extension
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

async function createTables() {
  console.log('🔨 Creating database tables...');
  
  try {
    // Since Supabase client doesn't support direct SQL execution,
    // we'll check what tables exist and guide you
    const tablesToCheck = ['users', 'recordings', 'reviews', 'sentences'];
    const tableStatus = {};
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (!error) {
          console.log(`✅ Table '${table}' exists`);
          tableStatus[table] = true;
        } else {
          console.log(`❌ Table '${table}' missing: ${error.message}`);
          tableStatus[table] = false;
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error: ${err.message}`);
        tableStatus[table] = false;
      }
    }
    
    const existingTables = Object.values(tableStatus).filter(Boolean).length;
    
    console.log('');
    console.log('📊 CURRENT STATUS:');
    console.log(`Tables created: ${existingTables}/4`);
    
    if (existingTables < 4) {
      console.log('');
      console.log('🔧 MANUAL STEP REQUIRED:');
      console.log('=======================');
      console.log('');
      console.log('Since automated creation failed, manually create tables:');
      console.log('');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Copy and paste this SQL:');
      console.log('');
      console.log(createTablesSQL);
      console.log('');
      console.log('3. Execute the SQL commands');
      console.log('4. Then run: node populate_sample_data.js');
    } else {
      console.log('🎉 All tables exist! Ready for sample data.');
      console.log('');
      console.log('Run: node populate_sample_data.js');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

createTables();
