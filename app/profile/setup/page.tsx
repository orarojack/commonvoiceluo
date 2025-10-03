"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/database"
import { User, Mail, MapPin, GraduationCap, Briefcase, Phone, Globe, CheckCircle, ArrowRight } from "lucide-react"



export default function ProfileSetupPage() {
  const { user, updateProfile, isLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    accent: "",
    location: "",
    constituency: "",
    languageDialect: "",
    educationalBackground: "",
    employmentStatus: "",
    phoneNumber: "",
    joinMailingList: false,
    acceptPrivacy: false,
  })
  const [loadingUserData, setLoadingUserData] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Kenya Counties to Constituencies mapping
  const countyConstituencies: Record<string, string[]> = {
    "nairobi": ["Dagoretti North", "Dagoretti South", "Embakasi Central", "Embakasi East", "Embakasi North", "Embakasi South", "Embakasi West", "Kamukunji", "Kasarani", "Kibra", "Lang'ata", "Makadara", "Mathare", "Roysambu", "Ruaraka", "Starehe", "Westlands"],
    "mombasa": ["Changamwe", "Jomba", "Kisauni", "Likoni", "Mvita", "Nyali"],
    "kwale": ["Kinango", "Lunga Lunga", "Matuga", "Msambweni"],
    "kilifi": ["Ganze", "Kaloleni", "Kilifi North", "Kilifi South", "Magarini", "Malindi", "Rabai"],
    "tana-river": ["Bura", "Galole", "Garsen"],
    "lamu": ["Lamu East", "Lamu West"],
    "taita-taveta": ["Mwatate", "Taveta", "Voi", "Wundanyi"],
    "garissa": ["Balambala", "Dadaab", "Fafi", "Garissa Township", "Ijara", "Lagdera"],
    "wajir": ["Eldas", "Tarbaj", "Wajir East", "Wajir North", "Wajir South", "Wajir West"],
    "mandera": ["Banissa", "Lafey", "Mandera East", "Mandera North", "Mandera South", "Mandera West"],
    "marsabit": ["Laisamis", "Moyale", "North Horr", "Saku"],
    "isiolo": ["Isiolo North", "Isiolo South"],
    "meru": ["Buuri", "Igembe Central", "Igembe North", "Igembe South", "Imenti Central", "Imenti North", "Imenti South", "Tigania East", "Tigania West"],
    "tharaka-nithi": ["Chuka/Igambang'ombe", "Maara", "Tharaka"],
    "embu": ["Manyatta", "Mbeere North", "Mbeere South", "Runyenjes"],
    "kitui": ["Kitui Central", "Kitui East", "Kitui Rural", "Kitui South", "Kitui West", "Mwingi Central", "Mwingi North", "Mwingi West"],
    "machakos": ["Kathiani", "Machakos Town", "Masinga", "Matungulu", "Mavoko", "Mwala", "Yatta"],
    "makueni": ["Kaiti", "Kibwezi East", "Kibwezi West", "Kilome", "Makueni", "Mbooni"],
    "nyandarua": ["Kinangop", "Kipipiri", "Ndaragwa", "Ol Joro Oirowa", "Ol Kalou"],
    "nyeri": ["Kieni", "Mathira", "Mukurweini", "Nyeri Town", "Othaya", "Tetu"],
    "kirinyaga": ["Gichugu", "Kirinyaga Central", "Mwea", "Ndia"],
    "muranga": ["Kandara", "Kangema", "Kigumo", "Kiharu", "Mathioya"],
    "kiambu": ["Gatundu North", "Gatundu South", "Githunguri", "Juja", "Kabete", "Kiambaa", "Kiambu", "Kikuyu", "Limuru", "Ruiru", "Thika Town", "Lari"],
    "turkana": ["Loima", "Turkana Central", "Turkana East", "Turkana North", "Turkana South", "Turkana West"],
    "west-pokot": ["Kacheliba", "Kapenguria", "Pokot South", "Sigor"],
    "samburu": ["Samburu East", "Samburu North", "Samburu West"],
    "trans-nzoia": ["Cherangany", "Endebess", "Kwanza", "Saboti"],
    "uasin-gishu": ["Ainabkoi", "Kapseret", "Kesses", "Moiben", "Soy", "Turbo"],
    "elgeyo-marakwet": ["Keiyo North", "Keiyo South", "Marakwet East", "Marakwet West"],
    "nandi": ["Aldai", "Chesumei", "Emgwen", "Mosop", "Nandi Hills", "Tinderet"],
    "baringo": ["Baringo Central", "Baringo North", "Baringo South", "Eldama Ravine", "Mogotio", "Tiaty"],
    "laikipia": ["Laikipia East", "Laikipia North", "Laikipia West"],
    "nakuru": ["Bahati", "Gilgil", "Kuresoi North", "Kuresoi South", "Molo", "Naivasha", "Nakuru Town East", "Nakuru Town West", "Njoro", "Rongai", "Subukia"],
    "narok": ["Narok East", "Narok North", "Narok South", "Narok West"],
    "kajiado": ["Kajiado North", "Kajiado Central", "Kajiado East", "Kajiado South", "Kajiado West"],
    "kericho": ["Ainamoi", "Belgut", "Bureti", "Kipkelion East", "Kipkelion West", "Sigowet/Soin"],
    "bomet": ["Bomet Central", "Bomet East", "Chepalungu", "Konoin", "Sotik"],
    "kakamega": ["Butere", "Ikolomani", "Khwisero", "Likuyani", "Lugari", "Lurambi", "Malava", "Matungu", "Mumias East", "Mumias West", "Navakholo", "Shinyalu"],
    "vihiga": ["Emuhaya", "Hamisi", "Luanda", "Sabatia", "Vihiga"],
    "bungoma": ["Bumula", "Kabuchai", "Kanduyi", "Kimilili", "Mt. Elgon", "Sirisia", "Tongaren", "Webuye East", "Webuye West"],
    "busia": ["Budalangi", "Butula", "Funyula", "Nambale", "Teso North", "Teso South"],
    "siaya": ["Alego Usonga", "Bondo", "Gem", "Rarieda", "Ugenya", "Ugunja"],
    "kisumu": ["Kisumu Central", "Kisumu East", "Kisumu West", "Muhoroni", "Nyakach", "Nyando", "Seme"],
    "homa-bay": ["Homa Bay Town", "Kabondo Kasipul", "Karachuonyo", "Kasipul", "Mbita", "Ndhiwa", "Rangwe", "Suba"],
    "migori": ["Awendo", "Kuria East", "Kuria West", "Nyatike", "Rongo", "Suna East", "Suna West", "Uriri"],
    "kisii": ["Bobasi", "Bomachoge Borabu", "Bomachoge Chache", "Bonchari", "Kitutu Chache North", "Kitutu Chache South", "Nyaribari Chache", "Nyaribari Masaba", "South Mugirango"],
    "nyamira": ["Borabu", "Kitutu Masaba", "North Mugirango", "West Mugirango"]
  }

  // Calculate form completion percentage
  const calculateProgress = () => {
    const requiredFields = ['name', 'age', 'gender', 'location', 'constituency', 'phoneNumber', 'languageDialect', 'educationalBackground', 'employmentStatus']
    const filledFields = requiredFields.filter(field => formData[field as keyof typeof formData])
    return Math.round((filledFields.length / requiredFields.length) * 100)
  }

  // Get constituencies for selected county
  const getConstituencies = () => {
    return formData.location ? countyConstituencies[formData.location] || [] : []
  }

  // Handle county change - reset constituency when county changes
  const handleCountyChange = (value: string) => {
    setFormData((prev) => ({ ...prev, location: value, constituency: "" }))
  }

  // Load existing user data and handle redirects
  useEffect(() => {
    console.log("Profile setup - Auth state:", { 
      isLoading, 
      user: user ? { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        status: user.status,
        profile_complete: user.profile_complete 
      } : null 
    })
    
    if (!isLoading && !user) {
      console.log("Profile setup - No user found, redirecting to signin")
      router.push("/auth/signin")
    } else if (!isLoading && user && user.role === "reviewer" && user.status === "pending") {
      console.log("Profile setup - Reviewer not approved yet, redirecting to signin")
      router.push("/auth/signin")
    } else if (!isLoading && user) {
      // Load existing user data into form fields
      console.log("Profile setup - Loading existing user data:", user)
      
      // Fetch complete user data from database to get all demographic fields
      const loadUserData = async () => {
        setLoadingUserData(true)
        try {
          const fullUserData = await db.getUserById(user.id)
          if (fullUserData) {
            console.log("Profile setup - Full user data from database:", fullUserData)
            setFormData(prevData => ({
              ...prevData,
              name: fullUserData.name || "",
              age: fullUserData.age || "",
              gender: fullUserData.gender || "",
              location: fullUserData.location || "",
              constituency: (fullUserData as any).constituency || "",
              languageDialect: fullUserData.language_dialect || "",
              educationalBackground: fullUserData.educational_background || "",
              employmentStatus: fullUserData.employment_status || "",
              phoneNumber: fullUserData.phone_number || "",
              accent: "", // This field might not be stored in database yet
              joinMailingList: false, // This field might not be stored in database yet
              acceptPrivacy: true, // Assume they accepted privacy policy if profile is complete
            }))
          } else {
            // Fallback to AuthProvider data if database fetch fails
            setFormData(prevData => ({
              ...prevData,
              name: user.name || "",
              age: user.age || "",
              gender: user.gender || "",
              acceptPrivacy: true,
            }))
          }
        } catch (error) {
          console.error("Error loading user data from database:", error)
          // Fallback to AuthProvider data
          setFormData(prevData => ({
            ...prevData,
            name: user.name || "",
            age: user.age || "",
            gender: user.gender || "",
            acceptPrivacy: true,
          }))
        } finally {
          setLoadingUserData(false)
        }
      }
      
      loadUserData()
    }
  }, [user, isLoading, router])

  // Show loading state while checking authentication or loading user data
  if (isLoading || loadingUserData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {isLoading ? "Setting up your workspace..." : "Loading your profile..."}
            </h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              We're preparing everything for you. This will just take a moment.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">Authentication Required</h3>
            <p className="text-gray-600">
              Please sign in to access your profile setup.
            </p>
            <p className="text-sm text-gray-500">
              If you're a new reviewer, make sure you've been approved by an admin.
            </p>
          </div>
          <Button 
            onClick={() => router.push("/auth/signin")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    )
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Store the current user role before updating
      const currentUserRole = user?.role
      console.log("Current user role:", currentUserRole)
      
      await updateProfile({
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        location: formData.location,
        constituency: formData.constituency,
        language_dialect: formData.languageDialect,
        educational_background: formData.educationalBackground,
        employment_status: formData.employmentStatus,
        phone_number: formData.phoneNumber,
        profile_complete: true,
      } as any)
      
      console.log("Profile updated successfully, redirecting to:", currentUserRole)
      
      // Small delay to show success state
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect based on the stored user role
      if (currentUserRole === "contributor") {
        console.log("Redirecting contributor to /speak")
        router.push("/speak")
      } else if (currentUserRole === "reviewer") {
        console.log("Redirecting reviewer to /listen")
        router.push("/listen")
      } else if (currentUserRole === "admin") {
        console.log("Redirecting admin to /admin")
        router.push("/admin")
      } else {
        console.log("Redirecting to /dashboard")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setIsSubmitting(false)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
          </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Common Voice Luo</h1>
                <p className="text-xs text-gray-500">Mozilla Foundation</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Profile Setup
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200/50 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {user?.profile_complete ? "Update Your Profile" : "Complete Your Profile"}
            </span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.profile_complete ? "Edit Profile Information" : "Let's Get to Know You"}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
                  {user?.profile_complete 
              ? "Update your information to keep your profile current and help improve our voice recognition technology."
              : "Help us improve speech recognition by sharing some information about yourself. Your data helps create more accurate and inclusive AI systems."
            }
          </p>
          
          {/* Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Profile Completion</span>
              <span>{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Display Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your display name"
                      className="h-11 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="visibility" className="text-sm font-medium text-gray-700">Leaderboard Visibility</Label>
                      <Select defaultValue="visible">
                      <SelectTrigger className="h-11 rounded-lg border-gray-200 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="visible">Visible to others</SelectItem>
                        <SelectItem value="hidden">Keep private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
              </div>

              {/* Demographics Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Demographics</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-medium text-gray-700">Age Range</Label>
                    <Select value={formData.age} onValueChange={(value) => setFormData((prev) => ({ ...prev, age: value }))}>
                      <SelectTrigger className="h-11 rounded-lg border-gray-200 focus:border-green-500">
                        <SelectValue placeholder="Select your age range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-19">Under 19</SelectItem>
                          <SelectItem value="19-29">19 - 29</SelectItem>
                          <SelectItem value="30-39">30 - 39</SelectItem>
                          <SelectItem value="40-49">40 - 49</SelectItem>
                          <SelectItem value="50-59">50 - 59</SelectItem>
                          <SelectItem value="60+">60+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender Identity</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}>
                      <SelectTrigger className="h-11 rounded-lg border-gray-200 focus:border-green-500">
                        <SelectValue placeholder="Select gender identity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male/Masculine</SelectItem>
                          <SelectItem value="female">Female/Feminine</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                    </div>
                  </div>

              {/* Location & Contact Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Location & Contact</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700">County (Kenya)</Label>
                    <Select value={formData.location} onValueChange={handleCountyChange}>
                      <SelectTrigger className="h-11 rounded-lg border-gray-200 focus:border-purple-500">
                            <SelectValue placeholder="Select your county" />
                          </SelectTrigger>
                      <SelectContent className="max-h-60">
                            <SelectItem value="mombasa">Mombasa</SelectItem>
                            <SelectItem value="kwale">Kwale</SelectItem>
                            <SelectItem value="kilifi">Kilifi</SelectItem>
                            <SelectItem value="tana-river">Tana River</SelectItem>
                            <SelectItem value="lamu">Lamu</SelectItem>
                            <SelectItem value="taita-taveta">Taita Taveta</SelectItem>
                            <SelectItem value="garissa">Garissa</SelectItem>
                            <SelectItem value="wajir">Wajir</SelectItem>
                            <SelectItem value="mandera">Mandera</SelectItem>
                            <SelectItem value="marsabit">Marsabit</SelectItem>
                            <SelectItem value="isiolo">Isiolo</SelectItem>
                            <SelectItem value="meru">Meru</SelectItem>
                            <SelectItem value="tharaka-nithi">Tharaka Nithi</SelectItem>
                            <SelectItem value="embu">Embu</SelectItem>
                            <SelectItem value="kitui">Kitui</SelectItem>
                            <SelectItem value="machakos">Machakos</SelectItem>
                            <SelectItem value="makueni">Makueni</SelectItem>
                            <SelectItem value="nyandarua">Nyandarua</SelectItem>
                            <SelectItem value="nyeri">Nyeri</SelectItem>
                            <SelectItem value="kirinyaga">Kirinyaga</SelectItem>
                            <SelectItem value="muranga">Murang'a</SelectItem>
                            <SelectItem value="kiambu">Kiambu</SelectItem>
                            <SelectItem value="turkana">Turkana</SelectItem>
                            <SelectItem value="west-pokot">West Pokot</SelectItem>
                            <SelectItem value="samburu">Samburu</SelectItem>
                            <SelectItem value="trans-nzoia">Trans Nzoia</SelectItem>
                            <SelectItem value="uasin-gishu">Uasin Gishu</SelectItem>
                            <SelectItem value="elgeyo-marakwet">Elgeyo Marakwet</SelectItem>
                            <SelectItem value="nandi">Nandi</SelectItem>
                            <SelectItem value="baringo">Baringo</SelectItem>
                            <SelectItem value="laikipia">Laikipia</SelectItem>
                            <SelectItem value="nakuru">Nakuru</SelectItem>
                            <SelectItem value="narok">Narok</SelectItem>
                            <SelectItem value="kajiado">Kajiado</SelectItem>
                            <SelectItem value="kericho">Kericho</SelectItem>
                            <SelectItem value="bomet">Bomet</SelectItem>
                            <SelectItem value="kakamega">Kakamega</SelectItem>
                            <SelectItem value="vihiga">Vihiga</SelectItem>
                            <SelectItem value="bungoma">Bungoma</SelectItem>
                            <SelectItem value="busia">Busia</SelectItem>
                            <SelectItem value="siaya">Siaya</SelectItem>
                            <SelectItem value="kisumu">Kisumu</SelectItem>
                            <SelectItem value="homa-bay">Homa Bay</SelectItem>
                            <SelectItem value="migori">Migori</SelectItem>
                            <SelectItem value="kisii">Kisii</SelectItem>
                            <SelectItem value="nyamira">Nyamira</SelectItem>
                            <SelectItem value="nairobi">Nairobi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                    <Label htmlFor="constituency" className="text-sm font-medium text-gray-700">Constituency</Label>
                    <Select 
                      value={formData.constituency} 
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, constituency: value }))}
                      disabled={!formData.location}
                    >
                      <SelectTrigger className="h-11 rounded-lg border-gray-200 focus:border-purple-500 disabled:opacity-50">
                        <SelectValue placeholder={formData.location ? "Select constituency" : "Select county first"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {getConstituencies().map((constituency) => (
                          <SelectItem key={constituency} value={constituency.toLowerCase().replace(/\s+/g, '-')}>
                            {constituency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.location && getConstituencies().length === 0 && (
                      <p className="text-xs text-amber-600">No constituencies available for this county</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="+254 700 000 000"
                        className="h-11 pl-10 rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                  </div>
                </div>
              </div>

              {/* Education & Professional Section */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Education & Professional</h3>
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                    <Label htmlFor="languageDialect" className="text-sm font-medium text-gray-700">Language Dialect</Label>
                    <Select value={formData.languageDialect} onValueChange={(value) => setFormData((prev) => ({ ...prev, languageDialect: value }))}>
                      <SelectTrigger className="h-11 rounded-lg border-gray-200 focus:border-orange-500">
                        <SelectValue placeholder="Select dialect" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Milambo">Milambo</SelectItem>
                            <SelectItem value="Nyanduat">Nyanduat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="educationalBackground" className="text-sm font-medium text-gray-700">Education Level</Label>
                        <Select value={formData.educationalBackground} onValueChange={(value) => setFormData((prev) => ({ ...prev, educationalBackground: value }))}>
                          <SelectTrigger className="h-11 rounded-lg border-gray-200 focus:border-orange-500">
                            <SelectValue placeholder="Select education" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="tertiary">Tertiary</SelectItem>
                            <SelectItem value="graduate">Graduate</SelectItem>
                            <SelectItem value="postgraduate">Postgraduate</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="employmentStatus" className="text-sm font-medium text-gray-700">Employment Status</Label>
                    <Select value={formData.employmentStatus} onValueChange={(value) => setFormData((prev) => ({ ...prev, employmentStatus: value }))}>
                      <SelectTrigger className="h-11 rounded-lg border-gray-200 focus:border-orange-500">
                        <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="self-employed">Self-employed</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                    </div>
                  </div>

              {/* Language & Voice Section */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Language & Voice</h3>
                    </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium text-gray-700">Primary Language</Label>
                      <Select value="luo" disabled>
                      <SelectTrigger className="h-11 rounded-lg border-gray-200 bg-gray-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="luo">Luo</SelectItem>
                        </SelectContent>
                      </Select>
                    <p className="text-xs text-gray-500 flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Luo is the primary language for this platform</span>
                      </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accent" className="text-sm font-medium text-gray-700">Accent Description</Label>
                    <Textarea
                      id="accent"
                      placeholder="Describe your accent or speaking style (optional)"
                      value={formData.accent}
                      onChange={(e) => setFormData((prev) => ({ ...prev, accent: e.target.value }))}
                      className="min-h-[100px] rounded-lg border-gray-200 focus:border-teal-500 focus:ring-teal-500 resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      Help us understand your unique voice characteristics
                    </p>
                  </div>
                </div>
              </div>

              {/* Account & Privacy Section */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Account & Privacy</h3>
                  </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        id="email" 
                        type="email" 
                        value={user?.email || ""} 
                        disabled 
                        className="h-11 pl-10 rounded-lg bg-gray-50 border-gray-200 text-gray-600" 
                      />
                    </div>
                    <p className="text-xs text-gray-500">Your email address cannot be changed</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <div className="flex items-start space-x-3">
                      <Checkbox
                        id="mailing-list"
                        checked={formData.joinMailingList}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, joinMailingList: checked as boolean }))
                        }
                          className="mt-1"
                      />
                        <div className="flex-1">
                          <Label htmlFor="mailing-list" className="text-sm font-medium text-gray-900 cursor-pointer">
                            Join our mailing list
                      </Label>
                          <p className="text-xs text-gray-500 mt-1">
                            Get updates about challenges, goals, and Common Voice Luo news
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-start space-x-3">
                      <Checkbox
                        id="privacy"
                        checked={formData.acceptPrivacy}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, acceptPrivacy: checked as boolean }))
                        }
                        required
                          className="mt-1"
                      />
                        <div className="flex-1">
                          <Label htmlFor="privacy" className="text-sm font-medium text-gray-900 cursor-pointer">
                            I accept the Privacy Policy *
                      </Label>
                          <p className="text-xs text-gray-600 mt-1">
                            I agree to Mozilla's{" "}
                            <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                        Privacy Policy
                      </a>
                            {" "}and{" "}
                            <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                              Terms of Service
                      </a>
                    </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                  </div>

              {/* Submit Button */}
              <div className="pt-4">
                  <Button
                    type="submit"
                  disabled={!formData.acceptPrivacy || isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Saving Profile...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>{user?.profile_complete ? "Update Profile" : "Complete Profile"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                  </Button>
                
                {!formData.acceptPrivacy && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    Please accept the Privacy Policy to continue
                  </p>
                )}
              </div>
                </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Your data helps improve speech recognition for everyone. Thank you for contributing!</p>
        </div>
      </div>
    </div>
  )
}
