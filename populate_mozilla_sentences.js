#!/usr/bin/env node

/**
 * Mozilla Sentences Populator
 * 
 * This script fetches sentences from the Mozilla Common Voice API
 * and populates them into the Voice Platform database.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const MOZILLA_API_BASE = 'https://api.commonvoice.mozilla.org';
const CLIENT_ID = 'cv_TrIdm8nuOC';
const CLIENT_SECRET = 'VXV79s_cQMpHZAa2DMzyX';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Cache for access token
let accessToken = null;
let tokenExpiry = 0;

/**
 * Get access token from Mozilla API
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    console.log('🔑 Getting Mozilla API access token...');
    
    const response = await fetch(`${MOZILLA_API_BASE}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    accessToken = data.token || null;
    tokenExpiry = Date.now() + (24 * 60 * 60 * 1000) - 60000; // 24 hours with 1 minute buffer
    
    if (!accessToken) {
      throw new Error('No token received from Mozilla API');
    }
    
    console.log('✅ Access token obtained successfully');
    return accessToken;
  } catch (error) {
    console.error('❌ Error getting Mozilla API access token:', error.message);
    throw error;
  }
}

/**
 * Fetch sentences from Mozilla API
 */
async function fetchMozillaSentences(options = {}) {
  const languageCode = options.languageCode || 'luo';
  const limit = options.limit || 100;
  const offset = options.offset || 0;
  const taxonomy = options.taxonomy || 'NOODL';

  try {
    console.log(`📥 Fetching ${limit} sentences (offset: ${offset}) for language: ${languageCode}`);
    
    const token = await getAccessToken();
    
    const params = new URLSearchParams({
      languageCode,
      limit: limit.toString(),
      offset: offset.toString(),
      'taxonomy[Licence]': taxonomy,
    });

    const response = await fetch(`${MOZILLA_API_BASE}/text/sentences?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sentences: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched ${data.data.length} sentences`);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching sentences:', error.message);
    throw error;
  }
}

/**
 * Calculate sentence difficulty and word count
 */
function analyzeSentence(text) {
  const cleanText = text.trim();
  const words = cleanText.split(/\s+/).filter(word => word.length > 0);
  const characters = cleanText.length;
  
  let difficulty = 'medium';
  if (words.length <= 5 || characters <= 30) {
    difficulty = 'basic';
  } else if (words.length >= 15 || characters >= 100) {
    difficulty = 'advanced';
  }
  
  return {
    wordCount: words.length,
    characterCount: characters,
    difficultyLevel: difficulty
  };
}

/**
 * Store sentences in the database
 */
