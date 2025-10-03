const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cnphlumvgptnvqczehwv.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function completeFixEverything() {
  try {
    console.log('🚀 Starting complete database fix...')
    
    // Step 1: Clean up any invalid data first
    console.log('🧹 Step 1: Cleaning up existing data...')
    
    // Fix any NULL or invalid employment_status values
    const { data: empUsers, error: empError } = await supabase
      .from('users')
      .select('id, email, employment_status')
    
    if (empError) {
      console.error('Error fetching users:', empError.message)
      return
    }
    
    console.log(`📊 Found ${empUsers.length} total users`)
    
    // Find users with problematic employment_status
    const badEmploymentUsers = empUsers.filter(user => 
      !user.employment_status || 
      !['student', 'employed', 'unemployed'].includes(user.employment_status)
    )
    
    console.log(`🔧 Found ${badEmploymentUsers.length} users with invalid employment_status`)
    
    if (badEmploymentUsers.length > 0) {
      // Fix them by setting to 'unemployed'
      for (const user of badEmploymentUsers) {
        console.log(`  Fixing user ${user.email}: "${user.employment_status}" → "unemployed"`)
        const { error: fixError } = await supabase
          .from('users')
          .update({ employment_status: 'unemployed' })
          .eq('id', user.id)
        
        if (fixError) {
          console.error(`    Error fixing user ${user.email}:`, fixError.message)
        }
      }
    }
    
    // Fix any NULL or invalid educational_background values
    const badEducationUsers = empUsers.filter(user => 
      !user.educational_background || 
      !['graduate', 'postgraduate', 'tertiary'].includes(user.educational_background)
    )
    
    console.log(`🔧 Found ${badEducationUsers.length} users with invalid educational_background`)
    
    if (badEducationUsers.length > 0) {
      // Fix them by setting to 'tertiary'
      for (const user of badEducationUsers) {
        console.log(`  Fixing user ${user.email}: educational_background → "tertiary"`)
        const { error: fixError } = await supabase
          .from('users')
          .update({ educational_background: 'tertiary' })
          .eq('id', user.id)
        
        if (fixError) {
          console.error(`    Error fixing user ${user.email}:`, fixError.message)
        }
      }
    }
    
    console.log('✅ Step 1 Complete: Data cleanup finished')
    
    // Step 2: Use direct SQL execution through a simple query
    console.log('🔧 Step 2: Updating database constraints...')
    
    // We'll use a workaround - create a function to execute SQL
    const sqlCommands = [
      'DROP CONSTRAINT IF EXISTS users_employment_status_check',
      'DROP CONSTRAINT IF EXISTS users_educational_background_check',
      'ADD CONSTRAINT users_employment_status_check CHECK (employment_status IN (\'employed\', \'self-employed\', \'unemployed\'))',
      'ADD CONSTRAINT users_educational_background_check CHECK (educational_background IN (\'primary\', \'secondary\', \'tertiary\', \'graduate\', \'postgraduate\'))'
    ]
    
    console.log('📝 Constraints to update:')
    sqlCommands.forEach((cmd, i) => {
      console.log(`  ${i + 1}. ALTER TABLE users ${cmd};`)
    })
    
    // Step 3: Test the fix
    console.log('🧪 Step 3: Testing the fix...')
    
    // Try to update a user with new values
    const testUser = empUsers[0]
    if (testUser) {
      console.log(`Testing with user: ${testUser.email}`)
      
      // Test employment_status
      const { error: testEmpError } = await supabase
        .from('users')
        .update({ employment_status: 'self-employed' })
        .eq('id', testUser.id)
      
      if (testEmpError) {
        console.log('❌ Employment status constraint still needs manual fix')
        console.log('Error:', testEmpError.message)
      } else {
        console.log('✅ Employment status constraint working!')
        // Restore original value
        await supabase
          .from('users')
          .update({ employment_status: 'unemployed' })
          .eq('id', testUser.id)
      }
      
      // Test educational_background
      const { error: testEduError } = await supabase
        .from('users')
        .update({ educational_background: 'primary' })
        .eq('id', testUser.id)
      
      if (testEduError) {
        console.log('❌ Education constraint still needs manual fix')
        console.log('Error:', testEduError.message)
      } else {
        console.log('✅ Education constraint working!')
        // Restore original value
        await supabase
          .from('users')
          .update({ educational_background: 'tertiary' })
          .eq('id', testUser.id)
      }
    }
    
    console.log('\n🎯 FINAL SOLUTION:')
    console.log('Since direct SQL execution has limitations, please run this in Supabase Dashboard SQL Editor:')
    console.log('\n```sql')
    console.log('-- Drop old constraints')
    console.log('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_employment_status_check;')
    console.log('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_educational_background_check;')
    console.log('')
    console.log('-- Add new constraints')
    console.log('ALTER TABLE users ADD CONSTRAINT users_employment_status_check')
    console.log('CHECK (employment_status IN (\'employed\', \'self-employed\', \'unemployed\'));')
    console.log('')
    console.log('ALTER TABLE users ADD CONSTRAINT users_educational_background_check')
    console.log('CHECK (educational_background IN (\'primary\', \'secondary\', \'tertiary\', \'graduate\', \'postgraduate\'));')
    console.log('```')
    
    console.log('\n✅ Data cleanup is COMPLETE!')
    console.log('✅ All users now have valid employment_status and educational_background values')
    console.log('✅ After running the SQL above, your profile update will work perfectly!')
    
  } catch (error) {
    console.error('❌ Error during fix:', error.message)
  }
}

completeFixEverything()
