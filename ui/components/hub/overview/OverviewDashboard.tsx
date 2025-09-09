'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { useBranch } from '@/contexts/BranchContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  GitBranch, 
  Star, 
  GitFork, 
  Eye, 
  Clock, 
  TrendingUp, 
  Users, 
  Code, 
  Calendar,
  Zap,
  AlertCircle,
  CheckCircle,
  GitCommit
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RepositoryCard } from './RepositoryCard';
import { QuickActions } from './QuickActions';
import { Repository, Activity as ActivityType, Metrics } from '@/types/hub';
import { hubApi } from '@/lib/api/hub-api';

interface OverviewDashboardProps {
  repository?: any; // TODO: Replace with proper Repository type from hub.ts
  className?: string;
  onError?: (error: Error) => void;
  onLoading?: (isLoading: boolean) => void;
}

interface DashboardStats {
  totalCommits: number;
  totalContributors: number;
  openIssues: number;
  openPullRequests: number;
  lastActivity: Date | null;
  weeklyCommits: number;
  monthlyCommits: number;
}

interface RecentActivity {
  id: string;
  type: 'commit' | 'issue' | 'pull_request' | 'release';
  title: string;
  author: string;
  timestamp: Date;
  url?: string;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  repository,
  className = '',
  onError,
  onLoading
}) => {
  const { token } = useAuth();
  const { repository: contextRepository } = useRepository();
  const { selectedBranch } = useBranch();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCommits: 0,
    totalContributors: 0,
    openIssues: 0,
    openPullRequests: 0,
    lastActivity: null,
    weeklyCommits: 0,
    monthlyCommits: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [quickStats, setQuickStats] = useState<Metrics>({});

  // Use repository from props or context
  const currentRepository = repository || contextRepository;

  useEffect(() => {
    if (!currentRepository || !token) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      onLoading?.(true);

      try {
        // Fetch dashboard data from API
        const dashboardData = await hubApi.overview.getUserDashboard();
        
        // TODO: Use real dashboard data from API
        const stats: DashboardStats = {
          totalCommits: currentRepository.size || 0,
          totalContributors: 0,
          openIssues: currentRepository.open_issues_count || 0,
          openPullRequests: 0,
          lastActivity: new Date(currentRepository.updated_at),
          weeklyCommits: 0,
          monthlyCommits: 0
        };

        // TODO: Fetch real activity data from API
        const activity: RecentActivity[] = [];

        setStats(stats);
        setRecentActivity(activity);
        setQuickStats(dashboardData.quickStats || {});

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        onError?.(error as Error);
      } finally {
        setLoading(false);
        onLoading?.(false);
      }
    };

    fetchDashboardData();
  }, [currentRepository, token, onError, onLoading]);

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'commit':
        return <GitCommit className="w-4 h-4" />;
      case 'issue':
        return <AlertCircle className="w-4 h-4" />;
      case 'pull_request':
        return <GitBranch className="w-4 h-4" />;
      case 'release':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'commit':
        return 'text-green-500';
      case 'issue':
        return 'text-red-500';
      case 'pull_request':
        return 'text-blue-500';
      case 'release':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  if (!currentRepository) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-muted-foreground">No repository selected</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Repository Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <img
            src={currentRepository.owner?.avatar_url || 'https://github.com/github.png'}
            alt={currentRepository.owner?.login}
            className="w-16 h-16 rounded-full border-2 border-border"
          />
          <div className="text-left">
            <h1 className="text-3xl font-bold">{currentRepository.name}</h1>
            <p className="text-muted-foreground">
              by{' '}
              <a 
                href={`https://github.com/${currentRepository.owner?.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {currentRepository.owner?.login}
              </a>
            </p>
          </div>
        </div>
        
        {currentRepository.description && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {currentRepository.description}
          </p>
        )}

        {/* Branch Info */}
        <div className="flex items-center justify-center gap-2">
          <GitBranch className="w-4 h-4" />
          <span className="text-sm">Current branch: </span>
          <Badge variant="secondary">{selectedBranch || currentRepository.default_branch}</Badge>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{currentRepository.stargazers_count}</p>
                <p className="text-xs text-muted-foreground">Stars</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <GitFork className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{currentRepository.forks_count}</p>
                <p className="text-xs text-muted-foreground">Forks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{currentRepository.watchers_count || 0}</p>
                <p className="text-xs text-muted-foreground">Watchers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.openIssues}</p>
                <p className="text-xs text-muted-foreground">Open Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">This week</span>
              <span className="font-semibold">{stats.weeklyCommits} commits</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">This month</span>
              <span className="font-semibold">{stats.monthlyCommits} commits</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Contributors</span>
              <span className="font-semibold">{stats.totalContributors}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-500" />
              Repository Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Language</span>
              <Badge variant="outline">{currentRepository.language || 'N/A'}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Size</span>
              <span className="font-semibold">{(currentRepository.size / 1024).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">License</span>
              <Badge variant="outline">{currentRepository.license?.name || 'None'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              Last Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Updated</span>
              <span className="font-semibold">
                {stats.lastActivity ? getRelativeTime(stats.lastActivity) : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="font-semibold">
                {new Date(currentRepository.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Default branch</span>
              <Badge variant="secondary">{currentRepository.default_branch}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest updates and changes in this repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`mt-1 ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.url ? (
                        <a 
                          href={activity.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {activity.title}
                        </a>
                      ) : (
                        activity.title
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.author} • {getRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <QuickActions 
        repository={currentRepository}
        onAction={(action, data) => {
          console.log('Quick action:', action, data);
          // Handle quick actions
        }}
      />
    </div>
  );
};

export default OverviewDashboard;