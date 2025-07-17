"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  GitBranch,
  GitCommit,
  MessageSquare,
  Star,
  Calendar,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { useGitHubData } from "@/hooks/useGitHubData"
import { formatDistanceToNow } from "date-fns"

export default function ActivityPage() {
  const { user } = useAuth()
  const [shownCommitsCount, setShownCommitsCount] = useState(10)
  const [shownPRsCount, setShownPRsCount] = useState(10)
  const [shownIssuesCount, setShownIssuesCount] = useState(10)
  const [shownUserActivityCount, setShownUserActivityCount] = useState(10)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    loading: dataLoading,
    updating,
    error: dataError,
    recentCommits,
    openPRs,
    openIssues,
    userActivity,
    lastUpdated,
    refreshData,
  } = useGitHubData()

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

  if (dataError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Error loading activity: {dataError}
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
      {/* Activity Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity</h1>
          <p className="text-muted-foreground mt-1">
            Recent activity across your repositories
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

      {/* Activity Tabs */}
      <Tabs defaultValue="commits" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="commits">
            Commits ({recentCommits.length})
          </TabsTrigger>
          <TabsTrigger value="prs">
            Pull Requests ({openPRs.length})
          </TabsTrigger>
          <TabsTrigger value="issues">
            Issues ({openIssues.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            User Activity ({userActivity.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitCommit className="h-5 w-5" />
                <span>Recent Commits</span>
                {updating && <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentCommits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitCommit className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent commits found</p>
                </div>
              ) : (
                <>
                  {recentCommits.slice(0, shownCommitsCount).map((commit, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={commit.author?.avatar_url} alt={commit.author?.login} />
                        <AvatarFallback>{commit.author?.login?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight mb-1">{commit.commit.message}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                          <span>{commit.author?.login}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(commit.commit.author.date), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {commit.sha?.substring(0, 7)}
                          </Badge>
                          {commit.repository && (
                            <Badge variant="secondary" className="text-xs">
                              {commit.repository.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={commit.html_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  ))}
                  {recentCommits.length > shownCommitsCount && (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setShownCommitsCount(prev => prev + 10)}
                      >
                        Show More ({recentCommits.length - shownCommitsCount} remaining)
                      </Button>
                    </div>
                  )}
                </>
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
              {openPRs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No open pull requests found</p>
                </div>
              ) : (
                <>
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
                          <span>{formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={pr.state === 'open' ? 'default' : pr.state === 'merged' ? 'secondary' : 'outline'} className="text-xs">
                            {pr.state}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {pr.base.ref} ← {pr.head.ref}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={pr.html_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  ))}
                  {openPRs.length > shownPRsCount && (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setShownPRsCount(prev => prev + 10)}
                      >
                        Show More ({openPRs.length - shownPRsCount} remaining)
                      </Button>
                    </div>
                  )}
                </>
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
              {openIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No open issues found</p>
                </div>
              ) : (
                <>
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
                          <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={issue.state === 'open' ? 'default' : 'secondary'} className="text-xs">
                            {issue.state}
                          </Badge>
                          {issue.labels?.slice(0, 2).map((label) => (
                            <Badge key={label.id} variant="outline" className="text-xs" style={{ backgroundColor: `#${label.color}20` }}>
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={issue.html_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  ))}
                  {openIssues.length > shownIssuesCount && (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setShownIssuesCount(prev => prev + 10)}
                      >
                        Show More ({openIssues.length - shownIssuesCount} remaining)
                      </Button>
                    </div>
                  )}
                </>
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
              {userActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity found</p>
                </div>
              ) : (
                <>
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
                          {activity.type} in {activity.repo?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                  {userActivity.length > shownUserActivityCount && (
                    <div className="text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setShownUserActivityCount(prev => prev + 10)}
                      >
                        Show More ({userActivity.length - shownUserActivityCount} remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}