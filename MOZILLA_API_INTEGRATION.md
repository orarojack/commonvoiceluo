# Mozilla Common Voice API Integration

## Overview
This document describes the integration of dynamic sentence fetching for voice recording. The system attempts to use the Mozilla Common Voice API but gracefully falls back to alternative sources and curated content when the API is unavailable.

## API Credentials
- **API Client ID**: `cv_TrIdm8nuOC`
- **API Client Secret**: `VXV79s_cQMpHZAa2DMzyX`
- **API Base URL**: `https://api.commonvoice.mozilla.org`

## Implementation

### 1. API Service (`lib/mozilla-api.ts`)
The `MozillaApiService` class handles all interactions with the Mozilla Common Voice API:

#### Key Features:
- **Multi-tier Fallback System**: Tries Mozilla API → Alternative API → Curated Content
- **OAuth2 Authentication**: Uses client credentials flow to get access tokens (when available)
- **Token Management**: Automatically refreshes tokens when they expire
- **Sentence Filtering**: Filters out unsuitable sentences (too long, too short, contains URLs)
- **Robust Error Handling**: Graceful fallback through multiple data sources
- **Multiple Languages**: Supports different locales (default: 'en')
- **40+ Curated Sentences**: High-quality sentences for voice recording

#### Main Methods:
- `getAccessToken()`: Gets OAuth2 access token
- `getSentences(options)`: Fetches sentences with filtering options
- `getRandomSentence(locale)`: Gets a single random sentence
- `getRandomSentences(count, locale)`: Gets multiple random sentences
- `getFallbackSentences()`: Returns hardcoded fallback sentences

### 2. Updated Speak Page (`app/speak/page.tsx`)
The speak page now dynamically loads sentences from the Mozilla API:

#### New Features:
- **Dynamic Loading**: Sentences are fetched from Mozilla API on page load
- **Loading States**: Shows loading spinner while fetching sentences
- **Error Handling**: Displays error messages and retry options
- **Fallback Mode**: Uses hardcoded sentences when API is unavailable
- **Load More**: Button to fetch additional sentences during session
- **Real-time Updates**: Toast notifications for API status

#### State Management:
- `availableSentences`: Array of sentences from API
- `isLoadingSentences`: Loading state for API calls
- `apiError`: Error state for API failures
- `currentSentence`: Currently displayed sentence

## Usage

### Basic Integration
```typescript
import { mozillaApi } from '@/lib/mozilla-api'

// Get a random sentence
const sentence = await mozillaApi.getRandomSentence('en')

// Get multiple sentences
const sentences = await mozillaApi.getRandomSentences(10, 'en')

// Get fallback sentences
const fallback = mozillaApi.getFallbackSentences()
```

### Error Handling
```typescript
try {
  const sentences = await mozillaApi.getRandomSentences(5, 'en')
  // Use API sentences
} catch (error) {
  // Fallback to hardcoded sentences
  const fallback = mozillaApi.getFallbackSentences()
}
```

## API Endpoints Used

### 1. OAuth Token
```
POST /api/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=cv_TrIdm8nuOC&client_secret=VXV79s_cQMpHZAa2DMzyX
```

### 2. Get Sentences
```
GET /api/v1/sentences?limit=10&page=1&locale=en&has_valid_clips=false
Authorization: Bearer {access_token}
```

## Configuration Options

### Sentence Filtering
- **Length**: 10-200 characters
- **Content**: Excludes URLs and special characters
- **Status**: Only sentences that need recordings (`has_valid_clips=false`)
- **Locale**: Language filter (default: 'en')

### API Options
```typescript
interface ApiOptions {
  locale?: string        // Language code (e.g., 'en', 'es', 'fr')
  limit?: number         // Number of sentences to fetch
  page?: number          // Page number for pagination
  domain?: string        // Sentence domain/category
  age?: string          // Age group filter
  gender?: string       // Gender filter
  hasValidClips?: boolean // Whether sentences have existing recordings
}
```

## Testing

### Manual Testing
1. Open the speak page (`/speak`)
2. Check if sentences load from Mozilla API
3. Verify fallback works when API is unavailable
4. Test "Load More" button functionality

### Automated Testing
```bash
# Run the test script
node scripts/test-mozilla-api.js
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify CLIENT_ID and CLIENT_SECRET are correct
   - Check if credentials have proper permissions
   - Ensure API endpoint is accessible

2. **No Sentences Returned**
   - Check if locale is supported
   - Verify filtering parameters
   - Try different API options

3. **API Timeout**
   - Check internet connection
   - Verify Mozilla API status
   - Implement retry logic

4. **Fallback Mode**
   - API is unavailable or returns errors
   - System automatically uses hardcoded sentences
   - User can retry API connection

### Debug Information
- Check browser console for API errors
- Monitor network requests in DevTools
- Review toast notifications for status updates

## Benefits

1. **Dynamic Content**: Fresh sentences from Mozilla's database
2. **Quality Control**: Filtered sentences suitable for recording
3. **Scalability**: No need to maintain local sentence database
4. **Community Driven**: Sentences from the Common Voice community
5. **Fallback Safety**: Always works even when API is down
6. **Real-time Updates**: New sentences available immediately

## Future Enhancements

1. **Caching**: Cache sentences locally for offline use
2. **User Preferences**: Allow users to select sentence categories
3. **Progress Tracking**: Track which sentences have been recorded
4. **Quality Metrics**: Collect feedback on sentence quality
5. **Multi-language**: Support for multiple languages
6. **Custom Filters**: Advanced filtering options for users

## Security Considerations

1. **API Keys**: Store credentials securely (use environment variables in production)
2. **Rate Limiting**: Implement rate limiting to avoid API abuse
3. **Error Handling**: Don't expose sensitive information in error messages
4. **Validation**: Validate all API responses before use
5. **Fallback**: Always have fallback content available

## Performance Optimization

1. **Batch Loading**: Load multiple sentences at once
2. **Lazy Loading**: Load more sentences as needed
3. **Caching**: Cache API responses locally
4. **Error Recovery**: Quick fallback to local content
5. **Loading States**: Provide feedback during API calls
