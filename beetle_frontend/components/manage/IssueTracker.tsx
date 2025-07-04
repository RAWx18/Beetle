import React, { useState, useMemo } from 'react';
import { Bug, Filter, Plus, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BranchIssueTable from './BranchIssueTable';
import { Issue } from './contribution-data';

interface IssueTrackerProps {
  issues: Issue[];
  branch: string;
  searchQuery: string;
}

const IssueTracker = ({ issues, branch, searchQuery }: IssueTrackerProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredIssues = useMemo(() => {
    let filtered = issues;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(issue => issue.status === selectedStatus);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(issue => issue.type === selectedType);
    }

    if (searchQuery) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.assignee && issue.assignee.toLowerCase().includes(searchQuery.toLowerCase())) ||
        issue.labels.some(label => label.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  }, [issues, selectedStatus, selectedType, searchQuery]);

  const statusCounts = useMemo(() => {
    return {
      all: issues.length,
      open: issues.filter(issue => issue.status === 'open').length,
      in_progress: issues.filter(issue => issue.status === 'in_progress').length,
      resolved: issues.filter(issue => issue.status === 'resolved').length,
      closed: issues.filter(issue => issue.status === 'closed').length,
    };
  }, [issues]);

  const typeCounts = useMemo(() => {
    return {
      all: issues.length,
      bug: issues.filter(issue => issue.type === 'bug').length,
      feature: issues.filter(issue => issue.type === 'feature').length,
      enhancement: issues.filter(issue => issue.type === 'enhancement').length,
      documentation: issues.filter(issue => issue.type === 'documentation').length,
    };
  }, [issues]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle size={14} className="text-red-500" />;
      case 'in_progress': return <Clock size={14} className="text-blue-500" />;
      case 'resolved': return <CheckCircle size={14} className="text-green-500" />;
      case 'closed': return <XCircle size={14} className="text-gray-500" />;
      default: return <Bug size={14} className="text-orange-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'feature': return '✨';
      case 'enhancement': return '🔧';
      case 'documentation': return '📚';
      default: return '📋';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <BranchIssueTable 
        issues={issues}
        branch={branch}
      />
    </div>
  );
};

export default IssueTracker;
