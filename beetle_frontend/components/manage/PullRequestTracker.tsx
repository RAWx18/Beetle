import React, { useState, useMemo } from 'react';
import { GitPullRequest, Filter, Plus, GitMerge, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BranchPullRequestTable from './BranchPullRequestTable';
import { PullRequest } from './contribution-data';

interface PullRequestTrackerProps {
  pullRequests: PullRequest[];
  branch: string;
  searchQuery: string;
}

const PullRequestTracker = ({ pullRequests, branch, searchQuery }: PullRequestTrackerProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredPRs = useMemo(() => {
    let filtered = pullRequests;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(pr => pr.status === selectedStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(pr =>
        pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.labels.some(label => label.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  }, [pullRequests, selectedStatus, searchQuery]);

  const statusCounts = useMemo(() => {
    return {
      all: pullRequests.length,
      open: pullRequests.filter(pr => pr.status === 'open').length,
      under_review: pullRequests.filter(pr => pr.status === 'under_review').length,
      merged: pullRequests.filter(pr => pr.status === 'merged').length,
      closed: pullRequests.filter(pr => pr.status === 'closed').length,
    };
  }, [pullRequests]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle size={14} className="text-green-500" />;
      case 'under_review': return <Clock size={14} className="text-yellow-500" />;
      case 'merged': return <GitMerge size={14} className="text-purple-500" />;
      case 'closed': return <CheckCircle size={14} className="text-gray-500" />;
      default: return <GitPullRequest size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <BranchPullRequestTable 
        pullRequests={pullRequests}
        branch={branch}
      />
    </div>
  );
};

export default PullRequestTracker;
