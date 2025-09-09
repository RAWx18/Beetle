"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, User, Building, Code, Filter, X, Star, GitBranch, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { githubSearchService, GitHubRepository, GitHubUser, GitHubOrganization } from "@/lib/search-service"
import { useDebouncedSearch } from "@/hooks/useDebounce"
import { toast } from "sonner"

export function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("repositories")
  const [filters, setFilters] = useState<string[]>([])

  // Use debounced search with real GitHub data
  const {
    results: searchResults,
    isLoading,
    error,
    search
  } = useDebouncedSearch(
    async (query: string) => {
      try {
        return await githubSearchService.searchAll(query, 1, 10); // Get more results for advanced view
      } catch (error) {
        toast.error('Search failed. Please check your connection and try again.');
        throw error;
      }
    },
    300 // 300ms debounce
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    
    if (query.trim()) {
      search(query);
    }
  }

  const addFilter = (filter: string) => {
    if (!filters.includes(filter)) {
      setFilters([...filters, filter])
    }
  }

  const removeFilter = (filter: string) => {
    setFilters(filters.filter((f) => f !== filter))
  }

  const repositories = searchResults?.repositories || [];
  const users = searchResults?.users || [];
  const organizations = searchResults?.organizations || [];

  return (
    <div className="space-y-6">
      {/* Enhanced Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search repositories, users, organizations..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-12 pr-16 py-4 text-lg bg-background border-2 border-muted hover:border-orange-500/50 focus:border-orange-500 rounded-2xl"
        />
        <Button
          size="sm"
          variant="outline"
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          onClick={() => {
            /* Open advanced filters */
          }}
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {filters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {filters.map((filter) => (
              <motion.div
                key={filter}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filter}
                  <button onClick={() => removeFilter(filter)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show loading state */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Searching...</div>
        </div>
      )}

      {/* Show error state */}
      {error && (
        <div className="text-center py-8 text-red-500">
          <div>Error: {error}</div>
        </div>
      )}

      {/* Search Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="repositories" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Repositories ({repositories.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Organizations ({organizations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repositories" className="space-y-4">
          {repositories.map((repo: GitHubRepository, index: number) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-orange-500 hover:text-orange-600 mb-2">{repo.name}</h3>
                      <p className="text-muted-foreground mb-3">{repo.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {repo.topics.slice(0, 5).map((topic: string) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Star className="w-4 h-4 mr-1" />
                      Star
                    </Button>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {repo.stargazers_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <GitBranch className="w-4 h-4" />
                      {repo.forks_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </div>
                    {repo.language && (
                      <Badge variant="outline">
                        {repo.language}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {users.map((user: GitHubUser, index: number) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {(user.name || user.login)
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{user.name || user.login}</h3>
                      <p className="text-muted-foreground mb-2">@{user.login}</p>
                      <p className="text-sm text-muted-foreground mb-3">{user.bio}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{user.followers} followers</span>
                        <span>{user.following} following</span>
                        <span>{user.public_repos} repositories</span>
                        {user.company && <span>{user.company}</span>}
                        {user.location && <span>{user.location}</span>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Follow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          {organizations.map((org: GitHubOrganization, index: number) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={org.avatar_url} />
                      <AvatarFallback>{(org.name || org.login)[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{org.name || org.login}</h3>
                      <p className="text-muted-foreground mb-2">{org.bio}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{org.public_repos} repositories</span>
                        {org.location && <span>{org.location}</span>}
                        <span>Since {new Date(org.created_at).getFullYear()}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Building className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
