import { NextRequest, NextResponse } from 'next/server'

const MOZILLA_API_BASE = 'https://api.commonvoice.mozilla.org'
const CLIENT_ID = 'cv_TrIdm8nuOC'
const CLIENT_SECRET = 'VXV79s_cQMpHZAa2DMzyX'

// Cache for access token
let accessToken: string | null = null
let tokenExpiry: number = 0

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken
  }

  try {
    const response = await fetch(`${MOZILLA_API_BASE}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`)
    }

    const data = await response.json()
    accessToken = data.token || null
    tokenExpiry = Date.now() + (24 * 60 * 60 * 1000) - 60000 // 24 hours with 1 minute buffer
    
    if (!accessToken) {
      throw new Error('No token received from Mozilla API')
    }
    
    return accessToken
  } catch (error) {
    console.error('Error getting Mozilla API access token:', error)
    throw new Error('Failed to authenticate with Mozilla Common Voice API')
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const languageCode = searchParams.get('languageCode') || 'luo'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const taxonomy = searchParams.get('taxonomy') || 'NOODL'

    // Get access token
    const token = await getAccessToken()
    
    // Build query parameters
    const params = new URLSearchParams({
      languageCode,
      limit: limit.toString(),
      offset: offset.toString(),
      'taxonomy[Licence]': taxonomy,
    })

    // Fetch sentences from Mozilla API
    const response = await fetch(`${MOZILLA_API_BASE}/text/sentences?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch sentences: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Return the data
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in Mozilla API proxy:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: `Mozilla API error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
