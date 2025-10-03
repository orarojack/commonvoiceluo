"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { db, type User } from "@/lib/database"

type AuthUser = Omit<User, "password">

type AuthContextType = {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, role: "contributor" | "reviewer") => Promise<void>
  adminLogin: (email: string, password: string) => Promise<void>

  logout: () => void
  updateProfile: (profile: Partial<AuthUser>) => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Admin credentials - in production, these should be environment variables
const ADMIN_CREDENTIALS = {
  email: "admin@commonvoice.org",
  password: "admin123",
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check for existing session
        const savedUser = localStorage.getItem("cv_current_user")
        console.log("AuthProvider - Loading user from localStorage:", savedUser ? "User found" : "No user found")
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser)

            // Validate the user data structure and UUID
            if (parsedUser && parsedUser.id && isValidUUID(parsedUser.id)) {
              try {
                // Validate the user still exists in database
                console.log("AuthProvider - Validating user in database:", parsedUser.id)
                const dbUser = await db.getUserById(parsedUser.id)
                console.log("AuthProvider - Database user found:", dbUser ? "Yes" : "No")
                
                if (dbUser) {
                  // Update the user session with fresh data from database
                  const updatedUser: AuthUser = {
                    id: dbUser.id,
                    email: dbUser.email,
                    role: dbUser.role,
                    status: dbUser.status,
                    profile_complete: dbUser.profile_complete,
                    name: dbUser.name,
                    age: dbUser.age,
                    gender: dbUser.gender,
                    languages: dbUser.languages,
                    location: dbUser.location,
                    language_dialect: dbUser.language_dialect,
                    educational_background: dbUser.educational_background,
                    employment_status: dbUser.employment_status,
                    phone_number: dbUser.phone_number,
                    created_at: dbUser.created_at,
                    updated_at: dbUser.updated_at,
                    last_login_at: dbUser.last_login_at,
                    is_active: dbUser.is_active,
                  }
                  console.log("AuthProvider - User loaded successfully:", { 
                    id: updatedUser.id, 
                    email: updatedUser.email, 
                    role: updatedUser.role,
                    status: updatedUser.status,
                    profile_complete: updatedUser.profile_complete 
                  })
                  setUser(updatedUser)
                  localStorage.setItem("cv_current_user", JSON.stringify(updatedUser))
                } else {
                  // User no longer exists, clear session
                  console.log("AuthProvider - User not found in database, clearing session")
                  localStorage.removeItem("cv_current_user")
                  setUser(null)
                }
              } catch (dbError) {
                console.error("AuthProvider - Error validating user in database:", dbError)
                // If database validation fails, keep the user session but log the error
                // This prevents clearing valid sessions due to temporary database issues
                console.log("AuthProvider - Keeping user session despite database validation error")
                setUser(parsedUser)
              }
            } else {
              // Invalid user data structure, clear session
              console.log("AuthProvider - Invalid user data structure, clearing session")
              localStorage.removeItem("cv_current_user")
              setUser(null)
            }
          } catch (parseError) {
            // Invalid JSON in localStorage, clear session
            console.error("Error parsing user session:", parseError)
            localStorage.removeItem("cv_current_user")
            setUser(null)
          }
        }
      } catch (error) {
        console.error("Error loading user session:", error)
        // Clear invalid session data
        localStorage.removeItem("cv_current_user")
        setUser(null)
      } finally {
        console.log("AuthProvider - Loading complete, isLoading set to false")
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required")
      }

      const foundUser = await db.getUserByEmail(email.toLowerCase().trim())

      if (!foundUser) {
        throw new Error("Invalid email or password")
      }

      if (foundUser.password !== password) {
        throw new Error("Invalid email or password")
      }

      if (foundUser.role === "admin") {
        throw new Error("Admin users must use admin login")
      }

      if (foundUser.role === "reviewer" && foundUser.status === "pending") {
        throw new Error("Your reviewer account is pending approval. Please wait for admin approval.")
      }

      if (foundUser.role === "reviewer" && foundUser.status === "rejected") {
        throw new Error("Your reviewer application has been rejected.")
      }

      if (!foundUser.is_active) {
        throw new Error("Your account has been deactivated. Please contact support.")
      }

      // Update last login
      await db.updateUser(foundUser.id, {
        last_login_at: new Date().toISOString(),
      })

      const userSession: AuthUser = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        status: foundUser.status,
        profile_complete: foundUser.profile_complete,
        name: foundUser.name,
        age: foundUser.age,
        gender: foundUser.gender,
        languages: foundUser.languages,
        location: foundUser.location,
        constituency: foundUser.constituency,
        language_dialect: foundUser.language_dialect,
        educational_background: foundUser.educational_background,
        employment_status: foundUser.employment_status,
        phone_number: foundUser.phone_number,
        created_at: foundUser.created_at,
        updated_at: foundUser.updated_at,
        last_login_at: new Date().toISOString(),
        is_active: foundUser.is_active,
      }

      setUser(userSession)
      localStorage.setItem("cv_current_user", JSON.stringify(userSession))
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const adminLogin = async (email: string, password: string) => {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required")
      }

      // Check against hardcoded admin credentials first
      if (email.toLowerCase().trim() === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        // Try to find admin user in database, create if doesn't exist
        let foundUser = await db.getUserByEmail(ADMIN_CREDENTIALS.email)

        if (!foundUser) {
          // Create admin user if doesn't exist
          foundUser = await db.createUser({
            email: ADMIN_CREDENTIALS.email,
            password: ADMIN_CREDENTIALS.password,
            role: "admin",
            status: "active",
            profile_complete: true,
            name: "System Administrator",
            is_active: true,
          })
        }

        // Update last login
        await db.updateUser(foundUser.id, {
          last_login_at: new Date().toISOString(),
        })

        const userSession: AuthUser = {
          id: foundUser.id,
          email: foundUser.email,
          role: foundUser.role,
          status: foundUser.status,
          profile_complete: foundUser.profile_complete,
          name: foundUser.name,
          age: foundUser.age,
          gender: foundUser.gender,
          languages: foundUser.languages,
          location: foundUser.location,
          language_dialect: foundUser.language_dialect,
          educational_background: foundUser.educational_background,
          employment_status: foundUser.employment_status,
          phone_number: foundUser.phone_number,
          created_at: foundUser.created_at,
          updated_at: foundUser.updated_at,
          last_login_at: new Date().toISOString(),
          is_active: foundUser.is_active,
        }

        setUser(userSession)
        localStorage.setItem("cv_current_user", JSON.stringify(userSession))
        return
      }

      // If not hardcoded credentials, check database
      const foundUser = await db.getUserByEmail(email.toLowerCase().trim())

      if (!foundUser || foundUser.password !== password || foundUser.role !== "admin") {
        throw new Error("Invalid admin credentials")
      }

      if (!foundUser.is_active) {
        throw new Error("Admin account has been deactivated")
      }

      // Update last login
      await db.updateUser(foundUser.id, {
        last_login_at: new Date().toISOString(),
      })

      const userSession: AuthUser = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        status: foundUser.status,
        profile_complete: foundUser.profile_complete,
        name: foundUser.name,
        age: foundUser.age,
        gender: foundUser.gender,
        languages: foundUser.languages,
        location: foundUser.location,
        constituency: foundUser.constituency,
        language_dialect: foundUser.language_dialect,
        educational_background: foundUser.educational_background,
        employment_status: foundUser.employment_status,
        phone_number: foundUser.phone_number,
        created_at: foundUser.created_at,
        updated_at: foundUser.updated_at,
        last_login_at: new Date().toISOString(),
        is_active: foundUser.is_active,
      }

      setUser(userSession)
      localStorage.setItem("cv_current_user", JSON.stringify(userSession))
    } catch (error) {
      console.error("Admin login error:", error)
      throw error
    }
  }



  const signup = async (email: string, password: string, role: "contributor" | "reviewer") => {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required")
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long")
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address")
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(email.toLowerCase().trim())
      if (existingUser) {
        throw new Error("An account with this email already exists")
      }

      // Create new user
      const newUser = await db.createUser({
        email: email.toLowerCase().trim(),
        password,
        role,
        status: role === "reviewer" ? "pending" : "active",
        profile_complete: false,
        name: null,
        is_active: true, // Set to true for all users - status controls access instead
      })

      if (role === "reviewer") {
        throw new Error(
          "Reviewer account created successfully! Please wait for admin approval before you can access the system.",
        )
      }

      // Auto-login for contributors
      const userSession: AuthUser = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        profile_complete: newUser.profile_complete,
        name: newUser.name,
        age: newUser.age,
        gender: newUser.gender,
        languages: newUser.languages,
        location: newUser.location,
        constituency: newUser.constituency,
        language_dialect: newUser.language_dialect,
        educational_background: newUser.educational_background,
        employment_status: newUser.employment_status,
        phone_number: newUser.phone_number,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
        last_login_at: newUser.last_login_at,
        is_active: newUser.is_active,
      }

      setUser(userSession)
      localStorage.setItem("cv_current_user", JSON.stringify(userSession))
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  const logout = () => {
    try {
      setUser(null)
      localStorage.removeItem("cv_current_user")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const updateProfile = async (profile: Partial<AuthUser>) => {
    try {
      if (!user) {
        throw new Error("No user logged in")
      }

      if (!isValidUUID(user.id)) {
        throw new Error("Invalid user ID")
      }

      // Convert camelCase properties to match what the database expects
      const dbProfile: any = {}

      // Map the properties correctly
      if (profile.name !== undefined) dbProfile.name = profile.name
      if (profile.age !== undefined) dbProfile.age = profile.age
      if (profile.gender !== undefined) dbProfile.gender = profile.gender
      if (profile.profile_complete !== undefined) dbProfile.profile_complete = profile.profile_complete
      
      // Add missing demographic fields
      if ((profile as any).phone_number !== undefined) dbProfile.phone_number = (profile as any).phone_number
      if ((profile as any).location !== undefined) dbProfile.location = (profile as any).location
      if ((profile as any).constituency !== undefined) dbProfile.constituency = (profile as any).constituency
      if ((profile as any).educational_background !== undefined) dbProfile.educational_background = (profile as any).educational_background
      if ((profile as any).employment_status !== undefined) dbProfile.employment_status = (profile as any).employment_status
      if ((profile as any).language_dialect !== undefined) dbProfile.language_dialect = (profile as any).language_dialect
      if ((profile as any).languages !== undefined) dbProfile.languages = (profile as any).languages

      console.log("updateProfile - User ID:", user.id)
      console.log("updateProfile - Profile data:", dbProfile)
      
      // First check if user exists in database
      const existingUser = await db.getUserById(user.id)
      console.log("updateProfile - User exists in database:", existingUser ? "Yes" : "No")
      if (existingUser) {
        console.log("updateProfile - Existing user data:", { id: existingUser.id, email: existingUser.email, profile_complete: existingUser.profile_complete })
      }

      const updatedUser = await db.updateUser(user.id, dbProfile)

      if (updatedUser) {
        console.log("User updated in database:", updatedUser)
        const userSession: AuthUser = {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          profile_complete: updatedUser.profile_complete,
          name: updatedUser.name,
          age: updatedUser.age,
          gender: updatedUser.gender,
          languages: updatedUser.languages,
          location: updatedUser.location,
          constituency: updatedUser.constituency,
          language_dialect: updatedUser.language_dialect,
          educational_background: updatedUser.educational_background,
          employment_status: updatedUser.employment_status,
          phone_number: updatedUser.phone_number,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at,
          last_login_at: updatedUser.last_login_at,
          is_active: updatedUser.is_active,
        }
        console.log("Setting user session:", userSession)
        setUser(userSession)
        localStorage.setItem("cv_current_user", JSON.stringify(userSession))
      }
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, adminLogin, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
