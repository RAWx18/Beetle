import React, { useState, useMemo, useEffect } from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Filter, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { contributionData, transformGitHubData, fallbackContributionData } from './contribution-data';
import GitHubAPI from '@/lib/github-api';
import BranchActivity from './BranchActivity';
import OverviewDashboard from './OverviewDashboard';
import MyContributions from './MyContributions';
import BranchPlanner from './BranchPlanner';
import SmartSuggestions from './SmartSuggestions';
import SavedFilters from './SavedFilters';
import PinnedWatched from './PinnedWatched';
import PrivateNotes from './PrivateNotes';
import ImportBranch from './ImportBranch';
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

interface BranchContributionManagerProps {
  selectedSection?: string;
}

const BranchContributionManager = ({ selectedSection = 'overview' }: BranchContributionManagerProps) => {
  const { selectedBranch, getBranchInfo } = useBranch();
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [issueFilters, setIssueFilters] = useState<{ status: string; type: string; priority: string; labels: string[] }>({ status: 'all', type: 'all', priority: 'all', labels: [] });
  const [prFilters, setPrFilters] = useState<{ status: string; labels: string[] }>({ status: 'all', labels: [] });
  const [realContributionData, setRealContributionData] = useState(fallbackContributionData);
  const [dataLoading, setDataLoading] = useState(true);
  
  const branchInfo = getBranchInfo();

  // Fetch real GitHub data
  useEffect(() => {
    const fetchRealData = async () => {
      if (!token) {
        setRealContributionData(fallbackContributionData);
        setDataLoading(false);
        return;
      }

      try {
        setDataLoading(true);
        const githubAPI = new GitHubAPI(token);
        
        // Fetch user activity
        const userActivity = await githubAPI.getUserActivity(user?.login, 1, 100);
        
        // Fetch pull requests from user's repositories
        const userRepos = await githubAPI.getUserRepositories(1, 10);
        const allPullRequests: any[] = [];
        const allIssues: any[] = [];
        const allCommits: any[] = [];

        // Fetch data from each repository
        for (const repo of userRepos.slice(0, 5)) { // Limit to 5 repos to avoid rate limits
          try {
            const [prs, issues, commits] = await Promise.all([
              githubAPI.getRepositoryPullRequests(repo.owner.login, repo.name, 'all', 1, 20),
              githubAPI.getRepositoryIssues(repo.owner.login, repo.name, 'all', 1, 20),
              githubAPI.getRepositoryCommits(repo.owner.login, repo.name, 'main', 1, 20)
            ]);
            
            allPullRequests.push(...prs);
            allIssues.push(...issues);
            allCommits.push(...commits);
          } catch (error) {
            console.error(`Error fetching data for ${repo.full_name}:`, error);
          }
        }

        // Transform the data
        const transformedData = transformGitHubData(userActivity, allPullRequests, allIssues, allCommits, user);
        setRealContributionData(transformedData as typeof fallbackContributionData);
      } catch (error) {
        console.error('Error fetching real contribution data:', error);
        setRealContributionData(fallbackContributionData);
      } finally {
        setDataLoading(false);
      }
    };

    fetchRealData();
  }, [user, token]);

  // Filter data based on selected branch
  const branchData = useMemo(() => {
    const branchKey = selectedBranch;
    return {
      pullRequests: realContributionData.pullRequests.filter(pr => 
        pr.targetBranch === branchKey || pr.sourceBranch === branchKey
      ),
      issues: realContributionData.issues.filter(issue => 
        issue.branch === branchKey || issue.labels.includes(branchKey)
      ),
      activity: realContributionData.activity.filter(activity => 
        activity.branch === branchKey
      )
    };
  }, [selectedBranch, realContributionData]);

  const allIssueLabels = Array.from(new Set(realContributionData.issues.flatMap(i => i.labels)));
  const allPRLabels = Array.from(new Set(realContributionData.pullRequests.flatMap(pr => pr.labels)));
  const allIssueTypes = Array.from(new Set(realContributionData.issues.map(i => i.type)));
  const allIssuePriorities = Array.from(new Set(realContributionData.issues.map(i => i.priority)));
  const allIssueStatuses = ['all', ...Array.from(new Set(realContributionData.issues.map(i => i.status)))];
  const allPRStatuses = ['all', ...Array.from(new Set(realContributionData.pullRequests.map(pr => pr.status)))]

  const filteredData = useMemo(() => {
    let prs = branchData.pullRequests;
    let issues = branchData.issues;
    if (selectedSection === 'pr-issues-tracker' || selectedSection === 'pr-tracker') {
      if (prFilters.status !== 'all') prs = prs.filter(pr => pr.status === prFilters.status);
      if (prFilters.labels.length > 0) prs = prs.filter(pr => pr.labels.some(l => prFilters.labels.includes(l)));
    }
    if (selectedSection === 'pr-issues-tracker' || selectedSection === 'issue-tracker') {
      if (issueFilters.status !== 'all') issues = issues.filter(issue => issue.status === issueFilters.status);
      if (issueFilters.type !== 'all') issues = issues.filter(issue => issue.type === issueFilters.type);
      if (issueFilters.priority !== 'all') issues = issues.filter(issue => issue.priority === issueFilters.priority);
      if (issueFilters.labels.length > 0) issues = issues.filter(issue => issue.labels.some(l => issueFilters.labels.includes(l)));
    }
    if (searchQuery) {
      prs = prs.filter(pr =>
        pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.labels.some(label => label.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      issues = issues.filter(issue =>
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.assignee && issue.assignee.toLowerCase().includes(searchQuery.toLowerCase())) ||
        issue.labels.some(label => label.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return {
      pullRequests: prs,
      issues,
      activity: branchData.activity
    };
  }, [branchData, searchQuery, prFilters, issueFilters, selectedSection]);

  const handleSectionChange = async (newSection: string) => {
    setIsLoading(true);
    // Simulate loading time for section switching
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
  };

  const renderSectionContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      );
    }

    switch (selectedSection) {
      case 'overview':
        return <OverviewDashboard branchData={filteredData} branch={selectedBranch} />;
      case 'my-contributions':
        return <MyContributions branchData={filteredData} branch={selectedBranch} />;
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
      case 'import-branch':
        return <ImportBranch />;
      case 'bot-logs':
        return <BotLogs activities={filteredData.activity} branch={selectedBranch} />;
      default:
        return <OverviewDashboard branchData={filteredData} branch={selectedBranch} />;
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
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={handleNewClick}>
              <Plus size={16} className="mr-2" />
              New
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
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
                      <Select value={prFilters.status} onValueChange={v => handlePRFilterChange('status', v)}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                          {allPRStatuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1 text-sm font-medium">Labels</label>
                      <div className="flex flex-wrap gap-2">
                        {allPRLabels.map(label => (
                          <label key={label} className="flex items-center gap-1 text-xs cursor-pointer">
                            <Checkbox checked={prFilters.labels.includes(label)} onCheckedChange={() => handlePRLabelToggle(label)} />
                            {label}
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
                      <Select value={issueFilters.status} onValueChange={v => handleIssueFilterChange('status', v)}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                          {allIssueStatuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="block mb-1 text-sm font-medium">Type</label>
                      <Select value={issueFilters.type} onValueChange={v => handleIssueFilterChange('type', v)}>
                        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">all</SelectItem>
                          {allIssueTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="block mb-1 text-sm font-medium">Priority</label>
                      <Select value={issueFilters.priority} onValueChange={v => handleIssueFilterChange('priority', v)}>
                        <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">all</SelectItem>
                          {allIssuePriorities.map(priority => (
                            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="block mb-1 text-sm font-medium">Labels</label>
                      <div className="flex flex-wrap gap-2">
                        {allIssueLabels.map(label => (
                          <label key={label} className="flex items-center gap-1 text-xs cursor-pointer">
                            <Checkbox checked={issueFilters.labels.includes(label)} onCheckedChange={() => handleIssueLabelToggle(label)} />
                            {label}
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
