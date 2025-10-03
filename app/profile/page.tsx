"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { TopNavigation } from "@/components/top-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: user?.name || "",
    age: user?.age || "",
    gender: user?.gender || "",
    accent: "",
    location: user?.location || "",
    constituency: (user as any)?.constituency || "",
    languageDialect: user?.language_dialect || "",
    educationalBackground: user?.educational_background || "",
    employmentStatus: user?.employment_status || "",
    phoneNumber: user?.phone_number || "",
    joinMailingList: false,
    acceptPrivacy: true,
    leaderboardVisibility: "visible",
  })

  const [showGenderHelp, setShowGenderHelp] = useState(false)
  const [showAccentHelp, setShowAccentHelp] = useState(false)

  // Kenya Counties to Constituencies mapping (same as in setup page)
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

  // Get constituencies for selected county
  const getConstituencies = () => {
    return formData.location ? countyConstituencies[formData.location] || [] : []
  }

  // Handle county change - reset constituency when county changes
  const handleCountyChange = (value: string) => {
    setFormData((prev) => ({ ...prev, location: value, constituency: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("Submitting profile data:", {
      name: formData.name,
      age: formData.age,
      gender: formData.gender,
      location: formData.location,
      constituency: formData.constituency,
      language_dialect: formData.languageDialect,
      educational_background: formData.educationalBackground,
      employment_status: formData.employmentStatus,
      phone_number: formData.phoneNumber,
    })
    
    try {
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
      console.log("Profile updated successfully")
      
      // Redirect based on user role
      if (user?.role === "contributor") {
        router.push("/speak")
      } else if (user?.role === "reviewer") {
        router.push("/listen")
      } else if (user?.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      // You might want to show an error message to the user here
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <TopNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="font-bold text-base text-gray-900">Build Profile</span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-white/20">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                                         <div>
                       <h4 className="font-semibold text-gray-900 mb-1 text-sm">Enhanced Accuracy</h4>
                       <p className="text-xs text-gray-700 leading-relaxed">Complete your profile to improve speech recognition accuracy and get better results.</p>
                     </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-white/20">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                                         <div>
                       <h4 className="font-semibold text-gray-900 mb-1 text-sm">AI Training</h4>
                       <p className="text-xs text-gray-700 leading-relaxed">Your information helps train better AI models for improved voice recognition.</p>
                     </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-white/20">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                                         <div>
                       <h4 className="font-semibold text-gray-900 mb-1 text-sm">Privacy First</h4>
                       <p className="text-xs text-gray-700 leading-relaxed">All data is handled according to Common Voice Luo's privacy policy with complete transparency.</p>
                     </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-600/10 rounded-xl border border-blue-200/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-blue-800">Quick Setup</span>
                  </div>
                  <p className="text-xs text-blue-700">This will only take a few minutes to complete your profile setup.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Profile</CardTitle>
                <CardDescription className="text-base">
                  Thanks for confirming your account, now let's build your profile. By providing some information about
                  yourself, the audio data you submit to Common Voice Luo will be more useful to Speech Recognition engines
                  that use this data to improve their accuracy.
                </CardDescription>

                <Button
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto justify-start"
                  onClick={() => setShowGenderHelp(!showGenderHelp)}
                >
                  Why does this matter? <ChevronDown className="ml-1 h-4 w-4" />
                </Button>

                {showGenderHelp && (
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    This information helps improve the accuracy of speech recognition systems by providing diverse
                    training data.
                  </div>
                )}
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        User Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="JackOraro"
                        className="h-10 rounded-lg w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visibility" className="text-sm font-medium">
                        Leaderboard Visibility
                      </Label>
                      <Select
                        value={formData.leaderboardVisibility}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, leaderboardVisibility: value }))}
                      >
                        <SelectTrigger className="h-10 rounded-lg w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visible">Visible</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Age and Gender */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-sm font-medium">
                        Age
                      </Label>
                      <Select value={formData.age} onValueChange={(value) => setFormData((prev) => ({ ...prev, age: value }))}>
                        <SelectTrigger className="h-10 rounded-lg w-full">
                          <SelectValue placeholder="19 - 29" />
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
                      <Label htmlFor="gender" className="text-sm font-medium">
                        Sex or Gender
                      </Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}>
                        <SelectTrigger className="h-10 rounded-lg w-full">
                          <SelectValue placeholder="Male/Masculine" />
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

                  <Button
                    type="button"
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                    onClick={() => setShowGenderHelp(!showGenderHelp)}
                  >
                    Need help with the Sex or Gender changes? <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>

                  {/* Demographics Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Additional Demographics</h3>
                    
                    {/* Location, Constituency and Phone Number */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm font-medium">
                          Location (Kenyan Counties)
                        </Label>
                        <Select value={formData.location} onValueChange={handleCountyChange}>
                          <SelectTrigger className="h-10 rounded-lg w-full">
                            <SelectValue placeholder="Select your county" />
                          </SelectTrigger>
                          <SelectContent>
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
                        <Label htmlFor="constituency" className="text-sm font-medium">
                          Constituency
                        </Label>
                        <Select 
                          value={formData.constituency} 
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, constituency: value }))}
                          disabled={!formData.location}
                        >
                          <SelectTrigger className="h-10 rounded-lg w-full disabled:opacity-50">
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
                        <Label htmlFor="phoneNumber" className="text-sm font-medium">
                          Phone Number
                        </Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="+254 700 000 000"
                          className="h-10 rounded-lg w-full"
                        />
                      </div>
                    </div>

                    {/* Language Dialect and Educational Background */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="languageDialect" className="text-sm font-medium">
                          Language Dialect
                        </Label>
                        <Select value={formData.languageDialect} onValueChange={(value) => setFormData((prev) => ({ ...prev, languageDialect: value }))}>
                          <SelectTrigger className="h-10 rounded-lg w-full">
                            <SelectValue placeholder="Select your dialect" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Milambo">Milambo</SelectItem>
                            <SelectItem value="Nyanduat">Nyanduat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="educationalBackground" className="text-sm font-medium">
                          Educational Background
                        </Label>
                        <Select value={formData.educationalBackground} onValueChange={(value) => setFormData((prev) => ({ ...prev, educationalBackground: value }))}>
                          <SelectTrigger className="h-10 rounded-lg w-full">
                            <SelectValue placeholder="Select your education level" />
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
                    </div>

                    {/* Employment Status */}
                    <div className="space-y-2">
                      <Label htmlFor="employmentStatus" className="text-sm font-medium">
                        Employment Status
                      </Label>
                      <Select value={formData.employmentStatus} onValueChange={(value) => setFormData((prev) => ({ ...prev, employmentStatus: value }))}>
                        <SelectTrigger className="h-10 rounded-lg w-full">
                          <SelectValue placeholder="Select your employment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="self-employed">Self-employed</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Languages Section */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-lg font-semibold">Languages</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-sm font-medium">
                        Language
                      </Label>
                      <Select value="luo" disabled>
                        <SelectTrigger className="h-10 rounded-lg w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="luo">luo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accent" className="text-sm font-medium">
                        How would you describe your accent?
                      </Label>
                      <Textarea
                        id="accent"
                        placeholder="Start typing to describe your accent"
                        value={formData.accent}
                        onChange={(e) => setFormData((prev) => ({ ...prev, accent: e.target.value }))}
                        className="min-h-[100px] rounded-lg"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                      onClick={() => setShowAccentHelp(!showAccentHelp)}
                    >
                      Need some help with accent? <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>

                    {showAccentHelp && (
                      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                        <p className="mb-2">Describe your accent to help improve speech recognition accuracy. Consider:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Regional variations in pronunciation</li>
                          <li>Influence from other languages you speak</li>
                          <li>Any speech patterns or characteristics</li>
                          <li>Educational or professional background</li>
                        </ul>
                      </div>
                    )}


                  </div>

                  {/* Email Section */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="h-10 rounded-lg bg-gray-50 w-full"
                    />
                  </div>

                  {/* Preferences */}
                  <div className="space-y-6">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="mailing-list"
                        checked={formData.joinMailingList}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, joinMailingList: checked as boolean }))
                        }
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="mailing-list" className="text-sm font-medium">
                          Join the Common Voice Luo mailing list
                        </Label>
                        <p className="text-xs text-gray-600">
                          Receive emails such as challenge and goal reminders, progress updates, and newsletters about
                          Common Voice Luo.
                        </p>
                      </div>
                    </div>

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
                      <div className="space-y-1">
                        <Label htmlFor="privacy" className="text-sm font-medium">
                          Privacy Policy
                        </Label>
                        <p className="text-xs text-gray-600">
                          I'm okay with you handling this info as you explain in Common Voice Luo's{" "}
                          <button className="text-blue-600 hover:underline">Privacy Policy</button>.
                        </p>
                      </div>
                    </div>

                    <p className="text-sm">
                      <button className="text-blue-600 hover:underline">Have you read our Terms?</button>
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg text-base font-medium"
                    disabled={!formData.acceptPrivacy}
                  >
                    Save
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
