"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { AlertCircle, Shield, Loader2 } from "lucide-react"
import { db } from "@/lib/database"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [step, setStep] = useState<"email" | "signin">("email")
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [googleOAuthAvailable, setGoogleOAuthAvailable] = useState(false)
  const { login, adminLogin, user } = useAuth()
  const router = useRouter()

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Email is required")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setStep("signin")
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      setError("")

      // Use AuthProvider's login function to ensure proper state management
      await login(email.toLowerCase().trim(), password)

      // Get the user data from database for redirect logic
      const existingUser = await db.getUserByEmail(email.toLowerCase().trim())
      console.log("Signin successful, user data:", existingUser)

      // Redirect based on user role and profile completion
      if (!existingUser?.profile_complete) {
        console.log("Profile not complete, redirecting to profile setup")
        router.push("/profile/setup")
      } else if (existingUser.role === "contributor") {
        console.log("Contributor, redirecting to speak")
        router.push("/speak")
      } else if (existingUser.role === "reviewer") {
        console.log("Reviewer, redirecting to listen")
        router.push("/listen")
      } else if (existingUser.role === "admin") {
        console.log("Admin, redirecting to admin")
        router.push("/admin")
      } else {
        console.log("Unknown role, redirecting to dashboard")
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Signin error:", error)
      setError(error.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!adminEmail.trim()) {
      setError("Admin email is required")
      return
    }

    if (!adminPassword) {
      setError("Admin password is required")
      return
    }

    try {
      setIsLoading(true)
      await adminLogin(adminEmail.trim(), adminPassword)
      router.push("/admin")
    } catch (error: any) {
      console.error("Admin login error:", error)
      setError(error.message || "Admin login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    setError("Google OAuth is not available. Please use email/password login.")
  }

  // Admin login form (always visible when admin tab is selected)
  if (activeTab === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Common Voice Luo
            </h1>
            <p className="text-gray-600 mt-2">Admin Portal</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1">
              <TabsTrigger value="user" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">User Login</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Admin Login</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm animate-slide-up">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="flex items-center justify-center space-x-2 text-2xl font-bold text-gray-900">
                    <Shield className="h-6 w-6 text-orange-500" />
                    <span>Admin Login</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600">Secure admin access to the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleAdminLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail" className="text-sm font-medium text-gray-700">Admin Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="Enter admin email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full h-12 px-4 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminPassword" className="text-sm font-medium text-gray-700">Admin Password</Label>
                      <PasswordInput
                        id="adminPassword"
                        placeholder="Enter admin password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full h-12 px-4 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Admin Sign In"
                      )}
                    </Button>
                  </form>

                  <div className="bg-orange-50/50 border border-orange-200 p-4 rounded-xl">
                    <p className="text-sm text-orange-800">
                      <strong>Demo Admin Credentials:</strong>
                      <br />
                      Email: admin@commonvoice.org
                      <br />
                      Password: admin123
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  if (step === "email") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Common Voice Luo
            </h1>
            <p className="text-gray-600 mt-2">Welcome back</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1">
              <TabsTrigger value="user" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">User Login</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Admin Login</TabsTrigger>
            </TabsList>

            <TabsContent value="user">
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm animate-slide-up">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">Enter your email</CardTitle>
                  <CardDescription className="text-gray-600">Continue to Common Voice Luo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full h-12 px-4 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900"
                      onClick={() => setError("Google login is not yet implemented. Please use email/password login.")}
                      disabled={isLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900"
                      onClick={() => setError("Microsoft login is not yet implemented. Please use email/password login.")}
                      disabled={isLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#F25022" d="M1 1h10v10H1z"/>
                        <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                        <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                        <path fill="#FFB900" d="M13 13h10v10H13z"/>
                      </svg>
                      Continue with Microsoft
                    </Button>
                  </div>



                  <div className="text-xs text-muted-foreground">
                    By proceeding, you agree to the{" "}
                    <Link href="#" className="underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="underline">
                      Privacy Notice
                    </Link>
                    .
                  </div>

                  <div className="text-center">
                    <Link href="/auth/signup" className="text-sm text-blue-600 hover:underline">
                      Don't have an account? Sign up
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  if (step === "signin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Common Voice Luo
            </h1>
            <p className="text-gray-600 mt-2">Welcome back, {email}</p>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Sign in</CardTitle>
              <CardDescription className="text-gray-600">Enter your password to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col items-center space-y-3 mb-6">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarFallback className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    {email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-gray-600 font-medium">{email}</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <PasswordInput
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full h-12 px-4 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>Demo Credentials:</strong>
                  <br />
                  Contributor: contributor@example.com / contributor123
                  <br />
                  Reviewer: reviewer@example.com / reviewer123
                  <br />
                  Pending: pending@example.com / pending123
                </p>
              </div>

              <div className="flex justify-between text-sm pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep("email")}
                  className="p-0 h-auto text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  disabled={isLoading}
                >
                  Use a different account
                </Button>
                <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                  Forgot password?
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
