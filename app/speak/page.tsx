"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Mic, Square, Play, RotateCcw, SkipForward, HelpCircle, Flag, ChevronLeft, ChevronRight } from "lucide-react"
import { db } from "@/lib/database"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function SpeakPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [currentSentence, setCurrentSentence] = useState("")
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [sentenceCount, setSentenceCount] = useState(0)
  const [sessionRecordings, setSessionRecordings] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [sentenceHistory, setSentenceHistory] = useState<string[]>([])
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [availableSentences, setAvailableSentences] = useState<string[]>([])
  const [isLoadingSentences, setIsLoadingSentences] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef<number>(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load sentences from database and contributor stats on component mount
  useEffect(() => {
    loadSentences()
    if (user?.id) {
      loadContributorStats()
    }
  }, [user])

  const loadSentences = async () => {
    try {
      setIsLoadingSentences(true)
      setApiError(null)
      
      // Get sentences from local database
      const { data: sentencesData, error } = await supabase
        .from('sentences')
        .select('text')
        .eq('is_active', true)
        .eq('language_code', 'luo')
        .limit(50)
        .order('id', { ascending: true })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const sentences = sentencesData.map(sentence => sentence.text)
      
      if (sentences.length === 0) {
        throw new Error('No sentences found in database')
      }

      setAvailableSentences(sentences)
      setCurrentSentence(sentences[0] || "")
      
      toast({
        title: "Sentences Loaded",
        description: `Loaded ${sentences.length} sentences from database`,
      })
    } catch (error) {
      console.error('Failed to load sentences from database:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setApiError(`Database Error: ${errorMessage}`)
      
      // Fallback to hardcoded sentences if database fails
      const fallbackSentences = [
        "Neno mar Luo ni neno mokworo mag piny Kenya.",
        "Kisumo ni kibanda makare ma nyangaf kuom Luo.",
        "Pesa ni pesa mokworo mag Luo mar Kenya.",
        "Nyaloga ni chak ruok mokworo mag Luo.",
        "Dhiang mokworo ni dhok Luo mar Kenya."
      ]
      
      setAvailableSentences(fallbackSentences)
      setCurrentSentence(fallbackSentences[0])
      
      toast({
        title: "Using Fallback Sentences",
        description: "Database unavailable, using sample sentences",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSentences(false)
    }
  }

  const loadContributorStats = async () => {
    if (!user?.id) return

    try {
      // Get all recordings by this contributor
      const allRecordings = await db.getRecordingsByUser(user.id)
      
      // Get today's recordings for session count
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayRecordings = allRecordings.filter(recording => {
        const recordingDate = new Date(recording.created_at)
        recordingDate.setHours(0, 0, 0, 0)
        return recordingDate.getTime() === today.getTime()
      })

      // Update states with actual data
      setRecordingProgress(allRecordings.length) // Total recordings ever made
      setSessionRecordings(todayRecordings.length) // Recordings made today
      
      console.log('📊 Contributor Stats Loaded:', {
        totalRecordings: allRecordings.length,
        todayRecordings: todayRecordings.length,
        userId: user.id
      })
    } catch (error) {
      console.error("Error loading contributor stats:", error)
    }
  }

  const loadMoreSentences = async () => {
    try {
      setApiError(null)
      
      // Get more sentences from database, excluding ones already loaded
      const currentSentenceIds = new Set(availableSentences)
      
      const { data: sentencesData, error } = await supabase
        .from('sentences')
        .select('text')
        .eq('is_active', true)
        .eq('language_code', 'luo')
        .limit(20)
        .order('id', { ascending: true })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      const allNewSentences = sentencesData.map(sentence => sentence.text)
      // Filter out sentences that are already in the current array
      const newSentences = allNewSentences.filter(sentence => !currentSentenceIds.has(sentence))
      
      if (newSentences.length > 0) {
        setAvailableSentences(prev => [...prev, ...newSentences])
        
        toast({
          title: "More Sentences Loaded",
          description: `Added ${newSentences.length} more sentences from database`,
        })
      } else {
        toast({
          title: "All Sentences Loaded",
          description: "You've seen all available sentences!",
        })
      }
    } catch (error) {
      console.error('Failed to load more sentences:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setApiError(`Database Error: ${errorMessage}`)
      
      toast({
        title: "Database Error",
        description: `Failed to load more sentences: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Detect the best supported audio format for this browser
      let mimeType = 'audio/webm;codecs=opus' // Default for Chrome
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm'
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      } else {
        mimeType = 'audio/wav' // Fallback
      }
      
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Use the actual MediaRecorder MIME type, not a hardcoded one
        const actualMimeType = mediaRecorder.mimeType || mimeType
        const blob = new Blob(chunks, { type: actualMimeType })
        
        
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setHasRecording(true)
        
        // Clear the progress interval when recording stops
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      startTimeRef.current = Date.now()

      // Update progress continuously without time limit
      progressIntervalRef.current = setInterval(() => {
        setRecordingProgress((prev) => {
          const elapsed = (Date.now() - startTimeRef.current) / 1000
          setRecordingDuration(elapsed)
          // Show progress as a visual indicator, but don't limit time
          return Math.min((elapsed / 30) * 100, 100) // Show progress up to 30s for visual reference
        })
      }, 100)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
    }
  }

  const resetRecording = () => {
    setHasRecording(false)
    setRecordingProgress(0)
    setRecordingDuration(0)
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setIsPlaying(false)
    
    // Clear any existing progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const submitRecording = async () => {
    if (!user || !audioBlob) return

    setIsSubmitting(true)
    try {
      // For now, store the audio as a data URL to avoid storage issues
      // In production, you would upload to Supabase Storage
      
      const reader = new FileReader()
      const audioDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          resolve(result)
        }
        reader.onerror = (error) => {
          reject(error)
        }
        reader.readAsDataURL(audioBlob)
      })

      // Create recording in database with the audio data URL
      await db.createRecording({
        user_id: user.id,
        sentence: currentSentence,
        audio_url: audioDataUrl, // Store as data URL for now
        duration: recordingDuration,
        status: "pending",
        quality: recordingDuration > 1 && recordingDuration < 15 ? "good" : "fair",
        metadata: {
          deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? "mobile" : "desktop",
          browserType: navigator.userAgent.includes("Chrome")
            ? "chrome"
            : navigator.userAgent.includes("Firefox")
              ? "firefox"
              : navigator.userAgent.includes("Safari")
                ? "safari"
                : "other",
        },
      })

      toast({
        title: "Success",
        description: "Recording submitted successfully!",
      })

      // Move to next sentence only after successful submission
      if (availableSentences.length > 0) {
        const nextIndex = Math.floor(Math.random() * availableSentences.length)
        const nextSentence = availableSentences[nextIndex]
        setCurrentSentence(nextSentence)
        setSentenceHistory(prev => [...prev, currentSentence])
        setCurrentSentenceIndex(prev => prev + 1)
      }
      
      setSentenceCount((prev) => prev + 1)
      setRecordingProgress((prev) => prev + 1) // Increment total recordings
      setSessionRecordings((prev) => prev + 1) // Increment today's recordings
      resetRecording()
    } catch (error) {
      console.error("Error submitting recording:", error)
      let errorMessage = "Failed to submit recording. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes("audio_url")) {
          errorMessage = "Audio file is too large. Please record a shorter audio clip."
        } else if (error.message.includes("user_id")) {
          errorMessage = "Authentication error. Please log in again."
        } else if (error.message.includes("sentence")) {
          errorMessage = "Invalid sentence data. Please try again."
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const skipSentence = () => {
    // Show confirmation toast
    toast({
      title: "Sentence Skipped",
      description: "You can skip any sentence you find difficult to read.",
    })
    
    // Move to next sentence without incrementing progress
    if (availableSentences.length > 0) {
      const nextIndex = Math.floor(Math.random() * availableSentences.length)
      const nextSentence = availableSentences[nextIndex]
      
      // Add current sentence to history if it's not already there
      if (currentSentence && !sentenceHistory.includes(currentSentence)) {
        setSentenceHistory(prev => [...prev, currentSentence])
      }
      
      setCurrentSentence(nextSentence)
      setCurrentSentenceIndex(prev => prev + 1)
      resetRecording()
    }
  }

  const goToNextSentence = () => {
    if (availableSentences.length > 0) {
      const nextIndex = Math.floor(Math.random() * availableSentences.length)
      const nextSentence = availableSentences[nextIndex]
      
      // Add current sentence to history
      if (currentSentence && !sentenceHistory.includes(currentSentence)) {
        setSentenceHistory(prev => [...prev, currentSentence])
      }
      
      setCurrentSentence(nextSentence)
      setCurrentSentenceIndex(prev => prev + 1)
      resetRecording()
    }
  }

  const goToPreviousSentence = () => {
    if (sentenceHistory.length > 0 && currentSentenceIndex > 0) {
      const previousSentence = sentenceHistory[sentenceHistory.length - 1]
      setCurrentSentence(previousSentence)
      setCurrentSentenceIndex(prev => prev - 1)
      setSentenceHistory(prev => prev.slice(0, -1))
      resetRecording()
    }
  }

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 pb-4 sm:pb-6">
      {/* Header Section - Fully Responsive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 bg-white rounded-lg p-2 sm:p-3 md:p-4 shadow-lg border border-gray-200 overflow-hidden">
        {/* Left: Badge + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-500 to-red-600 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full shadow-md whitespace-nowrap">
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white flex-shrink-0" />
            <span className="text-white font-semibold text-xs sm:text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Recording</span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif' }}>Speak</h1>
        </div>
        
        {/* Right: Instructions */}
        <div className="text-center sm:text-right w-full sm:w-auto sm:max-w-xs md:max-w-sm lg:max-w-md bg-blue-50 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-blue-200">
          <p className="text-xs sm:text-sm text-blue-800 font-bold leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Click mic, read aloud clearly, then submit.
          </p>
        </div>
      </div>

      {/* Progress Indicator - Responsive */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-xl border-2 border-gray-200 max-w-4xl w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2 sm:gap-0 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Progress</h3>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{sentenceCount}</div>
                <div className="text-xs sm:text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>current</div>
              </div>
              <div className="w-px h-8 sm:h-10 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{recordingProgress}</div>
                <div className="text-xs sm:text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>total</div>
              </div>
              <div className="w-px h-8 sm:h-10 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{sessionRecordings}</div>
                <div className="text-xs sm:text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>today</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs sm:text-sm font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Progress</span>
              <span className="text-xs sm:text-sm font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{sentenceCount}/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-2 sm:h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${(sentenceCount / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Indicators - Show 5 on mobile, 10 on desktop */}
          <div className="grid grid-cols-5 gap-2 sm:hidden">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex flex-col items-center space-y-1">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 relative shadow-md
                    ${
                      num === sentenceCount + 1
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg ring-2 ring-blue-100"
                        : num <= sentenceCount
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                          : "bg-white text-gray-500 border border-gray-300"
                    }
                  `}
                >
                  {num <= sentenceCount ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    num
                  )}
                  {num === sentenceCount + 1 && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Full step indicators for larger screens */}
          <div className="hidden sm:flex justify-between items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <div key={num} className="flex flex-col items-center space-y-0.5">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 relative shadow-md
                    ${
                      num === sentenceCount + 1
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-300 ring-2 ring-blue-100"
                        : num <= sentenceCount
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-300"
                          : "bg-white text-gray-500 border border-gray-300 shadow-sm"
                    }
                  `}
                >
                  {num <= sentenceCount ? (
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    num
                  )}
                  {num === sentenceCount + 1 && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className={`text-xs font-semibold ${num <= sentenceCount ? 'text-green-700' : num === sentenceCount + 1 ? 'text-blue-700' : 'text-gray-500'}`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {num <= sentenceCount ? 'Done' : num === sentenceCount + 1 ? 'Now' : 'Next'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Left Sidebar - Instructions (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 backdrop-blur-sm rounded-3xl p-5 shadow-xl border border-white/20 sticky top-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tracking-wide" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                Quick Guide
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="group flex items-center space-x-2.5 p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 transition-all duration-300 hover:shadow-md">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mic className="w-2.5 h-2.5 text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Click mic to start
                </p>
              </div>

              <div className="group flex items-center space-x-2.5 p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 transition-all duration-300 hover:shadow-md">
                <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Speak clearly
                </p>
              </div>

              <div className="group flex items-center space-x-2.5 p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 transition-all duration-300 hover:shadow-md">
                <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Avoid noise
                </p>
              </div>

              <div className="group flex items-center space-x-2.5 p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 transition-all duration-300 hover:shadow-md">
                <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <SkipForward className="w-2.5 h-2.5 text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Skip if needed
                </p>
              </div>

              <div className="group flex items-center space-x-2.5 p-2.5 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-200/50 hover:bg-green-500/20 transition-all duration-300 hover:shadow-md">
                <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  Submit
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="bg-white border-2 border-gray-200 shadow-2xl">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="text-center space-y-4 min-h-[250px] sm:min-h-[300px] lg:min-h-[350px] flex flex-col">
                {/* Sentence Display */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 h-20 sm:h-24 lg:h-28 flex items-center justify-center border-2 border-gray-200 shadow-lg">
                  {isLoadingSentences ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-lg text-gray-600">Loading sentences from Mozilla Common Voice...</p>
                    </div>
                  ) : apiError ? (
                    <div className="space-y-2 text-center">
                      <div className="max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        <p className="text-xl font-normal text-gray-900 leading-relaxed tracking-wide" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          {currentSentence}
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-sm text-orange-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>Using fallback sentences</span>
                        <Button
                          onClick={loadSentences}
                          variant="outline"
                          size="sm"
                          className="ml-2"
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent w-full text-center">
                      <p className="text-xl font-semibold text-gray-900 leading-relaxed tracking-wide" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {currentSentence}
                      </p>
                    </div>
                  )}
                </div>

                {/* Recording Controls */}
                <div className="flex-1 flex items-center justify-center relative">
                {!isRecording && !hasRecording && (
                  <div className="flex justify-center items-center space-x-2 h-24">
                    {/* Left Waveform - Pink/Red fading out */}
                    <div className="flex items-center space-x-0.5">
                      {[...Array(25)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full transition-all duration-300"
                          style={{
                            height: `${Math.sin(i * 0.3) * 18 + 25}px`,
                            backgroundColor: `rgba(236, 72, 153, ${1 - i * 0.025})`,
                            animationDelay: `${i * 0.03}s`,
                            boxShadow: '0 2px 4px rgba(236, 72, 153, 0.3)'
                          }}
                        />
                      ))}
                    </div>

                    <div className="relative">
                      {/* Enhanced glowing aura effect */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400 via-red-500 to-red-600 blur-xl opacity-80 animate-pulse"></div>
                      <Button
                        onClick={startRecording}
                        size="lg"
                        className="relative h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 rounded-full bg-white hover:bg-red-50 shadow-2xl hover:shadow-red-500/40 transition-all duration-300 transform hover:scale-110 active:scale-95 border-3 sm:border-4 border-red-100 hover:border-red-300 group aspect-square touch-manipulation"
                      >
                        <Mic className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 text-red-500 group-hover:text-red-600 transition-colors duration-300" />
                      </Button>
                    </div>

                    {/* Right Waveform - Teal/Green fading out */}
                    <div className="flex items-center space-x-0.5">
                      {[...Array(25)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full transition-all duration-300"
                          style={{
                            height: `${Math.sin(i * 0.3) * 18 + 25}px`,
                            backgroundColor: `rgba(20, 184, 166, ${1 - i * 0.025})`,
                            animationDelay: `${i * 0.03}s`,
                            boxShadow: '0 2px 4px rgba(20, 184, 166, 0.3)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {isRecording && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="flex justify-center items-center space-x-2">
                      {/* Left Waveform - Pink/Red fading out, animated */}
                      <div className="flex items-center space-x-0.5">
                        {[...Array(25)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 rounded-full animate-pulse"
                            style={{
                              height: `${Math.sin(i * 0.3) * 20 + 25}px`,
                              backgroundColor: `rgba(236, 72, 153, ${1 - i * 0.025})`,
                              animationDelay: `${i * 0.03}s`,
                              animationDuration: '0.8s',
                              boxShadow: '0 2px 6px rgba(236, 72, 153, 0.4)'
                            }}
                          />
                        ))}
                      </div>

                      <div className="relative">
                        {/* Glowing aura effect - more intense during recording */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 via-red-400 to-purple-400 blur-lg opacity-80 animate-pulse"></div>
                        <Button
                          onClick={stopRecording}
                          size="lg"
                          className="relative h-24 w-24 rounded-full bg-white shadow-xl animate-pulse border-2 border-gray-100"
                        >
                          <Square className="h-8 w-8 text-red-500" />
                        </Button>
                      </div>

                      {/* Right Waveform - Teal/Green fading out, animated */}
                      <div className="flex items-center space-x-0.5">
                        {[...Array(25)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 rounded-full animate-pulse"
                            style={{
                              height: `${Math.sin(i * 0.3) * 20 + 25}px`,
                              backgroundColor: `rgba(20, 184, 166, ${1 - i * 0.025})`,
                              animationDuration: '0.8s',
                              boxShadow: '0 2px 6px rgba(20, 184, 166, 0.4)'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="w-64">
                      <Progress value={recordingProgress} className="h-2 bg-gray-200" />
                      <p className="text-sm text-gray-500 mt-2">Recording... {recordingDuration.toFixed(1)}s</p>
                      <p className="text-xs text-gray-400 mt-1">Click the square to stop recording anytime</p>
                    </div>
                  </div>
                )}

                {hasRecording && !isRecording && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="flex justify-center items-center space-x-2">
                      {/* Left Waveform - Static for playback */}
                      <div className="flex items-center space-x-0.5">
                        {[...Array(25)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 rounded-full"
                            style={{
                              height: `${Math.sin(i * 0.3) * 18 + 25}px`,
                              backgroundColor: `rgba(236, 72, 153, ${1 - i * 0.025})`,
                              boxShadow: '0 2px 4px rgba(236, 72, 153, 0.3)'
                            }}
                          />
                        ))}
                      </div>

                      <div className="relative">
                        {/* Glowing aura effect - green for playback */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 blur-lg opacity-40"></div>
                        <Button
                          onClick={playRecording}
                          className="relative h-24 w-24 rounded-full bg-white shadow-xl transition-all duration-300 border-2 border-gray-100"
                        >
                          {isPlaying ? (
                            <Square className="h-8 w-8 text-green-500" />
                          ) : (
                            <Play className="h-8 w-8 text-green-500" />
                          )}
                        </Button>
                      </div>

                      {/* Right Waveform - Static for playback */}
                      <div className="flex items-center space-x-0.5">
                        {[...Array(25)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 rounded-full"
                            style={{
                              height: `${Math.sin(i * 0.3) * 18 + 25}px`,
                              backgroundColor: `rgba(20, 184, 166, ${1 - i * 0.025})`,
                              boxShadow: '0 2px 4px rgba(20, 184, 166, 0.3)'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-medium text-gray-900 mb-1">Your Recording</p>
                      <p className="text-sm text-gray-600">Duration: {recordingDuration.toFixed(1)}s</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {isPlaying ? "Playing..." : "Click to play"}
                      </p>
                    </div>
                    
                    {/* Hidden audio element for playback */}
                    {audioUrl && (
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={handleAudioEnded}
                        className="hidden"
                      />
                    )}
                    
                    <div className="flex space-x-3">
                      <Button
                        onClick={resetRecording}
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-gray-50 border-gray-200 rounded-lg px-4"
                        disabled={isSubmitting}
                      >
                        <RotateCcw className="h-3 w-3 mr-2" />
                        Re-record
                      </Button>
                      <Button
                        onClick={submitRecording}
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg px-6"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Recording"}
                      </Button>
                    </div>
                  </div>
                )}
                </div>
              </div>
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
              <span>Recording Guidelines</span>
            </DialogTitle>
            <DialogDescription>
              Follow these guidelines to ensure high-quality voice recordings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recording Environment</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Find a quiet environment with minimal background noise</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Avoid rooms with echo or reverberation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Keep your device at a consistent distance from your mouth</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Close windows and doors to minimize external sounds</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Speaking Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Speak clearly and at a natural pace</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Pronounce each word distinctly</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Maintain consistent volume throughout the recording</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Take a moment to read the sentence before recording</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Pause briefly at punctuation marks</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Technical Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Ensure your microphone is working properly</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Test your audio before starting the session</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>Keep recordings between 2-15 seconds for optimal quality</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span>If you make a mistake, use the re-record button</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">What to Avoid</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Background music, TV, or conversations</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Speaking too quickly or too slowly</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Whispering or shouting</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Adding extra words or sounds</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Recording in moving vehicles or noisy environments</span>
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer - Action Buttons */}
      {/* Footer - Responsive */}
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

          {/* Right side buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto justify-center">
            <Button
              onClick={goToPreviousSentence}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50 border-gray-200 rounded-xl px-3 sm:px-4 py-2 text-sm touch-manipulation active:scale-95 transition-transform"
              disabled={sentenceHistory.length === 0 || isRecording || isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            
            <Button
              onClick={goToNextSentence}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50 border-gray-200 rounded-xl px-3 sm:px-4 py-2 text-sm touch-manipulation active:scale-95 transition-transform"
              disabled={isRecording || isSubmitting}
            >
              <span className="hidden md:inline">Next Statement</span>
              <span className="md:hidden">Next</span>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 sm:ml-1" />
            </Button>

            <Button
              onClick={skipSentence}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50 border-gray-200 rounded-xl px-4 sm:px-6 py-2 text-sm touch-manipulation active:scale-95 transition-transform"
              disabled={isRecording || isSubmitting}
            >
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              Skip
            </Button>

            <Button
              onClick={loadMoreSentences}
              variant="outline"
              size="sm"
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 rounded-xl px-3 sm:px-4 py-2 text-sm touch-manipulation active:scale-95 transition-transform"
              disabled={isRecording || isSubmitting || isLoadingSentences}
            >
              {isLoadingSentences ? (
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600 mr-1 sm:mr-2"></div>
              ) : (
                <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className="hidden sm:inline">Load More</span>
              <span className="sm:hidden">More</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
