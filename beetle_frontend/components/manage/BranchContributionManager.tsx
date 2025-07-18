import React, { useState, useMemo, useEffect } from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { Search, Filter, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BranchActivity from './BranchActivity';
import OverviewDashboard from './OverviewDashboard';
import MyContributions from './MyContributions';
import BranchPlanner from './BranchPlanner';
import SmartSuggestions from './SmartSuggestions';
import SavedFilters from './SavedFilters';
import PinnedWatched from './PinnedWatched';
import PrivateNotes from './PrivateNotes';
import BotLogs from './BotLogs';
import PRIssuesCombined from './PRIssuesCombined';
import PullRequestTracker from './PullRequestTracker';
import IssueTracker from './IssueTracker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { apiService } from '@/lib/api';

interface BranchContributionManagerProps {
  selectedSection?: string;
}

const BranchContributionManager = ({ selectedSection = 'overview' }: BranchContributionManagerProps) => {
  const { selectedBranch, getBranchInfo } = useBranch();
  const { user, token } = useAuth();
  const { repository } = useRepository();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [issueFilters, setIssueFilters] = useState<{ status: string; type: string; priority: string; labels: string[] }>({ status: 'all', type: 'all', priority: 'all', labels: [] });
  const [prFilters, setPrFilters] = useState<{ status: string; labels: string[] }>({ status: 'all', labels: [] });
  const [beetleData, setBeetleData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [allRepoPRs, setAllRepoPRs] = useState<any[]>([]);
  
  const branchInfo = getBranchInfo();

  // Fallback data for demo mode or when no repository is selected
  const fallbackContributionData = {
    pullRequests: [],
    issues: [],
    commits: [],
    summary: {
      totalCommits: 0,
      totalIssues: 0,
      totalPullRequests: 0,
      lastCommit: null,
      lastActivity: new Date().toISOString()
    }
  };

  // Fetch Beetle project data from backend
  useEffect(() => {
    const fetchBranchAndRepoData = async () => {
      if (!repository || !token || token === 'demo-token') {
        setBeetleData(fallbackContributionData);
        setAllRepoPRs(fallbackContributionData.pullRequests);
        setDataLoading(false);
        setDataError(null);
        return;
      }
      setDataLoading(true);
      setDataError(null);
      try {
        const { owner, name } = repository;
        const now = new Date();
        const since = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        // Fetch both branch-specific data and all repo PRs
        const [branchResponse, prResponse] = await Promise.all([
          apiService.getBranchData(owner.login, name, selectedBranch, { since }),
          apiService.getRepositoryPullRequests(owner.login, name, 'all')
        ]);
        if (branchResponse.error) {
          setBeetleData(null);
          setDataError(branchResponse.error.message);
        } else {
          setBeetleData(branchResponse.data);
        }
        if (prResponse.error) {
          setAllRepoPRs([]);
        } else if (prResponse.data && prResponse.data.pullRequests) {
          setAllRepoPRs(prResponse.data.pullRequests);
        } else {
          setAllRepoPRs([]);
        }
      } catch (err: any) {
        setBeetleData(null);
        setAllRepoPRs([]);
        setDataError(err.message || 'Failed to fetch data');
      } finally {
        setDataLoading(false);
      }
    };
    fetchBranchAndRepoData();
  }, [repository, selectedBranch, token]);

  // Memoize branch-specific data
  const branchData = useMemo(() => {
    if (!beetleData) {
      return { pullRequests: [], issues: [], activity: [] };
    }
    
    console.log('[Beetle Overview] beetleData structure:', beetleData);
    
    // Transform commits to activity items
    const activity = (beetleData.commits || []).map((commit: any) => ({
      id: commit.sha || commit.id || Math.random().toString(36).slice(2),
      type: 'commit',
      user: commit.commit?.author?.name || commit.author?.login || commit.commit?.committer?.name || 'Unknown',
      description: commit.commit?.message?.split('\n')[0] || 'Commit',
      timestamp: commit.commit?.author?.date || commit.commit?.committer?.date || new Date().toISOString(),
      branch: selectedBranch
    }));

    // Filter PRs by status and labels
    let filteredPRs = allRepoPRs || [];
    if (prFilters.status && prFilters.status !== 'all') {
      filteredPRs = filteredPRs.filter((pr: any) => (pr.status || pr.state) === prFilters.status);
    }
    if (prFilters.labels && prFilters.labels.length > 0) {
      filteredPRs = filteredPRs.filter((pr: any) => (pr.labels || []).some((l: any) => prFilters.labels.includes(typeof l === 'string' ? l : l.name)));
    }

    return {
      pullRequests: filteredPRs,
      issues: beetleData.issues || [],
      activity,
    };
  }, [beetleData, allRepoPRs, selectedBranch, prFilters]);

  // Compute filter options
  const allIssueLabels = Array.from(new Set(branchData.issues.flatMap((i: any) => i.labels?.map((l: any) => typeof l === 'string' ? l : l.name) || [])));
  const allPRLabels = Array.from(new Set(branchData.pullRequests.flatMap((pr: any) => pr.labels?.map((l: any) => typeof l === 'string' ? l : l.name) || [])));
  const allIssueTypes = Array.from(new Set(branchData.issues.map((i: any) => i.type || 'feature')));
  const allIssuePriorities = Array.from(new Set(branchData.issues.map((i: any) => i.priority || 'medium')));
  const allIssueStatuses = ['all', ...Array.from(new Set(branchData.issues.map((i: any) => i.state || i.status || 'open')))];
  const allPRStatuses = ['all', ...Array.from(new Set(branchData.pullRequests.map((pr: any) => pr.state || pr.status || 'open')))]

  // Filter data based on UI state
  const filteredData = useMemo(() => {
    let prs: any[] = branchData.pullRequests;
    let issues: any[] = branchData.issues;
    if (selectedSection === 'pr-issues-tracker' || selectedSection === 'pr-tracker') {
      if (prFilters.status !== 'all') prs = prs.filter((pr: any) => (pr.state || pr.status) === prFilters.status);
      if (prFilters.labels.length > 0) prs = prs.filter((pr: any) => (pr.labels || []).some((l: any) => prFilters.labels.includes(typeof l === 'string' ? l : l.name)));
    }
    if (selectedSection === 'pr-issues-tracker' || selectedSection === 'issue-tracker') {
      if (issueFilters.status !== 'all') issues = issues.filter((issue: any) => (issue.state || issue.status) === issueFilters.status);
      if (issueFilters.type !== 'all') issues = issues.filter((issue: any) => (issue.type || 'feature') === issueFilters.type);
      if (issueFilters.priority !== 'all') issues = issues.filter((issue: any) => (issue.priority || 'medium') === issueFilters.priority);
      if (issueFilters.labels.length > 0) issues = issues.filter((issue: any) => (issue.labels || []).some((l: any) => issueFilters.labels.includes(typeof l === 'string' ? l : l.name)));
    }
    if (searchQuery) {
      prs = prs.filter((pr: any) =>
        pr.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pr.user?.login || pr.author)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pr.labels || []).some((label: any) => (typeof label === 'string' ? label : label.name).toLowerCase().includes(searchQuery.toLowerCase()))
      );
      issues = issues.filter((issue: any) =>
        issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.assignee && issue.assignee.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (issue.labels || []).some((label: any) => (typeof label === 'string' ? label : label.name).toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return {
      pullRequests: prs,
      issues,
      activity: branchData.activity
    };
  }, [branchData, searchQuery, prFilters, issueFilters, selectedSection]);

  // Use real GitHub activity data
  const mergedActivity = [
    ...(branchData.activity || [])
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Calculate this month's commits from mergedActivity
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyCommits = mergedActivity.filter(
    (a) => a.type === 'commit' && new Date(a.timestamp) >= firstOfMonth
  ).length;

  const handleSectionChange = async (newSection: string) => {
    setIsLoading(true);
    // Simulate loading time for section switching
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
  };

  const renderSectionContent = () => {
    if (dataLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <span className="ml-2 text-sm text-muted-foreground">Loading branch data...</span>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      );
    }

    switch (selectedSection) {
      case 'overview':
        return <OverviewDashboard branchData={{ ...filteredData, activity: mergedActivity, monthlyCommits }} branch={selectedBranch} />;
      case 'my-contributions':
        return <MyContributions branchData={{ ...filteredData, activity: mergedActivity, monthlyCommits }} branch={selectedBranch} />;
      case 'branch-planner':
        return <BranchPlanner branch={selectedBranch} />;
      case 'pr-issues-tracker':
        return (
          <PRIssuesCombined 
            pullRequests={filteredData.pullRequests}
            issues={filteredData.issues}
            branch={selectedBranch}
            searchQuery={searchQuery}
          />
        );
      case 'pr-tracker':
        return (
          <PullRequestTracker 
            pullRequests={filteredData.pullRequests}
            branch={selectedBranch}
            searchQuery={searchQuery}
          />
        );
      case 'issue-tracker':
        return (
          <IssueTracker 
            issues={filteredData.issues}
            branch={selectedBranch}
            searchQuery={searchQuery}
          />
        );
      case 'smart-suggestions':
        return <SmartSuggestions branch={selectedBranch} branchData={filteredData} />;
      case 'saved-filters':
        return <SavedFilters onFilterSelect={setSearchQuery} />;
      case 'pinned-watched':
        return <PinnedWatched branchData={filteredData} branch={selectedBranch} />;
      case 'private-notes':
        return <PrivateNotes branch={selectedBranch} />;
      case 'bot-logs':
        return <BotLogs activities={mergedActivity} branch={selectedBranch} />;
      default:
        return <OverviewDashboard branchData={{ ...filteredData, activity: mergedActivity, monthlyCommits }} branch={selectedBranch} />;
    }
  };

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      'overview': 'Branch Overview',
      'my-contributions': 'My Contributions',
      'branch-planner': 'Branch Planner',
      'pr-issues-tracker': 'PR & Issues Tracker',
      'pr-tracker': 'Pull Request Tracker',
      'issue-tracker': 'Issue Tracker',
      'smart-suggestions': 'Smart Suggestions',
      'saved-filters': 'Saved Filters',
      'pinned-watched': 'Pinned & Watched Items',
      'private-notes': 'Private Notes',
      'import-branch': 'Import Branch',
      'bot-logs': 'Bot Activity & Management',
    };
    return titles[selectedSection] || 'Dashboard';
  };

  const handleFilterClick = () => {
    setFilterDialogOpen(true);
  };

  const applyFilters = () => {
    setFilterDialogOpen(false);
    // Optionally, you can update searchQuery or add more advanced filter logic here
  };

  const handleIssueFilterChange = (field: string, value: string) => {
    setIssueFilters(prev => ({ ...prev, [field]: value }));
  };
  const handleIssueLabelToggle = (label: string) => {
    setIssueFilters(prev => ({ ...prev, labels: prev.labels.includes(label) ? prev.labels.filter(l => l !== label) : [...prev.labels, label] }));
  };
  const handlePRFilterChange = (field: string, value: string) => {
    setPrFilters(prev => ({ ...prev, [field]: value }));
  };
  const handlePRLabelToggle = (label: string) => {
    setPrFilters(prev => ({ ...prev, labels: prev.labels.includes(label) ? prev.labels.filter(l => l !== label) : [...prev.labels, label] }));
  };

  const handleNewClick = () => {
    // TODO: Implement create new item based on current view
    const actionMap: Record<string, string> = {
      'pr-issues-tracker': 'Create new PR or Issue',
      'private-notes': 'Create new note',
      'branch-planner': 'Create new task',
      'bot-logs': 'Add new bot'
    };
    console.log(actionMap[selectedSection] || 'Create new item');
  };

  React.useEffect(() => {
    handleSectionChange(selectedSection);
  }, [selectedSection]);

  // Add error UI for auth/token issues
  if (dataError && (dataError.includes('Access token required') || dataError.includes('401') || dataError.includes('403'))) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p>{dataError}</p>
        <p className="mt-2 text-sm text-red-500">Please log in again to view real contribution data.</p>
      </div>
    );
  }

  // Add general error UI for other errors
  if (dataError) {
    return (
      <div className="p-6 text-center text-orange-600 bg-orange-50 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Data Loading Error</h2>
        <p>{dataError}</p>
        <p className="mt-2 text-sm text-orange-500">Please try refreshing the page or check your connection.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className={branchInfo.color}>●</span>
                {getSectionTitle()}
              </h2>
              
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleFilterClick}>
              <Filter size={16} className="mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto pb-0 mb-0">
        {renderSectionContent()}
      </div>

      {/* Filter Modal Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {(selectedSection === 'pr-issues-tracker' || selectedSection === 'pr-tracker') && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="font-semibold mb-2">Pull Requests</div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block mb-1 text-sm font-medium">Status</label>
                      <Select value={String(prFilters.status)} onValueChange={v => handlePRFilterChange('status', String(v))}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                          {allPRStatuses.map(status => (
                            <SelectItem key={String(status)} value={String(status)}>{String(status)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1 text-sm font-medium">Labels</label>
                      <div className="flex flex-wrap gap-2">
                        {allPRLabels.map(label => (
                          <label key={String(label)} className="flex items-center gap-1 text-xs cursor-pointer">
                            <Checkbox checked={prFilters.labels.includes(String(label))} onCheckedChange={() => handlePRLabelToggle(String(label))} />
                            {String(label)}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {(selectedSection === 'pr-issues-tracker' || selectedSection === 'issue-tracker') && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="font-semibold mb-2">Issues</div>
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[120px]">
                      <label className="block mb-1 text-sm font-medium">Status</label>
                      <Select value={String(issueFilters.status)} onValueChange={v => handleIssueFilterChange('status', String(v))}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                          {allIssueStatuses.map(status => (
                            <SelectItem key={String(status)} value={String(status)}>{String(status)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="block mb-1 text-sm font-medium">Type</label>
                      <Select value={String(issueFilters.type)} onValueChange={v => handleIssueFilterChange('type', String(v))}>
                        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">all</SelectItem>
                          {allIssueTypes.map(type => (
                            <SelectItem key={String(type)} value={String(type)}>{String(type)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="block mb-1 text-sm font-medium">Priority</label>
                      <Select value={String(issueFilters.priority)} onValueChange={v => handleIssueFilterChange('priority', String(v))}>
                        <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">all</SelectItem>
                          {allIssuePriorities.map(priority => (
                            <SelectItem key={String(priority)} value={String(priority)}>{String(priority)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="block mb-1 text-sm font-medium">Labels</label>
                      <div className="flex flex-wrap gap-2">
                        {allIssueLabels.map(label => (
                          <label key={String(label)} className="flex items-center gap-1 text-xs cursor-pointer">
                            <Checkbox checked={issueFilters.labels.includes(String(label))} onCheckedChange={() => handleIssueLabelToggle(String(label))} />
                            {String(label)}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button onClick={applyFilters}>Apply Filters</Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchContributionManager;
