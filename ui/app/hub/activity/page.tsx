"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw } from 'lucide-react';
import GitHubAPI, { UserActivity, Repository } from '@/lib/github-api';
import { Timeline } from '@/components/hub/activity/Timeline';
import { HubActivitySkeleton } from '@/components/hub/activity/HubActivitySkeleton';
import { ActivityFilters } from '@/components/hub/activity/ActivityFilters';

export default function HubActivityPage() {
  const { token, user, githubApi } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<any>({ repository: "all", dateRange: null });
  const [repositories, setRepositories] = useState<Repository[]>([]);

  const fetchActivities = useCallback(async () => {
    if (!githubApi) return;

    setLoading(true);
    const api = githubApi;
    try {
      const [userActivities, repos] = await Promise.all([
        api.getUserActivity(user?.login),
        api.getUserRepositories(),
      ]);
      setActivities(userActivities);
      setFilteredActivities(userActivities);
      setRepositories(repos);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user?.login]);

  const refreshActivities = useCallback(async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  }, [fetchActivities]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    let filtered = activities;

    if (filters.repository !== "all") {
      filtered = filtered.filter((activity) => activity.repo.name === filters.repository);
    }

    if (filters.dateRange) {
      filtered = filtered.filter((activity) => {
        const activityDate = new Date(activity.created_at);
        return activityDate >= filters.dateRange.from && activityDate <= filters.dateRange.to;
      });
    }

    setFilteredActivities(filtered);
  }, [filters, activities]);

  const groupedActivities = filteredActivities.reduce((acc, activity) => {
    const date = new Date(activity.created_at).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as { [key: string]: UserActivity[] });

  if (loading) {
    return <HubActivitySkeleton />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            Activity Feed
          </h2>
          <p className="text-muted-foreground mt-1">
            Recent activity across all your repositories.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ActivityFilters repositories={repositories} onFilterChange={setFilters} />
          <Button
            variant="outline"
            size="sm"
            onClick={refreshActivities}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates and changes from your repositories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedActivities).length > 0 ? (
            Object.entries(groupedActivities).map(([date, activities]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold my-4">{date}</h3>
                <Timeline activities={activities} />
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground">
                No activities found for the selected filter.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}