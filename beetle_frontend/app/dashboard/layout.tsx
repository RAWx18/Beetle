"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import {
  BarChart3,
  Folder,
  Activity,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  User,
  Moon,
  Sun,
  Github,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [notifications] = useState(3) // Mock notification count

  const handleSignOut = () => {
    logout()
    router.push("/")
  }

  const navigationItems = [
    { name: "Overview", path: "/dashboard", icon: BarChart3 },
    { name: "Projects", path: "/dashboard/projects", icon: Folder },
    { name: "Activity", path: "/dashboard/activity", icon: Activity },
    { name: "Insights", path: "/dashboard/insights", icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/dashboard")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Github className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl">Beetle</span>
            </motion.div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  variant={pathname === item.path ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => router.push(item.path)}
                  className="flex items-center gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Button>
              ))}
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 p-0"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 relative">
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center bg-red-500">
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user?.avatar_url || "/placeholder.jpeg"} />
                    <AvatarFallback>
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">{user?.name || "User"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden border-b bg-background">
        <div className="container">
          <nav className="flex items-center gap-2 py-2 overflow-x-auto">
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                variant={pathname === item.path ? "secondary" : "ghost"}
                size="sm"
                onClick={() => router.push(item.path)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  )
}