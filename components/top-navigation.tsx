"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Mic, Headphones, ChevronDown, User, LogOut, Settings, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function TopNavigation() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const getNavigationItems = () => {
    const baseItems = [
      {
        title: "Speak",
        href: "/speak",
        icon: Mic,
        color: "text-red-500",
        activeColor: "bg-red-100 text-red-600",
        disabled: user?.role === "reviewer", // Reviewers can't access speak
      },
      {
        title: "Listen",
        href: "/listen",
        icon: Headphones,
        color: "text-blue-500",
        activeColor: "bg-blue-100 text-blue-600",
        disabled: user?.role === "contributor", // Contributors can't access listen
      },
    ]

    // Add admin navigation only for admin users
    if (user?.role === "admin") {
      baseItems.push({
        title: "Admin",
        href: "/admin",
        icon: Users,
        color: "text-orange-500",
        activeColor: "bg-orange-100 text-orange-600",
        disabled: false,
      })
    }

    return baseItems
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - Hidden on mobile, visible on larger screens */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Common Voice Luo
                </h1>
                <p className="text-xs text-gray-500 -mt-1">mozilla</p>
              </div>
            </Link>
          </div>

          {/* Mobile Logo - Only icon visible on mobile */}
          <div className="md:hidden">
            <Link href="/dashboard" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || (item.href === "/admin" && pathname.startsWith("/admin"))
              const Icon = item.icon

              return (
                <Link
                  key={item.title}
                  href={item.disabled ? "#" : item.href}
                  className={`
                    relative px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center gap-1 sm:gap-2
                    ${item.disabled ? "opacity-30 cursor-not-allowed pointer-events-none" : "hover:bg-gray-50"}
                    ${isActive && !item.disabled ? item.activeColor : ""}
                  `}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive && !item.disabled ? "" : item.color}`} />
                  <span className={`text-xs sm:text-sm font-medium ${isActive && !item.disabled ? "" : "text-gray-700"}`}>
                    {item.title}
                  </span>
                  {isActive && !item.disabled && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            {/* Role Badge - Hidden on small mobile, visible on sm+ */}
            <Badge
              variant="secondary"
              className={`
                hidden sm:inline-flex text-xs
                ${user?.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200"}
              `}
            >
              {user?.role} {user?.status === "pending" && "(Pending)"}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 hover:bg-gray-50 rounded-lg sm:rounded-xl px-2 sm:px-3">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-gray-100">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs sm:text-sm">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-xs sm:text-sm font-medium text-gray-700 max-w-20 sm:max-w-32 truncate">
                    {user?.name || user?.email}
                  </span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl shadow-lg border-0 bg-white/95 backdrop-blur-md"
              >
                {/* App Info - Visible in dropdown on mobile */}
                <div className="md:hidden px-3 py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">CV</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Common Voice Luo</h2>
                      <p className="text-xs text-gray-500">mozilla</p>
                    </div>
                  </div>
                </div>
                
                {/* User Role Badge - Only visible on mobile */}
                <div className="sm:hidden px-3 py-2 border-b border-gray-100">
                  <Badge
                    variant="secondary"
                    className={`
                      w-full justify-center text-xs
                      ${user?.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200"}
                    `}
                  >
                    {user?.role} {user?.status === "pending" && "(Pending)"}
                  </Badge>
                </div>

                <DropdownMenuItem asChild className="rounded-lg">
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link href="/dashboard" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="rounded-lg text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
