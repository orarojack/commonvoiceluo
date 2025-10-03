"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Headphones, Mic, Users, Award, TrendingUp, Play, Calendar, Clock, Filter, X, Calendar as CalendarIcon, TrendingDown, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { db, type UserStats } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Utility function to format time in hours, minutes, and seconds
const formatTime = (totalMinutes: number): string => {
  if (totalMinutes <= 0) {
    return "0h 0m 0s"
  }
  
  // Convert to total seconds first
  const totalSeconds = Math.round(totalMinutes * 60)
  
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  // Always show the full format: hours, minutes, seconds
  return `${hours}h ${minutes}m ${seconds}s`
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState({
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
  })
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    searchTerm: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState("all") // all, submitted, approved, rejected
  const [reviewerActiveTab, setReviewerActiveTab] = useState("all") // all, approved, rejected, total
  const [recordings, setRecordings] = useState<any[]>([])
  const [filteredRecordings, setFilteredRecordings] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [filteredReviews, setFilteredReviews] = useState<any[]>([])
  const [allRecordings, setAllRecordings] = useState<any[]>([])
  const [allReviews, setAllReviews] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn("Supabase environment variables not configured")
        toast({
          title: "Configuration Required",
          description: "Supabase is not configured. Please set up your environment variables.",
          variant: "destructive",
        })
        return
      }

      // Load system stats
      const systemStats = await db.getSystemStats()
      setStats(systemStats)

      // Load all recordings and reviews for activity chart
      const [allRecordingsData, allReviewsData] = await Promise.all([
        db.getAllRecordings(),
        db.getAllReviews()
      ])
      setAllRecordings(allRecordingsData)
      setAllReviews(allReviewsData)

      // Load user-specific stats
      if (user) {
        const userStatsData = await db.getUserStats(user.id)
        setUserStats(userStatsData)
        
        // Load recordings for contributors
        if (user.role === "contributor") {
          const userRecordings = await db.getRecordingsByUser(user.id)
          setRecordings(userRecordings)
          setFilteredRecordings(userRecordings)
        }
        
        // Load reviews for reviewers
        if (user.role === "reviewer") {
          const userReviews = await db.getReviewsByReviewer(user.id)
          setReviews(userReviews)
          setFilteredReviews(userReviews)
        }
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please check your Supabase configuration.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate user-specific stats based on role
  const getUserRoleStats = () => {
    if (!userStats) {
      return {
        primary: 0,
        secondary: 0,
        rejected: 0,
        timeContributed: 0,
        timeFormatted: "0h 0m 0s",
      }
    }

    if (user?.role === "contributor") {
      const timeContributed = userStats.totalTimeContributed
      console.log(`Contributor ${user.id} time stats:`, {
        totalTimeContributed: userStats.totalTimeContributed,
        timeContributed: timeContributed,
        formatted: formatTime(timeContributed)
      })
      return {
        primary: userStats.totalRecordings,
        secondary: userStats.approvedRecordings,
        rejected: userStats.rejectedRecordings,
        timeContributed: timeContributed,
        timeFormatted: formatTime(timeContributed),
      }
    } else if (user?.role === "reviewer") {
      const timeContributed = (userStats.averageReviewTime * userStats.totalReviews) / 60 // Convert to minutes
      return {
        primary: userStats.totalReviews,
        secondary: Math.floor(userStats.accuracyRate),
        streak: userStats.streakDays,
        timeContributed: timeContributed,
        timeFormatted: formatTime(timeContributed),
      }
    } else if (user?.role === "admin") {
      return {
        primary: stats.totalUsers,
        secondary: stats.pendingReviewers,
        streak: stats.totalRecordings,
        timeContributed: stats.totalSystemTime || 0,
        timeFormatted: formatTime(stats.totalSystemTime || 0),
      }
    }

    return {
      primary: 0,
      secondary: 0,
      rejected: 0,
      timeContributed: 0,
      timeFormatted: "0h 0m 0s",
    }
  }

  // Apply filters to recordings
  const applyFilters = (recordingList: any[]) => {
    let filtered = [...recordingList]

    // Filter by active tab
    if (activeTab !== "all") {
      switch (activeTab) {
        case "submitted":
          // Show all recordings (no status filter)
          break
        case "approved":
          filtered = filtered.filter(recording => recording.status === "approved")
          break
        case "rejected":
          filtered = filtered.filter(recording => recording.status === "rejected")
          break
      }
    }

    // Filter by status (only if not overridden by tab)
    if (filters.status !== "all" && activeTab === "all") {
      filtered = filtered.filter(recording => recording.status === filters.status)
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const now = new Date()
      const recordingDate = new Date()
      
      switch (filters.dateRange) {
        case "today":
          filtered = filtered.filter(recording => {
            const recDate = new Date(recording.created_at)
            return recDate.toDateString() === now.toDateString()
          })
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(recording => {
            const recDate = new Date(recording.created_at)
            return recDate >= weekAgo
          })
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(recording => {
            const recDate = new Date(recording.created_at)
            return recDate >= monthAgo
          })
          break
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(recording => {
            const recDate = new Date(recording.created_at)
            return recDate >= quarterAgo
          })
          break
      }
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(recording => 
        recording.sentence?.toLowerCase().includes(searchLower) ||
        recording.status?.toLowerCase().includes(searchLower) ||
        recording.quality?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }

  // Apply filters to reviews with tab support
  const applyReviewFilters = (reviewList: any[]) => {
    let filtered = [...reviewList]

    // Filter by active reviewer tab
    if (reviewerActiveTab !== "all") {
      switch (reviewerActiveTab) {
        case "approved":
          filtered = filtered.filter(review => review.decision === "approved")
          break
        case "rejected":
          filtered = filtered.filter(review => review.decision === "rejected")
          break
        case "total":
          // Show all reviews (no decision filter)
          break
      }
    }

    // Filter by decision (only if not overridden by tab)
    if (filters.status !== "all" && reviewerActiveTab === "all") {
      filtered = filtered.filter(review => review.decision === filters.status)
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const now = new Date()
      
      switch (filters.dateRange) {
        case "today":
          filtered = filtered.filter(review => {
            const reviewDate = new Date(review.created_at)
            return reviewDate.toDateString() === now.toDateString()
          })
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(review => {
            const reviewDate = new Date(review.created_at)
            return reviewDate >= weekAgo
          })
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(review => {
            const reviewDate = new Date(review.created_at)
            return reviewDate >= monthAgo
          })
          break
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(review => {
            const reviewDate = new Date(review.created_at)
            return reviewDate >= quarterAgo
          })
          break
      }
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(review => 
        review.recording?.sentence?.toLowerCase().includes(searchLower) ||
        review.decision?.toLowerCase().includes(searchLower) ||
        review.comments?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }

  // Update filtered recordings when filters or activeTab change
  useEffect(() => {
    if (recordings.length > 0) {
      const filtered = applyFilters(recordings)
      setFilteredRecordings(filtered)
    }
  }, [filters, recordings, activeTab])

  // Update filtered reviews when filters or reviewerActiveTab change
  useEffect(() => {
    if (reviews.length > 0) {
      const filtered = applyReviewFilters(reviews)
      setFilteredReviews(filtered)
    }
  }, [filters, reviews, reviewerActiveTab])

  const roleStats = getUserRoleStats()

  // Calculate filtered stats for the table
  const getFilteredStats = () => {
    const total = filteredRecordings.length
    const approved = filteredRecordings.filter(r => r.status === 'approved').length
    const rejected = filteredRecordings.filter(r => r.status === 'rejected').length
    const pending = filteredRecordings.filter(r => r.status === 'pending').length

    return {
      total,
      approved,
      rejected,
      pending,
      approvedPercentage: total > 0 ? Math.round((approved / total) * 100) : 0,
      rejectedPercentage: total > 0 ? Math.round((rejected / total) * 100) : 0,
      pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0,
    }
  }

  const filteredStats = getFilteredStats()

  // Calculate filtered review stats for the table
  const getFilteredReviewStats = () => {
    const total = filteredReviews.length
    const approved = filteredReviews.filter(r => r.decision === 'approved').length
    const rejected = filteredReviews.filter(r => r.decision === 'rejected').length

    return {
      total,
      approved,
      rejected,
      approvedPercentage: total > 0 ? Math.round((approved / total) * 100) : 0,
      rejectedPercentage: total > 0 ? Math.round((rejected / total) * 100) : 0,
    }
  }

  const filteredReviewStats = getFilteredReviewStats()

  // Generate activity data for the last 7 days from actual database data
  const generateActivityData = () => {
    const today = new Date()
    const activityData = []
    
    // Debug: Log the data we're working with
    console.log('🔍 Activity Data Debug:', {
      userRole: user?.role,
      userId: user?.id,
      totalRecordings: allRecordings.length,
      totalReviews: allReviews.length,
      userRecordings: user?.role === 'contributor' ? allRecordings.filter(r => r.user_id === user.id).length : 'N/A',
      userReviews: user?.role === 'reviewer' ? allReviews.filter(r => r.reviewer_id === user.id).length : 'N/A'
    })
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      let contributions = 0
      let maxContributions = 0
      
      if (user?.role === "contributor") {
        // Count recordings for this specific date (only user's own recordings)
        const dayRecordings = allRecordings.filter(recording => {
          const recordingDate = new Date(recording.created_at)
          return recordingDate.toDateString() === date.toDateString() && recording.user_id === user.id
        })
        contributions = dayRecordings.length
        maxContributions = 10 // Set a reasonable max for contributors
      } else if (user?.role === "reviewer") {
        // Count reviews for this specific date (only user's own reviews)
        const dayReviews = allReviews.filter(review => {
          const reviewDate = new Date(review.created_at)
          return reviewDate.toDateString() === date.toDateString() && review.reviewer_id === user.id
        })
        contributions = dayReviews.length
        maxContributions = 20 // Set a reasonable max for reviewers
      } else {
        // For admin, count total activities (recordings + reviews) for this date
        const dayRecordings = allRecordings.filter(recording => {
          const recordingDate = new Date(recording.created_at)
          return recordingDate.toDateString() === date.toDateString()
        })
        const dayReviews = allReviews.filter(review => {
          const reviewDate = new Date(review.created_at)
          return reviewDate.toDateString() === date.toDateString()
        })
        contributions = dayRecordings.length + dayReviews.length
        maxContributions = 15 // Set a reasonable max for admin
      }
      
      // Calculate trend based on previous day (if available)
      let trend = 'up'
      if (i < 6) { // Not the first day
        const previousDay = new Date(today)
        previousDay.setDate(previousDay.getDate() - (i + 1))
        
                 let previousContributions = 0
         if (user?.role === "contributor") {
           const prevDayRecordings = allRecordings.filter(recording => {
             const recordingDate = new Date(recording.created_at)
             return recordingDate.toDateString() === previousDay.toDateString() && recording.user_id === user.id
           })
           previousContributions = prevDayRecordings.length
         } else if (user?.role === "reviewer") {
           const prevDayReviews = allReviews.filter(review => {
             const reviewDate = new Date(review.created_at)
             return reviewDate.toDateString() === previousDay.toDateString() && review.reviewer_id === user.id
           })
           previousContributions = prevDayReviews.length
         } else {
           const prevDayRecordings = allRecordings.filter(recording => {
             const recordingDate = new Date(recording.created_at)
             return recordingDate.toDateString() === previousDay.toDateString()
           })
           const prevDayReviews = allReviews.filter(review => {
             const reviewDate = new Date(review.created_at)
             return reviewDate.toDateString() === previousDay.toDateString()
           })
           previousContributions = prevDayRecordings.length + prevDayReviews.length
         }
        
        trend = contributions >= previousContributions ? 'up' : 'down'
      }
      
      const dayData = {
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        contributions,
        maxContributions,
        percentage: Math.round((contributions / maxContributions) * 100),
        trend
      }
      
      // Debug: Log each day's calculation
      console.log(`📅 ${dayData.dayName} (${date.toDateString()}):`, {
        contributions: dayData.contributions,
        percentage: dayData.percentage,
        trend: dayData.trend
      })
      
      activityData.push(dayData)
    }
    
    return activityData
  }

  const activityData = generateActivityData()

  // Circular Progress Component
  const CircularProgress = ({ percentage, size = 60, strokeWidth = 4, color = "blue" }: {
    percentage: number
    size?: number
    strokeWidth?: number
    color?: string
  }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    const getColorClasses = (color: string) => {
      switch (color) {
        case 'blue': return 'text-blue-500'
        case 'green': return 'text-green-500'
        case 'purple': return 'text-purple-500'
        case 'orange': return 'text-orange-500'
        case 'red': return 'text-red-500'
        default: return 'text-blue-500'
      }
    }

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${getColorClasses(color)} transition-all duration-500 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-700">{percentage}%</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show configuration error if Supabase is not set up
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration Required</h2>
            <p className="text-gray-600 mb-6">Supabase environment variables are not configured.</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Setup Instructions:</h3>
            <ol className="text-left text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">1</span>
                <span>Create a <code className="bg-gray-200 px-1 rounded">.env.local</code> file in the project root</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">2</span>
                <span>Add your Supabase credentials:</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">3</span>
                <div>
                  <code className="bg-gray-200 px-2 py-1 rounded block text-sm">
                    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url<br/>
                    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
                  </code>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">4</span>
                <span>Restart the development server</span>
              </li>
            </ol>
          </div>
          
          <div className="mt-6">
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Welcome back, {user?.name || user?.email?.split("@")[0]}
            </h1>
            <p className="text-gray-600 mt-2">Here's your contribution overview</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 px-4 py-2"
            >
              <Award className="w-4 h-4 mr-2" />
              {user?.role}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {user?.role === "contributor" && (
          <>
            <Card 
              className={`bg-gradient-to-br from-red-50 to-red-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${activeTab === 'submitted' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setActiveTab('submitted')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Recordings Submitted</CardTitle>
                <div className="p-2 bg-red-500 rounded-lg">
                  <Mic className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">{roleStats.primary}</div>
                <p className="text-xs text-red-600 mt-1">Total recordings</p>
              </CardContent>
            </Card>

            <Card 
              className={`bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${activeTab === 'approved' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Recordings Approved</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Headphones className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{roleStats.secondary}</div>
                <p className="text-xs text-blue-600 mt-1">Approved recordings</p>
              </CardContent>
            </Card>

            <Card 
              className={`bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${activeTab === 'rejected' ? 'ring-2 ring-orange-500' : ''}`}
              onClick={() => setActiveTab('rejected')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">Recordings Rejected</CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">{roleStats.rejected}</div>
                <p className="text-xs text-orange-600 mt-1">Rejected recordings</p>
              </CardContent>
            </Card>

            <Card 
              className={`bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${activeTab === 'all' ? 'ring-2 ring-purple-500' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">Total Time</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">{roleStats.timeFormatted}</div>
                <p className="text-xs text-purple-600 mt-1">
                  {roleStats.timeContributed > 0 ? `${Math.round(roleStats.timeContributed)} minutes total` : "Time contributed"}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {user?.role === "reviewer" && (
          <>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Recordings Accepted</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Headphones className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{userStats?.approvedReviews || 0}</div>
                <p className="text-xs text-blue-600 mt-1">Approved recordings</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Recordings Rejected</CardTitle>
                <div className="p-2 bg-red-500 rounded-lg">
                  <X className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">{userStats?.rejectedReviews || 0}</div>
                <p className="text-xs text-red-600 mt-1">Rejected recordings</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">Total Reviews</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">{userStats?.totalReviews || 0}</div>
                <p className="text-xs text-purple-600 mt-1">Total recordings reviewed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">Total Time Reviewed</CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">{roleStats.timeFormatted}</div>
                <p className="text-xs text-orange-600 mt-1">
                  {roleStats.timeContributed > 0 ? `${Math.round(roleStats.timeContributed)} minutes total` : "Time reviewing"}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {user?.role === "admin" && (
          <>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Total Users</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{roleStats.primary}</div>
                <p className="text-xs text-blue-600 mt-1">All users</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800">Pending Reviewers</CardTitle>
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-900">{roleStats.secondary}</div>
                <p className="text-xs text-yellow-600 mt-1">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Total Recordings</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{roleStats.streak}</div>
                <p className="text-xs text-green-600 mt-1">All recordings</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">System Uptime</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">{roleStats.timeFormatted}</div>
                <p className="text-xs text-purple-600 mt-1">Last 30 days</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid - Quick Actions and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
        {/* Activity Chart */}
        <Card className="col-span-4 bg-white border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>
                  Your contribution activity over the last 7 days
                  {!loading && (allRecordings.length > 0 || allReviews.length > 0) && (
                    <span className="ml-2 text-xs text-green-600">
                      • Live data from {allRecordings.length} total recordings, {allReviews.length} total reviews
                      {user?.role === 'contributor' && (
                        <span className="ml-1">
                          ({allRecordings.filter(r => r.user_id === user.id).length} yours)
                        </span>
                      )}
                      {user?.role === 'reviewer' && (
                        <span className="ml-1">
                          ({allReviews.filter(r => r.reviewer_id === user.id).length} yours)
                        </span>
                      )}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadDashboardData}
                disabled={loading}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading activity data...</span>
              </div>
            ) : allRecordings.length === 0 && allReviews.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Data</h3>
                <p className="text-gray-500 mb-4">Start contributing to see your activity here!</p>
                {user?.role === "contributor" && (
                  <Button onClick={() => window.location.href = '/speak'} className="bg-blue-600 hover:bg-blue-700">
                    Start Recording
                  </Button>
                )}
                {user?.role === "reviewer" && (
                  <Button onClick={() => window.location.href = '/listen'} className="bg-blue-600 hover:bg-blue-700">
                    Start Reviewing
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-4">
                  {activityData.map((day, index) => (
                <div key={index} className="flex flex-col items-center space-y-3 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  {/* Day Label */}
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-600 mb-1">{day.dayName}</div>
                    <div className="text-xs text-gray-400">
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  
                  {/* Circular Progress */}
                  <div className="relative">
                    <CircularProgress 
                      percentage={day.percentage} 
                      size={70} 
                      strokeWidth={6}
                      color={day.percentage > 80 ? 'green' : day.percentage > 50 ? 'blue' : day.percentage > 25 ? 'orange' : 'red'}
                    />
                    
                    {/* Trend Indicator */}
                    <div className="absolute -top-1 -right-1">
                      {day.trend === 'up' ? (
                        <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-2.5 h-2.5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                          <TrendingDown className="w-2.5 h-2.5 text-red-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Activity Count */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{day.contributions}</div>
                    <div className="text-xs text-gray-500">
                      {user?.role === "contributor" ? "recordings" : user?.role === "reviewer" ? "reviews" : "activities"}
                    </div>
                  </div>
                  
                  {/* Performance Indicator */}
                  <div className="text-center">
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      day.percentage >= 80 ? 'bg-green-100 text-green-700' :
                      day.percentage >= 60 ? 'bg-blue-100 text-blue-700' :
                      day.percentage >= 40 ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {day.percentage >= 80 ? 'Excellent' :
                       day.percentage >= 60 ? 'Good' :
                       day.percentage >= 40 ? 'Fair' : 'Low'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
                {/* Weekly Summary */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {activityData.reduce((sum, day) => sum + day.contributions, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total This Week</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(activityData.reduce((sum, day) => sum + day.percentage, 0) / 7)}%
                      </div>
                      <div className="text-sm text-gray-600">Average Performance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {activityData.filter(day => day.trend === 'up').length}
                      </div>
                      <div className="text-sm text-gray-600">Improving Days</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3 bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Play className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Quick Actions
              </span>
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Jump to your most used features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === "contributor" && (
              <>
                <Link href="/speak">
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-200/50 hover:border-red-300 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-5">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Mic className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-red-900 group-hover:text-red-800 transition-colors duration-200">
                            Start Recording
                          </div>
                          <div className="text-sm text-red-700/80 mt-1">
                            Begin a new recording session
                          </div>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <div className="h-2"></div>
                
                <div 
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-200/50 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer"
                  onClick={loadDashboardData}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-5">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-blue-900 group-hover:text-blue-800 transition-colors duration-200">
                          Refresh Stats
                        </div>
                        <div className="text-sm text-blue-700/80 mt-1">
                          Update your progress data
                        </div>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {(user?.role === "reviewer" || user?.role === "admin") && (
              <>
                <Link href="/listen">
                  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-200/50 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-5">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Headphones className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-blue-900 group-hover:text-blue-800 transition-colors duration-200">
                            Start Review
                          </div>
                          <div className="text-sm text-blue-700/80 mt-1">
                            Begin validation session
                          </div>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                
                <div className="h-4"></div>
                
                <div 
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-200/50 hover:border-purple-300 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer"
                  onClick={loadDashboardData}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-5">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-purple-900 group-hover:text-purple-800 transition-colors duration-200">
                          Refresh Analytics
                        </div>
                        <div className="text-sm text-purple-700/80 mt-1">
                          Update performance data
                        </div>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {user?.role === "admin" && (
              <Link href="/admin">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-200/50 hover:border-green-300 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-5">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-green-900 group-hover:text-green-800 transition-colors duration-200">
                          Manage Users
                        </div>
                        <div className="text-sm text-green-700/80 mt-1">
                          User administration panel
                        </div>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}
            
            {/* Quick Stats Preview */}
            <div className="mt-6 pt-6 border-t border-gray-200/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl">
                  <div className="text-lg font-bold text-gray-900">
                    {roleStats.primary}
                  </div>
                  <div className="text-xs text-gray-600">
                    {user?.role === "contributor" ? "Recordings" : user?.role === "reviewer" ? "Reviews" : "Users"}
                  </div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl">
                  <div className="text-lg font-bold text-gray-900">
                    {roleStats.timeFormatted.split(' ')[0]}
                  </div>
                  <div className="text-xs text-gray-600">Time</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recording Status Table for Contributors */}
      {user?.role === "contributor" && (
        <div className="mb-8">
          <Card className="bg-white border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <span>Recording Status Overview</span>
                  </CardTitle>
                  <CardDescription>Detailed breakdown of your recording submissions</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Controls */}
              {showFilters && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Date Range</label>
                      <Select
                        value={filters.dateRange}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="quarter">This Quarter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Search</label>
                      <Input
                        placeholder="Search recordings..."
                        value={filters.searchTerm}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Active filters:</span>
                      {filters.status !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Status: {filters.status}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setFilters(prev => ({ ...prev, status: "all" }))}
                          />
                        </Badge>
                      )}
                      {filters.dateRange !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Date: {filters.dateRange}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setFilters(prev => ({ ...prev, dateRange: "all" }))}
                          />
                        </Badge>
                      )}
                      {filters.searchTerm && (
                        <Badge variant="secondary" className="text-xs">
                          Search: {filters.searchTerm}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setFilters(prev => ({ ...prev, searchTerm: "" }))}
                          />
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilters({ status: "all", dateRange: "all", searchTerm: "" })}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {filteredStats.total} of {recordings.length} recordings
                  {filters.status !== "all" || filters.dateRange !== "all" || filters.searchTerm ? " (filtered)" : ""}
                </div>
                {filteredStats.total !== recordings.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ status: "all", dateRange: "all", searchTerm: "" })}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Show All
                  </Button>
                )}
              </div>
              
                              <div className="overflow-x-auto">
                  {filteredStats.total === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500 text-lg font-medium mb-2">No recordings found</div>
                      <div className="text-gray-400 text-sm mb-4">
                        Try adjusting your filters or search terms
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setFilters({ status: "all", dateRange: "all", searchTerm: "" })}
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  ) : (
                    <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Count</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Percentage</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                        activeTab === "submitted" ? "bg-red-50 border-red-200 ring-2 ring-red-500 ring-opacity-50" : ""
                      }`}
                      onClick={() => setActiveTab("submitted")}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className={`font-medium ${activeTab === "submitted" ? "text-red-700" : "text-red-600"}`}>
                            Recordings Submitted
                          </span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-lg font-semibold ${activeTab === "submitted" ? "text-red-900" : "text-red-800"}`}>
                        {filteredStats.total}
                      </td>
                      <td className="py-3 px-4 text-gray-600">100%</td>
                      <td className="py-3 px-4 text-gray-600">All recordings submitted</td>
                    </tr>
                    <tr 
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                        activeTab === "approved" ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-opacity-50" : ""
                      }`}
                      onClick={() => setActiveTab("approved")}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className={`font-medium ${activeTab === "approved" ? "text-blue-700" : "text-blue-600"}`}>
                            Recordings Approved
                          </span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-lg font-semibold ${activeTab === "approved" ? "text-blue-900" : "text-blue-800"}`}>
                        {filteredStats.approved}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {filteredStats.approvedPercentage}%
                      </td>
                      <td className="py-3 px-4 text-gray-600">Successfully validated recordings</td>
                    </tr>
                    <tr 
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                        activeTab === "rejected" ? "bg-orange-50 border-orange-200 ring-2 ring-orange-500 ring-opacity-50" : ""
                      }`}
                      onClick={() => setActiveTab("rejected")}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className={`font-medium ${activeTab === "rejected" ? "text-orange-700" : "text-orange-600"}`}>
                            Recordings Rejected
                          </span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-lg font-semibold ${activeTab === "rejected" ? "text-orange-900" : "text-orange-800"}`}>
                        {filteredStats.rejected}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {filteredStats.rejectedPercentage}%
                      </td>
                      <td className="py-3 px-4 text-gray-600">Recordings that need improvement</td>
                    </tr>
                    <tr 
                      className={`bg-gray-50 cursor-pointer transition-all duration-200 ${
                        activeTab === "all" ? "bg-purple-50 border-purple-200 ring-2 ring-purple-500 ring-opacity-50" : ""
                      }`}
                      onClick={() => setActiveTab("all")}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className={`font-medium ${activeTab === "all" ? "text-purple-700" : "text-purple-600"}`}>
                            Total Time
                          </span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-lg font-bold ${activeTab === "all" ? "text-purple-900" : "text-purple-800"}`}>
                        {roleStats.timeFormatted}
                      </td>
                      <td className="py-3 px-4 text-gray-600">-</td>
                      <td className="py-3 px-4 text-gray-600">Total recording time</td>
                    </tr>
                  </tbody>
                </table>
                  )}
                </div>
                
                {/* Detailed Recordings Table */}
                {activeTab !== "all" && filteredRecordings.length > 0 && (
                  <div className="mt-8 border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {activeTab === "submitted" && "All Recordings"}
                        {activeTab === "approved" && "Approved Recordings"}
                        {activeTab === "rejected" && "Rejected Recordings"}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({filteredRecordings.length} {filteredRecordings.length === 1 ? 'recording' : 'recordings'})
                        </span>
                      </h3>
                    </div>
                    
                    <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
                      <table className="w-full bg-white">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-700 w-16">#</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Statement</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 w-24">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 w-32">Audio</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 w-20">Duration</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700 w-32">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecordings.map((recording, index) => (
                            <tr key={recording.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm font-medium text-gray-500">
                                {index + 1}
                              </td>
                              <td className="py-3 px-4">
                                <div className="max-w-md">
                                  <p className="text-sm text-gray-900 line-clamp-2">
                                    {recording.sentence || 'No statement available'}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  recording.status === 'approved' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : recording.status === 'rejected'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {recording.status || 'pending'}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {recording.audio_url ? (
                                  <audio 
                                    controls 
                                    className="w-full h-8"
                                    preload="metadata"
                                  >
                                    <source src={recording.audio_url} type="audio/mpeg" />
                                    <source src={recording.audio_url} type="audio/wav" />
                                    <source src={recording.audio_url} type="audio/ogg" />
                                    Your browser does not support the audio element.
                                  </audio>
                                ) : (
                                  <span className="text-xs text-gray-400">No audio</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {recording.duration ? `${Math.round(recording.duration)}s` : '-'}
                              </td>
                              <td className="py-3 px-4 text-xs text-gray-500">
                                {new Date(recording.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review History Table for Reviewers */}
      {user?.role === "reviewer" && (
        <div className="mb-8">
          <Card className="bg-white border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <span>Review History</span>
                  </CardTitle>
                  <CardDescription>Detailed breakdown of your review decisions</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Controls */}
              {showFilters && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Decision</label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All decisions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Decisions</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Date Range</label>
                      <Select
                        value={filters.dateRange}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="All time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="quarter">This Quarter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Search</label>
                      <Input
                        placeholder="Search recordings..."
                        value={filters.searchTerm}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Active filters:</span>
                      {filters.status !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Decision: {filters.status}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setFilters(prev => ({ ...prev, status: "all" }))}
                          />
                        </Badge>
                      )}
                      {filters.dateRange !== "all" && (
                        <Badge variant="secondary" className="text-xs">
                          Date: {filters.dateRange}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setFilters(prev => ({ ...prev, dateRange: "all" }))}
                          />
                        </Badge>
                      )}
                      {filters.searchTerm && (
                        <Badge variant="secondary" className="text-xs">
                          Search: {filters.searchTerm}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => setFilters(prev => ({ ...prev, searchTerm: "" }))}
                          />
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilters({ status: "all", dateRange: "all", searchTerm: "" })}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {filteredReviewStats.total} of {reviews.length} reviews
                  {filters.status !== "all" || filters.dateRange !== "all" || filters.searchTerm ? " (filtered)" : ""}
                </div>
                {filteredReviewStats.total !== reviews.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ status: "all", dateRange: "all", searchTerm: "" })}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Show All
                  </Button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                {filteredReviewStats.total === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 text-lg font-medium mb-2">No reviews found</div>
                    <div className="text-gray-400 text-sm mb-4">
                      Try adjusting your filters or search terms
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setFilters({ status: "all", dateRange: "all", searchTerm: "" })}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Decision</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Count</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Percentage</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr 
                        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                          reviewerActiveTab === "approved" ? "bg-green-50 border-green-200 ring-2 ring-green-500 ring-opacity-50" : ""
                        }`}
                        onClick={() => setReviewerActiveTab("approved")}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className={`font-medium ${reviewerActiveTab === "approved" ? "text-green-700" : "text-green-600"}`}>
                              Reviews Approved
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-lg font-semibold ${reviewerActiveTab === "approved" ? "text-green-900" : "text-green-800"}`}>
                          {filteredReviewStats.approved}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {filteredReviewStats.approvedPercentage}%
                        </td>
                        <td className="py-3 px-4 text-gray-600">Recordings you approved</td>
                      </tr>
                      <tr 
                        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                          reviewerActiveTab === "rejected" ? "bg-red-50 border-red-200 ring-2 ring-red-500 ring-opacity-50" : ""
                        }`}
                        onClick={() => setReviewerActiveTab("rejected")}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className={`font-medium ${reviewerActiveTab === "rejected" ? "text-red-700" : "text-red-600"}`}>
                              Reviews Rejected
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-lg font-semibold ${reviewerActiveTab === "rejected" ? "text-red-900" : "text-red-800"}`}>
                          {filteredReviewStats.rejected}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {filteredReviewStats.rejectedPercentage}%
                        </td>
                        <td className="py-3 px-4 text-gray-600">Recordings you rejected</td>
                      </tr>
                      <tr 
                        className={`bg-gray-50 cursor-pointer transition-all duration-200 ${
                          reviewerActiveTab === "total" ? "bg-purple-50 border-purple-200 ring-2 ring-purple-500 ring-opacity-50" : ""
                        }`}
                        onClick={() => setReviewerActiveTab("total")}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className={`font-medium ${reviewerActiveTab === "total" ? "text-purple-700" : "text-purple-600"}`}>
                              Total Reviews
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-lg font-bold ${reviewerActiveTab === "total" ? "text-purple-900" : "text-purple-800"}`}>
                          {filteredReviewStats.total}
                        </td>
                        <td className="py-3 px-4 text-gray-600">100%</td>
                        <td className="py-3 px-4 text-gray-600">All reviews completed</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Detailed Reviews Table */}
              {reviewerActiveTab !== "all" && filteredReviews.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {reviewerActiveTab === "approved" && "Approved Reviews"}
                      {reviewerActiveTab === "rejected" && "Rejected Reviews"}
                      {reviewerActiveTab === "total" && "All Reviews"}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'})
                      </span>
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full bg-white">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700 w-16">#</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Statement</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 w-24">Decision</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 w-32">Audio</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 w-20">Duration</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 w-32">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReviews.map((review, index) => (
                          <tr key={review.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-500">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="max-w-md">
                                <p className="text-sm text-gray-900 line-clamp-2">
                                  {review.recording?.sentence || 'No statement available'}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                review.decision === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : review.decision === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {review.decision || 'pending'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {review.recording?.audio_url ? (
                                <audio 
                                  controls 
                                  className="w-full h-8"
                                  preload="metadata"
                                >
                                  <source src={review.recording.audio_url} type="audio/mpeg" />
                                  <source src={review.recording.audio_url} type="audio/wav" />
                                  <source src={review.recording.audio_url} type="audio/ogg" />
                                  Your browser does not support the audio element.
                                </audio>
                              ) : (
                                <span className="text-xs text-gray-400">No audio</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {review.recording?.duration ? `${Math.round(review.recording.duration)}s` : '-'}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <div className="max-w-xs">
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {review.comments || 'No comments'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legacy Detailed Review Records Table - Remove this section */}
      {false && user?.role === "reviewer" && filteredReviews.length > 0 && (
        <div className="mb-8">
          <Card className="bg-white border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Headphones className="w-5 h-5 text-blue-500" />
                <span>Review Records</span>
              </CardTitle>
              <CardDescription>Detailed list of your review decisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Recording</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Decision</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Review Time</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Recording Duration</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Quality</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Confidence</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.slice(0, 10).map((review, index) => (
                      <tr key={review.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="max-w-xs">
                            <div className="font-medium text-gray-900 mb-1">
                              {review.recording?.sentence || "Recordings"}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              ID: {review.recording_id || review.id}
                            </div>
                            {review.recording?.audio_url && (
                              <audio 
                                controls 
                                className="w-full h-8 text-xs"
                                preload="none"
                              >
                                <source src={review.recording.audio_url} type="audio/wav" />
                                <source src={review.recording.audio_url} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={review.decision === 'approved' ? 'default' : 'destructive'}
                            className={review.decision === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}
                          >
                            {review.decision === 'approved' ? 'Approved' : 'Rejected'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {review.time_spent ? `${Math.round(review.time_spent)}s` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {review.recording?.duration ? `${Math.round(review.recording.duration)}s` : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="outline"
                            className={
                              review.recording?.quality === 'excellent' ? 'border-green-200 text-green-700 bg-green-50' :
                              review.recording?.quality === 'good' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                              review.recording?.quality === 'fair' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                              review.recording?.quality === 'poor' ? 'border-red-200 text-red-700 bg-red-50' :
                              'border-gray-200 text-gray-700 bg-gray-50'
                            }
                          >
                            {review.recording?.quality || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  review.confidence >= 80 ? 'bg-green-500' : 
                                  review.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${review.confidence || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{review.confidence || 0}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-xs truncate text-gray-600">
                            {review.comments || 'No comments'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredReviews.length > 10 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      Showing first 10 of {filteredReviews.length} reviews
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      View All Reviews
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
