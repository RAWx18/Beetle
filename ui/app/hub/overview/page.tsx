"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { HubHeader } from '@/components/hub/HubHeader';
import { StatsCard } from '@/components/hub/overview/StatsCards';
import { RecentActivity } from '@/components/hub/overview/RecentActivity';
import { MonthlyGoals } from '@/components/hub/overview/MonthlyGoals';
import { QuickActions } from '@/components/hub/overview/QuickActions';
import { AIInsights } from '@/components/hub/overview/AIInsights';
import { AssignedIssues } from '@/components/hub/overview/AssignedIssues';
import GitHubAPI from '@/lib/github-api';
import { GitCommit, GitPullRequest, Star, Users, CheckCircle, GitMerge, BookOpen } from 'lucide-react';
import { HubOverviewSkeleton } from '@/components/hub/overview/HubOverviewSkeleton';

// Mock data for monthly goals and AI insights
const mockGoals = [
  { id: 1, title: 'Resolve 10 issues', progress: 60, icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
  { id: 2, title: 'Review 5 pull requests', progress: 80, icon: <GitMerge className="h-5 w-5 text-blue-500" /> },
  { id: 3, title: 'Contribute to a new repository', progress: 25, icon: <BookOpen className="h-5 w-5 text-purple-500" /> },
];

const mockInsights = [
  { id: 1, text: 'Based on your recent activity, you might be interested in contributing to `repo-x`.' },
  { id: 2, text: 'You have a good track record with `bug` labels. Consider looking at issues with this label.' },
];

export default function HubOverviewPage() {
  const { user, loading: authLoading, token, githubApi, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [pullRequests, setPullRequests] = useState<any[]>([]);

  useEffect(() => {
    if (githubApi && isAuthenticated) {
      const api = githubApi;
      Promise.all([
        api.getAggregatedSummary(),
        api.getUserActivity(user?.login),
        api.getAggregatedIssues('open'),
        api.getAggregatedPullRequests('open'),
      ]).then(([summary, activities, issues, pullRequests]) => {
        setSummary(summary);
        setActivities(activities);
        setIssues(issues);
        setPullRequests(pullRequests);
        setLoading(false);
      }).catch(error => {
        console.error("Failed to fetch overview data:", error);
        // Optionally, set an error state to show a message to the user
        setLoading(false);
      });
    }
  }, [githubApi, isAuthenticated, user?.login]);

  if (authLoading || loading) {
    return <HubOverviewSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <HubHeader
        title="Overview"
        subtitle={`Welcome back, ${user?.name || user?.login || 'developer'}!`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <StatsCard title="Commits Today" value={summary?.commitsToday || 0} icon={<GitCommit className="h-4 w-4 text-gray-500" />} />
        <StatsCard title="Active PRs" value={summary?.activePRs || 0} icon={<GitPullRequest className="h-4 w-4 text-gray-500" />} />
        <StatsCard title="Stars Earned" value={summary?.starsEarned || 0} icon={<Star className="h-4 w-4 text-gray-500" />} />
        <StatsCard title="Collaborators" value={summary?.collaborators || 0} icon={<Users className="h-4 w-4 text-gray-500" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={activities} />
        </div>
        <div>
          <MonthlyGoals goals={mockGoals} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <AssignedIssues issues={issues} pullRequests={pullRequests} />
        </div>
        <div>
          <QuickActions />
          <AIInsights insights={mockInsights} />
        </div>
      </div>
    </div>
  );
}