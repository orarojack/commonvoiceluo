const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cnphlumvgptnvqczehwv.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNucGhsdW12Z3B0bnZxY3plaHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE0OTQ0MywiZXhwIjoyMDY5NzI1NDQzfQ.J1J_mYFvNG-EKvEbadCrmtAr6sNa86_mS0dFiSySIiE'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runDemographicsMigration() {
  try {
    console.log('🚀 Running demographics migration...')
    
    // Check current table structure
    const { data: columns, error: columnsError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (columnsError) {
      console.error('Error checking table structure:', columnsError.message)
      return
    }
    
    console.log('📊 Current table columns:', Object.keys(columns[0] || {}))
    
    // Add demographic columns with updated constraints
    console.log('📝 Adding demographic columns with updated constraints...')
    
    const migrationSQL = `
-- Add demographic columns with updated constraints
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS language_dialect VARCHAR(50) CHECK (language_dialect IN ('Milambo', 'Nyanduat')),
ADD COLUMN IF NOT EXISTS educational_background VARCHAR(50) CHECK (educational_background IN ('primary', 'secondary', 'tertiary', 'graduate', 'postgraduate')),
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) CHECK (employment_status IN ('employed', 'self-employed', 'unemployed')),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS constituency TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);
CREATE INDEX IF NOT EXISTS idx_users_language_dialect ON users(language_dialect);
CREATE INDEX IF NOT EXISTS idx_users_educational_background ON users(educational_background);
CREATE INDEX IF NOT EXISTS idx_users_employment_status ON users(employment_status);
CREATE INDEX IF NOT EXISTS idx_users_constituency ON users(constituency);
`
    
    console.log('SQL to run:')
    console.log(migrationSQL)
    
    console.log('\n📋 Please run this SQL in Supabase Dashboard SQL Editor:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Copy and paste the SQL above')
    console.log('3. Click "Run"')
    console.log('4. Try updating your profile again')
    
    console.log('\n✅ This will add all demographic columns with the correct constraints!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

runDemographicsMigration()
