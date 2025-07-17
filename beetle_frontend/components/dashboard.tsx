"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
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
  Check,
  Edit,
  Trash2,
  HelpCircle,
  Heart,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

// Mock data definitions
const mockNotifications = [
  {
    icon: GitBranch,
    title: "PR Review Request",
    message: "Gaurav requested your review on PR #247",
    time: "5 minutes ago",
    read: false,
    type: "pr"
  },
  {
    icon: Star,
    title: "Repository Starred",
    message: "Your repository 'awesome-ui' received 5 new stars",
    time: "1 hour ago",
    read: false,
    type: "star"
  },
  {
    icon: Shield,
    title: "Security Alert",
    message: "Vulnerability detected in lodash dependency",
    time: "2 hours ago",
    read: false,
    type: "security"
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
  const [notifications, setNotifications] = useState<any[]>([])
  
  // New states for editable features
  const [editableUsername, setEditableUsername] = useState("GitHub User")
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [showProjectSelector, setShowProjectSelector] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [projectSearchQuery, setProjectSearchQuery] = useState("")
  
  // Project filtering and creation states
  const [showProjectFilter, setShowProjectFilter] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [projectFilter, setProjectFilter] = useState({
    language: 'all',
    sortBy: 'updated',
    visibility: 'all'
  })
  
  // Editable monthly goals
  const [monthlyGoals, setMonthlyGoals] = useState([
    { 
      id: 1,
      title: "Repositories", 
      current: 0, 
      target: 10,
      description: "Your repositories",
      type: "repositories"
    },
    { 
      id: 2,
      title: "Commits", 
      current: 0, 
      target: 20,
      description: "Commits across all projects",
      type: "commits"
    },
    { 
      id: 3,
      title: "Pull Requests", 
      current: 0, 
      target: 5,
      description: "PRs created or merged",
      type: "prs"
    },
  ])
  const [isEditingGoals, setIsEditingGoals] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: "", target: 0, description: "", type: "custom" })
  
  // Replace showMore states with counts
  const PROJECTS_BATCH = 6;
  const ACTIVITY_BATCH = 8;
  const COMMITS_BATCH = 8;
  const PRS_BATCH = 8;
  const ISSUES_BATCH = 8;
  const USER_ACTIVITY_BATCH = 8;

  const [shownProjectsCount, setShownProjectsCount] = useState(PROJECTS_BATCH);
  const [shownActivityCount, setShownActivityCount] = useState(ACTIVITY_BATCH);
  const [shownCommitsCount, setShownCommitsCount] = useState(COMMITS_BATCH);
  const [shownPRsCount, setShownPRsCount] = useState(PRS_BATCH);
  const [shownIssuesCount, setShownIssuesCount] = useState(ISSUES_BATCH);
  const [shownUserActivityCount, setShownUserActivityCount] = useState(USER_ACTIVITY_BATCH);
  
  // Smooth refresh states
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshingStats, setRefreshingStats] = useState({
    commits: false,
    prs: false,
    issues: false,
    activity: false,
    repositories: false
  })
  
  // Notification and profile management states
  const [unreadNotifications, setUnreadNotifications] = useState(notifications.length)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)


  
  // Use real GitHub data and auth
  const {
    loading: dataLoading,
    updating,
    error: dataError,
    repositories,
    starredRepositories,
    trendingRepositories,
    recentCommits,
    openPRs,
    openIssues,
    userActivity,
    dashboardStats,
    quickStats,
    lastUpdated,
    refreshData,
  } = useGitHubData()
  
  // Debug logging
  useEffect(() => {
    console.log('Dashboard data:', {
      repositories: repositories.length,
      starredRepositories: starredRepositories.length,
      trendingRepositories: trendingRepositories.length,
      dataLoading,
      dataError
    });
  }, [repositories, starredRepositories, trendingRepositories, dataLoading, dataError]);
  
  const { user, isAuthenticated, login, loginDemo, enableAutoDemo, disableAutoDemo, forceLogout, token } = useAuth()

  // Initialize editable username when user data is available
  useEffect(() => {
    if (user?.login) {
      setEditableUsername(user.login)
    }
  }, [user])

  // Update monthly goals with real data
  useEffect(() => {
    setMonthlyGoals(prev => prev.map(goal => {
      switch (goal.type) {
        case "repositories":
          return { ...goal, current: dashboardStats.totalRepos }
        case "commits":
          return { ...goal, current: dashboardStats.totalCommits }
        case "prs":
          return { ...goal, current: dashboardStats.totalPRs }
        default:
          return goal
      }
    }))
  }, [dashboardStats])

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
    setSelectedAction('pull-request')
    setShowProjectSelector(true)
  }

  const handleCreateIssue = () => {
    setSelectedAction('issue')
    setShowProjectSelector(true)
  }

  const handleDeployProject = () => {
    setSelectedAction('deploy')
    setShowProjectSelector(true)
  }

  const handleProjectFilter = () => {
    setShowProjectFilter(!showProjectFilter)
  }

  const handleNewProject = () => {
    setShowNewProjectModal(true)
  }

  // Filter repositories based on selected filters
  const getFilteredRepositories = (repos: any[]) => {
    return repos.filter(repo => {
      // Language filter
      if (projectFilter.language !== 'all' && repo.language !== projectFilter.language) {
        return false;
      }
      
      // Visibility filter
      if (projectFilter.visibility !== 'all') {
        const isPublic = !repo.private;
        if (projectFilter.visibility === 'public' && !isPublic) return false;
        if (projectFilter.visibility === 'private' && isPublic) return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by selected criteria
      switch (projectFilter.sortBy) {
        case 'stars':
          return b.stargazers_count - a.stargazers_count;
        case 'forks':
          return b.forks_count - a.forks_count;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  };

  // Generate real contribution data from user activity
  const generateContributionData = () => {
    const contributionMap = new Map<string, number>();
    
    // Initialize last 365 days with 0 contributions
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      contributionMap.set(dateKey, 0);
    }

    // Count contributions from user activity
    userActivity.forEach(activity => {
      const activityDate = new Date(activity.created_at).toISOString().split('T')[0];
      const currentCount = contributionMap.get(activityDate) || 0;
      contributionMap.set(activityDate, currentCount + 1);
    });

    // Count contributions from commits
    recentCommits.forEach(commit => {
      const commitDate = new Date(commit.commit.author.date).toISOString().split('T')[0];
      const currentCount = contributionMap.get(commitDate) || 0;
      contributionMap.set(commitDate, currentCount + 1);
    });

    // Convert to array format expected by ContributionHeatmap
    const sortedDates = Array.from(contributionMap.keys()).sort();
    return sortedDates.map((dateKey, index) => ({
      day: index,
      contributions: contributionMap.get(dateKey) || 0,
      date: new Date(dateKey)
    }));
  };



  // New handlers for editable features
  const handleUsernameEdit = () => {
    setIsEditingUsername(true)
  }

  const handleUsernameSave = () => {
    setIsEditingUsername(false)
    // Here you could save to backend/localStorage
    localStorage.setItem('customUsername', editableUsername)
  }

  const handleUsernameCancel = () => {
    setEditableUsername(user?.login || "GitHub User")
    setIsEditingUsername(false)
  }

  const handleGoalEdit = () => {
    setIsEditingGoals(true)
  }

  const handleGoalSave = () => {
    setIsEditingGoals(false)
    // Save goals to localStorage
    localStorage.setItem('monthlyGoals', JSON.stringify(monthlyGoals))
  }

  const handleGoalCancel = () => {
    setIsEditingGoals(false)
    // Reset to original values
    setMonthlyGoals(prev => prev.map(goal => {
      switch (goal.type) {
        case "repositories":
          return { ...goal, current: dashboardStats.totalRepos }
        case "commits":
          return { ...goal, current: dashboardStats.totalCommits }
        case "prs":
          return { ...goal, current: dashboardStats.totalPRs }
        default:
          return goal
      }
    }))
  }

  const addNewGoal = () => {
    if (newGoal.title && newGoal.target > 0) {
      setMonthlyGoals(prev => [...prev, {
        id: Date.now(),
        title: newGoal.title,
        current: 0,
        target: newGoal.target,
        description: newGoal.description,
        type: "custom"
      }])
      setNewGoal({ title: "", target: 0, description: "", type: "custom" })
    }
  }

  const removeGoal = (id: number) => {
    setMonthlyGoals(prev => prev.filter(goal => goal.id !== id))
  }

  const updateGoalTarget = (id: number, newTarget: number) => {
    setMonthlyGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, target: newTarget } : goal
    ))
  }

  const handleProjectSelect = (repo: any) => {
    setSelectedProject(repo.full_name)
    setShowProjectSelector(false)
    
    // Execute the selected action
    switch (selectedAction) {
      case 'pull-request':
        window.open(`https://github.com/${repo.full_name}/compare`, '_blank')
        break
      case 'issue':
        window.open(`https://github.com/${repo.full_name}/issues/new`, '_blank')
        break
      case 'deploy':
        handleVercelDeploy(repo)
        break
    }
    
    setSelectedAction(null)
  }

  const handleVercelDeploy = async (repo: any) => {
    try {
      // Check if it's user's own repo or forked
      const isOwnRepo = repo.owner.login === user?.login
      
      if (isOwnRepo) {
        // Deploy original repo
        window.open(`https://vercel.com/new/git/external?repository-url=https://github.com/${repo.full_name}`, '_blank')
      } else {
        // Fork and deploy
        const forkUrl = `https://github.com/${repo.full_name}/fork`
        window.open(forkUrl, '_blank')
        
        // Show instructions for forked deployment
        setTimeout(() => {
          alert(`Repository forked! Now you can deploy your fork at: https://vercel.com/new/git/external?repository-url=https://github.com/${user?.login}/${repo.name}`)
        }, 2000)
      }
    } catch (error) {
      console.error('Deployment error:', error)
      alert('Failed to initiate deployment. Please try manually.')
    }
  }

  // Notification management functions
  const markNotificationAsRead = (index: number) => {
    setNotifications(prev => prev.map((notif, i) => 
      i === index ? { ...notif, read: true } : notif
    ))
    setUnreadNotifications(prev => Math.max(0, prev - 1))
  }





  // Profile and settings functions
  const handleProfileClick = () => {
    // Navigate to user profile or open profile modal
    setCurrentView("user")
    setSelectedData(user)
    setShowProfileMenu(false)
  }

  const handleSettingsClick = () => {
    setShowSettings(true)
    setShowProfileMenu(false)
  }

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }



  // Generate dynamic notifications based on real GitHub data
  const generateDynamicNotifications = useCallback(() => {
    const dynamicNotifications = [];

    // Add PR review requests if there are open PRs
    if (openPRs.length > 0) {
      const recentPR = openPRs[0];
      dynamicNotifications.push({
        icon: GitBranch,
        title: "PR Review Request",
        message: `${recentPR.user.login} opened PR #${recentPR.number}`,
        time: getRelativeTime(recentPR.created_at),
        read: false,
        type: "pr"
      });
    }

    // Add repository starred notifications
    if (starredRepositories.length > 0) {
      const recentStarred = starredRepositories[0];
      dynamicNotifications.push({
        icon: Star,
        title: "Repository Starred",
        message: `You starred ${recentStarred.full_name}`,
        time: getRelativeTime(recentStarred.updated_at),
        read: false,
        type: "star"
      });
    }

    // Add commit notifications
    if (recentCommits.length > 0) {
      const recentCommit = recentCommits[0];
      dynamicNotifications.push({
        icon: GitCommit,
        title: "New Commit",
        message: `Commit: ${recentCommit.commit.message.split('\n')[0].substring(0, 50)}...`,
        time: getRelativeTime(recentCommit.commit.author.date),
        read: false,
        type: "commit"
      });
    }

    // Add issue notifications
    if (openIssues.length > 0) {
      const recentIssue = openIssues[0];
      dynamicNotifications.push({
        icon: MessageSquare,
        title: "New Issue",
        message: `Issue #${recentIssue.number}: ${recentIssue.title.substring(0, 50)}...`,
        time: getRelativeTime(recentIssue.created_at),
        read: false,
        type: "issue"
      });
    }

    // Add activity notifications
    if (userActivity.length > 0) {
      const recentActivity = userActivity[0];
      dynamicNotifications.push({
        icon: Activity,
        title: "Recent Activity",
        message: `${recentActivity.type} in ${recentActivity.repo.name}`,
        time: getRelativeTime(recentActivity.created_at),
        read: false,
        type: "activity"
      });
    }

    // Fallback to mock notifications if no real data
    if (dynamicNotifications.length === 0) {
      return mockNotifications;
    }

    return dynamicNotifications.slice(0, 5); // Limit to 5 notifications
  }, [openPRs, starredRepositories, recentCommits, openIssues, userActivity]);

  // Initialize notifications with dynamic data
  useEffect(() => {
    if (!dataLoading && (repositories.length > 0 || recentCommits.length > 0 || openPRs.length > 0)) {
      const initialNotifications = generateDynamicNotifications()
      setNotifications(initialNotifications)
      setUnreadNotifications(initialNotifications.length)
    }
  }, [dataLoading, repositories, recentCommits, openPRs, generateDynamicNotifications])

  // Update notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newNotifications = generateDynamicNotifications()
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev.slice(0, 3)])
        setUnreadNotifications(prev => prev + newNotifications.length)
      }
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [generateDynamicNotifications])

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(projectSearchQuery.toLowerCase())
  )



  // Smooth refresh function
  const smoothRefresh = useCallback(async () => {
    if (isRefreshing) return // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true)
    setRefreshingStats({
      commits: true,
      prs: true,
      issues: true,
      activity: true,
      repositories: true
    })

    try {
      // Use the existing refreshData from useGitHubData hook
      await refreshData()
      
      // Stagger the refresh indicators for smooth visual feedback
      setTimeout(() => setRefreshingStats(prev => ({ ...prev, activity: false })), 200)
      setTimeout(() => setRefreshingStats(prev => ({ ...prev, commits: false })), 400)
      setTimeout(() => setRefreshingStats(prev => ({ ...prev, prs: false })), 600)
      setTimeout(() => setRefreshingStats(prev => ({ ...prev, issues: false })), 800)
      setTimeout(() => setRefreshingStats(prev => ({ ...prev, repositories: false })), 1000)
      
    } catch (error) {
      console.error('Smooth refresh failed:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 1200)
    }
  }, [isRefreshing, refreshData])

  // Enhanced refresh function that uses smooth refresh
  const handleSmoothRefresh = () => {
    smoothRefresh()
  }

  // Trigger smooth refresh indicators when data is being fetched
  useEffect(() => {
    if (dataLoading) {
      setIsRefreshing(true)
      setRefreshingStats({
        commits: true,
        prs: true,
        issues: true,
        activity: true,
        repositories: true
      })
    } else {
      // Stagger the refresh indicators for smooth visual feedback
      setTimeout(() => setRefreshingStats(prev => ({ ...prev, activity: false })), 200)
      setTimeout(() => setRefreshingStats(prev => ({ ...prev, commits: false })), 400)
      setTimeout(() => setRefreshingStats(prev => ({ ...prev, prs: false })), 600)
      setTimeout(() => setRefreshingStats(prev => ({ ...prev, issues: false })), 800)
      setTimeout(() => setRefreshingStats(prev => ({ ...prev, repositories: false })), 1000)
      setTimeout(() => setIsRefreshing(false), 1200)
    }
  }, [dataLoading])

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

  // Helper functions for show more functionality
  const getDisplayLimit = (showMore: boolean, defaultLimit: number = 5) => {
    return showMore ? 50 : defaultLimit;
  };

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
    <div className="min-h-screen bg-background">
      {/* Demo Mode Banner */}
      {token === 'demo-token' && (
        <div className="bg-orange-100 border-b border-orange-200 py-3 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-orange-800 font-medium">Demo Mode Active</p>
                <p className="text-orange-700 text-sm">You're viewing sample data. Connect your GitHub account to see real data.</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={login}
                className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                Connect GitHub
              </button>
              <button
                onClick={forceLogout}
                className="text-orange-600 text-sm font-medium hover:text-orange-700 transition-colors"
              >
                Exit Demo
              </button>
            </div>
          </div>
        </div>
      )}
      
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
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
            <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative" data-notification-button>
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end">
                <div className="p-3 border-b">
                  <h4 className="font-semibold">Notifications</h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <div
                        key={index} 
                        className={`p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                        onClick={() => markNotificationAsRead(index)}
                      >
                        <div className="flex items-start gap-3">
                          <notification.icon className="w-4 h-4 mt-1 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu open={showProfileMenu} onOpenChange={setShowProfileMenu}>
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
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://github.com/settings/profile', '_blank')}>
                  <Github className="mr-2 h-4 w-4" />
                  GitHub Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleThemeToggle}>
                  {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://github.com/notifications', '_blank')}>
                  <Bell className="mr-2 h-4 w-4" />
                  GitHub Notifications
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.open('https://github.com/support', '_blank')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('https://github.com/RAWx18/Beetle/', '_blank')}>
                  <Heart className="mr-2 h-4 w-4" />
                  About Beetle
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 hover:text-red-700">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">{getGreeting()}, </h1>
                    {isEditingUsername ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editableUsername}
                          onChange={(e) => setEditableUsername(e.target.value)}
                          className="text-3xl font-bold w-48"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUsernameSave()
                            if (e.key === 'Escape') handleUsernameCancel()
                          }}
                          autoFocus
                        />
                        <Button size="sm" onClick={handleUsernameSave}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleUsernameCancel}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold">{editableUsername} 👋</h1>
                        <Button size="sm" variant="ghost" onClick={handleUsernameEdit}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">Here's what's happening with your projects today.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="relative"
                  >
                    {isRefreshing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                  </Button>
                  <Badge variant="outline" className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                    {isRefreshing ? 'Updating...' : 'All systems operational'}
                  </Badge>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: GitCommit, label: "Commits Today", value: quickStats.commitsToday.toString(), color: "text-green-500", refreshing: refreshingStats.commits },
                  { icon: GitBranch, label: "Active PRs", value: quickStats.activePRs.toString(), color: "text-blue-500", refreshing: refreshingStats.prs },
                  { icon: Star, label: "Stars Earned", value: quickStats.starsEarned.toString(), color: "text-yellow-500", refreshing: refreshingStats.repositories },
                  { icon: Users, label: "Collaborators", value: quickStats.collaborators.toString(), color: "text-purple-500", refreshing: false },
                ].map((stat, index) => (
                                      <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`hover:shadow-md transition-all duration-300 cursor-pointer ${stat.refreshing ? 'ring-2 ring-orange-500/50 bg-orange-50/50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <stat.icon className={`w-5 h-5 ${stat.color} ${stat.refreshing ? 'animate-pulse' : ''}`} />
                            {stat.refreshing && (
                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <motion.div 
                            key={stat.value}
                            initial={{ scale: 1 }}
                            animate={{ scale: stat.refreshing ? 1.05 : 1 }}
                            transition={{ duration: 0.2 }}
                            className="text-2xl font-bold mb-1"
                          >
                            {stat.value}
                          </motion.div>
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
                        <>
                          {userActivity.slice(0, shownActivityCount).map((activity, index) => {
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
                        })}
                        
                        {/* Show More Button */}
                        {userActivity.length > shownActivityCount ? (
                          <Button
                            variant="ghost"
                            className="w-full mt-4"
                            onClick={() => setShownActivityCount(c => Math.min(c + ACTIVITY_BATCH, userActivity.length))}
                          >
                            Show More
                          </Button>
                        ) : userActivity.length > ACTIVITY_BATCH && shownActivityCount > ACTIVITY_BATCH ? (
                          <Button
                            variant="ghost"
                            className="w-full mt-4"
                            onClick={() => setShownActivityCount(ACTIVITY_BATCH)}
                          >
                            Show Less
                          </Button>
                        ) : null}
                      </>
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
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Monthly Goals
                        </CardTitle>
                        {isEditingGoals ? (
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={handleGoalSave}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleGoalCancel}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={handleGoalEdit}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {monthlyGoals.map((goal) => (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex-1">
                              {isEditingGoals ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={goal.title}
                                    onChange={(e) => {
                                      setMonthlyGoals(prev => prev.map(g => 
                                        g.id === goal.id ? { ...g, title: e.target.value } : g
                                      ))
                                    }}
                                    className="w-32 text-sm"
                                  />
                                  <Input
                                    type="number"
                                    value={goal.target}
                                    onChange={(e) => updateGoalTarget(goal.id, parseInt(e.target.value) || 0)}
                                    className="w-16 text-sm"
                                  />
                                  <Button size="sm" variant="ghost" onClick={() => removeGoal(goal.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="font-medium">{goal.title}</span>
                              )}
                              <p className="text-xs text-muted-foreground">{goal.description}</p>
                            </div>
                            <span className="font-medium">
                              {goal.current}/{goal.target}
                            </span>
                          </div>
                          <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                        </div>
                      ))}
                      
                      {/* Add new goal */}
                      {isEditingGoals && (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Goal title"
                              value={newGoal.title}
                              onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              placeholder="Target"
                              value={newGoal.target || ""}
                              onChange={(e) => setNewGoal(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                              className="w-20"
                            />
                            <Button size="sm" onClick={addNewGoal}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleProjectFilter}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleNewProject}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </div>

              {/* Project Filter */}
              {showProjectFilter && (
                <Card className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        value={projectFilter.language} 
                        onValueChange={(value) => setProjectFilter(prev => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All languages" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All languages</SelectItem>
                          <SelectItem value="JavaScript">JavaScript</SelectItem>
                          <SelectItem value="TypeScript">TypeScript</SelectItem>
                          <SelectItem value="Python">Python</SelectItem>
                          <SelectItem value="Java">Java</SelectItem>
                          <SelectItem value="Go">Go</SelectItem>
                          <SelectItem value="Rust">Rust</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="sortBy">Sort By</Label>
                      <Select 
                        value={projectFilter.sortBy} 
                        onValueChange={(value) => setProjectFilter(prev => ({ ...prev, sortBy: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="updated">Last Updated</SelectItem>
                          <SelectItem value="stars">Stars</SelectItem>
                          <SelectItem value="forks">Forks</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select 
                        value={projectFilter.visibility} 
                        onValueChange={(value) => setProjectFilter(prev => ({ ...prev, visibility: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setProjectFilter({
                        language: 'all',
                        sortBy: 'updated',
                        visibility: 'all'
                      })}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </Card>
              )}

              {/* Trending Featured Projects */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <FeaturedProjectsCarousel trendingRepositories={trendingRepositories} />
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
                    <>
                      {(() => {
                        const filteredRepos = getFilteredRepositories(repositories);
                        return (
                          <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {filteredRepos.slice(0, shownProjectsCount).map((repo) => (
                                <ProjectCard 
                                  key={repo.id} 
                                  project={{
                                    name: repo.name,
                                    full_name: repo.full_name,
                                    description: repo.description || 'No description available',
                                    owner: repo.owner,
                                    language: repo.language,
                                    languages: [repo.language].filter(Boolean),
                                    stars: repo.stargazers_count.toString(),
                                    forks: repo.forks_count.toString(),
                                    stargazers_count: repo.stargazers_count,
                                    forks_count: repo.forks_count,
                                    html_url: repo.html_url,
                                    clone_url: repo.clone_url,
                                    default_branch: repo.default_branch,
                                    created_at: repo.created_at,
                                    updated_at: repo.updated_at,
                                    private: repo.private,
                                    updated: new Date(repo.updated_at).toLocaleDateString(),
                                  }} 
                                  type="owned" 
                                />
                              ))}
                            </div>
                            {/* Show More Button for Projects */}
                            {filteredRepos.length > shownProjectsCount ? (
                              <Button onClick={() => setShownProjectsCount(c => Math.min(c + PROJECTS_BATCH, filteredRepos.length))}>
                                Show More
                              </Button>
                            ) : filteredRepos.length > PROJECTS_BATCH && shownProjectsCount > PROJECTS_BATCH ? (
                              <Button onClick={() => setShownProjectsCount(PROJECTS_BATCH)}>
                                Show Less
                              </Button>
                            ) : null}
                          </>
                        );
                      })()}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="starred" className="mt-6">
                  {dataLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  ) : dataError ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Error loading starred repositories: {dataError}
                    </div>
                  ) : starredRepositories.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No starred repositories found</p>
                      <p className="text-xs">Star some repositories on GitHub to see them here</p>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const filteredStarredRepos = getFilteredRepositories(starredRepositories);
                        return (
                          <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {filteredStarredRepos.slice(0, shownProjectsCount).map((repo) => (
                                <ProjectCard 
                                  key={repo.id} 
                                  project={{
                                    name: repo.name,
                                    full_name: repo.full_name,
                                    description: repo.description || 'No description available',
                                    owner: repo.owner,
                                    language: repo.language,
                                    languages: [repo.language].filter(Boolean),
                                    stars: repo.stargazers_count.toString(),
                                    forks: repo.forks_count.toString(),
                                    stargazers_count: repo.stargazers_count,
                                    forks_count: repo.forks_count,
                                    html_url: repo.html_url,
                                    clone_url: repo.clone_url,
                                    default_branch: repo.default_branch,
                                    created_at: repo.created_at,
                                    updated_at: repo.updated_at,
                                    private: repo.private,
                                    updated: new Date(repo.updated_at).toLocaleDateString(),
                                  }} 
                                  type="starred" 
                                />
                              ))}
                            </div>
                            {/* Show More Button for Starred Projects */}
                            {filteredStarredRepos.length > shownProjectsCount ? (
                              <Button onClick={() => setShownProjectsCount(c => Math.min(c + PROJECTS_BATCH, filteredStarredRepos.length))}>
                                Show More
                              </Button>
                            ) : filteredStarredRepos.length > PROJECTS_BATCH && shownProjectsCount > PROJECTS_BATCH ? (
                              <Button onClick={() => setShownProjectsCount(PROJECTS_BATCH)}>
                                Show Less
                              </Button>
                            ) : null}
                          </>
                        );
                      })()}
                    </>
                  )}
                </TabsContent>
              </Tabs>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshData}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>

              {/* Contribution Heatmap */}
              <div className="mb-8">
                <ContributionHeatmap 
                  contributionData={generateContributionData()}
                  loading={dataLoading}
                />
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
                      {recentCommits.slice(0, shownCommitsCount).map((commit) => (
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
                      
                      {/* Show More Button for Commits */}
                      {recentCommits.length > shownCommitsCount ? (
                        <Button
                          variant="ghost"
                          className="w-full mt-4"
                          onClick={() => setShownCommitsCount(c => Math.min(c + COMMITS_BATCH, recentCommits.length))}
                        >
                          Show More
                        </Button>
                      ) : recentCommits.length > COMMITS_BATCH && shownCommitsCount > COMMITS_BATCH ? (
                        <Button
                          variant="ghost"
                          className="w-full mt-4"
                          onClick={() => setShownCommitsCount(COMMITS_BATCH)}
                        >
                          Show Less
                        </Button>
                      ) : null}
                      
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
                        {updating && <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {openPRs.slice(0, shownPRsCount).map((pr) => (
                        <div key={pr.id} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-2 mt-1">
                            <GitBranch className={`h-4 w-4 ${pr.state === 'open' ? 'text-green-500' : pr.state === 'merged' ? 'text-purple-500' : 'text-gray-500'}`} />
                            <span className="text-sm font-medium">#{pr.number}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight mb-1">{pr.title}</p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                              <span>{pr.user.login}</span>
                              <span>•</span>
                              <span>{getRelativeTime(pr.created_at)}</span>
                              {pr.head && pr.base && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600">{pr.head.ref}</span>
                                  <span>→</span>
                                  <span className="text-green-600">{pr.base.ref}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                              {(pr as any).additions !== undefined && (
                                <span className="text-green-600">+{(pr as any).additions}</span>
                              )}
                              {(pr as any).deletions !== undefined && (
                                <span className="text-red-600">-{(pr as any).deletions}</span>
                              )}
                              {(pr as any).comments !== undefined && (
                                <span>💬 {(pr as any).comments}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={pr.state === 'open' ? 'default' : pr.state === 'merged' ? 'secondary' : 'outline'}>
                              {pr.state}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {/* Show More Button for PRs */}
                      {openPRs.length > shownPRsCount ? (
                        <Button
                          variant="ghost"
                          className="w-full mt-4"
                          onClick={() => setShownPRsCount(c => Math.min(c + PRS_BATCH, openPRs.length))}
                        >
                          Show More ({openPRs.length - shownPRsCount} remaining)
                        </Button>
                      ) : openPRs.length > PRS_BATCH && shownPRsCount > PRS_BATCH ? (
                        <Button
                          variant="ghost"
                          className="w-full mt-4"
                          onClick={() => setShownPRsCount(PRS_BATCH)}
                        >
                          Show Less
                        </Button>
                      ) : null}
                      {openPRs.length === 0 && (
                        <div className="text-center py-8">
                          <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">No pull requests found</p>
                        </div>
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
                        {updating && <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {openIssues.slice(0, shownIssuesCount).map((issue) => (
                        <div key={issue.id} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-2 mt-1">
                            <MessageSquare className={`h-4 w-4 ${issue.state === 'open' ? 'text-green-500' : 'text-purple-500'}`} />
                            <span className="text-sm font-medium">#{issue.number}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight mb-1">{issue.title}</p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                              <span>{issue.user.login}</span>
                              <span>•</span>
                              <span>{getRelativeTime(issue.created_at)}</span>
                              {(issue as any).comments !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>💬 {(issue as any).comments}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {issue.labels.slice(0, 3).map((label) => (
                                <Badge 
                                  key={label.name} 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ 
                                    backgroundColor: `#${label.color}20`, 
                                    borderColor: `#${label.color}`, 
                                    color: `#${label.color}` 
                                  }}
                                >
                                  {label.name}
                                </Badge>
                              ))}
                              {issue.labels.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{issue.labels.length - 3} more</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={issue.state === 'open' ? 'default' : 'secondary'}>
                              {issue.state}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {/* Show More Button for Issues */}
                      {openIssues.length > shownIssuesCount ? (
                        <Button
                          variant="ghost"
                          className="w-full mt-4"
                          onClick={() => setShownIssuesCount(c => Math.min(c + ISSUES_BATCH, openIssues.length))}
                        >
                          Show More ({openIssues.length - shownIssuesCount} remaining)
                        </Button>
                      ) : openIssues.length > ISSUES_BATCH && shownIssuesCount > ISSUES_BATCH ? (
                        <Button
                          variant="ghost"
                          className="w-full mt-4"
                          onClick={() => setShownIssuesCount(ISSUES_BATCH)}
                        >
                          Show Less
                        </Button>
                      ) : null}
                      {openIssues.length === 0 && (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">No issues found</p>
                        </div>
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
                      {userActivity.slice(0, shownUserActivityCount).map((activity) => (
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
                <Button variant="outline" size="sm" onClick={handleSmoothRefresh}>
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

      {/* New Project Modal */}
      <Dialog open={showNewProjectModal} onOpenChange={setShowNewProjectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Repository</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="repoName">Repository Name</Label>
              <Input id="repoName" placeholder="my-awesome-project" />
            </div>
            <div>
              <Label htmlFor="repoDescription">Description (optional)</Label>
              <Input id="repoDescription" placeholder="A brief description of your project" />
            </div>
            <div>
              <Label htmlFor="repoVisibility">Visibility</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={() => {
                  // Handle repository creation
                  setShowNewProjectModal(false)
                }}
              >
                Create Repository
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowNewProjectModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Selector Modal */}
      <Dialog open={showProjectSelector} onOpenChange={setShowProjectSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAction === 'pull-request' && 'Select Repository for Pull Request'}
              {selectedAction === 'issue' && 'Select Repository for Issue'}
              {selectedAction === 'deploy' && 'Select Repository to Deploy'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search repositories..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {dataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              ) : filteredRepositories.length > 0 ? (
                filteredRepositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleProjectSelect(repo)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <Code className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{repo.name}</h4>
                        <p className="text-sm text-muted-foreground">{repo.full_name}</p>
                        {repo.description && (
                          <p className="text-xs text-muted-foreground mt-1">{repo.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="w-4 h-4" />
                      {repo.stargazers_count}
                      <GitBranch className="w-4 h-4" />
                      {repo.forks_count}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {projectSearchQuery ? 'No repositories found matching your search.' : 'No repositories available.'}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FeaturedProjectsCarousel({ trendingRepositories }: { trendingRepositories: any[] }) {
  const [currentProject, setCurrentProject] = useState(0)

  useEffect(() => {
    if (trendingRepositories.length === 0) return
    const interval = setInterval(() => {
      setCurrentProject((prev) => (prev + 1) % trendingRepositories.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [trendingRepositories.length])

  const nextProject = () => {
    setCurrentProject((prev) => (prev + 1) % trendingRepositories.length)
  }

  const prevProject = () => {
    setCurrentProject((prev) => (prev - 1 + trendingRepositories.length) % trendingRepositories.length)
  }

  if (trendingRepositories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No trending projects available</p>
      </div>
    )
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
          {trendingRepositories.map((repo, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold mb-2">{repo.full_name}</h4>
                          <p className="text-muted-foreground mb-4">{repo.description || 'No description available'}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.open(repo.html_url, '_blank')}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on GitHub
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {repo.language && (
                          <Badge variant="secondary">
                            {repo.language}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {repo.stargazers_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="w-4 h-4" />
                          {repo.forks_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(repo.updated_at).toLocaleDateString()}
                        </div>
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
        {trendingRepositories.map((_, index) => (
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
  const router = useRouter()

  const handleOpenInBeetle = () => {
    try {
      // Extract owner information from full_name if not available
      const [ownerLogin, repoName] = project.full_name.split('/');
      
      // Create properly structured repository data
      const repoData = {
        name: repoName || project.name,
        full_name: project.full_name,
        description: project.description || 'No description available',
        owner: {
          login: ownerLogin,
          avatar_url: project.owner?.avatar_url || 'https://github.com/github.png',
          type: project.owner?.type || 'User'
        },
        language: project.language || 'Unknown',
        stargazers_count: parseInt(project.stars) || 0,
        forks_count: parseInt(project.forks) || 0,
        html_url: project.html_url,
        clone_url: project.html_url ? `${project.html_url}.git` : '',
        default_branch: project.default_branch || 'main',
        created_at: project.created_at || new Date().toISOString(),
        updated_at: project.updated_at || new Date().toISOString(),
        private: project.private || false,
        type: type as "starred" | "owned"
      };
      
      // Encode repository data as URL parameters
      const encodedRepoData = encodeURIComponent(JSON.stringify(repoData));
      
      // Navigate to contribution page with repository data
      router.push(`/contribution?repo=${encodedRepoData}`);
      
      console.log('🔍 Opening repository in Beetle:', repoData.full_name);
    } catch (error) {
      console.error('Error preparing repository data:', error);
      toast.error('Failed to open repository in Beetle');
    }
  }

  const handleViewOnGitHub = () => {
    window.open(project.html_url, '_blank')
  }

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
                <DropdownMenuItem onClick={handleOpenInBeetle}>
                  <Zap className="w-4 h-4 mr-2" />
                  Open in Beetle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewOnGitHub}>
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
                <Button size="sm" variant="outline" className="flex-1" onClick={handleOpenInBeetle}>
                  <Zap className="w-3 h-3 mr-1" />
                  Open
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={handleViewOnGitHub}>
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
