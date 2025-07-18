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

const getStatus = (pr: any) => {
  if (pr.draft) return 'draft';
  if (pr.merged) return 'merged';
  if (pr.state === 'closed') return 'closed';
  if (pr.requested_reviewers?.length > 0) return 'under_review';
  return pr.state || 'open';
};

const PullRequestTracker = ({ pullRequests, branch, searchQuery }: PullRequestTrackerProps) => {
  const filteredPRs = useMemo(() => {
    if (!searchQuery) return pullRequests;
    const lowercasedQuery = searchQuery.toLowerCase();
    return pullRequests.filter(pr =>
      pr.title?.toLowerCase().includes(lowercasedQuery) ||
      pr.author?.toLowerCase().includes(lowercasedQuery) ||
      (pr.labels?.some((label: any) => (label.name || label).toLowerCase().includes(lowercasedQuery)))
    );
  }, [pullRequests, searchQuery]);

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
    <div className="w-full max-w-7xl mx-auto p-4">
      <BranchPullRequestTable 
        pullRequests={filteredPRs}
        branch={branch}
      />
    </div>
  );
};

export default PullRequestTracker;
