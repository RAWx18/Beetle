"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp,
  BarChart3,
  Target,
  Calendar,
  Star,
  GitBranch,
  Activity,
  Clock,
  Zap,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/AuthContext"
import { useGitHubData } from "@/hooks/useGitHubData"
import { formatDistanceToNow } from "date-fns"

interface MetricCard {
  title: string
  value: string | number
  change: string
  trend: "up" | "down" | "stable"
  icon: React.ComponentType<any>
  description: string
}

interface ContributionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export default function InsightsPage() {
  const { user } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [contributionData, setContributionData] = useState<ContributionDay[]>([])

  const {
    loading: dataLoading,
    updating,
    error: dataError,
    repositories,
    recentCommits,
    openPRs,
    openIssues,
    userActivity,
    dashboardStats,
    quickStats,
    lastUpdated,
    refreshData,
  } = useGitHubData()

  // Generate contribution data from user activity
  useEffect(() => {
    const generateContributionData = () => {
      const contributionMap = new Map<string, number>()
      
      // Initialize last 365 days with 0 contributions
      for (let i = 0; i < 365; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateKey = date.toISOString().split('T')[0]
        contributionMap.set(dateKey, 0)
      }

      // Count contributions from user activity
      userActivity.forEach(activity => {
        const activityDate = new Date(activity.created_at).toISOString().split('T')[0]
        const currentCount = contributionMap.get(activityDate) || 0
        contributionMap.set(activityDate, currentCount + 1)
      })

      // Count contributions from commits
      recentCommits.forEach(commit => {
        const commitDate = new Date(commit.commit.author.date).toISOString().split('T')[0]
        const currentCount = contributionMap.get(commitDate) || 0
        contributionMap.set(commitDate, currentCount + 1)
      })

      // Convert to array and calculate levels
      const contributions: ContributionDay[] = Array.from(contributionMap.entries())
        .map(([date, count]) => ({
          date,
          count,
          level: count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setContributionData(contributions)
    }

    if (userActivity.length > 0 || recentCommits.length > 0) {
      generateContributionData()
    }
  }, [userActivity, recentCommits])

  const handleRefreshData = async () => {
    setIsRefreshing(true)
    await refreshData()
    setIsRefreshing(false)
  }

  // Calculate metrics
  const metrics: MetricCard[] = [
    {
      title: "Total Repositories",
      value: dashboardStats.totalRepos,
      change: "+2 this month",
      trend: "up",
      icon: GitBranch,
      description: "Active repositories you own"
    },
    {
      title: "Total Commits",
      value: dashboardStats.totalCommits,
      change: "+15 this week",
      trend: "up",
      icon: Activity,
      description: "Total commits across all repos"
    },
    {
      title: "Open Pull Requests",
      value: openPRs.length,
      change: "-1 from last week",
      trend: "down",
      icon: GitBranch,
      description: "Currently open pull requests"
    },
    {
      title: "Contribution Streak",
      value: calculateStreak(contributionData),
      change: "Active",
      trend: "stable",
      icon: Zap,
      description: "Current daily contribution streak"
    }
  ]

  function calculateStreak(contributions: ContributionDay[]): number {
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    
    for (let i = contributions.length - 1; i >= 0; i--) {
      const contribution = contributions[i]
      if (contribution.count > 0) {
        streak++
      } else if (contribution.date !== today) {
        break
      }
    }
    
    return streak
  }

  function getContributionLevelColor(level: number): string {
    switch (level) {
      case 0: return "bg-muted"
      case 1: return "bg-green-200"
      case 2: return "bg-green-300"
      case 3: return "bg-green-400"
      case 4: return "bg-green-500"
      default: return "bg-muted"
    }
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Error loading insights: {dataError}
      </div>
    )
  }

  return (
    <motion.div
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={metric.trend === "up" ? "default" : metric.trend === "down" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {metric.change}
                  </Badge>
                  <TrendingUp className={`h-3 w-3 ${
                    metric.trend === "up" ? "text-green-500" : 
                    metric.trend === "down" ? "text-red-500" : 
                    "text-gray-500"
                  }`} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Contribution Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Contribution Activity
          </CardTitle>
          <CardDescription>
            Your contribution activity over the past year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Contribution Grid */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-53 gap-1 w-full min-w-[800px]">
                {contributionData.map((day, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-sm ${getContributionLevelColor(day.level)}`}
                    title={`${day.date}: ${day.count} contributions`}
                  />
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Less</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`w-3 h-3 rounded-sm ${getContributionLevelColor(level)}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repository Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Top Repositories
            </CardTitle>
            <CardDescription>
              Your most starred repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {repositories
                .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
                .slice(0, 5)
                .map((repo, index) => (
                  <div key={repo.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{repo.name}</p>
                      <p className="text-sm text-muted-foreground">{repo.language || "No language"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">{repo.stargazers_count || 0}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Language Breakdown
            </CardTitle>
            <CardDescription>
              Languages used across your repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const languageCount = repositories.reduce((acc, repo) => {
                  const lang = repo.language || "Other"
                  acc[lang] = (acc[lang] || 0) + 1
                  return acc
                }, {} as Record<string, number>)

                const total = Object.values(languageCount).reduce((sum, count) => sum + count, 0)
                
                return Object.entries(languageCount)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([language, count]) => (
                    <div key={language} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{language}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({Math.round((count / total) * 100)}%)
                        </span>
                      </div>
                      <Progress value={(count / total) * 100} className="h-2" />
                    </div>
                  ))
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Performance
          </CardTitle>
          <CardDescription>
            Summary of your recent development activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{recentCommits.length}</div>
              <div className="text-sm text-muted-foreground">Commits This Week</div>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{openPRs.length}</div>
              <div className="text-sm text-muted-foreground">Active Pull Requests</div>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{openIssues.length}</div>
              <div className="text-sm text-muted-foreground">Open Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}