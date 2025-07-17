"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Check,
  X,
  Edit,
  RefreshCw,
  Plus,
  Github,
  Star,
  GitBranch,
  Users,
  Activity,
  Target,
  Code,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/AuthContext"
import { useGitHubData } from "@/hooks/useGitHubData"
import { DashboardStats } from "@/components/dashboard-stats"
import { formatDistanceToNow } from "date-fns"

export default function DashboardOverview() {
  const { user } = useAuth()
  const [editableUsername, setEditableUsername] = useState("GitHub User")
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [monthlyGoals, setMonthlyGoals] = useState([
    { type: "repositories", label: "Repos Created", current: 0, target: 5, color: "bg-blue-500" },
    { type: "commits", label: "Commits Made", current: 0, target: 100, color: "bg-green-500" },
    { type: "prs", label: "PRs Opened", current: 0, target: 20, color: "bg-purple-500" },
  ])

  const {
    loading: dataLoading,
    updating,
    error: dataError,
    repositories,
    recentCommits,
    openPRs,
    openIssues,
    dashboardStats,
    quickStats,
    lastUpdated,
    refreshData,
  } = useGitHubData()

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

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  // Username editing handlers
  const handleUsernameEdit = () => {
    setIsEditingUsername(true)
  }

  const handleUsernameSave = () => {
    setIsEditingUsername(false)
    localStorage.setItem('customUsername', editableUsername)
  }

  const handleUsernameCancel = () => {
    setEditableUsername(user?.login || "GitHub User")
    setIsEditingUsername(false)
  }

  // Quick action handlers
  const handleCreateRepository = () => {
    window.open('https://github.com/new', '_blank')
  }

  const handleRefreshData = async () => {
    setIsRefreshing(true)
    await refreshData()
    setIsRefreshing(false)
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <motion.div
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
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="relative"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common development tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" onClick={handleCreateRepository} className="h-20 flex-col gap-2">
              <Github className="w-6 h-6" />
              <span className="text-sm">New Repository</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <GitBranch className="w-6 h-6" />
              <span className="text-sm">New Pull Request</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Activity className="w-6 h-6" />
              <span className="text-sm">Create Issue</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="w-6 h-6" />
              <span className="text-sm">Deploy Project</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Monthly Goals
          </CardTitle>
          <CardDescription>
            Track your development progress this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {monthlyGoals.map((goal, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{goal.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {goal.current}/{goal.target}
                  </span>
                </div>
                <Progress value={(goal.current / goal.target) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Commits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Recent Commits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCommits.slice(0, 5).map((commit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={commit.author?.avatar_url} />
                    <AvatarFallback>{commit.author?.login?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{commit.commit.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {commit.author?.login} • {formatDistanceToNow(new Date(commit.commit.author.date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Open Pull Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Open Pull Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {openPRs.slice(0, 5).map((pr) => (
                <div key={pr.id} className="flex items-start gap-3">
                  <GitBranch className="w-4 h-4 text-green-500 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pr.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>#{pr.number}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {pr.state}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}