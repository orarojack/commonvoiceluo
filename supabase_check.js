#!/usr/bin/env node

/**
 * Direct Supabase Table Verification
 * This script checks what tables actually exist in your Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Supabase configuration
const SUPABASE_URL = 'https://cnphlumvgptnvqczehwv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 SUPABASE DATABASE VERIFICATION');
console.log('=================================');
console.log(`Project URL: ${SUPABASE_URL}`);
console.log(`Service Key: ${SUPABASE_KEY.substring(0, 20)}...`);
console.log('');

// Function to check table existence and structure
async function checkTable(tableName) {
  console.log(`📋 Checking table: ${tableName.toUpperCase()}`);
  console.log('-'.repeat(30));
  
  try {
    // Try to query the table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`✅ EXISTS: Table '${tableName}' is accessible`);
      console.log(`📊 Records: ${count || 0}`);
      
      // Try to get table schema info
      try {
        const { data: sampleData, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (!sampleError && sampleData) {
          console.log(`🔧 Schema: ${Object.keys(sampleData[0] || {}).length} columns`);
          if (sampleData[0]) {
            console.log(`📝 Sample columns: ${Object.keys(sampleData[0]).slice(0, 5).join(', ')}${Object.keys(sampleData[0]).length > 5 ? '...' : ''}`);
          }
        }
      } catch (err) {
        console.log(`⚠️ Schema check: ${err.message}`);
      }
      
      return true;
    } else {
      console.log(`❌ MISSING: Table '${tableName}' - ${error.message}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ ERROR: Table '${tableName}' - ${err.message}`);
    return false;
  }
  
  console.log('');
}

// Function to list ALL tables using Supabase Admin API
async function listAllTables() {
  console.log('📋 LISTING ALL TABLES IN SCHEMA');
  console.log('================================');
  
  try {
    // Use REST API to get schema information
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      }
    });
    
    if (response.ok) {
      const text = await response.text();
      console.log('📡 Schema response received');
      console.log(`Response length: ${text.length} characters`);
    } else {
      console.log(`⚠️ Schema API response: ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    console.log(`⚠️ Schema listing: ${err}`);
  }
  
  console.log('');
}

// Function to test database connection
async function testConnection() {
  console.log('🔌 TESTING DATABASE CONNECTION');
  console.log('===============================');
  
  try {
    // Simple query to test connection
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      }
    });
    
    if (response.ok) {
      console.log('✅ Database connection: SUCCESS');
      console.log(`📡 Response status: ${response.status}`);
    } else {
      console.log(`❌ Database connection: FAILED (${response.status})`);
      const errorText = await response.text();
      console.log(`📄 Error: ${errorText.substring(0, 100)}...`);
    }
  } catch (err) {
    console.log(`❌ Connection error: ${err.message}`);
  }
  
  console.log('');
}

// Main verification function
async function verifyDatabase() {
  try {
    await testConnection();
    await listAllTables();
    
    console.log('📊 CHECKING EXPECTED TABLES');
    console.log('============================');
    console.log('');
    
    const expectedTables = ['users', 'recordings', 'reviews', 'sentences'];
    const results = {};
    
    for (const table of expectedTables) {
      results[table] = await checkTable(table);
      console.log('');
    }
    
    // Summary
    console.log('📋 SUMMARY REPORT');
    console.log('==================');
    console.log('');
    
    const existingTables = Object.values(results).filter(Boolean).length;
    const totalTables = expectedTables.length;
    
    console.log(`📊 Tables Status: ${existingTables}/${totalTables} created`);
    console.log('');
    
    expectedTables.forEach(table => {
      const status = results[table] ? '✅ EXISTS' : '❌ MISSING';
      console.log(`   ${status}: ${table}`);
    });
    
    console.log('');
    
    if (existingTables === totalTables) {
      console.log('🎉 ALL TABLES READY! Your database is fully set up.');
    } else if (existingTables > 0) {
      console.log('⚠️ PARTIAL SETUP: Some tables exist, others need to be created.');
      console.log('');
      console.log('💡 Next Steps:');
      console.log('   1. Go to Supabase Dashboard');
      console.log('   2. Run SQL Editor');
      console.log('   3. Execute complete_database_setup.sql');
    } else {
      console.log('❌ NO TABLES FOUND: Database setup needed.');
    }
    
    console.log('');
    console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard/project/cnphlumvgptnvqczehwv');
    console.log('💾 SQL File: complete_database_setup.sql');
    
  } catch (error) {
    console.error('');
    console.error('❌ VERIFICATION FAILED:', error.message);
    console.error('');
    console.error('Possible issues:');
    console.error('1. Network connectivity');
    console.error('2. Supabase credentials');
    console.error('3. Project access permissions');
  }
}

// Run verification
verifyDatabase();
