#!/usr/bin/env node

/**
 * Simple Supabase Table Check
 * No external dependencies required
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://cnphlumvgptnvqczehwv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 SUPABASE DATABASE CHECK');
console.log('============================');
console.log(`📡 URL: ${SUPABASE_URL}`);
console.log(`🗝️ Key: ${SUPABASE_KEY.substring(0, 20)}...`);
console.log('');

async function checkTable(tableName) {
  console.log(`📋 Checking: ${tableName.toUpperCase()}`);
  
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`✅ EXISTS: ${count || 0} records`);
      
      // Try to get one sample record to see schema
      const { data: sample } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (sample && sample.length > 0) {
        const sampleRecord = sample[0];
        console.log(`🔧 Columns: ${Object.keys(sampleRecord).join(', ')}`);
      }
      
      return true;
    } else {
      console.log(`❌ MISSING: ${error.message}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ ERROR: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🗄️ Testing database connection...');
  
  const tablesToCheck = ['users', 'recordings', 'reviews', 'sentences'];
  const results = {};
  
  for (const table of tablesToCheck) {
    results[table] = await checkTable(table);
    console.log('');
  }
  
  // Summary
  console.log('📊 SUMMARY');
  console.log('===========');
  
  const existingTables = Object.values(results).filter(Boolean).length;
  const totalTables = tablesToCheck.length;
  
  console.log(`Tables Created: ${existingTables}/${totalTables}`);
  console.log('');
  
  tablesToCheck.forEach(table => {
    const status = results[table] ? '✅' : '❌';
    console.log(`${status} ${table}`);
  });
  
  console.log('');
  
  if (existingTables === totalTables) {
    console.log('🎉 COMPLETE! All tables created successfully.');
    console.log('Your Voice Platform database is fully ready!');
  } else if (existingTables > 0) {
    console.log('⚠️ PARTIAL: Some tables exist, some are missing.');
    console.log('');
    console.log('💡 To create missing tables:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. SQL Editor');
    console.log('3. Run complete_database_setup.sql');
  } else {
    console.log('❌ NO TABLES: Database needs setup.');
    console.log('');
    console.log('🚀 Quick Setup:');
    console.log('1. Supabase Dashboard → SQL Editor');
    console.log('2. Copy complete_database_setup.sql');
    console.log('3. Execute in Supabase');
  }
  
  console.log('');
  console.log('🔗 Dashboard: https://supabase.com/dashboard');
  console.log('📄 SQL File: complete_database_setup.sql');
}

main().catch(console.error);
