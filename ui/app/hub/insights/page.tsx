"use client";

import { HubHeader } from "@/components/hub/HubHeader";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { InsightCard } from "@/components/hub/insights/InsightCard";
import { Chart } from "@/components/hub/insights/Chart";
import GitHubAPI, { Repository } from "@/lib/github-api";
import { GitCommit, GitPullRequest, Star, Users } from "lucide-react";
import { HubInsightsSkeleton } from "@/components/hub/insights/HubInsightsSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContributorSpotlight } from "@/components/hub/insights/ContributorSpotlight";
import { PullRequestVelocity } from "@/components/hub/insights/PullRequestVelocity";

export default function HubInsightsPage() {
  const { token, user, githubApi } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [languages, setLanguages] = useState<any[]>([]);
  const [commitHistory, setCommitHistory] = useState<any[]>([]);
  const [contributors, setContributors] = useState<any[]>([]);
  const [pullRequestVelocity, setPullRequestVelocity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("all");

  useEffect(() => {
    if (githubApi) {
      const api = githubApi;
      setLoading(true);

      api.getUserRepositories().then((repos) => {
        setRepositories(repos);
      });

      const fetchInsights = async () => {
        const [summary, repos] = await Promise.all([
          api.getAggregatedSummary(),
          selectedRepo === "all" ? api.getUserRepositories() : [await api.getRepository(selectedRepo.split('/')[0], selectedRepo.split('/')[1])],
        ]);

        setSummary(summary);

        const langData = repos.reduce((acc, repo) => {
          if (repo.language) {
            const lang = acc.find((l) => l.name === repo.language);
            if (lang) {
              lang.value += 1;
            } else {
              acc.push({ name: repo.language, value: 1 });
            }
          }
          return acc;
        }, [] as { name: string; value: number }[]);
        setLanguages(langData);

        const commitPromises = repos.map((repo) =>
          api.getRepositoryCommits(repo.owner.login, repo.name)
        );
        const allCommits = await Promise.all(commitPromises);
        const flatCommits = allCommits.flat();
        const commitData = flatCommits.reduce((acc, commit) => {
          const date = new Date(commit.commit.author.date).toLocaleDateString();
          const day = acc.find((d) => d.name === date);
          if (day) {
            day.value += 1;
          } else {
            acc.push({ name: date, value: 1 });
          }
          return acc;
        }, [] as { name: string; value: number }[]);
        setCommitHistory(commitData);

        if (selectedRepo !== 'all') {
            const [owner, repoName] = selectedRepo.split('/');
            const contributorsData = await api.getRepositoryContributors(owner, repoName);
            setContributors(contributorsData);
        }

        // Mock PR velocity data
        const prVelocityData = [
          { date: '2023-01-01', opened: 4, closed: 2 },
          { date: '2023-01-02', opened: 5, closed: 3 },
          { date: '2023-01-03', opened: 2, closed: 4 },
        ];
        setPullRequestVelocity(prVelocityData);

        setLoading(false);
      };

      fetchInsights();
    }
  }, [token, selectedRepo]);

  if (loading) {
    return <HubInsightsSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <HubHeader
        title="Insights"
        subtitle="Explore insights and trends in your projects."
      />
      <div className="flex justify-end mb-4">
        <Select onValueChange={setSelectedRepo} defaultValue="all">
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a repository" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Repositories</SelectItem>
            {repositories.map((repo) => (
              <SelectItem key={repo.id} value={repo.full_name}>
                {repo.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <InsightCard title="Total Commits" value={summary?.totalCommits || 0} icon={<GitCommit className="h-4 w-4 text-gray-500" />} />
        <InsightCard title="Open PRs" value={summary?.openPRs || 0} icon={<GitPullRequest className="h-4 w-4 text-gray-500" />} />
        <InsightCard title="Total Stars" value={summary?.totalStars || 0} icon={<Star className="h-4 w-4 text-gray-500" />} />
        <InsightCard title="Total Collaborators" value={summary?.totalCollaborators || 0} icon={<Users className="h-4 w-4 text-gray-500" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Chart data={languages} title="Language Distribution" />
        <Chart data={commitHistory} title="Commit History" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {selectedRepo !== 'all' && <ContributorSpotlight data={contributors} />}
        <PullRequestVelocity data={pullRequestVelocity} />
      </div>
    </div>
  );
}