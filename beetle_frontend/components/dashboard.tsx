"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Star,
  GitBranch,
  Users,
  Settings,
  User,
  Moon,
  Sun,
  Github,
  Calendar,
  Code,
  TrendingUp,
  Zap,
  Plus,
  Filter,
  MoreHorizontal,
  X,
  LogOut,
  Bell,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Folder,
  FileText,
  GitCommit,
  MessageSquare,
  Target,
  Sparkles,
  BarChart3,
  Globe,
  Shield,
  ChevronLeft,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContributionHeatmap } from "@/components/contribution-heatmap"
import { EnhancedSearch } from "@/components/enhanced-search"
import { SettingsPage } from "@/components/settings-page"
import { DashboardStats } from "@/components/dashboard-stats"
import { RepositoryDetailPage } from "@/components/repository-detail-page"
import { UserProfilePage } from "@/components/user-profile-page"
import { OrganizationProfilePage } from "@/components/organization-profile-page"
import { Progress } from "@/components/ui/progress"

interface DashboardProps {
  onSignOut: () => void
}

export default function Dashboard({ onSignOut }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentView, setCurrentView] = useState<"dashboard" | "repository" | "user" | "organization">("dashboard")
  const [selectedData, setSelectedData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [notifications, setNotifications] = useState(mockNotifications)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        document.getElementById("search-input")?.focus()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        document.getElementById("search-input")?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSearchResultSelect = (result: any) => {
    setSelectedData(result.data)
    setCurrentView(result.type)
  }

  const handleViewAllResults = (query: string, type?: string) => {
    console.log("View all results for:", query, type)
  }

  const handleBackToDashboard = () => {
    setCurrentView("dashboard")
    setSelectedData(null)
  }

  const handleSignOut = () => {
    onSignOut()
  }

  if (!mounted) return null

  // Render different views based on current state
  if (currentView === "repository" && selectedData) {
    return <RepositoryDetailPage repository={selectedData} onBack={handleBackToDashboard} />
  }

  if (currentView === "user" && selectedData) {
    return <UserProfilePage user={selectedData} onBack={handleBackToDashboard} />
  }

  if (currentView === "organization" && selectedData) {
    return <OrganizationProfilePage organization={selectedData} onBack={handleBackToDashboard} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Navigation */}
            <div className="flex items-center space-x-8">
              <motion.div
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold">Beetle</span>
              </motion.div>

              {/* Quick Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {[
                  { name: "Overview", id: "overview", icon: BarChart3 },
                  { name: "Projects", id: "projects", icon: Folder },
                  { name: "Activity", id: "activity", icon: Activity },
                  { name: "Insights", id: "insights", icon: TrendingUp },
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(item.id)}
                    className="flex items-center gap-2"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                ))}
              </nav>
            </div>

            {/* Enhanced Search */}
            <motion.div
              className="flex-1 max-w-2xl mx-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <EnhancedSearch onResultSelect={handleSearchResultSelect} onViewAllResults={handleViewAllResults} />
            </motion.div>

            {/* Actions & User Menu */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="w-4 h-4" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <div className="p-3 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification, index) => (
                      <div key={index} className="p-3 border-b last:border-b-0 hover:bg-muted/50">
                        <div className="flex items-start gap-3">
                          <notification.icon className="w-4 h-4 mt-1 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/placeholder.jpeg?height=36&width=36" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.jpeg?height=32&width=32" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Ryan</p>
                        <p className="text-xs text-muted-foreground">rawx18.dev@gmail.com</p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowSettings(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Welcome Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Good morning, Ryan 👋</h1>
                  <p className="text-muted-foreground mt-1">Here's what's happening with your projects today.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    All systems operational
                  </Badge>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                          <Badge variant={stat.trend > 0 ? "default" : "secondary"} className="text-xs">
                            {stat.trend > 0 ? "+" : ""}
                            {stat.trend}%
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold mb-1">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* AI Insights */}
              <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-orange-600/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    AI Insights
                  </CardTitle>
                  <CardDescription>Personalized recommendations based on your activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {aiInsights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                        <insight.icon className={`w-5 h-5 mt-0.5 ${insight.color}`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                          <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs">
                            {insight.action}
                            <ArrowUpRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity & Quick Actions */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Recent Activity
                        </CardTitle>
                        <Button variant="ghost" size="sm">
                          View all
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={activity.avatar || "/placeholder.jpeg"} />
                            <AvatarFallback>{activity.user[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{activity.user}</span>{" "}
                              <span className="text-muted-foreground">{activity.action}</span>{" "}
                              <span className="font-medium">{activity.target}</span>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {activity.repo}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{activity.time}</span>
                            </div>
                          </div>
                          <activity.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="w-full justify-start h-auto p-3"
                          onClick={action.onClick}
                        >
                          <action.icon className="w-4 h-4 mr-3" />
                          <div className="text-left">
                            <div className="font-medium text-sm">{action.title}</div>
                            <div className="text-xs text-muted-foreground">{action.description}</div>
                          </div>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Goals Progress */}
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Monthly Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {monthlyGoals.map((goal, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>{goal.title}</span>
                            <span className="font-medium">
                              {goal.current}/{goal.target}
                            </span>
                          </div>
                          <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "projects" && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Projects</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </div>

              {/* Trending Featured Projects */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <FeaturedProjectsCarousel />
              </motion.section>

              <Tabs defaultValue="starred" className="w-full">
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger value="starred" className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Starred Projects
                  </TabsTrigger>
                  <TabsTrigger value="my-projects" className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    My Projects
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="starred" className="mt-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {starredProjects.map((project, index) => (
                      <ProjectCard key={index} project={project} type="starred" />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="my-projects" className="mt-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myProjects.map((project, index) => (
                      <ProjectCard key={index} project={project} type="owned" />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Activity</h2>
              <ContributionHeatmap />
            </motion.div>
          )}

          {activeTab === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Insights</h2>
              <DashboardStats />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-background z-50 overflow-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-2xl font-bold">Settings</h1>
            <Button variant="ghost" onClick={() => setShowSettings(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <SettingsPage />
        </div>
      )}
    </div>
  )
}

function FeaturedProjectsCarousel() {
  const [currentProject, setCurrentProject] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProject((prev) => (prev + 1) % featuredProjects.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const nextProject = () => {
    setCurrentProject((prev) => (prev + 1) % featuredProjects.length)
  }

  const prevProject = () => {
    setCurrentProject((prev) => (prev - 1 + featuredProjects.length) % featuredProjects.length)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          Trending Featured Projects
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevProject}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextProject}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <motion.div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentProject * 100}%)` }}
        >
          {featuredProjects.map((project, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold mb-2">{project.name}</h4>
                          <p className="text-muted-foreground mb-4">{project.description}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on GitHub
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.languages.map((lang: string) => (
                          <Badge key={lang} variant="secondary">
                            {lang}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {project.stars}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="w-4 h-4" />
                          {project.forks}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {project.contributors}
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-80 p-6 bg-muted/30">
                      <h5 className="font-semibold mb-3">Recent Activity</h5>
                      <div className="space-y-3">
                        {project.recentActivity.map((activity: any, actIndex: number) => (
                          <div key={actIndex} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                            <div className="text-sm">
                              <span className="font-medium">{activity.user}</span>
                              <span className="text-muted-foreground"> {activity.action}</span>
                              <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {featuredProjects.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentProject === index ? "bg-orange-500" : "bg-muted-foreground/30"
            }`}
            onClick={() => setCurrentProject(index)}
          />
        ))}
      </div>
    </div>
  )
}

