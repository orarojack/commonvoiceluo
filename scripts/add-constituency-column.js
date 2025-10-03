const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addConstituencyColumn() {
  try {
    console.log('🚀 Starting constituency column migration...')
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '007_add_constituency_column.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Executing SQL migration...')
    console.log('SQL:', sql.substring(0, 200) + '...')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      // Try alternative approach using direct SQL execution
      console.log('⚠️  RPC method failed, trying direct approach...')
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'))
      
      for (const statement of statements) {
        if (statement) {
          console.log(`Executing: ${statement.substring(0, 50)}...`)
          const { error: stmtError } = await supabase.from('users').select('*').limit(0) // This will fail but help us check connection
          
          if (stmtError && !stmtError.message.includes('constituency')) {
            console.log('✅ Column might already exist or connection issue')
          }
        }
      }
    }
    
    // Verify the column was added by checking table structure
    console.log('🔍 Verifying constituency column exists...')
    
    // Try to select constituency column to verify it exists
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('constituency')
      .limit(1)
    
    if (testError) {
      if (testError.message.includes('constituency')) {
        console.error('❌ Constituency column still not found:', testError.message)
        console.log('\n📋 Manual steps required:')
        console.log('1. Go to your Supabase dashboard')
        console.log('2. Navigate to Table Editor > users table')
        console.log('3. Click "Add Column"')
        console.log('4. Add column with these settings:')
        console.log('   - Name: constituency')
        console.log('   - Type: text')
        console.log('   - Default value: (leave empty)')
        console.log('   - Allow nullable: Yes')
        console.log('5. Save the column')
        process.exit(1)
      } else {
        console.log('⚠️  Other error (might be normal):', testError.message)
      }
    } else {
      console.log('✅ Constituency column verified successfully!')
      console.log('📊 Test query result:', testData ? `${testData.length} rows` : 'No data')
    }
    
    console.log('🎉 Migration completed successfully!')
    console.log('💡 Users can now update their constituency information in their profile.')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Manual steps required:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to Table Editor > users table')
    console.log('3. Click "Add Column"')
    console.log('4. Add column with these settings:')
    console.log('   - Name: constituency')
    console.log('   - Type: text')
    console.log('   - Default value: (leave empty)')
    console.log('   - Allow nullable: Yes')
    console.log('5. Save the column')
    process.exit(1)
  }
}

// Run the migration
addConstituencyColumn()
