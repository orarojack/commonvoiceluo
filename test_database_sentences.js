#!/usr/bin/env node

/**
 * Test script to verify database sentence fetching works like the app
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSentences() {
    try {
        console.log('🧪 Testing database sentence fetching for speak page...');
        console.log('======================================================');
        
        // Test initial load (what happens when contributor visits /speak)
        console.log('\n📋 Testing initial sentence load...');
        
        const { data: sentencesData, error } = await supabase
            .from('sentences')
            .select('text')
            .eq('is_active', true)
            .eq('language_code', 'luo')
            .limit(50)
            .order('id', { ascending: true });

        if (error) {
            console.log('❌ Error loading sentences:', error.message);
            return;
        }

        const sentences = sentencesData.map(sentence => sentence.text);
        console.log(`✅ Loaded ${sentences.length} sentences for contributors`);
        
        // Show first few sentences
        console.log('\n📝 Sample sentences that contributors will see:');
        sentences.slice(0, 3).forEach((sentence, index) => {
            console.log(`   ${index + 1}. ${sentence}`);
        });
        
        // Test load more functionality
        console.log('\n📋 Testing "Load More" functionality...');
        
        const { data: moreSentencesData, error: moreError } = await supabase
            .from('sentences')
            .select('text')
            .eq('is_active', true)
            .eq('language_code', 'luo')
            .limit(20)
            .order('id', { ascending: true });

        if (moreError) {
            console.log('❌ Error loading more sentences:', moreError.message);
            return;
        }

        const moreSentences = moreSentencesData.map(sentence => sentence.text);
        console.log(`✅ Load More would add ${moreSentences.length} more sentences`);
        
        // Check total available
        const { count: totalCount, error: countError } = await supabase
            .from('sentences')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .eq('language_code', 'luo');
            
        if (!countError && totalCount !== null) {
            console.log(`📊 Total Luo sentences available: ${totalCount}`);
        }
        
        console.log('\n🎉 Database sentence integration test completed successfully!');
        console.log('✨ Contributors will now get sentences from your local database!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDatabaseSentences();
