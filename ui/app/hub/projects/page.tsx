"use client";

import { HubHeader } from "@/components/hub/HubHeader";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectList } from "@/components/hub/projects/ProjectList";
import { SearchBar } from "@/components/hub/projects/SearchBar";
import { FilterDropdown } from "@/components/hub/projects/FilterDropdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GitHubAPI, { Repository } from "@/lib/github-api";
import { HubProjectsSkeleton } from "@/components/hub/projects/HubProjectsSkeleton";

export default function HubProjectsPage() {
  const { token, user, githubApi } = useAuth();
  const [trending, setTrending] = useState<Repository[]>([]);
  const [yours, setYours] = useState<Repository[]>([]);
  const [contributed, setContributed] = useState<Repository[]>([]);
  const [forked, setForked] = useState<Repository[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (githubApi) {
      const api = githubApi;
      setLoading(true);
      Promise.all([
        api.getTrendingRepositories(),
        api.getUserRepositories(),
      ]).then(([trending, userRepos]) => {
        setTrending(trending);
        const userOwned = userRepos.filter((repo) => !repo.fork && repo.owner.login === user?.login);
        const userForked = userRepos.filter((repo) => repo.fork && repo.owner.login === user?.login);
        const userContributed = userRepos.filter((repo) => repo.owner.login !== user?.login);

        setYours(userOwned);
        setForked(userForked);
        setContributed(userContributed);

        const allLanguages = [...new Set(userRepos.map((repo) => repo.language).filter(Boolean))];
        setLanguages(allLanguages as string[]);

        setLoading(false);
      });
    }
  }, [token, user]);

  const filterProjects = (projects: Repository[]) => {
    let filteredProjects = projects;

    if (filter !== "all") {
      if (filter === "owner") {
        filteredProjects = filteredProjects.filter((p) => p.owner.login === user?.login && !p.fork);
      } else if (filter === "member") {
        filteredProjects = filteredProjects.filter((p) => p.owner.login !== user?.login);
      } else if (filter === "fork") {
        filteredProjects = filteredProjects.filter((p) => p.fork);
      } else {
        filteredProjects = filteredProjects.filter((p) => p.language === filter);
      }
    }

    if (searchQuery) {
      filteredProjects = filteredProjects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredProjects;
  };

  if (loading) {
    return <HubProjectsSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <HubHeader
        title="Projects"
        subtitle="Manage your projects and repositories."
      />
      <div className="mt-6 flex justify-between items-center">
        <SearchBar onSearch={setSearchQuery} />
        <FilterDropdown onFilterChange={setFilter} languages={languages} />
      </div>
      <Tabs defaultValue="trending" className="mt-6">
        <TabsList>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="yours">Your Projects</TabsTrigger>
          <TabsTrigger value="contributed">Contributed</TabsTrigger>
          <TabsTrigger value="forked">Forked</TabsTrigger>
        </TabsList>
        <TabsContent value="trending">
          <ProjectList projects={filterProjects(trending)} />
        </TabsContent>
        <TabsContent value="yours">
          <ProjectList projects={filterProjects(yours)} />
        </TabsContent>
        <TabsContent value="contributed">
          <ProjectList projects={filterProjects(contributed)} />
        </TabsContent>
        <TabsContent value="forked">
          <ProjectList projects={filterProjects(forked)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}