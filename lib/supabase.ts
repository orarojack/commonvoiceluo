import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password: string
          role: "contributor" | "reviewer" | "admin"
          status: "active" | "pending" | "rejected"
          profile_complete: boolean
          name: string | null
          age: string | null
          gender: string | null
          languages: string[] | null
          location: string | null
          constituency: string | null
          language_dialect: string | null
          educational_background: string | null
          employment_status: string | null
          phone_number: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          password: string
          role: "contributor" | "reviewer" | "admin"
          status?: "active" | "pending" | "rejected"
          profile_complete?: boolean
          name?: string | null
          age?: string | null
          gender?: string | null
          languages?: string[] | null
          location?: string | null
          constituency?: string | null
          language_dialect?: string | null
          educational_background?: string | null
          employment_status?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          password?: string
          role?: "contributor" | "reviewer" | "admin"
          status?: "active" | "pending" | "rejected"
          profile_complete?: boolean
          name?: string | null
          age?: string | null
          gender?: string | null
          languages?: string[] | null
          location?: string | null
          constituency?: string | null
          language_dialect?: string | null
          educational_background?: string | null
          employment_status?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          is_active?: boolean
        }
      }
      recordings: {
        Row: {
          id: string
          user_id: string
          sentence: string
          audio_url: string
          audio_blob: string | null
          duration: number
          status: "pending" | "approved" | "rejected"
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
          quality: "good" | "fair" | "poor"
          metadata: Record<string, any>
        }
        Insert: {
          id?: string
          user_id: string
          sentence: string
          audio_url: string
          audio_blob?: string | null
          duration: number
          status?: "pending" | "approved" | "rejected"
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
          quality?: "good" | "fair" | "poor"
          metadata?: Record<string, any>
        }
        Update: {
          id?: string
          user_id?: string
          sentence?: string
          audio_url?: string
          audio_blob?: string | null
          duration?: number
          status?: "pending" | "approved" | "rejected"
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
          quality?: "good" | "fair" | "poor"
          metadata?: Record<string, any>
        }
      }
      reviews: {
        Row: {
          id: string
          recording_id: string
          reviewer_id: string
          decision: "approved" | "rejected"
          notes: string | null
          confidence: number
          created_at: string
          time_spent: number
        }
        Insert: {
          id?: string
          recording_id: string
          reviewer_id: string
          decision: "approved" | "rejected"
          notes?: string | null
          confidence: number
          created_at?: string
          time_spent: number
        }
        Update: {
          id?: string
          recording_id?: string
          reviewer_id?: string
          decision?: "approved" | "rejected"
          notes?: string | null
          confidence?: number
          created_at?: string
          time_spent?: number
        }
      }
      sentences: {
        Row: {
          id: string
          mozilla_id: string
          text: string
          language_code: string
          source: string | null
          bucket: string | null
          hash: string | null
          version: number
          clips_count: number
          has_valid_clip: boolean
          is_validated: boolean
          taxonomy: Record<string, any>
          metadata: Record<string, any>
          is_active: boolean
          difficulty_level: "basic" | "medium" | "advanced"
          word_count: number | null
          character_count: number | null
          created_at: string
          updated_at: string
          imported_at: string
        }
        Insert: {
          id?: string
          mozilla_id: string
          text: string
          language_code?: string
          source?: string | null
          bucket?: string | null
          hash?: string | null
          version?: number
          clips_count?: number
          has_valid_clip?: boolean
          is_validated?: boolean
          taxonomy?: Record<string, any>
          metadata?: Record<string, any>
          is_active?: boolean
          difficulty_level?: "basic" | "medium" | "advanced"
          word_count?: number | null
          character_count?: number | null
          created_at?: string
          updated_at?: string
          imported_at?: string
        }
        Update: {
          id?: string
          mozilla_id?: string
          text?: string
          language_code?: string
          source?: string | null
          bucket?: string | null
          hash?: string | null
          version?: number
          clips_count?: number
          has_valid_clip?: boolean
          is_validated?: boolean
          taxonomy?: Record<string, any>
          metadata?: Record<string, any>
          is_active?: boolean
          difficulty_level?: "basic" | "medium" | "advanced"
          word_count?: number | null
          character_count?: number | null
          created_at?: string
          updated_at?: string
          imported_at?: string
        }
      }
    }
  }
}
