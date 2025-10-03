"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Pause, ThumbsUp, ThumbsDown, SkipForward, HelpCircle, Flag, Volume2, ChevronLeft, ChevronRight } from "lucide-react"
import { db, type Recording } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

export default function ListenPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null)
  const [sentenceCount, setSentenceCount] = useState(1) // Current recording position (for navigation)
  const [reviewsCompleted, setReviewsCompleted] = useState(0) // Actual reviews completed (approve/reject only)
  const [sessionReviews, setSessionReviews] = useState(0)
  const [pendingRecordings, setPendingRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [audioLoading, setAudioLoading] = useState(false)
  const [reviewStartTime, setReviewStartTime] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [recordingHistory, setRecordingHistory] = useState<Recording[]>([])
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const waveformRef = useRef<HTMLDivElement | null>(null)
  const audioObjectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    loadPendingRecordings()
  }, [])

  useEffect(() => {
    const loadAudio = async () => {
      if (currentRecording?.audio_url && audioRef.current) {
        // Clean up previous object URL if it exists
        if (audioObjectUrlRef.current) {
          URL.revokeObjectURL(audioObjectUrlRef.current)
          audioObjectUrlRef.current = null
        }
        
        try {
          console.log("🎵 Loading audio for recording:", currentRecording.id)
          console.log("📝 Audio URL type:", currentRecording.audio_url.substring(0, 50) + "...")
          
          // Convert data URL to blob and create object URL (same as admin page)
          if (currentRecording.audio_url.startsWith('data:')) {
            console.log("🔄 Converting data URL to blob for better compatibility...")
            const response = await fetch(currentRecording.audio_url)
            const blob = await response.blob()
            console.log("✅ Blob created - Size:", blob.size, "bytes, Type:", blob.type)
            
            // Verify blob is valid
            if (blob.size === 0) {
              throw new Error("Audio blob is empty - recording may be corrupted")
            }
            
            const objectUrl = URL.createObjectURL(blob)
            audioObjectUrlRef.current = objectUrl
            console.log("🔗 Object URL created:", objectUrl.substring(0, 50) + "...")
            
            audioRef.current.src = objectUrl
          } else {
            console.log("🔗 Using direct URL...")
            // If it's already a regular URL, use it directly
            audioRef.current.src = currentRecording.audio_url
          }
          
          // Add error handling for audio loading
          const handleLoadStart = () => {
            console.log("⏳ Audio loading started...")
            setAudioLoading(true)
          }
          
          const handleCanPlay = () => {
            console.log("✅ Audio can play - ready for playback")
            setAudioLoading(false)
          }
          
          const handleError = (e: Event) => {
            const target = e.target as HTMLAudioElement
            const error = target.error
            console.error("❌ Audio loading error:", {
              code: error?.code,
              message: error?.message,
              MEDIA_ERR_ABORTED: error?.code === 1,
              MEDIA_ERR_NETWORK: error?.code === 2,
              MEDIA_ERR_DECODE: error?.code === 3,
              MEDIA_ERR_SRC_NOT_SUPPORTED: error?.code === 4
            })
            setAudioLoading(false)
            toast({
              title: "Audio Error",
              description: `Failed to load audio file (Error code: ${error?.code}). The recording may be corrupted.`,
              variant: "destructive",
            })
          }
          
          const handleLoadedData = () => {
            console.log("📦 Audio data loaded successfully")
          }
          
          // Add event listeners
          audioRef.current.addEventListener('loadstart', handleLoadStart)
          audioRef.current.addEventListener('canplay', handleCanPlay)
          audioRef.current.addEventListener('error', handleError)
          audioRef.current.addEventListener('loadeddata', handleLoadedData)
          
          audioRef.current.load()
          generateWaveformData()
          
          // Cleanup event listeners
          return () => {
            if (audioRef.current) {
              audioRef.current.removeEventListener('loadstart', handleLoadStart)
              audioRef.current.removeEventListener('canplay', handleCanPlay)
              audioRef.current.removeEventListener('error', handleError)
              audioRef.current.removeEventListener('loadeddata', handleLoadedData)
            }
          }
        } catch (error) {
          console.error("💥 Error processing audio:", error)
          toast({
            title: "Audio Processing Error",
            description: `Failed to process audio file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          })
        }
      }
    }
    
    loadAudio()
    
    // Cleanup object URL on unmount
    return () => {
      if (audioObjectUrlRef.current) {
        URL.revokeObjectURL(audioObjectUrlRef.current)
        audioObjectUrlRef.current = null
      }
    }
  }, [currentRecording])

  // Update current time as audio plays
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
    }

    const updateDuration = () => {
      setDuration(audio.duration)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('durationchange', updateDuration)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('durationchange', updateDuration)
    }
  }, [currentRecording])

  const generateWaveformData = () => {
    // Generate mock waveform data based on recording duration
    // In a real implementation, you would analyze the actual audio file
    const dataPoints = Math.floor(currentRecording?.duration || 10) * 10
    const data = Array.from({ length: dataPoints }, () => 
      Math.random() * 0.8 + 0.2
    )
    setWaveformData(data)
  }

  const loadPendingRecordings = async () => {
    try {
      setLoading(true)
      const recordings = await db.getRecordingsByStatus("pending")
      setPendingRecordings(recordings)

      if (recordings.length > 0) {
        setCurrentRecording(recordings[0])
        setReviewStartTime(Date.now())
      }

      // Load reviewer's actual statistics from database
      if (user?.id) {
        await loadReviewerStats()
      }
    } catch (error) {
      console.error("Error loading recordings:", error)
      toast({
        title: "Error",
        description: "Failed to load recordings for review",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadReviewerStats = async () => {
    if (!user?.id) return

    try {
      // Get all reviews by this reviewer
      const allReviews = await db.getReviewsByReviewer(user.id)
      
      // Get today's reviews for session count
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayReviews = allReviews.filter(review => {
        const reviewDate = new Date(review.created_at)
        reviewDate.setHours(0, 0, 0, 0)
        return reviewDate.getTime() === today.getTime()
      })

      // Update states with actual data
      setReviewsCompleted(allReviews.length) // Total reviews ever completed
      setSessionReviews(todayReviews.length) // Reviews completed today
      
      console.log('📊 Reviewer Stats Loaded:', {
        totalReviews: allReviews.length,
        todayReviews: todayReviews.length,
        userId: user.id
      })
    } catch (error) {
      console.error("Error loading reviewer stats:", error)
    }
  }

  const togglePlayback = async () => {
    if (!currentRecording?.audio_url) {
      toast({
        title: "Error",
        description: "No audio file available for this recording",
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
          // Simply play the audio - it's already been loaded and converted to blob in the useEffect
          await audioRef.current.play()
          setIsPlaying(true)
        }
      } catch (error) {
        let errorMessage = "Failed to play audio file"
        
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage = "Browser blocked audio playback. Please click play again."
          } else if (error.name === 'NotSupportedError') {
            errorMessage = "Audio format not supported by your browser."
          } else {
            errorMessage = `Audio error: ${error.message}`
          }
        }
        
        console.error("Playback error:", error)
        toast({
          title: "Audio Playback Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setAudioLoading(false)
      }
    }
  }

  const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !waveformRef.current) return

    const rect = waveformRef.current.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const clickPercentage = clickX / rect.width
    const newTime = clickPercentage * duration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const handleAudioError = () => {
    setIsPlaying(false)
    toast({
      title: "Error",
      description: "Failed to play audio file",
      variant: "destructive",
    })
  }

  const handleValidation = async (isValid: boolean) => {
    if (!currentRecording || !user) return

    try {
      const timeSpent = Math.floor((Date.now() - reviewStartTime) / 1000)

      // Create review
      await db.createReview({
        recording_id: currentRecording.id,
        reviewer_id: user.id,
        decision: isValid ? "approved" : "rejected",
        notes: isValid ? "Good quality recording" : "Quality issues detected",
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100% confidence
        time_spent: timeSpent,
      })

      toast({
        title: "Success",
        description: `Recording ${isValid ? "approved" : "rejected"} successfully`,
      })

      // Move to next recording
      const remainingRecordings = pendingRecordings.filter((r) => r.id !== currentRecording.id)
      setPendingRecordings(remainingRecordings)

      // Add current recording to history
      if (currentRecording && !recordingHistory.find(r => r.id === currentRecording.id)) {
        setRecordingHistory(prev => [...prev, currentRecording])
      }

      if (remainingRecordings.length > 0) {
        setCurrentRecording(remainingRecordings[0])
        setReviewStartTime(Date.now())
        setSentenceCount((prev) => prev + 1)
        setReviewsCompleted((prev) => prev + 1) // Increment total reviews completed
        setSessionReviews((prev) => prev + 1) // Increment today's session count
        setCurrentRecordingIndex(prev => prev + 1)
      } else {
        // No more recordings to review
        setCurrentRecording(null)
        setReviewsCompleted((prev) => prev + 1) // Increment total reviews completed
        setSessionReviews((prev) => prev + 1) // Increment today's session count
        toast({
          title: "All Done!",
          description: "No more recordings to review at this time.",
        })
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      })
    }
  }

  const skipRecording = () => {
    if (!currentRecording) return

    const remainingRecordings = pendingRecordings.filter((r) => r.id !== currentRecording.id)
    setPendingRecordings(remainingRecordings)

    if (remainingRecordings.length > 0) {
      setCurrentRecording(remainingRecordings[0])
      setReviewStartTime(Date.now())
      // Don't increment sentenceCount or reviewsCompleted for skip - it's just navigation
    } else {
      setCurrentRecording(null)
    }
  }

  const goToNextRecording = () => {
    if (pendingRecordings.length > 1) {
      const currentIndex = pendingRecordings.findIndex(r => r.id === currentRecording?.id)
      const nextIndex = (currentIndex + 1) % pendingRecordings.length
      const nextRecording = pendingRecordings[nextIndex]
      
      // Add current recording to history
      if (currentRecording && !recordingHistory.find(r => r.id === currentRecording.id)) {
        setRecordingHistory(prev => [...prev, currentRecording])
      }
      
      setCurrentRecording(nextRecording)
      setCurrentRecordingIndex(prev => prev + 1)
      setReviewStartTime(Date.now())
      // Don't increment sentenceCount or reviewsCompleted for navigation - only for actual reviews
    }
  }

  const goToPreviousRecording = () => {
    if (recordingHistory.length > 0 && currentRecording) {
      const previousRecording = recordingHistory[recordingHistory.length - 1]
      
      // Add current recording back to pending list if it's not already there
      if (!pendingRecordings.find(r => r.id === currentRecording.id)) {
        setPendingRecordings(prev => [currentRecording, ...prev])
      }
      
      setCurrentRecording(previousRecording)
      setCurrentRecordingIndex(prev => prev - 1)
      setRecordingHistory(prev => prev.slice(0, -1))
      setReviewStartTime(Date.now())
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recordings...</p>
        </div>
      </div>
    )
  }

  // Don't return early - show empty state within main layout

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-4 bg-white rounded-lg p-3 sm:p-4 shadow-lg border border-gray-200">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-md">
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          <span className="text-xs sm:text-sm text-white font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Review Session</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 order-first sm:order-none" style={{ fontFamily: 'Poppins, sans-serif' }}>Listen</h1>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200 w-full sm:max-w-xs md:max-w-md text-center sm:text-right">
          <p className="text-xs sm:text-sm text-blue-800 font-bold leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Click play, listen, then approve or reject based on quality.
        </p>
        </div>
      </div>

      {/* Progress Indicator - Horizontal */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-md border border-gray-100/50 max-w-4xl w-full">
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2 sm:gap-0 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
              <span className="text-sm sm:text-base font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Progress
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-center">
              <div className="flex items-center gap-1">
                <div className="text-base sm:text-lg font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{reviewsCompleted}</div>
                <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>total</div>
              </div>
              <div className="h-4 sm:h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <div className="text-base sm:text-lg font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{sessionReviews}</div>
                <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>today</div>
              </div>
              <div className="h-4 sm:h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <div className="text-base sm:text-lg font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{pendingRecordings.length}</div>
                <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>left</div>
              </div>
            </div>
          </div>
          
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs sm:text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Review Progress</span>
              <span className="text-xs sm:text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>{Math.round((reviewsCompleted / 10) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((reviewsCompleted / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2 sm:flex sm:justify-center sm:gap-3">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex flex-col items-center space-y-1">
                <div className={`
                  w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-md
                  ${num <= reviewsCompleted 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ring-2 ring-blue-100" 
                    : "bg-gray-100 text-gray-400 border"
                  }
                `}>
                  {num <= reviewsCompleted ? (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : num === reviewsCompleted + 1 ? (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                  ) : (
                    num
                  )}
                </div>
                <div className="text-xs font-medium text-gray-600 hidden sm:block" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {num <= reviewsCompleted ? "Done" : num === reviewsCompleted + 1 ? "Now" : "Next"}
            </div>
            </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Left Sidebar - Instructions (Hidden on mobile, visible on large screens) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 backdrop-blur-sm rounded-3xl p-5 shadow-xl border border-white/20 sticky top-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tracking-wide" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                Review Guide
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              <div className="group flex items-center space-x-2.5 p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 transition-all duration-300 hover:shadow-md">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Play className="w-2.5 h-2.5 text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Click play to listen
                </p>
              </div>

              <div className="group flex items-center space-x-2.5 p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 transition-all duration-300 hover:shadow-md">
                <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Check pronunciation
                </p>
              </div>

              <div className="group flex items-center space-x-2.5 p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 transition-all duration-300 hover:shadow-md">
                <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Check for noise
                </p>
              </div>

              <div className="group flex items-center space-x-2.5 p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 transition-all duration-300 hover:shadow-md">
                <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <SkipForward className="w-2.5 h-2.5 text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Skip if unclear
                </p>
              </div>

              <div className="group flex items-center space-x-2.5 p-2.5 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-200/50 hover:bg-green-500/20 transition-all duration-300 hover:shadow-md">
                <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Approve or reject
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-4">
          <Card className="bg-white border-2 border-gray-200 shadow-2xl">
            <CardContent className="p-4 sm:p-6 lg:p-6">
              {!currentRecording ? (
                // Empty State - No More Recordings
                <div className="text-center space-y-6 min-h-[250px] sm:min-h-[300px] lg:min-h-[400px] flex flex-col items-center justify-center">
                  <div className="text-center">
                    <Volume2 className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      🎉 Great Work!
                    </h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      You've completed all available recordings for review. New submissions will appear here when they're ready.
                    </p>
                    
                    {/* Session Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Session Summary
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {reviewsCompleted}
                          </div>
                          <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Total Reviews (All Time)
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {sessionReviews}
                          </div>
                          <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Reviews Today
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        onClick={loadPendingRecordings} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Check for New Recordings
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.href = '/dashboard'}
                        className="px-6 py-3 rounded-xl"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        Return to Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Normal State - Recording Available
                <div className="text-center space-y-4 min-h-[250px] sm:min-h-[300px] lg:min-h-[400px] flex flex-col">
                {/* Sentence Display */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 h-20 sm:h-24 lg:h-28 flex items-center justify-center border-2 border-gray-200 shadow-lg">
                    <div className="max-h-16 sm:max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent w-full text-center">
                      <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {currentRecording.sentence}
                  </p>
                    </div>
                </div>


                {/* Audio Player */}
                <div className="flex-1 flex items-center justify-center relative">
                  <div className="flex justify-center items-center space-x-1 sm:space-x-2 h-20 sm:h-24">
                    {/* Left Waveform */}
                    <div className="flex items-center space-x-0.5">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                          className="w-1 rounded-full transition-all duration-300"
                        style={{
                            height: `${Math.sin(i * 0.3) * 15 + 20}px`,
                            backgroundColor: `rgba(59, 130, 246, ${1 - i * 0.03})`,
                            animationDelay: `${i * 0.03}s`,
                            boxShadow: isPlaying ? `0 0 8px rgba(59, 130, 246, ${0.6 - i * 0.02})` : 'none'
                        }}
                      />
                    ))}
                  </div>

                  <div className="relative">
                    {/* Glowing aura effect */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 blur-xl opacity-80 animate-pulse"></div>
                    <Button
                      onClick={togglePlayback}
                      size="lg"
                      className={`
                          relative h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 rounded-full bg-white shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-blue-500/40 border-2 sm:border-4 border-blue-100 hover:border-blue-300 group aspect-square
                        ${isPlaying ? 'animate-pulse' : ''}
                        ${!currentRecording?.audio_url ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      disabled={!currentRecording?.audio_url || audioLoading}
                    >
                      {audioLoading ? (
                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 border-b-2 border-blue-500"></div>
                      ) : isPlaying ? (
                          <Pause className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-500 group-hover:text-blue-600" />
                      ) : (
                          <Play className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-500 group-hover:text-blue-600" />
                      )}
                    </Button>
                  </div>

                    {/* Right Waveform */}
                    <div className="flex items-center space-x-0.5">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                          className="w-1 rounded-full transition-all duration-300"
                        style={{
                            height: `${Math.sin(i * 0.3) * 15 + 20}px`,
                            backgroundColor: `rgba(147, 51, 234, ${1 - i * 0.03})`,
                            animationDelay: `${i * 0.03}s`,
                            boxShadow: isPlaying ? `0 0 8px rgba(147, 51, 234, ${0.6 - i * 0.02})` : 'none'
                        }}
                      />
                    ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Waveform */}
                <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                  <div className="mb-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Audio Waveform</span>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatTime(currentTime)}</span>
                      <span>/</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  
                  <div 
                    ref={waveformRef}
                    onClick={handleWaveformClick}
                    className="relative w-full h-12 bg-gray-100 rounded-lg cursor-pointer overflow-hidden hover:bg-gray-50 transition-colors"
                  >
                    {/* Waveform bars */}
                    <div className="absolute inset-0 flex items-center justify-center space-x-1 px-4">
                      {waveformData.map((height, index) => (
                        <div
                          key={index}
                          className="flex-1 bg-gradient-to-t from-blue-400 to-purple-400 rounded-sm transition-all duration-200 hover:from-blue-500 hover:to-purple-500"
                          style={{
                            height: `${height * 100}%`,
                            opacity: 0.7
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Playhead indicator */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-lg"
                      style={{
                        left: `${(currentTime / duration) * 100}%`,
                        transition: 'left 0.1s ease-out'
                      }}
                    />
                    
                    {/* Progress overlay */}
                    <div 
                      className="absolute top-0 bottom-0 bg-blue-500/20 rounded-l-xl"
                      style={{
                        width: `${(currentTime / duration) * 100}%`,
                        transition: 'width 0.1s ease-out'
                      }}
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Click anywhere on the waveform to jump to that position
                  </p>
                </div>

                {/* Recording Info */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 mb-1">Recording Details</p>
                  <div className="flex justify-center space-x-4 text-xs text-gray-600">
                    <span>Duration: {currentRecording.duration.toFixed(1)}s</span>
                    <span>Quality: {currentRecording.quality}</span>
                    <span>Device: {currentRecording.metadata?.deviceType || "Unknown"}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isPlaying ? "Playing..." : "Click to play"}
                  </p>
                </div>
                
                {/* Hidden audio element for playback */}
                <audio
                  ref={audioRef}
                  onEnded={handleAudioEnded}
                  onError={handleAudioError}
                  className="hidden"
                  controls={false}
                  preload="metadata"
                />

                {/* Validation Buttons */}
                <div className="flex justify-center gap-4 sm:gap-6 px-4 sm:px-0">
                  <Button
                    onClick={() => handleValidation(true)}
                    size="sm"
                    className="flex flex-col items-center space-y-1 h-auto py-3 px-5 sm:px-6 bg-white hover:bg-green-50 border-2 border-green-200 hover:border-green-300 rounded-xl shadow-lg hover:shadow-green-500/10 transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation min-w-[100px] sm:min-w-[120px]"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                      <ThumbsUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-green-600 font-semibold text-sm sm:text-base">YES</span>
                    <span className="text-green-500 text-xs">Accurate</span>
                  </Button>

                  <Button
                    onClick={() => handleValidation(false)}
                    size="sm"
                    className="flex flex-col items-center space-y-1 h-auto py-3 px-5 sm:px-6 bg-white hover:bg-red-50 border-2 border-red-200 hover:border-red-300 rounded-xl shadow-lg hover:shadow-red-500/10 transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation min-w-[100px] sm:min-w-[120px]"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                      <ThumbsDown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-red-600 font-semibold text-sm sm:text-base">NO</span>
                    <span className="text-red-500 text-xs">Inaccurate</span>
                  </Button>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Guidelines Dialog */}
      <Dialog open={showGuidelines} onOpenChange={setShowGuidelines}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              <span>Review Guidelines</span>
            </DialogTitle>
            <DialogDescription>
              Follow these guidelines to ensure accurate and consistent reviews
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Quality Assessment</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Listen to the entire recording before making a decision</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Focus on clarity, pronunciation, and natural speech flow</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Consider the speaker's accent and dialect variations</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Evaluate if the sentence was read accurately and completely</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Approval Criteria (YES)</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Clear and understandable pronunciation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Complete sentence was read without omissions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Natural speech rhythm and pacing</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Minimal background noise or interference</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Appropriate volume and audio quality</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Rejection Criteria (NO)</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Unclear or mumbled speech</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Incomplete sentence reading</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Excessive background noise or interference</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Technical issues (audio distortion, cutting out)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Reading errors or mispronunciations that affect clarity</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Review Process</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Listen to each recording at least once before deciding</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Use the waveform to navigate and replay sections if needed</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Be consistent in your evaluation criteria</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Skip recordings if you're unsure or need a break</span>
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer - Action Buttons */}
      <div className="mt-4 sm:mt-6 border-t border-gray-200 pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Left side buttons */}
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-gray-900 rounded-xl px-3 sm:px-4 py-2 text-sm touch-manipulation"
              onClick={() => setShowGuidelines(true)}
            >
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Guidelines</span>
              <span className="sm:hidden">Guide</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-900 rounded-xl px-3 sm:px-4 py-2 text-sm touch-manipulation"
            >
              <Flag className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Report Issue</span>
              <span className="sm:hidden">Report</span>
            </Button>
          </div>

          {/* Right side navigation buttons */}
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-center">
            <Button
              onClick={goToPreviousRecording}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50 border-gray-200 rounded-xl px-3 sm:px-4 py-2 text-sm touch-manipulation active:scale-95 transition-transform"
              disabled={recordingHistory.length === 0}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            
            <Button
              onClick={goToNextRecording}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50 border-gray-200 rounded-xl px-3 sm:px-4 py-2 text-sm touch-manipulation active:scale-95 transition-transform"
              disabled={pendingRecordings.length <= 1}
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 sm:ml-1" />
            </Button>

            <Button
              onClick={skipRecording}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50 border-gray-200 rounded-xl px-4 sm:px-6 py-2 text-sm touch-manipulation active:scale-95 transition-transform"
            >
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
