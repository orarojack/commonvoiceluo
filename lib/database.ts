import { supabase } from "./supabase"
import type { Database } from "./supabase"

export type User = Database["public"]["Tables"]["users"]["Row"]
export type Recording = Database["public"]["Tables"]["recordings"]["Row"]
export type Review = Database["public"]["Tables"]["reviews"]["Row"]

export interface UserStats {
  userId: string
  totalRecordings: number
  approvedRecordings: number
  rejectedRecordings: number
  pendingRecordings: number
  totalReviews: number
  approvedReviews: number
  rejectedReviews: number
  averageReviewTime: number
  accuracyRate: number
  streakDays: number
  totalTimeContributed: number
  lastActivityAt: string
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Helper function to convert camelCase to snake_case for database operations
function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }

  const converted: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    converted[snakeKey] = toSnakeCase(value)
  }
  return converted
}

class SupabaseDatabase {
  // User operations
  async createUser(userData: Database["public"]["Tables"]["users"]["Insert"]): Promise<User> {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert({
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Use the is_active value from userData, or default to true
          is_active: userData.is_active !== undefined ? userData.is_active : true,
        })
        .select()
        .single()

      if (error) {
        console.error("Database error creating user:", error)
        throw new Error(`Failed to create user: ${error.message}`)
      }

      if (!data) {
        throw new Error("No data returned from user creation")
      }

      return data
    } catch (error) {
      console.error("Error in createUser:", error)
      throw error
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      if (!email || typeof email !== "string") {
        throw new Error("Invalid email provided")
      }

      const { data, error } = await supabase.from("users").select("*").eq("email", email.toLowerCase().trim()).single()

      if (error && error.code !== "PGRST116") {
        console.error("Database error getting user by email:", error)
        throw new Error(`Failed to get user: ${error.message}`)
      }

      return data || null
    } catch (error) {
      console.error("Error in getUserByEmail:", error)
      if (error instanceof Error && error.message.includes("Failed to get user")) {
        throw error
      }
      return null
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      if (!id || typeof id !== "string") {
        console.error("Invalid user ID provided:", id)
        return null
      }

      // Validate UUID format
      if (!isValidUUID(id)) {
        console.error("Invalid UUID format:", id)
        return null
      }

      const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Database error getting user by id:", error)
        throw new Error(`Failed to get user: ${error.message}`)
      }

