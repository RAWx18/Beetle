
import React, { useState } from 'react';
import { GitPullRequest, Bug } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PullRequestTracker from './PullRequestTracker';
import IssueTracker from './IssueTracker';
import { PullRequest, Issue } from './contribution-data';

interface PRIssuesCombinedProps {
  pullRequests: PullRequest[];
  issues: Issue[];
  branch: string;
  searchQuery: string;
}

const PRIssuesCombined = ({ pullRequests, issues, branch, searchQuery }: PRIssuesCombinedProps) => {
  const [activeTab, setActiveTab] = useState('pull-requests');

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pull-requests" className="flex items-center gap-2">
            <GitPullRequest size={16} />
            Pull Requests ({pullRequests.length})
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <Bug size={16} />
            Issues ({issues.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pull-requests" className="mt-6">
          <PullRequestTracker 
            pullRequests={pullRequests}
            branch={branch}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="issues" className="mt-6">
          <IssueTracker 
            issues={issues}
            branch={branch}
            searchQuery={searchQuery}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PRIssuesCombined;
