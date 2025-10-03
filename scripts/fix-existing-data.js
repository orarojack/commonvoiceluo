const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cnphlumvgptnvqczehwv.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixExistingData() {
  try {
    console.log('🔍 Checking existing user data...')
    
    // Check users with invalid employment_status
    const { data: invalidEmployment, error: empError } = await supabase
      .from('users')
      .select('id, email, employment_status')
      .not('employment_status', 'in', '("student","employed","unemployed")')
    
    if (empError) {
      console.error('Error checking employment status:', empError.message)
    } else {
      console.log(`📊 Found ${invalidEmployment?.length || 0} users with invalid employment_status`)
      if (invalidEmployment && invalidEmployment.length > 0) {
        console.log('Invalid employment_status values:')
        invalidEmployment.forEach(user => {
          console.log(`  - User ${user.email}: "${user.employment_status}"`)
        })
      }
    }
    
    // Check users with invalid educational_background
    const { data: invalidEducation, error: eduError } = await supabase
      .from('users')
      .select('id, email, educational_background')
      .not('educational_background', 'in', '("graduate","postgraduate","tertiary")')
    
    if (eduError) {
      console.error('Error checking education background:', eduError.message)
    } else {
      console.log(`📊 Found ${invalidEducation?.length || 0} users with invalid educational_background`)
      if (invalidEducation && invalidEducation.length > 0) {
        console.log('Invalid educational_background values:')
        invalidEducation.forEach(user => {
          console.log(`  - User ${user.email}: "${user.educational_background}"`)
        })
      }
    }
    
    // Fix NULL or invalid employment_status values
    console.log('🔧 Fixing employment_status values...')
    const { data: fixedEmployment, error: fixEmpError } = await supabase
      .from('users')
      .update({ employment_status: 'unemployed' })
      .or('employment_status.is.null,employment_status.not.in.(student,employed,unemployed)')
      .select('id, email')
    
    if (fixEmpError) {
      console.error('Error fixing employment_status:', fixEmpError.message)
    } else {
      console.log(`✅ Fixed employment_status for ${fixedEmployment?.length || 0} users`)
    }
    
    // Fix NULL or invalid educational_background values
    console.log('🔧 Fixing educational_background values...')
    const { data: fixedEducation, error: fixEduError } = await supabase
      .from('users')
      .update({ educational_background: 'tertiary' })
      .or('educational_background.is.null,educational_background.not.in.(graduate,postgraduate,tertiary)')
      .select('id, email')
    
    if (fixEduError) {
      console.error('Error fixing educational_background:', fixEduError.message)
    } else {
      console.log(`✅ Fixed educational_background for ${fixedEducation?.length || 0} users`)
    }
    
    console.log('\n📋 Now run this SQL in Supabase Dashboard to update constraints:')
    console.log(`
-- Drop existing constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_employment_status_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_educational_background_check;

-- Add updated constraints with new values
ALTER TABLE users ADD CONSTRAINT users_employment_status_check 
CHECK (employment_status IN ('employed', 'self-employed', 'unemployed'));

ALTER TABLE users ADD CONSTRAINT users_educational_background_check 
CHECK (educational_background IN ('primary', 'secondary', 'tertiary', 'graduate', 'postgraduate'));
`)
    
    console.log('🎉 Data cleanup completed!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixExistingData()
