import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GitPullRequest, Bug, Clock, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MyContributionsProps {
  branchData: any;
  branch: string;
}

const MyContributions = ({ branchData, branch }: MyContributionsProps) => {
  const { user } = useAuth();
  const currentUserLogin = user?.login;

  // Filter PRs: authored by user OR user is requested reviewer
  // If no user is authenticated, show all PRs as fallback
  const myPRs = currentUserLogin ? branchData.pullRequests.filter((pr: any) => 
    pr.user?.login === currentUserLogin || 
    pr.requested_reviewers?.some((reviewer: any) => reviewer.login === currentUserLogin)
  ) : branchData.pullRequests;
  
  // Filter issues: assigned to user OR created by user
  // If no user is authenticated, show all issues as fallback
  const myIssues = currentUserLogin ? branchData.issues.filter((issue: any) => 
    issue.assignees?.some((assignee: any) => assignee.login === currentUserLogin) ||
    issue.user?.login === currentUserLogin
  ) : branchData.issues;

  // Debug logging
  console.log('[MyContributions] Current user:', currentUserLogin);
  console.log('[MyContributions] Total PRs:', branchData.pullRequests?.length || 0);
  console.log('[MyContributions] Total Issues:', branchData.issues?.length || 0);
  console.log('[MyContributions] My PRs:', myPRs.length);
  console.log('[MyContributions] My Issues:', myIssues.length);
  
  // Log sample PR and issue data for debugging
  if (branchData.pullRequests?.length > 0) {
    console.log('[MyContributions] Sample PR:', branchData.pullRequests[0]);
  }
  if (branchData.issues?.length > 0) {
    console.log('[MyContributions] Sample Issue:', branchData.issues[0]);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Monthly Commits Stat */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commits This Month</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branchData.monthlyCommits ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              in {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Pull Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-blue-500" />
              {currentUserLogin ? 'My Pull Requests' : 'All Pull Requests'} ({myPRs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {myPRs.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {currentUserLogin ? 'No pull requests found for you' : 'No pull requests found'}
                </p>
              ) : (
                <>
                  {myPRs.length > 8 && (
                    <div className="text-xs text-muted-foreground text-center py-2 border-b">
                      <ChevronDown className="inline w-3 h-3 mr-1" />
                      Scroll to see all {myPRs.length} pull requests
                    </div>
                  )}
                  {myPRs.map((pr: any) => (
                    <div key={pr.id} className="border rounded-md p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{pr.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            #{pr.number} • {pr.head?.ref} → {pr.base?.ref}
                          </p>
                        </div>
                        <Badge className={
                          pr.state === 'open' ? 'bg-green-100 text-green-800' :
                          pr.merged ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {pr.merged ? 'merged' : pr.state}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {new Date(pr.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-500" />
              {currentUserLogin ? 'My Issues' : 'All Issues'} ({myIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {myIssues.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {currentUserLogin ? 'No issues assigned to you' : 'No issues found'}
                </p>
              ) : (
                <>
                  {myIssues.length > 8 && (
                    <div className="text-xs text-muted-foreground text-center py-2 border-b">
                      <ChevronDown className="inline w-3 h-3 mr-1" />
                      Scroll to see all {myIssues.length} issues
                    </div>
                  )}
                  {myIssues.map((issue: any) => (
                    <div key={issue.id} className="border rounded-md p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{issue.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            #{issue.number}
                          </p>
                        </div>
                        <Badge className={
                          issue.state === 'open' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {issue.state}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {new Date(issue.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyContributions;
