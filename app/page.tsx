"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import LandingPage from "@/components/landing-page"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        if (!isLoading && user) {
          console.log("User state:", user)
          console.log("Profile complete:", user?.profile_complete)
          
          if (!user.profile_complete) {
            console.log("Profile not complete, redirecting to setup")
            router.push("/profile/setup")
          } else {
            // Redirect based on user role
            console.log("Profile complete, redirecting based on role:", user.role)
            if (user.role === "contributor") {
              router.push("/speak")
            } else if (user.role === "reviewer") {
              router.push("/listen")
            } else if (user.role === "admin") {
              router.push("/admin")
            } else {
              router.push("/dashboard")
            }
          }
        }
      } catch (error) {
        console.error("Navigation error:", error)
        // Don't redirect on error, just show landing page
      }
    }

    handleRedirect()
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Show landing page for non-authenticated users
  if (!user) {
    return <LandingPage />
  }

  // Show loading while redirecting authenticated users
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}
