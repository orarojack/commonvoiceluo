#!/usr/bin/env node

/**
 * Simple verification script for Mozilla sentences
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

async function verifySentences() {
    try {
        console.log('🔍 Verifying Mozilla sentences in database...');
        console.log('================================================');
        
        // Check total sentences
        const { count: totalSentences, error: checkError } = await supabase
            .from('sentences')
            .select('*', { count: 'exact', head: true });
            
        if (checkError) {
            console.log('❌ Error checking sentences:', checkError.message);
            return;
        }
        
        console.log(`📊 Total sentences in database: ${totalSentences}`);
        
        // Check sentences by language
        const { data: languageStats, error: langError } = await supabase
            .from('sentences')
            .select('language_code')
            .then(result => {
                const stats = {};
                if (result.data) {
                    result.data.forEach(row => {
                        stats[row.language_code] = (stats[row.language_code] || 0) + 1;
                    });
                }
                return { data: stats, error: result.error };
            });
            
        if (langError) {
            console.log('⚠️ Could not get language stats:', langError.message);
        } else {
            console.log('🌍 Sentences by language:');
            Object.entries(languageStats).forEach(([lang, count]) => {
                console.log(`   ${lang}: ${count} sentences`);
            });
        }
        
        // Show sample sentences
        const { data: sampleSentences, error: sampleError } = await supabase
            .from('sentences')
            .select('text, language_code, difficulty_level')
            .limit(5);
            
        if (sampleError) {
            console.log('❌ Error getting sample sentences:', sampleError.message);
        } else {
            console.log('');
            console.log('📝 Sample sentences:');
            sampleSentences.forEach((sentence, index) => {
                console.log(`   ${index + 1}. [${sentence.language_code}] ${sentence.text.substring(0, 50)}...`);
            });
        }
        
        // Check if sentences are active
        const { count: activeSentences, error: activeError } = await supabase
            .from('sentences')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
            
        if (!activeError && activeSentences !== null) {
            console.log(`✅ Active sentences available for recording: ${activeSentences}`);
        }
        
        console.log('');
        if (totalSentences > 0) {
            console.log('🎉 Mozilla sentences verification completed successfully!');
            console.log('✨ Your Voice Platform is ready with fresh Mozilla sentences!');
        } else {
            console.log('⚠️ No sentences found. The population may not have worked correctly.');
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

verifySentences();
