import React from 'react';
import { GitPullRequest, Bug, Activity, Users, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface OverviewDashboardProps {
  branchData: any;
  branch: string;
}

const OverviewDashboard = ({ branchData, branch }: OverviewDashboardProps) => {
  const stats = {
    totalPRs: branchData.pullRequests.length,
    openPRs: branchData.pullRequests.filter((pr: any) => (pr.state || pr.status) === 'open').length,
    totalIssues: branchData.issues.length,
    openIssues: branchData.issues.filter((issue: any) => (issue.state || issue.status) === 'open').length,
    recentActivity: branchData.activity.length,
    activeContributors: new Set(branchData.pullRequests.map((pr: any) => pr.user?.login || pr.author)).size
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col max-h-full overflow-hidden">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
            <GitPullRequest className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPRs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.openPRs} open
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <Bug className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              {stats.openIssues} open
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commits This Month</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branchData.monthlyCommits ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              in {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeContributors}</div>
            <p className="text-xs text-muted-foreground">
              active this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card className="flex-1 min-h-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {branchData.activity.slice(0, 5).map((activity: any) => (
              <div key={activity.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {activity.user.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} />
                    {new Date(activity.timestamp).toLocaleDateString()}
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewDashboard;
