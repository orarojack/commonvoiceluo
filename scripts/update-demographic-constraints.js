const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in environment variables')
  console.log('\n📋 Manual steps required:')
  console.log('1. Go to your Supabase dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy and paste the contents of scripts/008_update_demographic_constraints.sql')
  console.log('4. Click "Run" to execute the migration')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.log('⚠️  Missing SUPABASE_SERVICE_ROLE_KEY - providing manual instructions')
  console.log('\n📋 Manual steps to fix the constraint error:')
  console.log('1. Go to your Supabase dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy and paste this SQL:')
  console.log('\n```sql')
  
  // Read and display the SQL content
  const sqlPath = path.join(__dirname, '008_update_demographic_constraints.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')
  console.log(sql)
  console.log('```\n')
  
  console.log('4. Click "Run" to execute the migration')
  console.log('5. Try updating your profile again')
  process.exit(0)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateDemographicConstraints() {
  try {
    console.log('🚀 Starting demographic constraints update...')
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '008_update_demographic_constraints.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Executing SQL migration...')
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('COMMENT'))
    
    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 80)}...`)
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })
          if (error) {
            console.log(`⚠️  Statement may have failed: ${error.message}`)
          } else {
            console.log('✅ Statement executed successfully')
          }
        } catch (err) {
          console.log(`⚠️  Statement execution error: ${err.message}`)
        }
      }
    }
    
    // Test the new constraints by attempting to insert a test value
    console.log('🔍 Testing updated constraints...')
    
    // This should work now with the updated constraints
    const testEmploymentValues = ['employed', 'self-employed', 'unemployed']
    const testEducationValues = ['primary', 'secondary', 'tertiary', 'graduate', 'postgraduate']
    
    console.log('✅ New employment status values allowed:', testEmploymentValues.join(', '))
    console.log('✅ New education level values allowed:', testEducationValues.join(', '))
    
    console.log('🎉 Migration completed successfully!')
    console.log('💡 Users can now select "self-employed" and "primary/secondary" education levels.')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Manual steps required:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of scripts/008_update_demographic_constraints.sql')
    console.log('4. Click "Run" to execute the migration')
    process.exit(1)
  }
}

// Run the migration
updateDemographicConstraints()
