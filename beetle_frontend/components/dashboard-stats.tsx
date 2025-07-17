"use client"

import React from 'react';
import { motion } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  GitCommit,
  GitPullRequest,
  Star,
  Users,
  Clock,
  Target,
  Award,
  Zap,
  Calendar,
  Code2,
  GitBranch,
  Eye,
  MessageSquare,
  Shield,
  Flame,
  Activity,
  GitBranch as GitBranchIcon,
  GitPullRequest as GitPullRequestIcon,
  GitCommit as GitCommitIcon,
  Star as StarIcon,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Code2 as Code2Icon,
  GitBranch as GitBranchIcon2,
  Shield as ShieldIcon,
  Eye as EyeIcon,
  Zap as ZapIcon,
  Target as TargetIcon,
  MessageSquare as MessageSquareIcon,
  Award as AwardIcon,
  Flame as FlameIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface DashboardStatsProps {
  userActivity?: any[];
  repositories?: any[];
  commits?: any[];
  pullRequests?: any[];
  issues?: any[];
  user?: any;
}

export function DashboardStats({ 
  userActivity = [], 
  repositories = [], 
  commits = [], 
  pullRequests = [], 
  issues = [],
  user
}: DashboardStatsProps) {
  // Calculate real stats from the provided data
  const calculateRealStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Commits this week
    const commitsThisWeek = commits.filter(commit => 
      new Date(commit.commit?.author?.date || commit.created_at) >= oneWeekAgo
    ).length;

    // Pull requests this week
    const prsThisWeek = pullRequests.filter(pr => 
      new Date(pr.created_at) >= oneWeekAgo
    ).length;

    // Total stars earned
    const totalStars = repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

    // Collaborators (unique contributors across repositories)
    const collaborators = new Set();
    repositories.forEach(repo => {
      if (repo.contributors) {
        repo.contributors.forEach((contributor: any) => {
          collaborators.add(contributor.login);
        });
      }
    });

    // Calculate trends (simplified - in real app you'd compare with previous period)
    const commitsTrend = commitsThisWeek > 0 ? 12 : -5;
    const prsTrend = prsThisWeek > 0 ? -5 : -10;
    const starsTrend = totalStars > 100 ? 18 : 5;
    const collabTrend = collaborators.size > 5 ? 25 : 10;

    return {
      commitsThisWeek,
      prsThisWeek,
      totalStars,
      collaborators: collaborators.size,
      commitsTrend,
      prsTrend,
      starsTrend,
      collabTrend
    };
  };

  const realStats = calculateRealStats();

  // Generate real primary stats
  const primaryStats = [
    { 
      icon: GitCommit, 
      label: "Commits This Week", 
      value: realStats.commitsThisWeek.toString(), 
      trend: realStats.commitsTrend, 
      color: "text-green-500" 
    },
    { 
      icon: GitPullRequest, 
      label: "Pull Requests", 
      value: realStats.prsThisWeek.toString(), 
      trend: realStats.prsTrend, 
      color: "text-blue-500" 
    },
    { 
      icon: Star, 
      label: "Stars Earned", 
      value: realStats.totalStars.toString(), 
      trend: realStats.starsTrend, 
      color: "text-yellow-500" 
    },
    { 
      icon: Users, 
      label: "Collaborators", 
      value: realStats.collaborators.toString(), 
      trend: realStats.collabTrend, 
      color: "text-purple-500" 
    },
  ];

  // Calculate real contribution insights
  const calculateContributionInsights = () => {
    const totalCommits = commits.length;
    const userCreatedAt = user?.created_at ? new Date(user.created_at) : new Date();
    const daysActive = Math.max(1, (new Date().getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    const dailyAverage = totalCommits / daysActive;
    
    // Get unique languages
    const languages = new Set();
    repositories.forEach(repo => {
      if (repo.language) {
        languages.add(repo.language);
      }
    });

    // Get active branches (simplified)
    const activeBranches = new Set();
    pullRequests.forEach(pr => {
      if (pr.head?.ref) activeBranches.add(pr.head.ref);
      if (pr.base?.ref) activeBranches.add(pr.base.ref);
    });

    return [
      { 
        icon: Calendar, 
        label: "Daily Average", 
        value: `${dailyAverage.toFixed(1)} commits`, 
        percentage: Math.min(100, (dailyAverage / 10) * 100) 
      },
      { 
        icon: Clock, 
        label: "Peak Hours", 
        value: "2-4 PM", 
        percentage: 85 
      },
      { 
        icon: Code2, 
        label: "Languages Used", 
        value: `${languages.size} languages`, 
        percentage: Math.min(100, (languages.size / 10) * 100) 
      },
      { 
        icon: GitBranch, 
        label: "Active Branches", 
        value: `${activeBranches.size} branches`, 
        percentage: Math.min(100, (activeBranches.size / 10) * 100) 
      },
    ];
  };

  const contributionInsights = calculateContributionInsights();

  // Generate real recent activity from user activity
  const generateRecentActivity = () => {
    return userActivity.slice(0, 5).map(activity => {
      const getActivityColor = (type: string) => {
        switch (type) {
          case 'PushEvent': return 'bg-green-500';
          case 'PullRequestEvent': return 'bg-blue-500';
          case 'IssuesEvent': return 'bg-yellow-500';
          case 'CreateEvent': return 'bg-purple-500';
          default: return 'bg-gray-500';
        }
      };

      const getActivityDescription = (activity: any) => {
        switch (activity.type) {
          case 'PushEvent':
            return `Pushed ${activity.payload?.commits?.length || 0} commits to ${activity.repo?.name}`;
          case 'PullRequestEvent':
            return `${activity.payload?.action === 'opened' ? 'Opened' : 'Updated'} PR in ${activity.repo?.name}`;
          case 'IssuesEvent':
            return `${activity.payload?.action === 'opened' ? 'Opened' : 'Updated'} issue in ${activity.repo?.name}`;
          case 'CreateEvent':
            return `Created ${activity.payload?.ref_type} in ${activity.repo?.name}`;
          default:
            return `Activity in ${activity.repo?.name}`;
        }
      };

      const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} days ago`;
        return date.toLocaleDateString();
      };

      return {
        action: getActivityDescription(activity),
        time: getRelativeTime(activity.created_at),
        color: getActivityColor(activity.type)
      };
    });
  };

  const recentActivity = generateRecentActivity();

  return (
    <div className="space-y-8">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {primaryStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <Badge variant={stat.trend > 0 ? "default" : "secondary"} className="text-xs">
                    {stat.trend > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(stat.trend)}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Analytics */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contribution Insights */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GitCommit className="w-5 h-5 text-green-500" />
                Contribution Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contributionInsights.map((insight, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <insight.icon className="w-4 h-4 text-muted-foreground" />
                      {insight.label}
                    </span>
                    <span className="font-medium">{insight.value}</span>
                  </div>
                  <Progress value={insight.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Repository Health */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-blue-500" />
                Repository Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {repoHealth.map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                    <span className="text-sm">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        metric.status === "good" ? "default" : metric.status === "warning" ? "secondary" : "destructive"
                      }
                    >
                      {metric.value}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-orange-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${activity.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{activity.action}</div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${metric.bgColor}`}>
                    <metric.icon className={`w-8 h-8 ${metric.iconColor}`} />
                  </div>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="text-sm text-muted-foreground">{metric.label}</div>
                  <div className={`text-xs ${metric.trend > 0 ? "text-green-500" : "text-red-500"}`}>
                    {metric.trend > 0 ? "+" : ""}
                    {metric.trend}% this week
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements & Streaks */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${achievement.bgColor}`}>
                    <achievement.icon className={`w-5 h-5 ${achievement.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{achievement.title}</div>
                    <div className="text-xs text-muted-foreground">{achievement.description}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {achievement.date}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                Streaks & Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {streaksAndGoals.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {item.current}/{item.target}
                    </span>
                  </div>
                  <Progress value={(item.current / item.target) * 100} className="h-2" />
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// Mock data
const repoHealth = [
  { icon: Shield, label: "Security Score", value: "A+", status: "good", color: "text-green-500" },
  { icon: Code2, label: "Code Quality", value: "94%", status: "good", color: "text-blue-500" },
  { icon: Eye, label: "Test Coverage", value: "87%", status: "warning", color: "text-yellow-500" },
  { icon: Zap, label: "Performance", value: "Good", status: "good", color: "text-green-500" },
]

const performanceMetrics = [
  {
    icon: Target,
    label: "Goals Completed",
    value: "8/10",
    trend: 15,
    bgColor: "bg-green-100 dark:bg-green-900",
    iconColor: "text-green-600",
  },
  {
    icon: Zap,
    label: "Avg Response Time",
    value: "2.3h",
    trend: -12,
    bgColor: "bg-blue-100 dark:bg-blue-900",
    iconColor: "text-blue-600",
  },
  {
    icon: MessageSquare,
    label: "Code Reviews",
    value: "23",
    trend: 8,
    bgColor: "bg-purple-100 dark:bg-purple-900",
    iconColor: "text-purple-600",
  },
  {
    icon: Award,
    label: "Quality Score",
    value: "96%",
    trend: 3,
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
    iconColor: "text-yellow-600",
  },
]

const achievements = [
  {
    icon: Flame,
    title: "7-Day Streak",
    description: "Committed code for 7 consecutive days",
    date: "Today",
    bgColor: "bg-red-100 dark:bg-red-900",
    iconColor: "text-red-600",
  },
  {
    icon: Star,
    title: "100 Stars",
    description: "Reached 100 stars across all repositories",
    date: "2 days ago",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
    iconColor: "text-yellow-600",
  },
  {
    icon: Users,
    title: "Team Player",
    description: "Collaborated on 5+ repositories this month",
    date: "1 week ago",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    iconColor: "text-blue-600",
  },
]

const streaksAndGoals = [
  {
    icon: Flame,
    label: "Commit Streak",
    current: 7,
    target: 30,
    description: "Keep the momentum going!",
    color: "text-red-500",
  },
  {
    icon: Target,
    label: "Monthly Goal",
    current: 47,
    target: 60,
    description: "47 commits this month",
    color: "text-green-500",
  },
  {
    icon: Star,
    label: "Star Goal",
    current: 234,
    target: 500,
    description: "Growing your impact",
    color: "text-yellow-500",
  },
]
