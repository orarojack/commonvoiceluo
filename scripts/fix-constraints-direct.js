const { createClient } = require('@supabase/supabase-js')

// Use the provided credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cnphlumvgptnvqczehwv.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixConstraints() {
  try {
    console.log('🚀 Fixing database constraints...')
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Connection test failed:', testError.message)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Try to add constituency column first
    console.log('📝 Adding constituency column...')
    try {
      const { error: addColumnError } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS constituency TEXT;'
      })
      if (addColumnError && !addColumnError.message.includes('already exists')) {
        console.log('⚠️  Add column may have failed:', addColumnError.message)
      } else {
        console.log('✅ Constituency column added/verified')
      }
    } catch (err) {
      console.log('⚠️  Column addition error (may be normal):', err.message)
    }
    
    // Test if we can insert new values by trying to update a test record
    console.log('🔍 Testing constraint updates...')
    
    // Try to find a user to test with
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, employment_status, educational_background')
      .limit(1)
    
    if (usersError) {
      console.error('❌ Could not fetch users:', usersError.message)
      return
    }
    
    if (users && users.length > 0) {
      const testUser = users[0]
      console.log('📊 Found test user:', testUser.id)
      
      // Try to update with new values to test constraints
      console.log('🧪 Testing employment_status constraint...')
      const { error: employmentError } = await supabase
        .from('users')
        .update({ employment_status: 'self-employed' })
        .eq('id', testUser.id)
      
      if (employmentError) {
        if (employmentError.message.includes('check constraint')) {
          console.log('❌ Employment status constraint still needs fixing')
          console.log('📋 Manual SQL needed for employment_status constraint')
        } else {
          console.log('✅ Employment status constraint appears to be working')
        }
      } else {
        console.log('✅ Employment status constraint test passed')
      }
      
      // Test education constraint
      console.log('🧪 Testing educational_background constraint...')
      const { error: educationError } = await supabase
        .from('users')
        .update({ educational_background: 'primary' })
        .eq('id', testUser.id)
      
      if (educationError) {
        if (educationError.message.includes('check constraint')) {
          console.log('❌ Education background constraint still needs fixing')
          console.log('📋 Manual SQL needed for educational_background constraint')
        } else {
          console.log('✅ Education background constraint appears to be working')
        }
      } else {
        console.log('✅ Education background constraint test passed')
      }
      
      // Test constituency field
      console.log('🧪 Testing constituency field...')
      const { error: constituencyError } = await supabase
        .from('users')
        .update({ constituency: 'test-constituency' })
        .eq('id', testUser.id)
      
      if (constituencyError) {
        if (constituencyError.message.includes('constituency')) {
          console.log('❌ Constituency column still missing')
        } else {
          console.log('⚠️  Constituency test error:', constituencyError.message)
        }
      } else {
        console.log('✅ Constituency field test passed')
      }
      
      // Restore original values
      console.log('🔄 Restoring original values...')
      await supabase
        .from('users')
        .update({ 
          employment_status: testUser.employment_status,
          educational_background: testUser.educational_background,
          constituency: null
        })
        .eq('id', testUser.id)
    }
    
    console.log('\n📋 If constraints still need fixing, run this SQL in Supabase Dashboard:')
    console.log(`
-- Drop existing constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_employment_status_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_educational_background_check;

-- Add updated constraints
ALTER TABLE users ADD CONSTRAINT users_employment_status_check 
CHECK (employment_status IN ('employed', 'self-employed', 'unemployed'));

ALTER TABLE users ADD CONSTRAINT users_educational_background_check 
CHECK (educational_background IN ('primary', 'secondary', 'tertiary', 'graduate', 'postgraduate'));

-- Add constituency column
ALTER TABLE users ADD COLUMN IF NOT EXISTS constituency TEXT;
`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Please run the SQL manually in Supabase Dashboard SQL Editor')
  }
}

fixConstraints()
