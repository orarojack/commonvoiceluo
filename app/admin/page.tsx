"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Search,
  UserCheck,
  UserX,
  Mail,
  Users,
  Clock,
  Mic,
  Headphones,
  TrendingUp,
  Activity,
  Trash2,
  Eye,
  Play,
  Pause,
  Volume2,
  Download,
  RefreshCw,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { db, type User, type UserStats, type Recording, type Review } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { mozillaApi } from "@/lib/mozilla-api"

// Utility function to format time in hours, minutes, and seconds
const formatTime = (totalSeconds: number): string => {
  if (totalSeconds < 1) {
    return "0h 0m 0s"
  }
  
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  
  // Always show the full format: hours, minutes, seconds
  return `${hours}h ${minutes}m ${seconds}s`
}

// Smart pagination component
const renderPaginationButtons = (
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
) => {
  const maxVisiblePages = 7
  const pages = []
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(i)}
          className="w-8 h-8 p-0"
        >
          {i}
        </Button>
      )
    }
  } else {
    // Smart pagination with ellipsis
    const current = currentPage
    const total = totalPages
    
    // Always show first page
    pages.push(
      <Button
        key={1}
        variant={current === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => onPageChange(1)}
        className="w-8 h-8 p-0"
      >
        1
      </Button>
    )
    
    // Show ellipsis if current page is far from start
    if (current > 4) {
      pages.push(
        <span key="ellipsis1" className="px-2 text-gray-500">...</span>
      )
    }
    
    // Show pages around current page
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) {
        pages.push(
          <Button
            key={i}
            variant={current === i ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(i)}
            className="w-8 h-8 p-0"
          >
            {i}
          </Button>
        )
      }
    }
    
    // Show ellipsis if current page is far from end
    if (current < total - 3) {
      pages.push(
        <span key="ellipsis2" className="px-2 text-gray-500">...</span>
      )
    }
    
    // Always show last page
    if (total > 1) {
      pages.push(
        <Button
          key={total}
          variant={current === total ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(total)}
          className="w-8 h-8 p-0"
        >
          {total}
        </Button>
      )
    }
  }
  
  return pages
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [recordingSearchTerm, setRecordingSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [users, setUsers] = useState<User[]>([])
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [systemStats, setSystemStats] = useState({
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
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Pagination state
  const [currentUserPage, setCurrentUserPage] = useState(1)
  const [currentRecordingPage, setCurrentRecordingPage] = useState(1)
  const [currentStatementPage, setCurrentStatementPage] = useState(1)
  const usersPerPage = 10
  const recordingsPerPage = 10
  const statementsPerPage = 10

  // Statements state
  const [statements, setStatements] = useState<string[]>([])
  const [loadingStatements, setLoadingStatements] = useState(false)
  const [statementsError, setStatementsError] = useState<string | null>(null)

  // Audio playback state
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioObjectUrlRef = useRef<string | null>(null)

  // Reviewer information modal state
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)

  // User details modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false)

  useEffect(() => {
    if (user?.role !== "admin") {
      router.push("/dashboard")
      return
    }
    loadAllData()
  }, [user, router])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentUserPage(1)
  }, [searchTerm, filterRole, filterStatus])

  useEffect(() => {
    setCurrentRecordingPage(1)
  }, [recordingSearchTerm, filterStatus])

  // Load statements when statements tab is accessed
  useEffect(() => {
    if (activeTab === "statements" && statements.length === 0 && !loadingStatements) {
      loadStatements()
    }
  }, [activeTab])

  const loadAllData = async () => {
    try {
      setLoading(true)
      
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("Supabase environment variables not configured")
        toast({
          title: "Configuration Error",
          description: "Supabase is not properly configured. Please check your environment variables.",
          variant: "destructive",
        })
        return
      }
      
      console.log("Loading admin data...")
      const [allUsers, allUserStats, allRecordings, allReviews, stats] = await Promise.all([
        db.getAllUsers(),
        db.getAllUserStats(),
        db.getAllRecordings(),
        db.getAllReviews(),
        db.getSystemStats(),
      ])

      console.log("Loaded users:", allUsers.length)
      console.log("Loaded user stats:", allUserStats.length)
      console.log("Loaded recordings:", allRecordings.length)
      console.log("Loaded reviews:", allReviews.length)

      // Debug: Log pending reviewers
      const pendingReviewers = allUsers.filter(user => user.role === "reviewer" && user.status === "pending")
      console.log("Pending reviewers:", pendingReviewers)
      
      setUsers(allUsers)
      setUserStats(allUserStats)
      setRecordings(allRecordings)
      setReviews(allReviews)
      setSystemStats(stats)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    try {
      setRefreshing(true)
      
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("Supabase environment variables not configured")
        toast({
          title: "Configuration Error",
          description: "Supabase is not properly configured. Please check your environment variables.",
          variant: "destructive",
        })
        return
      }
      
      console.log("Refreshing admin data...")
      const [allUsers, allUserStats, allRecordings, allReviews, stats] = await Promise.all([
        db.getAllUsers(),
        db.getAllUserStats(),
        db.getAllRecordings(),
        db.getAllReviews(),
        db.getSystemStats(),
      ])

      console.log("Refreshed users:", allUsers.length)
      console.log("Refreshed user stats:", allUserStats.length)
      console.log("Refreshed recordings:", allRecordings.length)
      console.log("Refreshed reviews:", allReviews.length)
      
      setUsers(allUsers)
      setUserStats(allUserStats)
      setRecordings(allRecordings)
      setReviews(allReviews)
      setSystemStats(stats)
      
      toast({
        title: "Data Refreshed",
        description: "All statistics have been updated successfully.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const loadStatements = async () => {
    try {
      setLoadingStatements(true)
      setStatementsError(null)
      
      // Use the imported mozillaApi
      
      // Fetch ALL statements by making multiple requests
      const allStatements: string[] = []
      let offset = 0
      const batchSize = 50 // API limit per request
      let hasMore = true
      
      toast({
        title: "Loading Statements",
        description: "Fetching all statements from Mozilla Common Voice API...",
      })
      
      while (hasMore) {
        try {
          // Fetch batch of statements
          const batch = await mozillaApi.getSentences({
            languageCode: 'luo',
            limit: batchSize,
            offset: offset,
            taxonomy: { Licence: 'NOODL' }
          })
          
          if (batch.length === 0) {
            hasMore = false
          } else {
            // Extract text from sentences and add to our collection
            const batchTexts = batch.map(sentence => sentence.text)
            allStatements.push(...batchTexts)
            offset += batchSize
            
            // Update progress
            toast({
              title: "Loading Statements",
              description: `Loaded ${allStatements.length} statements so far...`,
            })
          }
        } catch (batchError) {
          console.error(`Error fetching batch at offset ${offset}:`, batchError)
          // If we get an error, we might have reached the end or hit a limit
          hasMore = false
        }
      }
      
      setStatements(allStatements)
      
      toast({
        title: "All Statements Loaded",
        description: `Successfully loaded ${allStatements.length} statements from Mozilla Common Voice API`,
      })
    } catch (error) {
      console.error('Failed to load statements from Mozilla API:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Clean up error message if it's already wrapped
      const cleanErrorMessage = errorMessage.replace(/^Mozilla API error: /i, '').replace(/^Mozilla API Error: /i, '')
      setStatementsError(cleanErrorMessage)
      
      toast({
        title: "Mozilla API Error",
        description: `Failed to load statements: ${cleanErrorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoadingStatements(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    const matchesStatus = filterStatus === "all" || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  // Pagination for users
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startUserIndex = (currentUserPage - 1) * usersPerPage
  const endUserIndex = startUserIndex + usersPerPage
  const paginatedUsers = filteredUsers.slice(startUserIndex, endUserIndex)

  // Filtered recordings
  const filteredRecordings = recordings.filter(recording => {
    let matchesStatus;
    if (filterStatus === "all") {
      matchesStatus = true;
    } else if (filterStatus === "reviewed") {
      matchesStatus = recording.status === "approved" || recording.status === "rejected";
    } else {
      matchesStatus = recording.status === filterStatus;
    }
    
    const matchesSearch = !recordingSearchTerm || 
      recording.sentence.toLowerCase().includes(recordingSearchTerm.toLowerCase()) ||
      users.find(u => u.id === recording.user_id)?.name?.toLowerCase().includes(recordingSearchTerm.toLowerCase()) ||
      users.find(u => u.id === recording.user_id)?.email.toLowerCase().includes(recordingSearchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination for recordings
  const totalRecordingPages = Math.ceil(filteredRecordings.length / recordingsPerPage)
  const startRecordingIndex = (currentRecordingPage - 1) * recordingsPerPage
  const endRecordingIndex = startRecordingIndex + recordingsPerPage
  const paginatedRecordings = filteredRecordings.slice(startRecordingIndex, endRecordingIndex)

  // Pagination for statements
  const totalStatementPages = Math.ceil(statements.length / statementsPerPage)
  const startStatementIndex = (currentStatementPage - 1) * statementsPerPage
  const endStatementIndex = startStatementIndex + statementsPerPage
  const paginatedStatements = statements.slice(startStatementIndex, endStatementIndex)

  const handleApproveReviewer = async (userId: string) => {
    try {
      console.log("Approving reviewer with ID:", userId)
      
      // Get user details before updating
      const userToApprove = users.find(u => u.id === userId)
      if (!userToApprove) {
        throw new Error("User not found")
      }
      
      const result = await db.updateUser(userId, { status: "active", is_active: true })
      console.log("Update result:", result)
      
      // Update local state instead of reloading all data
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: "active", is_active: true }
            : user
        )
      )
      
      // Update system stats
      setSystemStats(prevStats => ({
        ...prevStats,
        pendingReviewers: prevStats.pendingReviewers - 1,
        activeUsers: prevStats.activeUsers + 1
      }))
      
      toast({
        title: "Reviewer Approved",
        description: `${userToApprove.email} has been approved and can now access the system.`,
      })
      
      // TODO: Send email notification to the approved reviewer
      console.log(`Email notification would be sent to: ${userToApprove.email}`)
      
    } catch (error) {
      console.error("Error approving reviewer:", error)
      toast({
        title: "Error",
        description: "Failed to approve reviewer",
        variant: "destructive",
      })
    }
  }

  const handleRejectReviewer = async (userId: string) => {
    try {
      console.log("Rejecting reviewer with ID:", userId)
      
      // Get user details before updating
      const userToReject = users.find(u => u.id === userId)
      if (!userToReject) {
        throw new Error("User not found")
      }
      
      const result = await db.updateUser(userId, { status: "rejected", is_active: false })
      console.log("Reject result:", result)
      
      // Update local state instead of reloading all data
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: "rejected", is_active: false }
            : user
        )
      )
      
      // Update system stats
      setSystemStats(prevStats => ({
        ...prevStats,
        pendingReviewers: prevStats.pendingReviewers - 1
      }))
      
      toast({
        title: "Reviewer Rejected",
        description: `${userToReject.email} has been rejected and cannot access the system.`,
      })
      
      // TODO: Send email notification to the rejected reviewer
      console.log(`Email notification would be sent to: ${userToReject.email}`)
      
    } catch (error) {
      console.error("Error rejecting reviewer:", error)
      toast({
        title: "Error",
        description: "Failed to reject reviewer",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        // Get user details before deleting
        const userToDelete = users.find(u => u.id === userId)
        if (!userToDelete) {
          throw new Error("User not found")
        }
        
        await db.deleteUser(userId)
        
        // Update local state instead of reloading all data
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
        
        // Update system stats based on user role and status
        setSystemStats(prevStats => {
          const newStats = { ...prevStats }
          newStats.totalUsers = newStats.totalUsers - 1
          
          if (userToDelete.role === "contributor") {
            newStats.contributors = newStats.contributors - 1
          } else if (userToDelete.role === "reviewer") {
            newStats.reviewers = newStats.reviewers - 1
            if (userToDelete.status === "pending") {
              newStats.pendingReviewers = newStats.pendingReviewers - 1
            }
          }
          
          if (userToDelete.status === "active") {
            newStats.activeUsers = newStats.activeUsers - 1
          }
          
          return newStats
        })
        
        // Remove user's recordings from local state
        setRecordings(prevRecordings => 
          prevRecordings.filter(recording => recording.user_id !== userId)
        )
        
        // Remove user's reviews from local state
        setReviews(prevReviews => 
          prevReviews.filter(review => review.reviewer_id !== userId)
        )
        
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
      } catch (error) {
        console.error("Error deleting user:", error)
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        })
      }
    }
  }

  const handleSendEmail = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId)
    
    if (!targetUser?.email) {
      toast({
        title: "Error",
        description: "No email address found for this user",
        variant: "destructive",
      })
      return
    }

    try {
      // Open default email client with the user's email address
      const mailtoLink = `mailto:${targetUser.email}`
      window.open(mailtoLink, '_blank')
      
      toast({
        title: "Email Client Opened",
        description: `Opening email client for ${targetUser.email}`,
      })
    } catch (error) {
      console.error("Error opening email client:", error)
      toast({
        title: "Error",
        description: "Failed to open email client. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getUserStatsById = (userId: string): UserStats | undefined => {
    return userStats.find((stats) => stats.userId === userId)
  }

  const getRecordingsByUser = (userId: string): Recording[] => {
    return recordings.filter((recording) => recording.user_id === userId)
  }

  const getReviewsByReviewer = (reviewerId: string): Review[] => {
    return reviews.filter((review) => review.reviewer_id === reviewerId)
  }

  // Audio playback functions
  const handlePlayRecording = async (recording: Recording) => {
    setSelectedRecording(recording)
    setIsAudioModalOpen(true)
    setIsPlaying(false)
    setAudioError(null)
    setAudioLoading(true)
    
    console.log("Loading recording:", recording.id)
    console.log("Audio URL type:", recording.audio_url.substring(0, 50) + "...")
    
    // Check if audio URL is valid
    if (!recording.audio_url || recording.audio_url.trim() === '') {
      setAudioLoading(false)
      setAudioError("No audio URL available")
      return
    }
    
    try {
      // Convert data URL to blob and create object URL for better performance
      if (recording.audio_url.startsWith('data:')) {
        console.log("Converting data URL to blob...")
        const response = await fetch(recording.audio_url)
        const blob = await response.blob()
        console.log("Blob created, size:", blob.size)
        const objectUrl = URL.createObjectURL(blob)
        audioObjectUrlRef.current = objectUrl
        
        if (audioRef.current) {
          audioRef.current.src = objectUrl
          audioRef.current.load()
          console.log("Audio element loaded with object URL")
        }
      } else {
        // If it's already a regular URL, use it directly
        console.log("Using direct URL...")
        if (audioRef.current) {
          audioRef.current.src = recording.audio_url
          audioRef.current.load()
        }
      }
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (audioLoading) {
          setAudioLoading(false)
          setAudioError("Audio loading timed out. Please try again.")
        }
      }, 15000) // 15 second timeout for blob conversion
      
      // Add event listeners for better error handling
      if (audioRef.current) {
        audioRef.current.oncanplay = () => {
          console.log("Audio can play event fired")
          clearTimeout(timeoutId)
          setAudioLoading(false)
          setAudioError(null)
        }
        
        audioRef.current.onerror = (e) => {
          console.error("Audio error event fired:", e)
          clearTimeout(timeoutId)
          setAudioLoading(false)
          setAudioError("Failed to load audio file")
        }
        
        audioRef.current.ontimeupdate = () => {
          // Reset loading state once audio starts playing
          if (audioRef.current && audioRef.current.currentTime > 0) {
            setAudioLoading(false)
          }
        }
      }
    } catch (error) {
      console.error("Error processing audio:", error)
      
      // Fallback: try to use the data URL directly
      try {
        console.log("Trying fallback with direct data URL...")
        if (audioRef.current) {
          audioRef.current.src = recording.audio_url
          audioRef.current.load()
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError)
        setAudioLoading(false)
        setAudioError("Failed to process audio file")
      }
    }
  }

  const togglePlayback = async () => {
    if (!selectedRecording?.audio_url) {
      toast({
        title: "Error",
        description: "No audio file available for this recording",
        variant: "destructive",
      })
      return
    }

    if (audioError) {
      toast({
        title: "Error",
        description: audioError,
        variant: "destructive",
      })
      return
    }

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsPlaying(false)
    } else {
      setAudioLoading(true)
      try {
        if (audioRef.current) {
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (error) {
        console.error("Error playing audio:", error)
        setAudioError("Failed to play audio file")
        toast({
          title: "Error",
          description: "Failed to play audio file",
          variant: "destructive",
        })
      } finally {
        setAudioLoading(false)
      }
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const handleAudioError = () => {
    setIsPlaying(false)
    setAudioLoading(false)
    setAudioError("Failed to load audio file")
    toast({
      title: "Error",
      description: "Failed to load audio file",
      variant: "destructive",
    })
  }

  const closeAudioModal = () => {
    setIsAudioModalOpen(false)
    setSelectedRecording(null)
    setIsPlaying(false)
    setAudioLoading(false)
    setAudioError(null)
    
    // Clean up object URL to prevent memory leaks
    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current)
      audioObjectUrlRef.current = null
    }
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      // Remove event listeners
      audioRef.current.oncanplay = null
      audioRef.current.onerror = null
      audioRef.current.ontimeupdate = null
    }
  }

  const handleViewReviewerInfo = async (recording: Recording) => {
    if (!recording.reviewed_by) {
      toast({
        title: "No Review",
        description: "This recording has not been reviewed yet.",
        variant: "destructive",
      })
      return
    }

    try {
      setReviewLoading(true)
      setIsReviewModalOpen(true)
      
      // Get the review details from the reviews table
      const reviews = await db.getReviewsByRecording(recording.id)
      const review = reviews.find(r => r.reviewer_id === recording.reviewed_by)
      
      if (review) {
        setSelectedReview(review)
      } else {
        toast({
          title: "Review Not Found",
          description: "Review details could not be found.",
          variant: "destructive",
        })
        setIsReviewModalOpen(false)
      }
    } catch (error) {
      console.error("Error fetching review details:", error)
      toast({
        title: "Error",
        description: "Failed to load review information.",
        variant: "destructive",
      })
      setIsReviewModalOpen(false)
    } finally {
      setReviewLoading(false)
    }
  }

  const closeReviewModal = () => {
    setIsReviewModalOpen(false)
    setSelectedReview(null)
    setReviewLoading(false)
  }

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user)
    setIsUserDetailsModalOpen(true)
  }

  const closeUserDetailsModal = () => {
    setIsUserDetailsModalOpen(false)
    setSelectedUser(null)
  }

  const handleExportUsers = () => {
    try {
      // Get filtered users
      const filteredUsers = users.filter((user) => {
        const matchesSearch =
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = filterRole === "all" || user.role === filterRole
        const matchesStatus = filterStatus === "all" || user.status === filterStatus
        return matchesSearch && matchesRole && matchesStatus
      })

      // Prepare CSV data
      const csvData = [
        // Header row
        ['Name', 'Email', 'Role', 'Status', 'Join Date', 'Profile Complete', 'Age', 'Gender', 'Phone Number', 'Location', 'Educational Background', 'Employment Status', 'Language Dialect', 'Languages', 'Total Recordings', 'Approved Recordings', 'Rejected Recordings', 'Total Reviews', 'Approved Reviews', 'Rejected Reviews', 'Accuracy Rate'],
        // Data rows
        ...filteredUsers.map(user => {
          const stats = getUserStatsById(user.id)
          
          return [
            user.name || 'N/A',
            user.email,
            user.role,
            user.status,
            new Date(user.created_at).toLocaleDateString(),
            user.profile_complete ? 'Yes' : 'No',
            user.age || 'N/A',
            user.gender || 'N/A',
            user.phone_number || 'N/A',
            user.location || 'N/A',
            user.educational_background || 'N/A',
            user.employment_status || 'N/A',
            user.language_dialect || 'N/A',
            user.languages && user.languages.length > 0 ? user.languages.join('; ') : 'N/A',
            stats?.totalRecordings || 0,
            stats?.approvedRecordings || 0,
            stats?.rejectedRecordings || 0,
            stats?.totalReviews || 0,
            stats?.approvedReviews || 0,
            stats?.rejectedReviews || 0,
            stats?.accuracyRate?.toFixed(1) + '%' || 'N/A'
          ];
        })
      ];

      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(',')
      ).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${filteredUsers.length} users to CSV file`,
      });
    } catch (error) {
      console.error("Error exporting users:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export users. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportRecordings = () => {
    try {
      // Get filtered recordings
      const filteredRecordings = recordings.filter(recording => {
        let matchesStatus;
        if (filterStatus === "all") {
          matchesStatus = true;
        } else if (filterStatus === "reviewed") {
          matchesStatus = recording.status === "approved" || recording.status === "rejected";
        } else {
          matchesStatus = recording.status === filterStatus;
        }
        
        const matchesSearch = !recordingSearchTerm || 
          recording.sentence.toLowerCase().includes(recordingSearchTerm.toLowerCase()) ||
          users.find(u => u.id === recording.user_id)?.name?.toLowerCase().includes(recordingSearchTerm.toLowerCase()) ||
          users.find(u => u.id === recording.user_id)?.email.toLowerCase().includes(recordingSearchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      });

      // Prepare CSV data
      const csvData = [
        // Header row
        ['Contributor', 'Contributor Email', 'Sentence', 'Duration (s)', 'Status', 'Reviewer', 'Review Date', 'Created Date', 'Quality', 'Audio URL'],
        // Data rows
        ...filteredRecordings.map(recording => {
          const contributor = users.find((u) => u.id === recording.user_id);
          const reviewer = recording.reviewed_by ? users.find((u) => u.id === recording.reviewed_by) : null;
          
          return [
            contributor?.name || 'N/A',
            contributor?.email || 'N/A',
            `"${recording.sentence.replace(/"/g, '""')}"`, // Escape quotes in CSV
            recording.duration.toFixed(1),
            recording.status,
            reviewer?.name || reviewer?.email || 'Not reviewed',
            recording.reviewed_at ? new Date(recording.reviewed_at).toLocaleDateString() : 'N/A',
            new Date(recording.created_at).toLocaleDateString(),
            recording.quality || 'N/A',
            recording.audio_url ? 'Yes' : 'No'
          ];
        })
      ];

      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(',')).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `recordings_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${filteredRecordings.length} recordings to CSV file`,
      });
    } catch (error) {
      console.error("Error exporting recordings:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export recordings. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (user?.role !== "admin") {
    return null
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive system management and analytics</p>
          </div>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </Button>
        </div>
      </div>

      {/* System Stats Grid */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6 mb-8">
        <Card 
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
          onClick={() => {
            setActiveTab("users")
            setFilterRole("all")
            setFilterStatus("all")
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-blue-800">Total Users</CardTitle>
            <div className="p-1 bg-blue-500 rounded">
              <Users className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold text-blue-900">{systemStats.totalUsers}</div>
            <p className="text-xs text-blue-600">{systemStats.activeUsers} active</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
          onClick={() => {
            setActiveTab("recordings")
            setRecordingSearchTerm("")
            // Reset filter to show all recordings
            setFilterStatus("all")
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-green-800">Total Recordings</CardTitle>
            <div className="p-1 bg-green-500 rounded">
              <Mic className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold text-green-900">{systemStats.totalRecordings}</div>
            <p className="text-xs text-green-600">
              {systemStats.approvedRecordings} approved, {systemStats.rejectedRecordings} rejected
            </p>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
          onClick={() => {
            setActiveTab("recordings")
            setRecordingSearchTerm("")
            // Set filter to show only reviewed recordings (approved and rejected)
            setFilterStatus("reviewed")
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-purple-800">Total Reviews</CardTitle>
            <div className="p-1 bg-purple-500 rounded">
              <Headphones className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold text-purple-900">{systemStats.totalReviews}</div>
            <p className="text-xs text-purple-600">Avg: {systemStats.averageReviewTime.toFixed(1)}s</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
          onClick={() => {
            setActiveTab("recordings")
            setRecordingSearchTerm("")
            // Set filter to show only pending recordings
            setFilterStatus("pending")
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-yellow-800">Pending Reviews</CardTitle>
            <div className="p-1 bg-yellow-500 rounded">
              <Clock className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold text-yellow-900">{systemStats.pendingRecordings}</div>
            <p className="text-xs text-yellow-600">{systemStats.pendingReviewers} reviewers pending</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
          onClick={() => {
            setActiveTab("users")
            setFilterRole("reviewer")
            setFilterStatus("pending")
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-orange-800">Pending Reviewers</CardTitle>
            <div className="p-1 bg-orange-500 rounded">
              <Users className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold text-orange-900">{systemStats.pendingReviewers}</div>
            <p className="text-xs text-orange-600">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
          onClick={() => {
            setActiveTab("analytics")
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-indigo-800">Total Time</CardTitle>
            <div className="p-1 bg-indigo-500 rounded">
              <TrendingUp className="h-3 w-3 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold text-indigo-900">{formatTime(systemStats.totalSystemTime)}</div>
            <p className="text-xs text-indigo-600">Total recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="statements">API Statements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Activity */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={() => {
                setActiveTab("recordings")
                setRecordingSearchTerm("")
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <p className="text-xs text-gray-500">Click to view all recordings</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recordings.slice(0, 5).map((recording) => {
                    const recordingUser = users.find((u) => u.id === recording.user_id)
                    return (
                      <div key={recording.id} className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Mic className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{recordingUser?.name || recordingUser?.email}</p>
                          <p className="text-xs text-gray-500">
                            Submitted recording • {new Date(recording.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            recording.status === "approved"
                              ? "default"
                              : recording.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {recording.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={() => {
                setActiveTab("users")
                setFilterRole("contributor")
                setFilterStatus("all")
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Top Contributors</span>
                </CardTitle>
                <p className="text-xs text-gray-500">Click to view all contributors</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users
                    .filter((u) => u.role === "contributor")
                    .map((user) => {
                      const stats = getUserStatsById(user.id)
                      return { user, stats }
                    })
                    .sort((a, b) => (b.stats?.totalRecordings || 0) - (a.stats?.totalRecordings || 0))
                    .slice(0, 5)
                    .map(({ user, stats }) => (
                      <div key={user.id} className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name || user.email}</p>
                          <p className="text-xs text-gray-500">
                            {stats?.totalRecordings || 0} recordings • {stats?.approvedRecordings || 0} approved
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{stats?.totalRecordings || 0}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and reviewer applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  onClick={handleExportUsers}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Users</span>
                </Button>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="contributor">Contributors</SelectItem>
                    <SelectItem value="reviewer">Reviewers</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contributions</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const stats = getUserStatsById(user.id)
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name || "No name"}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "reviewer" ? "secondary" : user.role === "admin" ? "default" : "outline"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "active"
                                ? "default"
                                : user.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className={
                              user.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : user.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : ""
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.role === "contributor" && (
                              <>
                                <p>{stats?.totalRecordings || 0} recordings</p>
                                <p className="text-xs text-gray-500">
                                  {stats?.approvedRecordings || 0} approved, {stats?.rejectedRecordings || 0} rejected
                                </p>
                              </>
                            )}
                            {user.role === "reviewer" && (
                              <>
                                <p>{stats?.totalReviews || 0} reviews</p>
                                <p className="text-xs text-gray-500">
                                  {stats?.approvedReviews || 0} approved, {stats?.rejectedReviews || 0} rejected
                                </p>
                              </>
                            )}
                            {user.role === "admin" && <p className="text-xs text-gray-500">System administrator</p>}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {user.role === "reviewer" && user.status === "pending" && (
                              <>
                                {console.log("Rendering approval buttons for user:", user.id, user.email)}
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveReviewer(user.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleRejectReviewer(user.id)}>
                                  <UserX className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleViewUserDetails(user)}
                              className="flex items-center space-x-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span>Details</span>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSendEmail(user.id)}>
                              <Mail className="h-4 w-4" />
                            </Button>
                            {user.role !== "admin" && (
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              
              {/* Users Pagination */}
              {totalUserPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {startUserIndex + 1} to {Math.min(endUserIndex, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentUserPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentUserPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {renderPaginationButtons(currentUserPage, totalUserPages, setCurrentUserPage)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentUserPage(prev => Math.min(prev + 1, totalUserPages))}
                      disabled={currentUserPage === totalUserPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recordings Tab */}
        <TabsContent value="recordings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recording Management</CardTitle>
              <CardDescription>
                View and manage all voice recordings ({recordings.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recordings by sentence or contributor..."
                    value={recordingSearchTerm}
                    onChange={(e) => setRecordingSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="reviewed">Reviewed (Approved + Rejected)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleExportRecordings}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export to Excel</span>
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contributor</TableHead>
                    <TableHead>Sentence</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecordings.map((recording) => {
                    const contributor = users.find((u) => u.id === recording.user_id)
                    const reviewer = recording.reviewed_by ? users.find((u) => u.id === recording.reviewed_by) : null
                    return (
                      <TableRow key={recording.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{contributor?.name || contributor?.email}</p>
                            <p className="text-xs text-gray-500">{contributor?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-xs truncate">{recording.sentence}</p>
                        </TableCell>
                        <TableCell>{recording.duration.toFixed(1)}s</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              recording.status === "approved"
                                ? "default"
                                : recording.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {recording.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reviewer ? (
                            <div>
                              <p className="text-sm">{reviewer.name || reviewer.email}</p>
                              {recording.reviewed_at && (
                                <p className="text-xs text-gray-500">
                                  {new Date(recording.reviewed_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not reviewed</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(recording.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePlayRecording(recording)}
                              disabled={!recording.audio_url}
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewReviewerInfo(recording)}
                              disabled={!recording.reviewed_by}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              
              {/* Recordings Pagination */}
              {totalRecordingPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {startRecordingIndex + 1} to {Math.min(endRecordingIndex, filteredRecordings.length)} of {filteredRecordings.length} recordings
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentRecordingPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentRecordingPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {renderPaginationButtons(currentRecordingPage, totalRecordingPages, setCurrentRecordingPage)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentRecordingPage(prev => Math.min(prev + 1, totalRecordingPages))}
                      disabled={currentRecordingPage === totalRecordingPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statements Tab */}
        <TabsContent value="statements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="h-5 w-5" />
                <span>Mozilla API Statements</span>
              </CardTitle>
              <CardDescription>
                View all statements being fetched from Mozilla Common Voice API for contributors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-500">
                  {statements.length > 0 ? (
                    <div className="flex items-center space-x-2">
                      <span>{statements.length.toLocaleString()} statements loaded</span>
                      {loadingStatements && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          <span className="text-xs">Loading more...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    "No statements loaded yet"
                  )}
                </div>
                <Button
                  onClick={loadStatements}
                  disabled={loadingStatements}
                  className="flex items-center space-x-2"
                >
                  {loadingStatements ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Loading All...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Load All Statements</span>
                    </>
                  )}
                </Button>
              </div>

              {statementsError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-red-700 font-medium">Error loading statements</p>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{statementsError}</p>
                </div>
              )}

              {loadingStatements && statements.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading statements from Mozilla Common Voice API...</p>
                  </div>
                </div>
              ) : statements.length === 0 ? (
                <div className="text-center py-12">
                  <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No statements loaded yet. Click "Load Statements" to fetch from Mozilla API.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedStatements.map((statement, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {startStatementIndex + index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 leading-relaxed">
                              {statement}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span>Language: Luo</span>
                              <span>Length: {statement.length} characters</span>
                              <span>Words: {statement.split(' ').length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Statements Pagination */}
                  {totalStatementPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500">
                        Showing {startStatementIndex + 1} to {Math.min(endStatementIndex, statements.length)} of {statements.length.toLocaleString()} statements
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStatementPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentStatementPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {renderPaginationButtons(currentStatementPage, totalStatementPages, setCurrentStatementPage)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStatementPage(prev => Math.min(prev + 1, totalStatementPages))}
                          disabled={currentStatementPage === totalStatementPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Reviewer Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Reviewer Performance</CardTitle>
                <CardDescription>Individual reviewer statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users
                    .filter((u) => u.role === "reviewer" && u.status === "active")
                    .map((reviewer) => {
                      const stats = getUserStatsById(reviewer.id)
                      return { reviewer, stats }
                    })
                    .sort((a, b) => (b.stats?.totalReviews || 0) - (a.stats?.totalReviews || 0))
                    .slice(0, 2)
                    .map(({ reviewer, stats }) => (
                      <div key={reviewer.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{reviewer.name || reviewer.email}</h4>
                          <Badge variant="outline">{stats?.accuracyRate.toFixed(1)}% accuracy</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Total Reviews</p>
                            <p className="font-bold">{stats?.totalReviews || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Avg Review Time</p>
                            <p className="font-bold">{stats?.averageReviewTime.toFixed(1)}s</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Approved</p>
                            <p className="font-bold text-green-600">{stats?.approvedReviews || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Rejected</p>
                            <p className="font-bold text-red-600">{stats?.rejectedReviews || 0}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Approval Rate</span>
                            <span>
                              {stats?.totalReviews
                                ? ((stats.approvedReviews / stats.totalReviews) * 100).toFixed(1)
                                : 0}
                              %
                            </span>
                          </div>
                          <Progress
                            value={stats?.totalReviews ? (stats.approvedReviews / stats.totalReviews) * 100 : 0}
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall platform metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Recording Approval Rate</span>
                      <span>
                        {systemStats.totalRecordings
                          ? ((systemStats.approvedRecordings / systemStats.totalRecordings) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        systemStats.totalRecordings
                          ? (systemStats.approvedRecordings / systemStats.totalRecordings) * 100
                          : 0
                      }
                      className="h-3"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>User Activation Rate</span>
                      <span>
                        {systemStats.totalUsers
                          ? ((systemStats.activeUsers / systemStats.totalUsers) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={systemStats.totalUsers ? (systemStats.activeUsers / systemStats.totalUsers) * 100 : 0}
                      className="h-3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {systemStats.averageRecordingDuration.toFixed(1)}s
                      </p>
                      <p className="text-xs text-gray-500">Avg Recording Duration</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{systemStats.averageReviewTime.toFixed(1)}s</p>
                      <p className="text-xs text-gray-500">Avg Review Time</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {formatTime(systemStats.totalRecordingTime)}
                      </p>
                      <p className="text-xs text-gray-500">Total Recording Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {formatTime(systemStats.totalReviewTime)}
                      </p>
                      <p className="text-xs text-gray-500">Total Review Time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Audio Playback Modal */}
      <Dialog open={isAudioModalOpen} onOpenChange={setIsAudioModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Listen to Recording</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                {selectedRecording && (
                  <>
                    <p className="text-sm text-gray-600">
                      <strong>Contributor:</strong> {users.find(u => u.id === selectedRecording.user_id)?.name || users.find(u => u.id === selectedRecording.user_id)?.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Sentence:</strong> {selectedRecording.sentence}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Duration:</strong> {selectedRecording.duration.toFixed(1)}s
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Status:</strong> 
                      <Badge
                        variant={
                          selectedRecording.status === "approved"
                            ? "default"
                            : selectedRecording.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                        className="ml-2"
                      >
                        {selectedRecording.status}
                      </Badge>
                    </p>
                    {selectedRecording.reviewed_by && (
                      <p className="text-sm text-gray-600">
                        <strong>Reviewed by:</strong> {users.find(u => u.id === selectedRecording.reviewed_by)?.name || users.find(u => u.id === selectedRecording.reviewed_by)?.email}
                      </p>
                    )}
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="text-center mb-2">
              <p className="text-lg font-semibold text-gray-900">
                {selectedRecording?.duration.toFixed(1)}s
              </p>
              <p className="text-sm text-gray-500">Duration</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={togglePlayback}
                disabled={audioLoading || !selectedRecording?.audio_url || !!audioError}
                size="lg"
                className="w-16 h-16 rounded-full"
              >
                {audioLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
            </div>
            
            {audioError && (
              <div className="text-center">
                <p className="text-sm text-red-500 mb-2">{audioError}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setAudioError(null)
                    setAudioLoading(true)
                    if (audioRef.current && selectedRecording) {
                      audioRef.current.src = selectedRecording.audio_url
                      audioRef.current.load()
                    }
                  }}
                >
                  Retry
                </Button>
              </div>
            )}
            
            {selectedRecording?.audio_url && (
              <audio
                ref={audioRef}
                onEnded={handleAudioEnded}
                onError={handleAudioError}
                className="hidden"
              />
            )}
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {audioLoading ? "Loading audio..." : isPlaying ? "Playing..." : "Click to play recording"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reviewer Information Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reviewer Information</DialogTitle>
            <DialogDescription>
              Detailed information about the reviewer and their decision
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {reviewLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading review details...</span>
              </div>
            ) : selectedReview ? (
              <>
                {/* Recording Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-gray-900 mb-2">Recording Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Contributor:</strong> {users.find(u => u.id === selectedRecording?.user_id)?.name || users.find(u => u.id === selectedRecording?.user_id)?.email}</p>
                    <p><strong>Sentence:</strong> {selectedRecording?.sentence}</p>
                    <p><strong>Duration:</strong> {selectedRecording?.duration.toFixed(1)}s</p>
                    <p><strong>Status:</strong> 
                      <Badge
                        variant={
                          selectedReview.decision === "approved"
                            ? "default"
                            : "destructive"
                        }
                        className="ml-2"
                      >
                        {selectedReview.decision}
                      </Badge>
                    </p>
                  </div>
                </div>

                {/* Reviewer Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-blue-900 mb-2">Reviewer Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {users.find(u => u.id === selectedReview.reviewer_id)?.name || "Not provided"}</p>
                    <p><strong>Email:</strong> {users.find(u => u.id === selectedReview.reviewer_id)?.email}</p>
                    <p><strong>Role:</strong> {users.find(u => u.id === selectedReview.reviewer_id)?.role}</p>
                    <p><strong>Review Date:</strong> {new Date(selectedReview.created_at).toLocaleDateString()}</p>
                    <p><strong>Review Time:</strong> {new Date(selectedReview.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Review Decision */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-green-900 mb-2">Review Decision</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span><strong>Decision:</strong></span>
                      <Badge
                        variant={
                          selectedReview.decision === "approved"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {selectedReview.decision}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span><strong>Confidence:</strong></span>
                      <span className="font-medium">{selectedReview.confidence}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span><strong>Time Spent:</strong></span>
                      <span className="font-medium">{selectedReview.time_spent}s</span>
                    </div>
                    {selectedReview.notes && (
                      <div>
                        <span><strong>Notes:</strong></span>
                        <p className="mt-1 text-gray-700 bg-white rounded p-2 border">
                          {selectedReview.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-purple-900 mb-2">Reviewer Performance</h4>
                  <div className="space-y-1 text-sm">
                    {(() => {
                      const reviewerStats = getUserStatsById(selectedReview.reviewer_id)
                      return (
                        <>
                          <p><strong>Total Reviews:</strong> {reviewerStats?.totalReviews || 0}</p>
                          <p><strong>Approval Rate:</strong> {reviewerStats?.totalReviews ? ((reviewerStats.approvedReviews / reviewerStats.totalReviews) * 100).toFixed(1) : 0}%</p>
                          <p><strong>Average Review Time:</strong> {reviewerStats?.averageReviewTime.toFixed(1) || 0}s</p>
                          <p><strong>Accuracy Rate:</strong> {reviewerStats?.accuracyRate.toFixed(1) || 0}%</p>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No review information available</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={closeReviewModal}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={isUserDetailsModalOpen} onOpenChange={setIsUserDetailsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected user
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {selectedUser && (
              <>
                {/* Basic Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-blue-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600"><strong>Name:</strong></p>
                      <p className="text-gray-900">{selectedUser.name || "Not provided"}</p>
    </div>
                    <div>
                      <p className="text-gray-600"><strong>Email:</strong></p>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600"><strong>Role:</strong></p>
                      <Badge
                        variant={
                          selectedUser.role === "reviewer" ? "secondary" : selectedUser.role === "admin" ? "default" : "outline"
                        }
                      >
                        {selectedUser.role}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-600"><strong>Status:</strong></p>
                      <Badge
                        variant={
                          selectedUser.status === "active"
                            ? "default"
                            : selectedUser.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          selectedUser.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedUser.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : ""
                        }
                      >
                        {selectedUser.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-600"><strong>Join Date:</strong></p>
                      <p className="text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600"><strong>Profile Complete:</strong></p>
                      <p className="text-gray-900">{selectedUser.profile_complete ? "Yes" : "No"}</p>
                    </div>
                  </div>
                </div>

                {/* Demographics & Contact */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-green-900 mb-3">Demographics & Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600"><strong>Age:</strong></p>
                      <p className="text-gray-900">{selectedUser.age || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600"><strong>Gender:</strong></p>
                      <p className="text-gray-900">{selectedUser.gender || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600"><strong>Phone Number:</strong></p>
                      <p className="text-gray-900">{selectedUser.phone_number || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600"><strong>Location:</strong></p>
                      <p className="text-gray-900">{selectedUser.location || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600"><strong>Educational Background:</strong></p>
                      <p className="text-gray-900">{selectedUser.educational_background || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600"><strong>Employment Status:</strong></p>
                      <p className="text-gray-900">{selectedUser.employment_status || "Not provided"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600"><strong>Language Dialect:</strong></p>
                      <p className="text-gray-900">{selectedUser.language_dialect || "Not provided"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600"><strong>Languages:</strong></p>
                      <p className="text-gray-900">
                        {selectedUser.languages && selectedUser.languages.length > 0 
                          ? selectedUser.languages.join(", ") 
                          : "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Statistics */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-purple-900 mb-3">Performance Statistics</h4>
                  <div className="space-y-4">
                    {(() => {
                      const stats = getUserStatsById(selectedUser.id)
                      return (
                        <>
                          {selectedUser.role === "contributor" && (
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center p-3 bg-white rounded border">
                                <p className="text-2xl font-bold text-blue-600">{stats?.totalRecordings || 0}</p>
                                <p className="text-xs text-gray-600">Total Recordings</p>
                              </div>
                              <div className="text-center p-3 bg-white rounded border">
                                <p className="text-2xl font-bold text-green-600">{stats?.approvedRecordings || 0}</p>
                                <p className="text-xs text-gray-600">Approved</p>
                              </div>
                              <div className="text-center p-3 bg-white rounded border">
                                <p className="text-2xl font-bold text-red-600">{stats?.rejectedRecordings || 0}</p>
                                <p className="text-xs text-gray-600">Rejected</p>
                              </div>
                            </div>
                          )}
                          
                          {selectedUser.role === "reviewer" && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="text-center p-3 bg-white rounded border">
                                <p className="text-2xl font-bold text-blue-600">{stats?.totalReviews || 0}</p>
                                <p className="text-xs text-gray-600">Total Reviews</p>
                              </div>
                              <div className="text-center p-3 bg-white rounded border">
                                <p className="text-2xl font-bold text-purple-600">{stats?.accuracyRate?.toFixed(1) || 0}%</p>
                                <p className="text-xs text-gray-600">Accuracy Rate</p>
                              </div>
                              <div className="text-center p-3 bg-white rounded border">
                                <p className="text-2xl font-bold text-green-600">{stats?.approvedReviews || 0}</p>
                                <p className="text-xs text-gray-600">Approved Reviews</p>
                              </div>
                              <div className="text-center p-3 bg-white rounded border">
                                <p className="text-2xl font-bold text-orange-600">{stats?.averageReviewTime?.toFixed(1) || 0}s</p>
                                <p className="text-xs text-gray-600">Avg Review Time</p>
                              </div>
                            </div>
                          )}

                          {selectedUser.role === "admin" && (
                            <div className="text-center p-4 bg-white rounded border">
                              <p className="text-lg font-semibold text-gray-700">System Administrator</p>
                              <p className="text-sm text-gray-500">Full system access and management privileges</p>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Recent Activity */}
                {selectedUser.role === "contributor" && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-orange-900 mb-3">Recent Recordings</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {getRecordingsByUser(selectedUser.id).slice(0, 5).map((recording) => (
                        <div key={recording.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                          <div className="flex-1">
                            <p className="font-medium truncate max-w-xs">{recording.sentence}</p>
                            <p className="text-xs text-gray-500">{new Date(recording.created_at).toLocaleDateString()}</p>
                          </div>
                          <Badge
                            variant={
                              recording.status === "approved"
                                ? "default"
                                : recording.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {recording.status}
                          </Badge>
                        </div>
                      ))}
                      {getRecordingsByUser(selectedUser.id).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No recordings yet</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedUser.role === "reviewer" && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-orange-900 mb-3">Recent Reviews</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {getReviewsByReviewer(selectedUser.id).slice(0, 5).map((review) => {
                        const recording = recordings.find(r => r.id === review.recording_id)
                        return (
                          <div key={review.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                            <div className="flex-1">
                              <p className="font-medium truncate max-w-xs">{recording?.sentence || "Recording not found"}</p>
                              <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge
                              variant={
                                review.decision === "approved"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {review.decision}
                            </Badge>
                          </div>
                        )
                      })}
                      {getReviewsByReviewer(selectedUser.id).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No reviews yet</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={closeUserDetailsModal}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