async function storeSentences(sentences, languageCode = 'luo', source = 'mozilla') {
  console.log(`💾 Storing ${sentences.length} sentences in database...`);
  
  const sentencesToStore = sentences.map(sentence => {
    const analysis = analyzeSentence(sentence.text);
    
    return {
      mozilla_id: sentence.id.toString(),
      text: sentence.text,
      language_code: languageCode,
      source: source,
      bucket: sentence.bucket || null,
      hash: sentence.hash || null,
      version: sentence.version || 1,
      clips_count: sentence.clipsCount || 0,
      has_valid_clip: sentence.hasValidClip === 1,
      is_validated: sentence.isValidated === 1,
      taxonomy: sentence.taxonomy || {},
      metadata: {
        mozilla_created_at: sentence.createdAt,
        language_code: sentence.languageCode
      },
      difficulty_level: analysis.difficultyLevel,
      word_count: analysis.wordCount,
      character_count: analysis.characterCount,
    };
  });

  try {
    const { data, error } = await supabase
      .from('sentences')
      .upsert(sentencesToStore, {
        onConflict: 'mozilla_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully stored ${sentencesToStore.length} sentences`);
    return data;
  } catch (error) {
    console.error('❌ Error storing sentences:', error.message);
    throw error;
  }
}

/**
 * Get statistics about stored sentences
 */
async function getSentencesStats() {
  try {
    const { data: stats, error } = await supabase
      .from('sentences')
      .select(`
        language_code,
        source,
        difficulty_level,
        count:count(*)
      `)
      .eq('is_active',true);

    if (error) throw error;

    console.log('\n📊 Sentenced Statistics:');
    console.log('========================');
    
    // Group by language
    const languageStats = {};
    const sourceStats = {};
    const difficultyStats = {};
    
    stats.forEach(stat => {
      const lang = stat.language_code;
      const src = stat.source;
      const diff = stat.difficulty_level;
      const count = stat.count;
      
      languageStats[lang] = (languageStats[lang] || 0) + count;
      sourceStats[src] = (sourceStats[src] || 0) + count;
      difficultyStats[diff] = (difficultyStats[diff] || 0) + count;
    });
    
    console.log('By Language:');
    Object.entries(languageStats).forEach(([lang, count]) => {
      console.log(`  ${lang}: ${count} sentences`);
    });
    
    console.log('\nBy Source:');
    Object.entries(sourceStats).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} sentences`);
    });
    
    console.log('\nBy Difficulty:');
    Object.entries(difficultyStats).forEach(([difficulty, count]) => {
      console.log(`  ${difficulty}: ${count} sentences`);
    });
    
  } catch (error) {
    console.error('❌ Error getting statistics:', error.message);
  }
}

/**
 * Main function to populate Mozilla sentences
 */
async function populateMozillaSentences(options = {}) {
  const {
    languageCode = 'luo',
    maxSentences = null,
    batchSize = 100,
    source = 'mozilla'
  } = options;

  try {
    console.log('🚀 Starting Mozilla sentences population...');
    console.log(`Configuration: lang=${languageCode}, batch=${batchSize}, max=${maxSentences || 'unlimited'}`);
    
    let totalStored = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // Check if we've reached the maximum
      if (maxSentences && totalStored >= maxSentences) {
        console.log(`✅ Reached maximum number of sentences (${maxSentences})`);
        break;
      }

      // Adjust batch size if we're approaching the max
      let currentBatchSize = batchSize;
      if (maxSentences && totalStored + currentBatchSize > maxSentences) {
        currentBatchSize = maxSentences - totalStored;
      }

      // Fetch sentences from Mozilla API
      const apiResponse = await fetchMozillaSentences({
        languageCode,
        limit: currentBatchSize,
        offset,
      });

      const sentences = apiResponse.data;
      
      if (!sentences || sentences.length === 0) {
        console.log('ℹ️ No more sentences available from Mozilla API');
        break;
      }

      // Store sentences in database
      await storeSentences(sentences, languageCode, source);
      
      totalStored += sentences.length;
      offset += currentBatchSize;
      
      console.log(`📈 Progress: ${totalStored} sentences stored so far`);
      
      // Check if we have more data
      hasMore = sentences.length === currentBatchSize;
      
      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`🎉 Successfully populated ${totalStored} sentences from Mozilla API`);
    
    // Show final statistics
    await getSentencesStats();
    
    return {
      totalStored,
      languageCode,
      source
    };

  } catch (error) {
    console.error('❌ Error populating Mozilla sentences:', error.message);
    throw error;
  }
}

/**
 * Populate curated sentences as fallback
 */
async function populateCuratedSentences() {
  const curatedSentences = [
    // English sentences
    "The quick brown fox jumps over the lazy dog.",
    "A journey of a thousand miles begins with a single step.",
    "To be or not to be, that is the question.",
    "The sun rises in the east and sets in the west.",
    "Practice makes perfect in all endeavors.",
    "Knowledge is power, but wisdom is knowing how to use it.",
    "Time heals all wounds, but memories last forever.",
    "Actions speak louder than words in every situation.",
    "The early bird catches the worm every morning.",
    "Where there's a will, there's always a way forward.",
    "Innovation distinguishes between a leader and a follower.",
    "The only way to do great work is to love what you do.",
    "Life is what happens to you while you're busy making other plans.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "It is during our darkest moments that we must focus to see the light.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The way to get started is to quit talking and begin doing.",
    "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.",
    "The only impossible journey is the one you never begin.",
    "Believe you can and you're halfway there.",
    
    // Luo language sentences (Dholuo)
    "Onge ranyisi moro amora ma oseket e yor chik ma nyiso ni wachno en adier.",
    "Chakruok e piny ni kaka gi chakruok e yor chik ma nyiso ni wachno en adier.",
    "Wachni e piny ni kaka gi wachni e yor chik ma nyiso ni wachno en adier.",
    "Kaka gi wachni e piny ni kaka gi wachni e yor chik ma nyiso ni wachno en adier.",
    "Wachni e piny ni kaka gi wachni e yor chik ma nyiso ni wachno en adier.",
    "Chakruok e piny ni kaka gi chakruok e yor chik ma nyiso ni wachno en adier.",
  ];

  console.log(`📚 Populating ${curatedSentences.length} curated sentences...`);
  
  const sentencesToStore = curatedSentences.map((text, index) => {
    const analysis = analyzeSentence(text);
    const isLuo = text.includes('piny') || text.includes('wachno') || text.includes('chik');
    
    return {
      mozilla_id: `curated_${Date.now()}_${index}`,
      text: text,
      language_code: isLuo ? 'luo' : 'en',
      source: 'curated',
      version: 1,
      clips_count: 0,
      has_valid_clip: false,
      is_validated: true,
      taxonomy: { Licence: 'Curated' },
      metadata: { curated_at: new Date().toISOString() },
      difficulty_level: analysis.difficultyLevel,
      word_count: analysis.wordCount,
      character_count: analysis.characterCount,
    };
  });

  try {
    const { data, error } = await supabase
      .from('sentences')
      .upsert(sentencesToStore, {
        onConflict: 'mozilla_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) throw error;

    console.log(`✅ Successfully stored ${curatedSentences.length} curated sentences`);
    return data;
  } catch (error) {
    console.error('❌ Error storing curated sentences:', error.message);
    throw error;
  }
}

// CLI functionality
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'mozilla';
  const languageCode = args[1] || 'luo';
  const maxSentences = parseInt(args[2]) || 1000;

  async function main() {
    try {
      switch (command) {
        case 'mozilla':
          await populateMozillaSentences({
            languageCode,
            maxSentences,
            batchSize: 50
          });
          break;
          
        case 'curated':
          await populateCuratedSentences();
          break;
          
        case 'stats':
          await getSentencesStats();
          break;
          
        case 'all':
          console.log('🔄 Populating both Mozilla and curated sentences...');
          await populateCuratedSentences();
          await populateMozillaSentences({
            languageCode,
            maxSentences: Math.max(0, maxSentences - 50) // Reduce max for Mozilla since we added curated
          });
          break;
          
        default:
          console.log('📖 Usage:');
          console.log('  node populate_mozilla_sentences.js mozilla [lang] [max]  - Populate from Mozilla API');
          console.log('  node populate_mozilla_sentences.js curated             - Populate curated sentences');
          console.log('  node populate_mozilla_sentences.js stats                - Show statistics');
          console.log('  node populate_mozilla_sentences.js all [lang] [max]     - Populate both sources');
          console.log('');
          console.log('Examples:');
          console.log('  node populate_mozilla_sentences.js mozilla luo 500');
          console.log('  node populate_mozilla_sentences.js all en 1000');
          process.exit(0);
      }
      
      console.log('\n🎉 Sentence population completed successfully!');
      process.exit(0);
      
    } catch (error) {
      console.error('\n💥 Fatal error:', error.message);
      process.exit(1);
    }
  }

  main();
}

module.exports = {
  populateMozillaSentences,
  populateCuratedSentences,
  getSentencesStats,
  analyzeSentence
};
