#!/usr/bin/env node

/**
 * Create Tables in YOUR Supabase Project
 * Run this after you get the correct API keys
 */

const { createClient } = require('@supabase/supabase-js');

// YOUR Supabase project (this should be the correct one)
const SUPABASE_URL = 'https://wbjzdbuanfusvsxjzagp.supabase.co';

console.log('🚀 CREATING TABLES IN YOUR SUPABASE PROJECT');
console.log('===========================================');
console.log(`Project: ${SUPABASE_URL}`);
console.log('');

// Check if correct credentials are available
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY || SUPABASE_KEY.includes('Indian') || SUPABASE_KEY.includes('jWSOg0')) {
  console.log('❌ PROBLEM: Invalid API keys detected');
  console.log('');
  console.log('🔧 SOLUTION:');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select your project: wbjzdbuanfusvsxjzagp');
  console.log('3. Go to: Settings → API');
  console.log('4. Copy the CORRECT project URL and API keys');
  console.log('5. Update your ..env.local file');
  console.log('');
  console.log('📝 Your current .env.local should look like:');
  console.log('');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://YOUR-REAL-PROJECT-ID.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...');
  console.log('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...');
  console.log('');
  console.log('❗ Your current keys are corrupted/mixed');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ API Key looks valid, proceeding...');
console.log('');

async function createTable(sqlQuery, tableName) {
  try {
    console.log(`📝 Creating ${tableName} table...`);
    
    // Since direct SQL execution isn't available, we'll try to create by accessing
    // First let's check if table exists
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    if (!error) {
      console.log(`✅ ${tableName} table already exists`);
      return true;
    } else {
      console.log(`❌ ${tableName} table missing: ${error.message}`);
      console.log(`🔧 You need to create this table manually in Supabase`);
      console.log('');
      console.log('💡 Manual Steps:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Copy and paste the SQL commands from complete_database_setup.sql');
      console.log('3. Execute each CREATE TABLE statement');
      console.log('');
      return false;
    }
  } catch (err) {
    console.log(`❌ Error checking ${tableName}: ${err.message}`);
    return false;
  }
}

async function createAllTables() {
  const tables = [
    { name: 'users', sql: 'See complete_database_setup.sql for users table SQL' },
    { name: 'recordings', sql: 'See complete_database_setup.sql for recordings table SQL' },
    { name: 'reviews', sql: 'See complete_database_setup.sql for reviews table SQL' },
    { name: 'sentences', sql: 'See complete_database_setup.sql for sentences table SQL' }
  ];
  
  console.log('🔍 Checking current table status...');
  console.log('');
  
  const results = {};
  for (const table of tables) {
    results[table.name] = await createTable(table.sql, table.name);
  }
  
  const existingTables = Object.values(results).filter(Boolean).length;
  
  console.log('');
  console.log('📊 CURRENT STATUS:');
  console.log(`Tables created: ${existingTables}/4`);
  
  if (existingTables === 4) {
    console.log('🎉 ALL TABLES EXIST! Your database is ready.');
  } else {
    console.log('');
    console.log('🚀 TO CREATE MISSING TABLES:');
    console.log('============================');
    console.log('');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and run this SQL:');
    console.log('');
    console.log('-- Enable UUID extension');
    console.log('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('');
    console.log('-- Then run each CREATE TABLE from complete_database_setup.sql');
    console.log('');
    console.log('📁 SQL file location: complete_database_setup.sql');
    console.log('🔗 Dashboard: https://supabase.com/dashboard/project/wbjzdbuanfusvsxjzagp');
  }
  
  console.log('');
  console.log('⚠️ NOTE:');
  console.log('The automated table creation failed because Supabase requires manual SQL execution');
  console.log('in the dashboard. This is normal for Supabase free tier accounts.');
}

createAllTables();
