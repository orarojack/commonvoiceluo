// Mozilla Common Voice API integration
// Uses server-side proxy to avoid CORS issues

export interface MozillaSentence {
  bucket: string
  clipsCount: number
  createdAt: string
  hasValidClip: number
  hash: string
  id: string
  isValidated: number
  languageCode: string
  source: string
  text: string
  version: number
}

export interface MozillaApiResponse {
  data: MozillaSentence[]
  meta: {
    limit: number
    offset: number
    returned: number
  }
}

class MozillaApiService {


  // Get curated sentences for voice recording
  private getCuratedSentences(): string[] {
    return [
      // English sentences
      "The quick brown fox jumps over the lazy dog.",
      "A journey of a thousand miles begins with a single step.",
      "To be or not to be, that is the question.",
      "The sun rises in the east and sets in the west.",
      "Practice makes perfect in all endeavors.",
      "Knowledge is power, but wisdom is knowing how to use it.",
      "Time heals all wounds, but memories last forever.",
      "Actions speak louder than words in every situation.",
      "The early bird catches the worm every morning.",
      "Where there's a will, there's always a way forward.",
      "Innovation distinguishes between a leader and a follower.",
      "The only way to do great work is to love what you do.",
      "Life is what happens to you while you're busy making other plans.",
      "The future belongs to those who believe in the beauty of their dreams.",
      "It is during our darkest moments that we must focus to see the light.",
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      "The way to get started is to quit talking and begin doing.",
      "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.",
      "The only impossible journey is the one you never begin.",
      "Believe you can and you're halfway there.",
      "The secret of getting ahead is getting started.",
      "You are never too old to set another goal or to dream a new dream.",
      "The future starts today, not tomorrow.",
      "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
      "The best time to plant a tree was 20 years ago. The second best time is now.",
      "Your limitation—it's only your imagination.",
      "Great things never come from comfort zones.",
      "Dream it. Wish it. Do it.",
      "Success doesn't just find you. You have to go out and get it.",
      "The harder you work for something, the greater you'll feel when you achieve it.",
      "Dream bigger. Do bigger.",
      "Don't stop when you're tired. Stop when you're done.",
      "Wake up with determination. Go to bed with satisfaction.",
      "Do something today that your future self will thank you for.",
      "Little things make big days.",
      "It's going to be hard, but hard does not mean impossible.",
      "Don't wait for opportunity. Create it.",
      "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
      "The key to success is to focus on goals, not obstacles.",
      "Dream it. Believe it. Build it.",
      
      // Luo language sentences (Dholuo)
      "Onge ranyisi moro amora ma oseket e yor chik ma nyiso ni wachno en adier.",
      "Chakruok e piny ni kaka gi chakruok e yor chik ma nyiso ni wachno en adier.",
      "Wachni e piny ni kaka gi wachni e yor chik ma nyiso ni wachno en adier.",
      "Kaka gi wachni e piny ni kaka gi wachni e yor chik ma nyiso ni wachno en adier.",
      "Wachni e piny ni kaka gi wachni e yor chik ma nyiso ni wachno en adier.",
      "Chakruok e piny ni kaka gi chakruok e yor chik ma nyiso ni wachno en adier.",
      "Wachni e piny ni kaka gi wachni e yor chik ma nyiso ni wachno en adier.",
      "Kaka gi wachni e piny ni kaka gi wachni e yor chik ma nyiso ni wachno en adier.",
      "Wachni e piny ni kaka gi wachni e yor chik ma nyiso ni wachno en adier.",
      "Chakruok e piny ni kaka gi chakruok e yor chik ma nyiso ni wachno en adier.",
    ]
  }

  // Fetch sentences from Mozilla Common Voice API via server-side proxy
  async getSentences(options: {
    languageCode?: string
    limit?: number
    offset?: number
    taxonomy?: {
      Licence?: string
    }
  } = {}): Promise<MozillaSentence[]> {
    try {
      const params = new URLSearchParams({
        languageCode: options.languageCode || 'luo',
        limit: (options.limit || 10).toString(),
        offset: (options.offset || 0).toString(),
        taxonomy: options.taxonomy?.Licence || 'NOODL',
      })

      // Use server-side API route to avoid CORS issues
      const response = await fetch(`/api/mozilla/sentences?${params}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch sentences: ${response.statusText}`)
      }

      const data: MozillaApiResponse = await response.json()
      return data.data
    } catch (error) {
      console.error('Error fetching sentences from Mozilla API:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Mozilla API error: ${errorMessage}`)
    }
  }

  // Get a random sentence for recording
  async getRandomSentence(languageCode: string = 'luo'): Promise<string> {
    const sentences = await this.getSentences({
      languageCode,
      limit: 50, // Get more sentences to choose from
      taxonomy: { Licence: 'NOODL' }, // Use NOODL license
    })

    if (sentences.length === 0) {
      throw new Error('No sentences available from Mozilla API')
    }

    // Filter out sentences that are too long or too short
    const filteredSentences = sentences.filter(sentence => {
      const text = sentence.text.trim()
      return text.length >= 10 && text.length <= 200 && !text.includes('http')
    })

    if (filteredSentences.length === 0) {
      throw new Error('No suitable sentences found from Mozilla API')
    }

    // Return a random sentence
    const randomIndex = Math.floor(Math.random() * filteredSentences.length)
    return filteredSentences[randomIndex].text
  }

  // Get multiple random sentences for a recording session
  async getRandomSentences(count: number = 5, languageCode: string = 'luo'): Promise<string[]> {
    // Only use Mozilla API - no fallbacks
    const sentences = await this.getSentences({
      languageCode,
      limit: count * 3, // Get more to ensure we have enough good ones
      taxonomy: { Licence: 'NOODL' }, // Use NOODL license
    })

    if (sentences.length === 0) {
      throw new Error('No sentences available from Mozilla API')
    }

    // Filter and select random sentences
    const filteredSentences = sentences
      .filter(sentence => {
        const text = sentence.text.trim()
        return text.length >= 10 && text.length <= 200 && !text.includes('http')
      })
      .map(sentence => sentence.text)

    if (filteredSentences.length === 0) {
      throw new Error('No suitable sentences found from Mozilla API')
    }

    // Shuffle and return the requested count
    const shuffled = filteredSentences.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, shuffled.length))
  }

  // Fallback sentences in case API fails
  getFallbackSentences(): string[] {
    return this.getCuratedSentences()
  }
}

// Export singleton instance
export const mozillaApi = new MozillaApiService()
