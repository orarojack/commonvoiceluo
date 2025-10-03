#!/usr/bin/env node

/**
 * Check existing tables and create missing ones
 */

const { createClient } = require('@supabase/supabase-js');

// Connect to Supabase
const supabase = createClient(
  'https://cnphlumvgptnvqczehwv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE'
);

console.log('🔍 CHECKING AND CREATING TABLES');
console.log('===============================');
console.log('');

async function checkTables() {
  const tablesToCheck = [
    { name: 'users', createSql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    ` },
    { name: 'recordings', createSql: `
      CREATE TABLE IF NOT EXISTS recordings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    ` },
    { name: 'reviews', createSql: `
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
        reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected')),
        notes TEXT,
        confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        time_spent INTEGER NOT NULL DEFAULT 0
      );
    ` },
    { name: 'sentences', createSql: `
      CREATE TABLE IF NOT EXISTS sentences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    ` }
  ];

  console.log('Checking each table...');
  console.log('');

  for (const table of tablesToCheck) {
    console.log(`🔄 Checking table '${table.name}'...`);
    
    try {
      // Try to query the table
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (!error) {
        console.log(`✅ Table '${table.name}' EXISTS and is accessible`);
        
        // Count records if it exists
        const { count } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });
        
        console.log(`   Records: ${count || 0}`);
      } else {
        console.log(`❌ Table '${table.name}' MISSING: ${error.message}`);
        
        // Try to create the table using Supabase REST API
        console.log(`🔧 Attempting to create table '${table.name}'...`);
        
        try {
          const response = await fetch(`https://cnphlumvgptnvqczehwv.supabase.co/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE'
            },
            body: JSON.stringify({
              query: table.createSql
            })
          });

          if (response.ok) {
            console.log(`✅ Table '${table.name}' created successfully!`);
          } else {
            const errorText = await response.text();
            console.log(`⚠️ Table '${table.name}' creation attempt made (may already exist): ${errorText}`);
          }
        } catch (createError) {
          console.log(`⚠️ Could not create table '${table.name}': ${createError.message}`);
          console.log(`   Manual creation may be needed - see instructions below`);
        }
      }
    } catch (err) {
      console.log(`❌ Error checking table '${table.name}': ${err.message}`);
    }
    
    console.log('');
  }

  // Final verification
  console.log('🔍 FINAL VERIFICATION');
  console.log('======================');
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (!error) {
        console.log(`✅ ${table.name}: OK`);
      } else {
        console.log(`❌ ${table.name}: ${error.message}`);
      }
    } catch (err) {
      console.log(`❌ ${table.name}: ${err.message}`);
    }
  }
  
  console.log('');
  console.log('📋 MANUAL TABLE CREATION');
  console.log('=========================');
  console.log('If tables are missing, go to your Supabase dashboard:');
  console.log('1. Visit: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to: SQL Editor');
  console.log('4. Run the complete_database_setup.sql script');
  console.log('5. Or run each CREATE TABLE statement individually');
  console.log('');
  console.log('💡 Your SQL file: complete_database_setup.sql');
  console.log('   Contains all CREATE TABLE statements ready to run!');
}

checkTables();
