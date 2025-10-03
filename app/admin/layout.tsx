"use client"

import type React from "react"
import { useAuth } from "@/components/auth-provider"
import { TopNavigation } from "@/components/top-navigation"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({
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
    } else if (!isLoading && user && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading || !user || !user.profile_complete) {
    return null
  }

  if (user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      <TopNavigation />
      <main className="py-8">{children}</main>
    </div>
  )
}
