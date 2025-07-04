import React from 'react';
import { GitPullRequest, Bug, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MyContributionsProps {
  branchData: any;
  branch: string;
}

const MyContributions = ({ branchData, branch }: MyContributionsProps) => {
  // Mock current user - in real app this would come from auth context
  const currentUser = 'john_doe';
  
  const myPRs = branchData.pullRequests.filter((pr: any) => pr.author === currentUser);
  const myIssues = branchData.issues.filter((issue: any) => issue.assignee === currentUser);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Pull Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-blue-500" />
              My Pull Requests ({myPRs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myPRs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No pull requests found</p>
              ) : (
                myPRs.map((pr: any) => (
                  <div key={pr.id} className="border rounded-md p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{pr.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          #{pr.id} • {pr.sourceBranch} → {pr.targetBranch}
                        </p>
                      </div>
                      <Badge className={
                        pr.status === 'open' ? 'bg-green-100 text-green-800' :
                        pr.status === 'merged' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {pr.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock size={12} />
                      {pr.lastUpdated}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-500" />
              My Issues ({myIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myIssues.length === 0 ? (
                <p className="text-muted-foreground text-sm">No issues assigned</p>
              ) : (
                myIssues.map((issue: any) => (
                  <div key={issue.id} className="border rounded-md p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{issue.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          #{issue.id}
                        </p>
                      </div>
                      <Badge className={
                        issue.status === 'open' ? 'bg-red-100 text-red-800' :
                        issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock size={12} />
                      {issue.createdAt}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyContributions;
