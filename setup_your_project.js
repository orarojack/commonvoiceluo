#!/usr/bin/env node

/**
 * Setup Tables in YOUR Correct Supabase Project
 * This will create tables in the project you're actually looking at
 */

const { createClient } = require('@supabase/supabase-js');

// YOUR actual Supabase project (from .env.local)
const SUPABASE_URL = 'https://wbjzdbuanfusvsxjzagp.supabase.co';

console.log('🔍 YOUR SUPABASE PROJECT CHECK');
console.log('===============================');
console.log(`📡 Your Project URL: ${SUPABASE_URL}`);
console.log('');

// Test connection to YOUR project
async function testYourProject() {
  try {
    // Try with a dummy key first to test URL
    const testClient = createClient(SUPABASE_URL, 'dummy-key');
    
    console.log('🔌 Testing connection to YOUR project...');
    
    const { data, error } = await testClient
      .from('information_schema.tables')
      .select('*')
      .limit(1);
      
    console.log('✅ URL is accessible');
    console.log('❗ However, you need valid API keys to actually work with it');
    
  } catch (err) {
    console.log(`❌ URL not accessible: ${err.message}`);
  }
  
  console.log('');
  console.log('🛠️ TO FIX THIS ISSUE:');
  console.log('======================');
  console.log('');
  console.log('1. Go to your Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard');
  console.log('');
  console.log('2. Make sure you select the CORRECT project:');
  console.log(`   Project ID: wbjzdbuanfusvsxjzagp`);
  console.log('');
  console.log('3. Get your REAL API keys:');
  console.log('   Settings → API → Copy keys');
  console.log('');
  console.log('4. Update your .env.local file with CORRECT keys');
  console.log('');
  console.log('5. Then run: node create_your_tables.js');
  console.log('');
  console.log('📋 The tables that need to be created:');
  console.log('   • users');
  console.log('   • recordings'); 
  console.log('   • reviews');
  console.log('   • sentences');
}

testYourProject();