function ProjectCard({ project, type }: { project: any; type: "starred" | "owned" }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-orange-500 transition-colors">{project.name}</CardTitle>
              <CardDescription className="mt-2 line-clamp-2">{project.description}</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Zap className="w-4 h-4 mr-2" />
                  Open in Beetle
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Github className="w-4 h-4 mr-2" />
                  View on GitHub
                </DropdownMenuItem>
                {type === "owned" && (
                  <DropdownMenuItem>
                    <GitBranch className="w-4 h-4 mr-2" />
                    Preview Branches
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {project.languages.map((lang: string) => (
                <Badge key={lang} variant="secondary" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {project.stars}
                </div>
                <div className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {project.forks}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {project.updated}
              </div>
            </div>

            {type === "owned" && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Zap className="w-3 h-3 mr-1" />
                  Open
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Github className="w-3 h-3 mr-1" />
                  GitHub
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const featuredProjects = [
  {
    name: "vercel/next.js",
    description:
      "The React Framework for the Web. Used by some of the world's largest companies, Next.js enables you to create full-stack web applications.",
    languages: ["TypeScript", "React", "JavaScript"],
    stars: "120k",
    forks: "26k",
    contributors: "2.1k contributors",
    recentActivity: [
      { user: "timneutkens", action: "merged PR #58234", time: "2 hours ago" },
      { user: "shuding", action: "opened issue #58235", time: "4 hours ago" },
      { user: "ijjk", action: "released v14.0.4", time: "6 hours ago" },
      { user: "styfle", action: "commented on #58230", time: "8 hours ago" },
    ],
  },
  {
    name: "microsoft/vscode",
    description: "Visual Studio Code. Code editing. Redefined. Free. Built on open source. Runs everywhere.",
    languages: ["TypeScript", "JavaScript", "CSS"],
    stars: "155k",
    forks: "27k",
    contributors: "1.8k contributors",
    recentActivity: [
      { user: "bpasero", action: "merged PR #201234", time: "1 hour ago" },
      { user: "joaomoreno", action: "fixed issue #201235", time: "3 hours ago" },
      { user: "alexdima", action: "released v1.85.0", time: "5 hours ago" },
      { user: "mjbvz", action: "updated extension API", time: "7 hours ago" },
    ],
  },
  {
    name: "facebook/react",
    description:
      "The library for web and native user interfaces. React lets you build user interfaces out of individual pieces called components.",
    languages: ["JavaScript", "TypeScript", "Flow"],
    stars: "220k",
    forks: "45k",
    contributors: "1.5k contributors",
    recentActivity: [
      { user: "gaearon", action: "merged PR #28234", time: "3 hours ago" },
      { user: "sebmarkbage", action: "opened RFC #28235", time: "5 hours ago" },
      { user: "acdlite", action: "released v18.2.0", time: "1 day ago" },
      { user: "rickhanlonii", action: "updated docs", time: "2 days ago" },
    ],
  },
]

// Enhanced Mock Data
const quickStats = [
  { icon: GitCommit, label: "Commits Today", value: "12", trend: 15, color: "text-green-500" },
  { icon: GitBranch, label: "Active PRs", value: "3", trend: -5, color: "text-blue-500" },
  { icon: Star, label: "Stars Earned", value: "47", trend: 23, color: "text-yellow-500" },
  { icon: Users, label: "Collaborators", value: "8", trend: 12, color: "text-purple-500" },
]

const aiInsights = [
  {
    icon: Shield,
    title: "Security Alert",
    description: "Update lodash dependency in 3 repositories to fix vulnerability",
    action: "Review & Fix",
    color: "text-red-500",
  },
  {
    icon: TrendingUp,
    title: "Performance Opportunity",
    description: "Consider implementing lazy loading in your React components",
    action: "Learn More",
    color: "text-blue-500",
  },
  {
    icon: MessageSquare,
    title: "Code Review Needed",
    description: "2 pull requests are waiting for your review",
    action: "Review Now",
    color: "text-orange-500",
  },
  {
    icon: Sparkles,
    title: "Best Practice",
    description: "Add TypeScript to improve code quality in 2 projects",
    action: "Get Started",
    color: "text-purple-500",
  },
]

const recentActivity = [
  {
    user: "You",
    action: "merged pull request",
    target: "#247",
    repo: "my-awesome-app",
    time: "2 hours ago",
    avatar: "/placeholder.jpeg?height=32&width=32",
    icon: GitBranch,
  },
  {
    user: "Gaurav",
    action: "opened issue",
    target: "#45",
    repo: "ui-components",
    time: "4 hours ago",
    avatar: "/placeholder.jpeg?height=32&width=32",
    icon: MessageSquare,
  },
  {
    user: "You",
    action: "starred",
    target: "microsoft/vscode",
    repo: "vscode",
    time: "6 hours ago",
    avatar: "/placeholder.jpeg?height=32&width=32",
    icon: Star,
  },
  {
    user: "Neil",
    action: "commented on",
    target: "PR #123",
    repo: "api-service",
    time: "8 hours ago",
    avatar: "/placeholder.jpeg?height=32&width=32",
    icon: MessageSquare,
  },
]

const quickActions = [
  {
    icon: Plus,
    title: "Create Repository",
    description: "Start a new project",
    onClick: () => console.log("Create repo"),
  },
  {
    icon: GitBranch,
    title: "New Pull Request",
    description: "Propose changes",
    onClick: () => console.log("New PR"),
  },
  {
    icon: FileText,
    title: "Create Issue",
    description: "Report a bug or request",
    onClick: () => console.log("New issue"),
  },
  {
    icon: Globe,
    title: "Deploy Project",
    description: "Ship to production",
    onClick: () => console.log("Deploy"),
  },
]

const monthlyGoals = [
  { title: "Commits", current: 47, target: 60 },
  { title: "PRs Merged", current: 8, target: 12 },
  { title: "Issues Closed", current: 15, target: 20 },
]

const mockNotifications = [
  {
    icon: GitBranch,
    title: "PR Review Request",
    message: "Gaurav requested your review on PR #247",
    time: "5 minutes ago",
  },
  {
    icon: Star,
    title: "Repository Starred",
    message: "Your repository 'awesome-ui' received 5 new stars",
    time: "1 hour ago",
  },
  {
    icon: Shield,
    title: "Security Alert",
    message: "Vulnerability detected in lodash dependency",
    time: "2 hours ago",
  },
]

const starredProjects = [
  {
    name: "vercel/next.js",
    description: "The React Framework for the Web",
    languages: ["TypeScript", "JavaScript", "CSS"],
    stars: "120k",
    forks: "26k",
    updated: "2h ago",
  },
  {
    name: "facebook/react",
    description: "The library for web and native user interfaces",
    languages: ["JavaScript", "TypeScript"],
    stars: "220k",
    forks: "45k",
    updated: "4h ago",
  },
  {
    name: "microsoft/vscode",
    description: "Visual Studio Code",
    languages: ["TypeScript", "JavaScript"],
    stars: "155k",
    forks: "27k",
    updated: "1d ago",
  },
]

const myProjects = [
  {
    name: "my-awesome-app",
    description: "A full-stack web application built with Next.js",
    languages: ["TypeScript", "React", "Tailwind"],
    stars: "42",
    forks: "8",
    updated: "1h ago",
  },
  {
    name: "ui-component-library",
    description: "Reusable React components with TypeScript",
    languages: ["TypeScript", "React", "Storybook"],
    stars: "18",
    forks: "3",
    updated: "2d ago",
  },
  {
    name: "api-service",
    description: "RESTful API service with Node.js and Express",
    languages: ["Node.js", "Express", "MongoDB"],
    stars: "7",
    forks: "2",
    updated: "1w ago",
  },
]
