"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { db } from "@/lib/database"
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthTextColor } from "@/lib/password-validation"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"contributor" | "reviewer">("contributor")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [googleOAuthAvailable, setGoogleOAuthAvailable] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
    isValid: false,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  })
  const { signup } = useAuth()
  const router = useRouter()


  const validateForm = () => {
    if (!email.trim()) {
      setError("Email is required")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return false
    }

    if (!password) {
      setError("Password is required")
      return false
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setError(`Password requirements not met: ${passwordValidation.feedback}`)
      return false
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    return true
  }

  // Handle password change and update strength
  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword)
    const validation = validatePassword(newPassword)
    setPasswordStrength(validation)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Check if user already exists in our database first
      const existingUser = await db.getUserByEmail(email.toLowerCase().trim())
      if (existingUser) {
        setError("An account with this email already exists. Please sign in instead.")
        return
      }

      // Create user directly in our database without Supabase Auth
      const newUser = await db.createUser({
        email: email.toLowerCase().trim(),
        password: password,
        role: role,
        status: role === "reviewer" ? "pending" : "active",
        profile_complete: false,
        name: email.split('@')[0], // Use email prefix as default name
        age: null,
        gender: null,
        languages: null,
        is_active: true, // Set to true for all users - status controls access instead
      })

      console.log("User created in database:", newUser)
      console.log("User ID from database:", newUser.id)
      console.log("User ID type:", typeof newUser.id)

      if (newUser.role === "reviewer" && newUser.status === "pending") {
        // Reviewer needs approval - don't log them in
        setSuccess("Reviewer account created successfully! Your account is pending admin approval. You will receive an email notification when your account is approved. You can try logging in once approved.")
        
        // Clear any existing session
        localStorage.removeItem("cv_current_user")
        
        // Redirect to signin page after a delay
        setTimeout(() => {
          router.push("/auth/signin")
        }, 4000)
      } else {
        // Contributor or approved reviewer - log them in
        const authUser = {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          profile_complete: newUser.profile_complete,
          name: newUser.name,
          age: newUser.age,
          gender: newUser.gender,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at,
          last_login_at: new Date().toISOString(),
          is_active: newUser.is_active,
        }

        console.log("Setting user session:", authUser)
        console.log("Auth user ID:", authUser.id)
        console.log("Auth user ID type:", typeof authUser.id)
        localStorage.setItem("cv_current_user", JSON.stringify(authUser))
        
        // Verify the user was saved to localStorage
        const savedUser = localStorage.getItem("cv_current_user")
        console.log("User saved to localStorage:", savedUser ? JSON.parse(savedUser) : "No user found")
        
        // Verify the user exists in database
        try {
          const verifyUser = await db.getUserById(newUser.id)
          console.log("User verification in database:", verifyUser ? "Found" : "Not found")
          if (verifyUser) {
            console.log("Verified user ID:", verifyUser.id)
          }
        } catch (error) {
          console.error("Error verifying user in database:", error)
        }
        
        setSuccess("Account created successfully! Redirecting to profile setup...")
        
        console.log("Redirecting to profile setup in 2 seconds...")
        // Redirect directly to profile setup
        setTimeout(() => {
          console.log("Executing redirect to /profile/setup")
          router.push("/profile/setup")
        }, 2000)
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      setError(error.message || "Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: string) => {
    setError("Google OAuth is not available. Please use email/password signup.")
  }

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
          <p className="text-gray-600 mt-2">Join the voice data revolution</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm animate-slide-up">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
            <CardDescription className="text-gray-600">Join the Common Voice Luo community and help build the future of voice technology</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignUp} className="space-y-6">
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

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">Account Type</Label>
                <Select
                  value={role}
                  onValueChange={(value: "contributor" | "reviewer") => setRole(value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full h-12 px-4 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-xl">
                    <SelectItem value="contributor" className="rounded-lg">Contributor (Record voice samples)</SelectItem>
                    <SelectItem value="reviewer" className="rounded-lg">Reviewer (Validate recordings - requires approval)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === "reviewer" && (
                <Alert className="border-amber-200 bg-amber-50/50 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Reviewer accounts require admin approval.</strong> After signing up, you'll need to wait for an admin to approve your account before you can access the system. You'll receive an email notification when your account is approved.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="w-full h-12 px-4 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${getPasswordStrengthTextColor(passwordStrength.score)}`}>
                        {passwordStrength.feedback}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">Password must contain:</p>
                      <ul className="space-y-1">
                        <li className={`flex items-center ${passwordStrength.requirements?.length ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="mr-2">{passwordStrength.requirements?.length ? '✓' : '○'}</span>
                          At least 8 characters
                        </li>
                        <li className={`flex items-center ${passwordStrength.requirements?.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="mr-2">{passwordStrength.requirements?.uppercase ? '✓' : '○'}</span>
                          One uppercase letter (A-Z)
                        </li>
                        <li className={`flex items-center ${passwordStrength.requirements?.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="mr-2">{passwordStrength.requirements?.lowercase ? '✓' : '○'}</span>
                          One lowercase letter (a-z)
                        </li>
                        <li className={`flex items-center ${passwordStrength.requirements?.number ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="mr-2">{passwordStrength.requirements?.number ? '✓' : '○'}</span>
                          One number (0-9)
                        </li>
                        <li className={`flex items-center ${passwordStrength.requirements?.special ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="mr-2">{passwordStrength.requirements?.special ? '✓' : '○'}</span>
                          One special character (!@#$%^&*)
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-gray-500 font-medium">or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                onClick={() => setError("Google signup is not yet implemented. Please use email/password signup.")}
                disabled={isLoading}
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                onClick={() => setError("Microsoft signup is not yet implemented. Please use email/password signup.")}
                disabled={isLoading}
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M1 1h10v10H1z"/>
                  <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                  <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                  <path fill="#FFB900" d="M13 13h10v10H13z"/>
                </svg>
                Continue with Microsoft
              </Button>
            </div>



            <div className="text-center pt-4">
              <Link href="/auth/signin" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                Already have an account? <span className="underline">Sign in</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
