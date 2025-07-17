"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Star,
  GitBranch,
  Code,
  Filter,
  Plus,
  ExternalLink,
  Users,
  Calendar,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { useGitHubData } from "@/hooks/useGitHubData"
import { formatDistanceToNow } from "date-fns"

interface ProjectCardProps {
  project: {
    name: string
    description: string
    language: string
    stars: number
    forks: number
    updated: string
    private: boolean
    url: string
  }
}

function ProjectCard({ project }: ProjectCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="truncate">{project.name}</span>
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {project.description || "No description available"}
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" className="ml-2" asChild>
              <a href={project.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {project.stars}
              </div>
              <div className="flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                {project.forks}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(project.updated), { addSuffix: true })}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            {project.language && (
              <Badge variant="secondary" className="text-xs">
                {project.language}
              </Badge>
            )}
            <Badge variant={project.private ? "outline" : "default"} className="text-xs">
              {project.private ? "Private" : "Public"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const [showProjectFilter, setShowProjectFilter] = useState(false)
  const [shownProjectsCount, setShownProjectsCount] = useState(6)
  const [shownStarredCount, setShownStarredCount] = useState(6)
  const [projectFilter, setProjectFilter] = useState({
    language: 'all',
    visibility: 'all',
    sortBy: 'updated'
  })

  const {
    loading: dataLoading,
    updating,
    error: dataError,
    repositories,
    starredRepositories,
    refreshData,
  } = useGitHubData()

  // Filter repositories based on selected filters
  const getFilteredRepositories = (repos: any[]) => {
    return repos.filter(repo => {
      // Language filter
      if (projectFilter.language !== 'all' && repo.language !== projectFilter.language) {
        return false;
      }
      
      // Visibility filter
      if (projectFilter.visibility !== 'all') {
        const isPublic = !repo.private;
        if (projectFilter.visibility === 'public' && !isPublic) return false;
        if (projectFilter.visibility === 'private' && isPublic) return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by selected criteria
      switch (projectFilter.sortBy) {
        case 'stars':
          return b.stargazers_count - a.stargazers_count;
        case 'forks':
          return b.forks_count - a.forks_count;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  };

  const handleCreateRepository = () => {
    window.open('https://github.com/new', '_blank')
  }

  const handleProjectFilter = () => {
    setShowProjectFilter(!showProjectFilter)
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Error loading repositories: {dataError}
      </div>
    )
  }

  const filteredRepos = getFilteredRepositories(repositories)
  const filteredStarredRepos = getFilteredRepositories(starredRepositories)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Projects Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your repositories and starred projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleProjectFilter}>
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" onClick={handleCreateRepository}>
            <Plus className="w-4 h-4 mr-2" />
            New Repository
          </Button>
        </div>
      </div>

      {/* Project Filters */}
      {showProjectFilter && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={projectFilter.language}
                    onValueChange={(value) => setProjectFilter(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      <SelectItem value="JavaScript">JavaScript</SelectItem>
                      <SelectItem value="TypeScript">TypeScript</SelectItem>
                      <SelectItem value="Python">Python</SelectItem>
                      <SelectItem value="Java">Java</SelectItem>
                      <SelectItem value="Go">Go</SelectItem>
                      <SelectItem value="Rust">Rust</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={projectFilter.visibility}
                    onValueChange={(value) => setProjectFilter(prev => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sort by</Label>
                  <Select
                    value={projectFilter.sortBy}
                    onValueChange={(value) => setProjectFilter(prev => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated">Last Updated</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="stars">Stars</SelectItem>
                      <SelectItem value="forks">Forks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Projects Tabs */}
      <Tabs defaultValue="my-projects" className="w-full">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="my-projects" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            My Repositories ({repositories.length})
          </TabsTrigger>
          <TabsTrigger value="starred" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Starred Projects ({starredRepositories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-projects" className="mt-6">
          {filteredRepos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No repositories found</p>
              <p className="text-xs">Create your first repository to get started</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRepos.slice(0, shownProjectsCount).map((repo) => (
                  <ProjectCard 
                    key={repo.id} 
                    project={{
                      name: repo.name,
                      description: repo.description,
                      language: repo.language,
                      stars: repo.stargazers_count || 0,
                      forks: repo.forks_count || 0,
                      updated: repo.updated_at,
                      private: repo.private,
                      url: repo.html_url,
                    }}
                  />
                ))}
              </div>
              {filteredRepos.length > shownProjectsCount && (
                <div className="text-center mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => setShownProjectsCount(prev => prev + 6)}
                  >
                    Show More ({filteredRepos.length - shownProjectsCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="starred" className="mt-6">
          {filteredStarredRepos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No starred repositories found</p>
              <p className="text-xs">Star some repositories on GitHub to see them here</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStarredRepos.slice(0, shownStarredCount).map((repo) => (
                  <ProjectCard 
                    key={repo.id} 
                    project={{
                      name: repo.name,
                      description: repo.description,
                      language: repo.language,
                      stars: repo.stargazers_count || 0,
                      forks: repo.forks_count || 0,
                      updated: repo.updated_at,
                      private: repo.private,
                      url: repo.html_url,
                    }}
                  />
                ))}
              </div>
              {filteredStarredRepos.length > shownStarredCount && (
                <div className="text-center mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => setShownStarredCount(prev => prev + 6)}
                  >
                    Show More ({filteredStarredRepos.length - shownStarredCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}