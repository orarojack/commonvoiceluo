#!/usr/bin/env node

/**
 * Create sentences table specifically
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cnphlumvgptnvqczehwv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE'
);

async function createSentencesTable() {
  console.log('🔄 Creating sentences table...');
  
  // First, let's check if table exists
  try {
    const { data, error } = await supabase
      .from('sentences')
      .select('id')
      .limit(1);
      
    if (!error) {
      console.log('✅ Sentences table already exists!');
      return true;
    }
  } catch (err) {
    console.log('Table does not exist yet, creating...');
  }
  
  // Try to create table using direct SQL
  try {
    const response = await fetch('https://cnphlumvgptnvqczehwv.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE'
      },
      body: JSON.stringify({
        sql: `CREATE TABLE IF NOT EXISTS sentences (
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
        );`
      })
    });
    
    if (response.ok) {
      console.log('✅ Sentences table created successfully');
    } else {
      console.log('⚠️ Note:', await response.text());
    }
  } catch (error) {
    console.log('⚠️ Note:', error.message);
  }
  
  // Verify table creation
  try {
    const { data, error } = await supabase
      .from('sentences')
      .select('id')
      .limit(1);
      
    if (!error) {
      console.log('✅ Sentences table verified and accessible');
      
      // Insert sample sentences
      console.log('🔄 Inserting sample sentences...');
      
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
      
      const { data: insertData, error: insertError } = await supabase
        .from('sentences')
        .upsert(sampleSentences, { onConflict: 'mozilla_id' })
        .select();
        
      if (!insertError && insertData) {
        console.log('✅ Sample sentences inserted:', insertData.length);
      } else {
        console.log('⚠️ Sentence insertion note:', insertError?.message || 'Unknown error');
      }
      
    } else {
      console.log('❌ Sentences table still not accessible:', error.message);
    }
  } catch (error) {
    console.log('❌ Error verifying sentences table:', error.message);
  }
}

createSentencesTable().then(() => {
  console.log('');
  console.log('🎉 Setup completed!');
  console.log('Check your Supabase dashboard for all tables.');
});
