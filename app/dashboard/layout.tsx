"use client"

import type React from "react"
import { useAuth } from "@/components/auth-provider"
import { TopNavigation } from "@/components/top-navigation"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin")
    } else if (!isLoading && user && !user.profile_complete) {
      router.push("/profile/setup")
    }
  }, [user, isLoading, router])

  if (isLoading || !user || !user.profile_complete) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <TopNavigation />
      <main>{children}</main>
    </div>
  )
}