      return data || null
    } catch (error) {
      console.error("Error in getUserById:", error)
      return null
    }
  }

  async updateUser(id: string, updates: any): Promise<User | null> {
    try {
      if (!id || !isValidUUID(id)) {
        throw new Error("Invalid user ID provided")
      }

      // Prepare updates - already in snake_case format from auth provider
      const dbUpdates = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      console.log("Updating user with data:", dbUpdates)
      console.log("Updating user with ID:", id)

      // First check if user exists
      const { data: existingUser, error: checkError } = await supabase.from("users").select("*").eq("id", id).single()
      console.log("User exists check:", existingUser ? "Found" : "Not found", checkError ? `Error: ${checkError.message}` : "")

      if (!existingUser && checkError?.code === "PGRST116") {
        throw new Error(`User with ID ${id} not found in database`)
      }

      const { data, error } = await supabase.from("users").update(dbUpdates).eq("id", id).select().single()

      if (error) {
        console.error("Database error updating user:", error)
        throw new Error(`Failed to update user: ${error.message}`)
      }

      if (!data) {
        throw new Error(`No data returned after updating user with ID ${id}`)
      }

      console.log("User updated successfully:", data)
      return data
    } catch (error) {
      console.error("Error in updateUser:", error)
      throw error
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      if (!id || !isValidUUID(id)) {
        throw new Error("Invalid user ID provided")
      }

      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) {
        console.error("Database error deleting user:", error)
        throw new Error(`Failed to delete user: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error("Error in deleteUser:", error)
      throw error
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Database error getting all users:", error)
        throw new Error(`Failed to get users: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in getAllUsers:", error)
      return []
    }
  }

  async getUsersByRole(role: User["role"]): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", role)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error getting users by role:", error)
        throw new Error(`Failed to get users by role: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in getUsersByRole:", error)
      return []
    }
  }

  async getUsersByStatus(status: User["status"]): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error getting users by status:", error)
        throw new Error(`Failed to get users by status: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in getUsersByStatus:", error)
      return []
    }
  }

  // Recording operations
  async createRecording(recordingData: Database["public"]["Tables"]["recordings"]["Insert"]): Promise<Recording> {
    try {
      if (!recordingData.user_id || !isValidUUID(recordingData.user_id)) {
        throw new Error("Invalid user ID provided for recording")
      }

      // Log the data being inserted for debugging
      console.log("Creating recording with data:", {
        user_id: recordingData.user_id,
        sentence: recordingData.sentence?.substring(0, 100) + "...",
        audio_url_length: recordingData.audio_url?.length || 0,
        duration: recordingData.duration,
        status: recordingData.status,
        quality: recordingData.quality,
        metadata: recordingData.metadata
      })

      // Note: audio_url field is now TEXT, so it can handle long data URLs

      const { data, error } = await supabase
        .from("recordings")
        .insert({
          ...recordingData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Database error creating recording:", error)
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Failed to create recording: ${error.message}`)
      }

      if (!data) {
        throw new Error("No data returned from recording creation")
      }

      return data
    } catch (error) {
      console.error("Error in createRecording:", error)
      throw error
    }
  }

  async getRecordingById(id: string): Promise<Recording | null> {
    try {
      if (!id || !isValidUUID(id)) {
        return null
      }

      const { data, error } = await supabase.from("recordings").select("*").eq("id", id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Database error getting recording:", error)
        throw new Error(`Failed to get recording: ${error.message}`)
      }

      return data || null
    } catch (error) {
      console.error("Error in getRecordingById:", error)
      return null
    }
  }

  async getRecordingsByUser(userId: string): Promise<Recording[]> {
    try {
      if (!userId || !isValidUUID(userId)) {
        return []
      }

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn("Supabase not configured, returning empty recordings array")
        return []
      }

      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error getting recordings by user:", error)
        throw new Error(`Failed to get recordings by user: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in getRecordingsByUser:", error)
      return []
    }
  }

  async getRecordingsByStatus(status: Recording["status"]): Promise<Recording[]> {
    try {
      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error getting recordings by status:", error)
        throw new Error(`Failed to get recordings by status: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in getRecordingsByStatus:", error)
      return []
    }
  }

  async getRecordingsByReviewer(reviewerId: string): Promise<Recording[]> {
    try {
      if (!reviewerId || !isValidUUID(reviewerId)) {
        return []
      }

      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .eq("reviewed_by", reviewerId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error getting recordings by reviewer:", error)
        throw new Error(`Failed to get recordings by reviewer: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in getRecordingsByReviewer:", error)
      return []
    }
  }

  async updateRecording(
    id: string,
    updates: Database["public"]["Tables"]["recordings"]["Update"],
  ): Promise<Recording | null> {
    try {
      if (!id || !isValidUUID(id)) {
        throw new Error("Invalid recording ID provided")
      }

      const { data, error } = await supabase
        .from("recordings")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Database error updating recording:", error)
        throw new Error(`Failed to update recording: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("Error in updateRecording:", error)
      throw error
    }
  }

  async getAllRecordings(): Promise<Recording[]> {
    try {
      const { data, error } = await supabase.from("recordings").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Database error getting all recordings:", error)
        throw new Error(`Failed to get all recordings: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in getAllRecordings:", error)
      return []
    }
  }

  // Review operations
  async createReview(reviewData: Database["public"]["Tables"]["reviews"]["Insert"]): Promise<Review> {
    try {
      if (!reviewData.recording_id || !isValidUUID(reviewData.recording_id)) {
        throw new Error("Invalid recording ID provided for review")
      }

      if (!reviewData.reviewer_id || !isValidUUID(reviewData.reviewer_id)) {
        throw new Error("Invalid reviewer ID provided for review")
      }

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          ...reviewData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Database error creating review:", error)
        throw new Error(`Failed to create review: ${error.message}`)
      }

      if (!data) {
        throw new Error("No data returned from review creation")
      }

      // Update recording status
      await this.updateRecording(reviewData.recording_id, {
        status: reviewData.decision,
        reviewed_by: reviewData.reviewer_id,
        reviewed_at: new Date().toISOString(),
      })

      return data
    } catch (error) {
      console.error("Error in createReview:", error)
      throw error
    }
  }

  async getReviewsByReviewer(reviewerId: string): Promise<Review[]> {
    try {
      if (!reviewerId || !isValidUUID(reviewerId)) {
        return []
      }

      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          recording:recordings(
            id,
            sentence,
            audio_url,
            duration,
            quality,
            status,
            created_at
          )
        `)
        .eq("reviewer_id", reviewerId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error getting reviews by reviewer:", error)
        throw new Error(`Failed to get reviews by reviewer: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in getReviewsByReviewer:", error)
      return []
    }
  }

  async getReviewsByRecording(recordingId: string): Promise<Review[]> {
    try {
      if (!recordingId || !isValidUUID(recordingId)) {
        return []
      }

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("recording_id", recordingId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error getting reviews by recording:", error)
        throw new Error(`Failed to get reviews by recording: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in getReviewsByRecording:", error)
      return []
    }
  }

  async getAllReviews(): Promise<Review[]> {
    try {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Database error getting all reviews:", error)
        throw new Error(`Failed to get all reviews: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error in getAllReviews:", error)
      return []
    }
  }

  // Statistics operations
  async getSystemStats() {
    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn("Supabase not configured, returning default stats")
        return {
          totalUsers: 0,
          contributors: 0,
          reviewers: 0,
          pendingReviewers: 0,
          totalRecordings: 0,
          pendingRecordings: 0,
          approvedRecordings: 0,
          rejectedRecordings: 0,
          totalReviews: 0,
          activeUsers: 0,
          averageRecordingDuration: 0,
          averageReviewTime: 0,
          totalRecordingTime: 0,
          totalReviewTime: 0,
          totalSystemTime: 0,
        }
      }

      // Get user counts
      const { data: users, error: usersError } = await supabase.from("users").select("role, status, is_active")

      if (usersError) {
        console.error("Database error getting user stats:", usersError)
        throw new Error(`Failed to get user stats: ${usersError.message}`)
      }

      // Get recording counts
      const { data: recordings, error: recordingsError } = await supabase.from("recordings").select("status, duration")

      if (recordingsError) {
        console.error("Database error getting recording stats:", recordingsError)
        throw new Error(`Failed to get recording stats: ${recordingsError.message}`)
      }

      // Get review counts
      const { data: reviews, error: reviewsError } = await supabase.from("reviews").select("time_spent")

      if (reviewsError) {
        console.error("Database error getting review stats:", reviewsError)
        throw new Error(`Failed to get review stats: ${reviewsError.message}`)
      }

      const totalUsers = users?.length || 0
      const contributors = users?.filter((u) => u.role === "contributor").length || 0
      const reviewers = users?.filter((u) => u.role === "reviewer" && u.status === "active").length || 0
      const pendingReviewers = users?.filter((u) => u.role === "reviewer" && u.status === "pending").length || 0
      const totalRecordings = recordings?.length || 0
      const pendingRecordings = recordings?.filter((r) => r.status === "pending").length || 0
      const approvedRecordings = recordings?.filter((r) => r.status === "approved").length || 0
      const rejectedRecordings = recordings?.filter((r) => r.status === "rejected").length || 0
      const totalReviews = reviews?.length || 0
      const activeUsers = users?.filter((u) => u.is_active).length || 0

      // Calculate total system recording time
      const totalRecordingTime = recordings?.reduce((sum, r) => sum + (r.duration || 0), 0) || 0
      const totalReviewTime = reviews?.reduce((sum, r) => sum + (r.time_spent || 0), 0) || 0
      const totalSystemTime = totalRecordingTime + totalReviewTime

      return {
        totalUsers,
        contributors,
        reviewers,
        pendingReviewers,
        totalRecordings,
        pendingRecordings,
        approvedRecordings,
        rejectedRecordings,
        totalReviews,
        activeUsers,
        averageRecordingDuration: recordings?.length
          ? recordings.reduce((sum, r) => sum + (r.duration || 0), 0) / recordings.length
          : 0,
        averageReviewTime: reviews?.length
          ? reviews.reduce((sum, r) => sum + (r.time_spent || 0), 0) / reviews.length
          : 0,
        totalRecordingTime,
        totalReviewTime,
        totalSystemTime,
      }
    } catch (error) {
      console.error("Error getting system stats:", error)
      // Return default stats instead of throwing
      return {
        totalUsers: 0,
        contributors: 0,
        reviewers: 0,
        pendingReviewers: 0,
        totalRecordings: 0,
        pendingRecordings: 0,
        approvedRecordings: 0,
        rejectedRecordings: 0,
        totalReviews: 0,
        activeUsers: 0,
        averageRecordingDuration: 0,
        averageReviewTime: 0,
        totalRecordingTime: 0,
        totalReviewTime: 0,
        totalSystemTime: 0,
      }
    }
  }

  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      if (!userId || !isValidUUID(userId)) {
        return null
      }

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn("Supabase not configured, returning default user stats")
        return {
          userId,
          totalRecordings: 0,
          approvedRecordings: 0,
          rejectedRecordings: 0,
          pendingRecordings: 0,
          totalReviews: 0,
          approvedReviews: 0,
          rejectedReviews: 0,
          averageReviewTime: 0,
          accuracyRate: 0,
          streakDays: 0,
          totalTimeContributed: 0,
          lastActivityAt: new Date().toISOString(),
        }
      }

      const [recordings, reviews] = await Promise.all([
        this.getRecordingsByUser(userId),
        this.getReviewsByReviewer(userId),
      ])

      const stats: UserStats = {
        userId,
        totalRecordings: recordings.length,
        approvedRecordings: recordings.filter((r) => r.status === "approved").length,
        rejectedRecordings: recordings.filter((r) => r.status === "rejected").length,
        pendingRecordings: recordings.filter((r) => r.status === "pending").length,
        totalReviews: reviews.length,
        approvedReviews: reviews.filter((r) => r.decision === "approved").length,
        rejectedReviews: reviews.filter((r) => r.decision === "rejected").length,
        averageReviewTime: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.time_spent, 0) / reviews.length : 0,
        accuracyRate: reviews.length > 0 ? (reviews.filter((r) => r.confidence > 80).length / reviews.length) * 100 : 0,
        streakDays: this.calculateStreakDays(recordings),
        totalTimeContributed: recordings.reduce((sum, r) => {
          const duration = typeof r.duration === 'string' ? parseFloat(r.duration) : r.duration || 0
          console.log(`Recording ${r.id}: duration = ${r.duration} (parsed: ${duration})`)
          return sum + duration
        }, 0) / 60, // Convert to minutes
        lastActivityAt: new Date().toISOString(),
      }

      console.log(`User ${userId} stats:`, {
        totalRecordings: stats.totalRecordings,
        totalTimeContributed: stats.totalTimeContributed,
        recordings: recordings.map(r => ({ id: r.id, duration: r.duration, parsed: typeof r.duration === 'string' ? parseFloat(r.duration) : (r.duration || 0) }))
      })

      return stats
    } catch (error) {
      console.error("Error getting user stats:", error)
      return null
    }
  }

  async getAllUserStats(): Promise<UserStats[]> {
    try {
      const users = await this.getAllUsers()
      const statsPromises = users.map((user) => this.getUserStats(user.id))
      const stats = await Promise.all(statsPromises)
      return stats.filter((stat) => stat !== null) as UserStats[]
    } catch (error) {
      console.error("Error getting all user stats:", error)
      return []
    }
  }

  // Calculate streak days based on user's recording activity
  private calculateStreakDays(recordings: Recording[]): number {
    if (recordings.length === 0) return 0
    
    // Sort recordings by date (newest first)
    const sortedRecordings = recordings.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let streakDays = 0
    let currentDate = new Date(today)
    
    // Check consecutive days backwards from today
    while (true) {
      const recordingsOnDate = sortedRecordings.filter(recording => {
        const recordingDate = new Date(recording.created_at)
        recordingDate.setHours(0, 0, 0, 0)
        return recordingDate.getTime() === currentDate.getTime()
      })
      
      if (recordingsOnDate.length > 0) {
        streakDays++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streakDays
  }

  // Advanced queries for admin dashboard
  async getTopContributors(limit = 10): Promise<Array<User & { stats: UserStats }>> {
    try {
      const contributors = await this.getUsersByRole("contributor")
      const contributorsWithStats = await Promise.all(
        contributors.map(async (user) => {
          const stats = await this.getUserStats(user.id)
          return { ...user, stats: stats! }
        }),
      )

      return contributorsWithStats
        .filter((user) => user.stats)
        .sort((a, b) => b.stats.totalRecordings - a.stats.totalRecordings)
        .slice(0, limit)
    } catch (error) {
      console.error("Error getting top contributors:", error)
      return []
    }
  }

  async getTopReviewers(limit = 10): Promise<Array<User & { stats: UserStats }>> {
    try {
      const reviewers = await this.getUsersByRole("reviewer")
      const activeReviewers = reviewers.filter((r) => r.status === "active")

      const reviewersWithStats = await Promise.all(
        activeReviewers.map(async (user) => {
          const stats = await this.getUserStats(user.id)
          return { ...user, stats: stats! }
        }),
      )

      return reviewersWithStats
        .filter((user) => user.stats)
        .sort((a, b) => b.stats.totalReviews - a.stats.totalReviews)
        .slice(0, limit)
    } catch (error) {
      console.error("Error getting top reviewers:", error)
      return []
    }
  }

  async getRecentActivity(limit = 20): Promise<
    Array<{
      type: "recording" | "review" | "user_joined"
      user: User
      data: Recording | Review | User
      timestamp: string
    }>
  > {
    try {
      const activities: Array<{
        type: "recording" | "review" | "user_joined"
        user: User
        data: Recording | Review | User
        timestamp: string
      }> = []

      // Get recent recordings
      const recordings = await this.getAllRecordings()
      for (const recording of recordings.slice(0, 10)) {
        const user = await this.getUserById(recording.user_id)
        if (user) {
          activities.push({
            type: "recording",
            user,
            data: recording,
            timestamp: recording.created_at,
          })
        }
      }

      // Get recent reviews
      const reviews = await this.getAllReviews()
      for (const review of reviews.slice(0, 10)) {
        const user = await this.getUserById(review.reviewer_id)
        if (user) {
          activities.push({
            type: "review",
            user,
            data: review,
            timestamp: review.created_at,
          })
        }
      }

      // Get recent users
      const users = await this.getAllUsers()
      for (const user of users.slice(0, 10)) {
        if (user.role !== "admin") {
          activities.push({
            type: "user_joined",
            user,
            data: user,
            timestamp: user.created_at,
          })
        }
      }

      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error("Error getting recent activity:", error)
      return []
    }
  }

  // Get available sentences for a specific user (excluding already recorded + those with 3 recordings)
  async getAvailableSentencesForUser(userId: string): Promise<string[]> {
    try {
      if (!userId || !isValidUUID(userId)) {
        return []
      }

      // Get all active sentences
      const { data: allSentences, error: sentencesError } = await supabase
        .from('sentences')
        .select('text')
        .eq('is_active', true)
        .eq('language_code', 'luo')

      if (sentencesError) {
        console.error("Error fetching sentences:", sentencesError)
        throw new Error(`Failed to fetch sentences: ${sentencesError.message}`)
      }

      if (!allSentences || allSentences.length === 0) {
        return []
      }

      // Get all recordings to check limits
      const { data: allRecordings, error: recordingsError } = await supabase
        .from('recordings')
        .select('sentence, user_id')

      if (recordingsError) {
        console.error("Error fetching recordings:", recordingsError)
        throw new Error(`Failed to fetch recordings: ${recordingsError.message}`)
      }

      const recordings = allRecordings || []

      // Count recordings per sentence
      const sentenceRecordingCounts: Record<string, Set<string>> = {}
      
      recordings.forEach(recording => {
        if (!sentenceRecordingCounts[recording.sentence]) {
          sentenceRecordingCounts[recording.sentence] = new Set()
        }
        sentenceRecordingCounts[recording.sentence].add(recording.user_id)
      })

      // Filter sentences
      const availableSentences = allSentences
        .map(s => s.text)
        .filter(sentence => {
          const recordedByUsers = sentenceRecordingCounts[sentence]
          
          // Exclude if user already recorded this sentence
          if (recordedByUsers && recordedByUsers.has(userId)) {
            return false
          }
          
          // Exclude if 3 or more different users already recorded this sentence
          if (recordedByUsers && recordedByUsers.size >= 3) {
            return false
          }
          
          return true
        })

      console.log(`Available sentences for user ${userId}:`, {
        totalSentences: allSentences.length,
        availableForUser: availableSentences.length,
        alreadyRecorded: allSentences.length - availableSentences.length
      })

      return availableSentences
    } catch (error) {
      console.error("Error in getAvailableSentencesForUser:", error)
      return []
    }
  }

  // Check if a user can record a specific sentence
  async canUserRecordSentence(userId: string, sentence: string): Promise<boolean> {
    try {
      if (!userId || !isValidUUID(userId)) {
        return false
      }

      // Check if user already recorded this sentence
      const { data: userRecording, error: userError } = await supabase
        .from('recordings')
        .select('id')
        .eq('user_id', userId)
        .eq('sentence', sentence)
        .limit(1)

      if (userError) {
        console.error("Error checking user recording:", userError)
        return false
      }

      // If user already recorded this sentence, return false
      if (userRecording && userRecording.length > 0) {
        return false
      }

      // Check total number of unique users who recorded this sentence
      const { data: allRecordings, error: recordingsError } = await supabase
        .from('recordings')
        .select('user_id')
        .eq('sentence', sentence)

      if (recordingsError) {
        console.error("Error checking sentence recordings:", recordingsError)
        return false
      }

      // Count unique users
      const uniqueUsers = new Set(allRecordings?.map(r => r.user_id) || [])
      
      // Allow if less than 3 unique users have recorded this sentence
      return uniqueUsers.size < 3
    } catch (error) {
      console.error("Error in canUserRecordSentence:", error)
      return false
    }
  }

  // Get sentence recording statistics
  async getSentenceStats(sentence: string): Promise<{ totalRecordings: number, uniqueContributors: number }> {
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('user_id')
        .eq('sentence', sentence)

      if (error) {
        console.error("Error getting sentence stats:", error)
        return { totalRecordings: 0, uniqueContributors: 0 }
      }

      const recordings = data || []
      const uniqueUsers = new Set(recordings.map(r => r.user_id))

      return {
        totalRecordings: recordings.length,
        uniqueContributors: uniqueUsers.size
      }
    } catch (error) {
      console.error("Error in getSentenceStats:", error)
      return { totalRecordings: 0, uniqueContributors: 0 }
    }
  }
}

export const db = new SupabaseDatabase()
