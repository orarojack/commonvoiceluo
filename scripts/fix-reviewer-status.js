// Script to fix existing reviewer users with is_active: false
// Run this script to update existing reviewers to have is_active: true

const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixReviewerStatus() {
  try {
    console.log('🔍 Checking for reviewers with is_active: false...')
    
    // Get all reviewers with is_active: false
    const { data: reviewers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'reviewer')
      .eq('is_active', false)
    
    if (fetchError) {
      console.error('❌ Error fetching reviewers:', fetchError)
      return
    }
    
    if (!reviewers || reviewers.length === 0) {
      console.log('✅ No reviewers found with is_active: false')
      return
    }
    
    console.log(`📋 Found ${reviewers.length} reviewers with is_active: false:`)
    reviewers.forEach(reviewer => {
      console.log(`  - ${reviewer.email} (status: ${reviewer.status})`)
    })
    
    // Update all reviewers to have is_active: true
    const { data: updatedUsers, error: updateError } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('role', 'reviewer')
      .eq('is_active', false)
      .select()
    
    if (updateError) {
      console.error('❌ Error updating reviewers:', updateError)
      return
    }
    
    console.log(`✅ Successfully updated ${updatedUsers.length} reviewers to is_active: true`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
fixReviewerStatus()
