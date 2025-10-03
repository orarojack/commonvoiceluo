#!/usr/bin/env node

/**
 * Populate Sample Data
 * Inserts sample users, recordings, and sentences
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🌱 POPULATION SAMPLE DATA');
console.log('=========================');
console.log('');

async function insertSampleData() {
  try {
    console.log('👥 Inserting sample users...');
    
    const sampleUsers = [
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
        employment_status: 'unemployed',
        educational_background: 'secondary',
        constituency: 'Kisumu Central',
        phone_number: '+254712345678'
      }
    ];
    
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .upsert(sampleUsers, { onConflict: 'email' })
      .select();
      
    if (!usersError) {
      console.log(`✅ Inserted/updated ${usersData.length} users`);
    } else {
      console.log(`⚠️ Users: ${usersError.message}`);
    }
    
    console.log('');
    console.log('📝 Inserting sample sentences...');
    
    const sampleSentences = [
      {
        mozilla_id: 'curated_en_001',
        text: 'The quick brown fox jumps over the lazy dog.',
        language_code: 'en',
        source: 'curated',
        version: 1,
        is_validated: true,
        taxonomy: { Licence: 'Curated' },
        difficulty_level: 'basic',
        word_count: 9,
        character_count: 44
      },
      {
        mozilla_id: 'curated_en_002',
        text: 'A journey of a thousand miles begins with a single step.',
        language_code: 'en',
        source: 'curated',
        version: 1,
        is_validated: true,
        taxonomy: { Licence: 'Curated' },
        difficulty_level: 'medium',
        word_count: 10,
        character_count: 58
      },
      {
        mozilla_id: 'curated_en_003',
        text: 'Practice makes perfect in all endeavors.',
        language_code: 'en',
        source: 'curated',
        version: 1,
        is_validated: true,
        taxonomy: { Licence: 'Curated' },
        difficulty_level: 'medium',
        word_count: 6,
        character_count: 42
      },
      {
        mozilla_id: 'curated_luo_001',
        text: 'Onge ranyisi moro amora ma oseket e yor chik ma nyiso ni wachno en adier.',
        language_code: 'luo',
        source: 'curated',
        version: 1,
        is_validated: true,
        taxonomy: { Licence: 'Curated' },
        difficulty_level: 'medium',
        word_count: 15,
        character_count: 80
      },
      {
        mozilla_id: 'curated_luo_002',
        text: 'Chakruok e piny ni kaka gi chakruok e yor chik ma nyiso ni wachno en adier.',
        language_code: 'luo',
        source: 'curated',
        version: 1,
        is_validated: true,
        taxonomy: { Licence: 'Curated' },
        difficulty_level: 'medium',
        word_count: 15,
        character_count: 85
      }
    ];
    
    const { data: sentencesData, error: sentencesError } = await supabase
      .from('sentences')
      .upsert(sampleSentences, { onConflict: 'mozilla_id' })
      .select();
      
    if (!sentencesError) {
      console.log(`✅ Inserted/updated ${sentencesData.length} sentences`);
    } else {
      console.log(`⚠️ Sentences: ${sentencesError.message}`);
    }
    
    console.log('');
    console.log('🎉 SAMPLE DATA POPULATION COMPLETE!');
    console.log('===================================');
    console.log('');
    console.log('✅ Login Credentials:');
    console.log('  • admin@commonvoice.org (admin123) - Admin');
    console.log('  • reviewer@example.com (reviewer123) - Reviewer');
    console.log('  • contributor@example.com (contributor123) - Contributor');
    console.log('');
    console.log('✅ Ready for:');
    console.log('  • User authentication');
    console.log('  • Voice recording');
    console.log('  • Review process');
    console.log('  • Mozilla API integration');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

insertSampleData();
