const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugUserIssue() {
  try {
    console.log('🔍 Debugging user database issue...')
    
    // Get all users from the database
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, name, profile_complete, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (allUsersError) {
      console.error('Error fetching users:', allUsersError)
      return
    }
    
    console.log(`\n📊 Found ${allUsers.length} users in database:`)
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name || 'Not set'}`)
      console.log(`   Profile Complete: ${user.profile_complete}`)
      console.log(`   Created: ${user.created_at}`)
      console.log('')
    })
    
    // Check if the specific user ID from the error exists
    const problemUserId = '1dfa8f41-ad8d-419d-9743-06c7663218df'
    console.log(`\n🔍 Checking for specific user ID: ${problemUserId}`)
    
    const { data: specificUser, error: specificError } = await supabase
      .from('users')
      .select('*')
      .eq('id', problemUserId)
      .single()
    
    if (specificError) {
      console.log(`❌ User with ID ${problemUserId} not found:`, specificError.message)
    } else {
      console.log(`✅ User found:`, specificUser)
    }
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

debugUserIssue()
