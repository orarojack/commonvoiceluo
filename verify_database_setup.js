#!/usr/bin/env node

/**
 * Database Setup Verification Script
 * This script verifies that the Voice Platform database tables were created correctly
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    console.error('');
    console.error('Please set these in your environment or create a .env.local file');
    process.exit(1);
}

console.log('🔍 Verifying Voice Platform Database Setup');
console.log('===============================================');
console.log(`📡 Connected to: ${SUPABASE_URL.substring(0, 30)}...`);

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyDatabaseSetup() {
    const checks = [];
    
    try {
        console.log('🔧 Checking database tables...');
        
        // Check 1: Verify tables exist
        const expectedTables = ['users', 'recordings', 'reviews', 'sentences'];
        console.log('\n📋 Checking table existence:');
        
        for (const tableName of expectedTables) {
            try {
                const { data, error, count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    console.log(`❌ Table ${tableName}: ${error.message}`);
                    checks.push({ table: tableName, status: 'not_found', error: error.message });
                } else {
                    console.log(`✅ Table ${tableName}: Found (${count || 'undefined'} records)`);
                    checks.push({ table: tableName, status: 'found', count: count || 0 });
                }
            } catch (e) {
                console.log(`❌ Table ${tableName}: ${e.message}`);
                checks.push({ table: tableName, status: 'error', error: e.message });
            }
        }
        
        // Check 2: Verify sample users
        console.log('\n👥 Checking sample users:');
        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('email, role, status, name')
                .in('email', [
                    'admin@commonvoice.org',
                    'reviewer@example.com',
                    'contributor@example.com',
                    'alice@example.com'
                ]);
            
            if (error) {
                console.log(`❌ Users query failed: ${error.message}`);
            } else {
                const expectedUsers = [
                    { email: 'admin@commonvoice.org', role: 'admin' },
                    { email: 'reviewer@example.com', role: 'reviewer' },
                    { email: 'contributor@example.com', role: 'contributor' },
                    { email: 'alice@example.com', role: 'contributor' }
                ];
                
                for (const expected of expectedUsers) {
                    const found = users.find(u => u.email === expected.email);
                    if (found) {
                        console.log(`✅ ${found.email} (${found.role}) - ${found.status}`);
                    } else {
                        console.log(`❌ Missing user: ${expected.email}`);
                    }
                }
            }
        } catch (e) {
            console.log(`❌ Users check failed: ${e.message}`);
        }
        
        // Check 3: Verify sample recordings
        console.log('\n🎵 Checking sample recordings:');
        try {
            const { data: recordings, error } = await supabase
                .from('recordings')
                .select('id, sentence, status, quality, duration')
                .limit(5);
            
            if (error) {
                console.log(`❌ Recordings query failed: ${error.message}`);
            } else {
                const statusCounts = {};
                recordings.forEach(r => {
                    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
                });
                
                console.log(`✅ Found ${recordings.length} recordings:`);
                Object.entries(statusCounts).forEach(([status, count]) => {
                    console.log(`   ${status}: ${count}`);
                });
            }
        } catch (e) {
            console.log(`❌ Recordings check failed: ${e.message}`);
        }
        
        // Check 4: Verify sample reviews
        console.log('\n📝 Checking sample reviews:');
        try {
            const { data: reviews, error } = await supabase
                .from('reviews')
                .select['id, decision, confidence, notes')
                .limit(5);
            
            if (error) {
                console.log(`❌ Reviews query failed: ${error.message}`);
            } else {
                console.log(`✅ Found ${reviews.length} reviews`);
            }
        } catch (e) {
            console.log(`❌ Reviews check failed: ${e.message}`);
        }
        
        // Check 5: Test database connectivity with auth
        console.log('\n🔐 Testing database connectivity:');
        try {
            // Try a simple count query on each table
            const tableCounts = {};
            
            for (const tableName of expectedTables) {
                const { count, error } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    tableCounts[tableName] = `Error: ${error.message}`;
                } else {
                    tableCounts[tableName] = count || 0;
                }
            }
            
            console.log('📊 Record counts by table:');
            Object.entries(tableCounts).forEach(([table, count]) => {
                console.log(`   ${table}: ${count}`);
            });
            
        } catch (e) {
            console.log(`❌ Connectivity test failed: ${e.message}`);
        }
        
        // Summary
        console.log('\n🎯 Verification Summary');
        console.log('======================');
        
        const tableCheck = checks.filter(c => c.status === 'found');
        const failedCheck = checks.filter(c => c.status !== 'found');
        
        if (tableCheck.length === expectedTables.length && failedCheck.length === 0) {
            console.log('🎉 All database tables verified successfully!');
            console.log('');
            console.log('✨ Your Voice Platform database is ready to use');
            console.log('');
            console.log('📋 Sample accounts available for testing:');
            console.log('   Admin: admin@commonvoice.org / admin123');
            console.log('   Reviewer: reviewer@example.com / reviewer123');
            console.log('   Contributor: contributor@example.com / contributor123');
            console.log('   Contributor: alice@example.com / alice123');
            console.log('');
            console.log('🚀 You can now start your application and test the functionality!');
            
        } else {
            console.log('⚠️ Some database tables could not be verified');
            console.log('');
            console.log('Failed checks:');
            failedCheck.forEach(check => {
                console.log(`   ❌ ${check.table}: ${check.error || 'Unknown error'}`);
            });
            console.log('');
            console.log('💡 Troubleshooting tips:');
            console.log('   1. Verify your Supabase connection details are correct');
            console.log('   2. Check that the database setup script was executed successfully');
            console.log('   3. Ensure you have the necessary permissions to read from the tables');
            console.log('   4. Try running the setup script again if tables are missing');
        }
        
    } catch (error) {
        console.error('💥 Verification failed:', error.message);
        console.error('');
        console.error('This might indicate:');
        console.error('1. Database connection issues');
        console.error('2. Incorrect Supabase credentials');
        console.error('3. Tables were not created properly');
        console.error('4. Permission issues with the API key');
        process.exit(1);
    }
}

// Run verification
verifyDatabaseSetup().catch(error => {
    console.error('💥 Fatal error during verification:', error);
    process.exit(1);
});
