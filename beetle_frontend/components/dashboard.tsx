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
  RefreshCw,
  Play,
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
import { useGitHubData } from "@/hooks/useGitHubData"
import { useAuth } from "@/contexts/AuthContext"

// Mock data definitions
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
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "activity" | "insights">("overview")
  const [notifications, setNotifications] = useState(mockNotifications)
  
  // Use real GitHub data and auth
  const {
    loading: dataLoading,
    error: dataError,
    repositories,
    recentCommits,
    openPRs,
    openIssues,
    userActivity,
    dashboardStats,
    quickStats,
    refreshData,
  } = useGitHubData()
  
  const { user, isAuthenticated, login, loginDemo, enableAutoDemo, disableAutoDemo } = useAuth()

  // Handle tab switching with better state management
  const [debouncedActiveTab, setDebouncedActiveTab] = useState(activeTab);
  
  useEffect(() => {
    // Debounce tab switching to prevent rapid changes
    const timer = setTimeout(() => {
      setDebouncedActiveTab(activeTab);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return "Developer"
    return user.name || user.login || "Developer"
  }

  // Quick action handlers
  const handleCreateRepository = () => {
    window.open('https://github.com/new', '_blank')
  }

  const handleNewPullRequest = () => {
    if (repositories.length > 0) {
      const repo = repositories[0]
      window.open(`https://github.com/${repo.full_name}/compare`, '_blank')
    } else {
      window.open('https://github.com', '_blank')
    }
  }

  const handleCreateIssue = () => {
    if (repositories.length > 0) {
      const repo = repositories[0]
      window.open(`https://github.com/${repo.full_name}/issues/new`, '_blank')
    } else {
      window.open('https://github.com', '_blank')
    }
  }

  const handleDeployProject = () => {
    // This would typically open a deployment modal or redirect to deployment service
    console.log('Deploy project - would open deployment options')
    // For now, just show an alert
    alert('Deploy functionality would open deployment options for your projects')
  }

  // Helper function to get relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  }

  // Navigation items for the four main sections
  const navigationItems = [
    {
      id: "overview",
      name: "Overview",
      icon: BarChart3,
      description: "Dashboard overview and key metrics"
    },
    {
      id: "projects",
      name: "Projects",
      icon: Folder,
      description: "Your repositories and projects"
    },
    {
      id: "activity",
      name: "Activity",
      icon: Activity,
      description: "Recent activity and contributions"
    },
    {
      id: "insights",
      name: "Insights",
      icon: TrendingUp,
      description: "Analytics and performance insights"
    }
  ];

  // Quick actions configuration
  const quickActions = [
    {
      icon: Plus,
      title: "Create Repository",
      description: "Start a new project",
      onClick: handleCreateRepository,
    },
    {
      icon: GitBranch,
      title: "New Pull Request",
      description: "Propose changes",
      onClick: handleNewPullRequest,
    },
    {
      icon: FileText,
      title: "Create Issue",
      description: "Report a bug or request",
      onClick: handleCreateIssue,
    },
    {
      icon: Globe,
      title: "Deploy Project",
      description: "Ship to production",
      onClick: handleDeployProject,
    },
  ]

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

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto">
            <Code className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Beetle</h1>
            <p className="text-muted-foreground mb-6">Connect your GitHub account to get started</p>
          </div>
          
          {/* GitHub OAuth Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🔗 Real GitHub Integration</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Connect your GitHub account to see your real repositories, commits, pull requests, and activity.
            </p>
            <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <p>✅ View your actual repositories and stats</p>
              <p>✅ See real-time activity and contributions</p>
              <p>✅ Access your pull requests and issues</p>
              <p>✅ Track your GitHub analytics</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={login} 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white w-full"
            >
              <Github className="w-5 h-5 mr-2" />
              Connect with GitHub
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button 
              onClick={loginDemo} 
              size="lg" 
              variant="outline"
              className="w-full"
            >
              <Code className="w-5 h-5 mr-2" />
              Try Demo Mode
            </Button>
            
            {/* Development Mode Toggle */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">🔧 Development Mode</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Enable auto-login with demo mode for development and testing.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={enableAutoDemo} 
                    size="sm" 
                    variant="outline"
                    className="w-full text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                  >
                    Enable Auto Demo Mode
                  </Button>
                  <Button 
                    onClick={disableAutoDemo} 
                    size="sm" 
                    variant="outline"
                    className="w-full text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                  >
                    Disable Auto Demo Mode
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground space-y-2">
            <p>💡 <strong>GitHub OAuth:</strong> You'll be redirected to GitHub to authorize access to your repositories and activity.</p>
            <p>🎯 <strong>Demo Mode:</strong> Explore the app with realistic sample data for testing and demonstration.</p>
            {process.env.NODE_ENV === 'development' && (
              <p>🔧 <strong>Development:</strong> Use the buttons above to enable auto demo mode for testing.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

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
    <div className="min-h-screen bg-background relative">
      {dataLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Loading dashboard data...</span>
          </div>
        </div>
      )}
      {/* Error Banner */}
      {dataError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg relative mb-6 max-w-4xl mx-auto mt-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Unable to fetch GitHub data
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{dataError}</p>
                {dataError.includes('Authentication required') && (
                  <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-md">
                    <p className="font-medium mb-2">To fix this:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Click "Connect with GitHub" to authorize access to your repositories</li>
                      <li>• Or use "Try Demo Mode" to explore with sample data</li>
                      <li>• Make sure you're logged into GitHub in your browser</li>
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={login}
                        className="text-xs"
                      >
                        <Github className="w-3 h-3 mr-1" />
                        Connect with GitHub
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={loginDemo}
                        className="text-xs"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Try Demo Mode
                      </Button>
                    </div>
                  </div>
                )}
                {(dataError.includes('Failed to fetch') || dataError.includes('Backend server is not accessible')) && (
                  <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-md">
                    <p className="font-medium mb-2">Possible solutions:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Check your internet connection</li>
                      <li>• Try refreshing the page</li>
                      <li>• Use demo mode if the issue persists</li>
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={refreshData}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          localStorage.setItem('beetle_token', 'demo-token');
                          localStorage.setItem('isAuthenticated', 'true');
                          window.location.reload();
                        }}
                        className="text-xs"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Switch to Demo Mode
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
                    onClick={() => setActiveTab(item.id as "overview" | "projects" | "activity" | "insights")}
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
                      <AvatarImage src={user?.avatar_url || "/placeholder.jpeg?height=36&width=36"} alt="User" />
                      <AvatarFallback>{user?.login?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar_url || "/placeholder.jpeg?height=32&width=32"} />
                        <AvatarFallback>{user?.login?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{getUserDisplayName()}</p>
                        <p className="text-xs text-muted-foreground">{user?.email || user?.login || "user@example.com"}</p>
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
          {debouncedActiveTab === "overview" && (
            <motion.div
              key={`overview-${dataLoading ? 'loading' : 'loaded'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Welcome Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{getGreeting()}, {getUserDisplayName()} 👋</h1>
                  <p className="text-muted-foreground mt-1">Here's what's happening with your projects today.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={refreshData}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                  <Badge variant="outline" className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    All systems operational
                  </Badge>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: GitCommit, label: "Commits Today", value: quickStats.commitsToday.toString(), color: "text-green-500" },
                  { icon: GitBranch, label: "Active PRs", value: quickStats.activePRs.toString(), color: "text-blue-500" },
                  { icon: Star, label: "Stars Earned", value: quickStats.starsEarned.toString(), color: "text-yellow-500" },
                  { icon: Users, label: "Collaborators", value: quickStats.collaborators.toString(), color: "text-purple-500" },
                ].map((stat, index) => (
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
                      {dataLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                        </div>
                      ) : userActivity.length > 0 ? (
                        userActivity.slice(0, 20).map((activity, index) => {
                          const getActivityIcon = (type: string) => {
                            switch (type) {
                              case 'PushEvent': return GitCommit;
                              case 'PullRequestEvent': return GitBranch;
                              case 'IssuesEvent': return FileText;
                              case 'CreateEvent': return Plus;
                              case 'ForkEvent': return GitBranch;
                              case 'WatchEvent': return Star;
                              case 'DeleteEvent': return X;
                              case 'GollumEvent': return FileText;
                              case 'CommitCommentEvent': return MessageSquare;
                              case 'IssueCommentEvent': return MessageSquare;
                              case 'PullRequestReviewEvent': return GitBranch;
                              default: return Activity;
                            }
                          };
                          
                          const getActivityDescription = (type: string, payload: any) => {
                            switch (type) {
                              case 'PushEvent':
                                const commitCount = payload.commits?.length || 0;
                                return `pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''}`;
                              case 'PullRequestEvent':
                                if (payload.action === 'opened') return 'opened pull request';
                                if (payload.action === 'closed') return payload.pull_request?.merged ? 'merged pull request' : 'closed pull request';
                                if (payload.action === 'reopened') return 'reopened pull request';
                                return 'updated pull request';
                              case 'IssuesEvent':
                                if (payload.action === 'opened') return 'opened issue';
                                if (payload.action === 'closed') return 'closed issue';
                                if (payload.action === 'reopened') return 'reopened issue';
                                return 'updated issue';
                              case 'CreateEvent':
                                if (payload.ref_type === 'repository') return 'created repository';
                                if (payload.ref_type === 'branch') return 'created branch';
                                if (payload.ref_type === 'tag') return 'created tag';
                                return `created ${payload.ref_type}`;
                              case 'ForkEvent':
                                return 'forked repository';
                              case 'WatchEvent':
                                return 'starred repository';
                              case 'DeleteEvent':
                                return `deleted ${payload.ref_type}`;
                              case 'GollumEvent':
                                return 'updated wiki';
                              case 'CommitCommentEvent':
                                return 'commented on commit';
                              case 'IssueCommentEvent':
                                return 'commented on issue';
                              case 'PullRequestReviewEvent':
                                return 'reviewed pull request';
                              default:
                                return type.replace('Event', '').toLowerCase();
                            }
                          };

                          const IconComponent = getActivityIcon(activity.type);
                          
                          return (
                            <div
                              key={activity.id}
                              className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={activity.actor.avatar_url} />
                                <AvatarFallback>{activity.actor.login[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">
                                  <span className="font-medium">{activity.actor.login}</span>{" "}
                                  <span className="text-muted-foreground">
                                    {getActivityDescription(activity.type, activity.payload)}
                                  </span>{" "}
                                  <span className="font-medium">{activity.repo.name}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {activity.repo.name}
                                  </Badge>
                                                                  <span className="text-xs text-muted-foreground">
                                  {getRelativeTime(activity.created_at)}
                                </span>
                                </div>
                              </div>
                              <IconComponent className="w-4 h-4 text-muted-foreground" />
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No recent activity
                        </div>
                      )}
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
                      {[
                        { 
                          title: "Repositories", 
                          current: dashboardStats.totalRepos, 
                          target: Math.max(dashboardStats.totalRepos + 5, 10),
                          description: "Your repositories"
                        },
                        { 
                          title: "Commits", 
                          current: dashboardStats.totalCommits, 
                          target: Math.max(dashboardStats.totalCommits + 10, 20),
                          description: "Commits across all projects"
                        },
                        { 
                          title: "Pull Requests", 
                          current: dashboardStats.totalPRs, 
                          target: Math.max(dashboardStats.totalPRs + 3, 5),
                          description: "PRs created or merged"
                        },
                      ].map((goal, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium">{goal.title}</span>
                              <p className="text-xs text-muted-foreground">{goal.description}</p>
                            </div>
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

              <Tabs defaultValue="my-projects" className="w-full">
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger value="my-projects" className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    My Repositories
                  </TabsTrigger>
                  <TabsTrigger value="starred" className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Starred Projects
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="my-projects" className="mt-6">
                  {dataLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  ) : dataError ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Error loading repositories: {dataError}
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {repositories.map((repo) => (
                        <ProjectCard 
                          key={repo.id} 
                          project={{
                            name: repo.full_name,
                            description: repo.description || 'No description available',
                            languages: [repo.language].filter(Boolean),
                            stars: repo.stargazers_count.toString(),
                            forks: repo.forks_count.toString(),
                            updated: new Date(repo.updated_at).toLocaleDateString(),
                          }} 
                          type="owned" 
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="starred" className="mt-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {starredProjects.map((project, index) => (
                      <ProjectCard key={index} project={project} type="starred" />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}



                      {debouncedActiveTab === "projects" && (
              <motion.div
                key={`projects-${dataLoading ? 'loading' : 'loaded'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
              {/* Projects Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Your Projects</h1>
                  <p className="text-muted-foreground mt-1">
                    {repositories.length} repositories • {repositories.filter(r => !r.private).length} public, {repositories.filter(r => r.private).length} private
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={refreshData}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={handleCreateRepository} className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>New Repository</span>
                  </Button>
                </div>
              </div>

              {/* Repository Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repositories.map((repo, index) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">
                              <a
                                href={repo.html_url || `https://github.com/${repo.full_name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-colors"
                              >
                                {repo.name}
                              </a>
                            </CardTitle>
                            <CardDescription className="truncate">
                              {repo.full_name}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {repo.private && (
                              <Badge variant="secondary" className="text-xs">
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Description */}
                        {repo.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {repo.description}
                          </p>
                        )}

                        {/* Language */}
                        {repo.language && (
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-sm text-muted-foreground">{repo.language}</span>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>{repo.stargazers_count}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <GitBranch className="h-4 w-4 text-blue-500" />
                              <span>{repo.forks_count}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{getRelativeTime(repo.updated_at)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <a href={repo.html_url || `https://github.com/${repo.full_name}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`${repo.html_url || `https://github.com/${repo.full_name}`}/issues`} target="_blank" rel="noopener noreferrer">
                              <MessageSquare className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`${repo.html_url || `https://github.com/${repo.full_name}`}/pulls`} target="_blank" rel="noopener noreferrer">
                              <GitBranch className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Empty State */}
              {repositories.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="flex flex-col items-center space-y-4">
                      <Code className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold">No repositories found</h3>
                        <p className="text-muted-foreground">
                          Get started by creating your first repository
                        </p>
                      </div>
                      <Button onClick={handleCreateRepository}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Repository
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {debouncedActiveTab === "activity" && (
            <motion.div
              key={`activity-${dataLoading ? 'loading' : 'loaded'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Activity Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Activity</h1>
                  <p className="text-muted-foreground mt-1">
                    Recent activity across your repositories
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshData}>
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Activity Tabs */}
              <Tabs defaultValue="commits" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="commits">Commits</TabsTrigger>
                  <TabsTrigger value="prs">Pull Requests</TabsTrigger>
                  <TabsTrigger value="issues">Issues</TabsTrigger>
                  <TabsTrigger value="activity">User Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="commits" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <GitCommit className="h-5 w-5" />
                        <span>Recent Commits</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {recentCommits.slice(0, 10).map((commit) => (
                        <div key={commit.sha} className="flex items-center space-x-3 p-3 rounded-lg border">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={commit.author?.avatar_url} alt={commit.author?.login} />
                            <AvatarFallback>{commit.author?.login?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {commit.commit.message.split('\n')[0]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {commit.author?.login} • {getRelativeTime(commit.commit.author.date)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {commit.sha.substring(0, 7)}
                          </Badge>
                        </div>
                      ))}
                      {recentCommits.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No recent commits found
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="prs" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <GitBranch className="h-5 w-5" />
                        <span>Pull Requests</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {openPRs.slice(0, 10).map((pr) => (
                        <div key={pr.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                          <div className="flex items-center space-x-2">
                            <GitBranch className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">#{pr.number}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{pr.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {pr.user.login} • {getRelativeTime(pr.created_at)}
                            </p>
                          </div>
                          <Badge variant={pr.state === 'open' ? 'default' : 'secondary'}>
                            {pr.state}
                          </Badge>
                        </div>
                      ))}
                      {openPRs.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No pull requests found
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="issues" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="h-5 w-5" />
                        <span>Issues</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {openIssues.slice(0, 10).map((issue) => (
                        <div key={issue.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">#{issue.number}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{issue.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {issue.user.login} • {getRelativeTime(issue.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {issue.labels.slice(0, 2).map((label) => (
                              <Badge key={label.name} variant="outline" className="text-xs">
                                {label.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                      {openIssues.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No issues found
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5" />
                        <span>User Activity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {userActivity.slice(0, 10).map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                          <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4 text-gray-500" />
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={activity.actor?.avatar_url} alt={activity.actor?.login} />
                            <AvatarFallback>{activity.actor?.login?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {activity.type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.repo?.name} • {getRelativeTime(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {userActivity.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No user activity found
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {debouncedActiveTab === "insights" && (
            <motion.div
              key={`insights-${dataLoading ? 'loading' : 'loaded'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Insights Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Insights & Analytics</h1>
                  <p className="text-muted-foreground mt-1">
                    Performance metrics and recommendations
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshData}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Repositories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalRepos}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {repositories.filter(r => !r.private).length} public, {repositories.filter(r => r.private).length} private
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Stars</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalStars}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Across all repositories
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Forks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalForks}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Repository forks
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active PRs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{openPRs.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Open pull requests
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Language Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Language Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const languages = repositories
                        .filter(r => r.language)
                        .reduce((acc, repo) => {
                          acc[repo.language] = (acc[repo.language] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);
                      
                      const sortedLanguages = Object.entries(languages)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 8);
                      
                      return sortedLanguages.map(([lang, count]) => (
                        <div key={lang} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-medium">{lang}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ));
                    })()}
                  </div>
                  {repositories.filter(r => r.language).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No language data available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <GitCommit className="h-5 w-5" />
                      <span>Recent Commits</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentCommits.slice(0, 5).map((commit) => (
                        <div key={commit.sha} className="flex items-center space-x-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={commit.author?.avatar_url} alt={commit.author?.login} />
                            <AvatarFallback className="text-xs">{commit.author?.login?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              {commit.commit.message.split('\n')[0]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getRelativeTime(commit.commit.author.date)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {recentCommits.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No recent commits
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Open Issues</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {openIssues.slice(0, 5).map((issue) => (
                        <div key={issue.id} className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">#{issue.number}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{issue.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {getRelativeTime(issue.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {openIssues.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No open issues
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Recommendations */}
              <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-orange-600/5">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    <span>AI Recommendations</span>
                  </CardTitle>
                  <CardDescription>
                    Personalized suggestions based on your GitHub activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      {
                        icon: GitBranch,
                        title: "Review Open PRs",
                        description: `You have ${openPRs.length} open pull requests that need attention`,
                        action: "Review Now",
                        color: "text-blue-500"
                      },
                      {
                        icon: MessageSquare,
                        title: "Address Issues",
                        description: `There are ${openIssues.length} open issues across your repositories`,
                        action: "View Issues",
                        color: "text-green-500"
                      },
                      {
                        icon: Star,
                        title: "Popular Repositories",
                        description: "Your repositories have gained significant attention",
                        action: "View Analytics",
                        color: "text-yellow-500"
                      },
                      {
                        icon: Activity,
                        title: "Activity Streak",
                        description: "Maintain your development momentum",
                        action: "Track Progress",
                        color: "text-purple-500"
                      }
                    ].map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-background/50 rounded-lg">
                        <recommendation.icon className={`h-5 w-5 mt-0.5 ${recommendation.color}`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{recommendation.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{recommendation.description}</p>
                          <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs">
                            {recommendation.action}
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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



const monthlyGoals = [
  { title: "Commits", current: 47, target: 60 },
  { title: "PRs Merged", current: 8, target: 12 },
  { title: "Issues Closed", current: 15, target: 20 },
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
