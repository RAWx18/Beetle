"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, User, Building, Code, Star, GitBranch, ExternalLink, Loader2, Filter, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { githubSearchService, GitHubRepository, GitHubUser, GitHubOrganization } from "@/lib/search-service"
import { useDebouncedSearch } from "@/hooks/useDebounce"
import { toast } from "sonner"

interface SearchResult {
  type: "repository" | "user" | "organization"
  id: string
  data: any
}

interface EnhancedSearchProps {
  onResultSelect: (result: SearchResult) => void
  onViewAllResults: (query: string, type?: string) => void
}

export function EnhancedSearch({ onResultSelect, onViewAllResults }: EnhancedSearchProps) {
  // Remove debounced search and only trigger search on Enter
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (searchQuery.length > 2) {
      setIsLoading(true);
      setError(null);
      setIsOpen(true);
      try {
        const results = await githubSearchService.searchAll(searchQuery, 1, 4);
        setSearchResults(results);
      } catch (err: any) {
        setError(err.message || 'Search failed. Please check your connection and try again.');
        setSearchResults(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsOpen(false);
      setSearchResults(null);
      setError(null);
    }
  };

  // Move handlers above JSX usage
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleResultClick = (type: "repository" | "user" | "organization", data: any) => {
    onResultSelect({ type, id: data.id || data.login || data.name, data })
    setIsOpen(false)
    setSearchQuery("")
  }

  const totalResults = searchResults 
    ? (searchResults.repositories?.length || 0) + (searchResults.users?.length || 0) + (searchResults.organizations?.length || 0)
    : 0;
  const hasResults = totalResults > 0

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl">
      {/* Enhanced Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search repositories, users, organizations... (Press / to focus)"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => { if (searchQuery.length > 2) setIsOpen(true); }}
          className="pl-12 pr-16 py-4 text-base bg-background border-2 border-muted hover:border-orange-500/50 focus:border-orange-500 rounded-xl transition-all duration-200"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced Dropdown Results */}
      <AnimatePresence>
        {isOpen && searchQuery.length > 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-3 bg-background border-2 border-muted rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-hidden"
          >
            {!isLoading && error && (
              <div className="p-8 text-center text-red-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Search Error</h3>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!isLoading && !error && !hasResults && searchQuery.length > 2 && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No results found</h3>
                <p className="text-sm">Try adjusting your search terms or browse trending repositories</p>
              </div>
            )}

            {!isLoading && !error && searchResults && (
              <div className="max-h-[80vh] overflow-y-auto">
                {/* Quick Stats Header */}
                <div className="p-4 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Found {totalResults} results for "{searchQuery}"
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {searchResults.repositories?.length || 0} repos
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {searchResults.users?.length || 0} users
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {searchResults.organizations?.length || 0} orgs
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Repositories Section */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Code className="w-4 h-4 text-blue-500" />
                      Repositories
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewAllResults(searchQuery, "repositories")}
                      className="text-xs"
                    >
                      View all <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {searchResults.repositories && searchResults.repositories.length > 0 ? (
                      searchResults.repositories.map((repo: GitHubRepository, index: number) => (
                        <motion.div
                          key={repo.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleResultClick("repository", repo)}
                          className="flex items-start gap-4 p-4 hover:bg-muted/50 rounded-xl cursor-pointer group transition-all duration-200"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Code className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm group-hover:text-orange-500 transition-colors truncate">
                                {repo.name}
                              </h4>
                              {repo.private && (
                                <Badge variant="outline" className="text-xs">
                                  Private
                                </Badge>
                              )}
                              {repo.archived && (
                                <Badge variant="secondary" className="text-xs">
                                  Archived
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{repo.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                {repo.language || 'Unknown'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {repo.stargazers_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                {repo.forks_count}
                              </span>
                              <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {repo.topics.slice(0, 3).map((topic: string) => (
                                <Badge key={topic} variant="outline" className="text-xs px-1 py-0">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm">No repositories found</div>
                    )}
                  </div>
                </div>

                {/* Users Section */}
                <Separator />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="w-4 h-4 text-green-500" />
                      Users
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewAllResults(searchQuery, "users")}
                      className="text-xs"
                    >
                      View all <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {searchResults.users && searchResults.users.length > 0 ? (
                      searchResults.users.map((user: GitHubUser, index: number) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleResultClick("user", user)}
                          className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-xl cursor-pointer group transition-all duration-200"
                        >
                          <Avatar className="w-12 h-12 border-2 border-muted">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {(user.name || user.login)
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm group-hover:text-orange-500 transition-colors">
                                {user.name || user.login}
                              </h4>
                              {user.site_admin && (
                                <Badge variant="default" className="text-xs">
                                  Staff
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">@{user.login}</p>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{user.bio}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{user.followers} followers</span>
                              <span>{user.following} following</span>
                              <span>{user.public_repos} repos</span>
                              {user.company && <span>{user.company}</span>}
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm">No users found</div>
                    )}
                  </div>
                </div>

                {/* Organizations Section */}
                <Separator />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building className="w-4 h-4 text-purple-500" />
                      Organizations
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewAllResults(searchQuery, "organizations")}
                      className="text-xs"
                    >
                      View all <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {searchResults.organizations && searchResults.organizations.length > 0 ? (
                      searchResults.organizations.map((org: GitHubOrganization, index: number) => (
                        <motion.div
                          key={org.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleResultClick("organization", org)}
                          className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-xl cursor-pointer group transition-all duration-200"
                        >
                          <Avatar className="w-12 h-12 border-2 border-muted">
                            <AvatarImage src={org.avatar_url} />
                            <AvatarFallback>{(org.name || org.login)[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm group-hover:text-orange-500 transition-colors">
                                {org.name || org.login}
                              </h4>
                              {org.site_admin && (
                                <Badge variant="default" className="text-xs">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{org.bio}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{org.public_repos} repositories</span>
                              {org.location && <span>{org.location}</span>}
                              <span>Since {new Date(org.created_at).getFullYear()}</span>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm">No organizations found</div>
                    )}
                  </div>
                </div>

                {/* Enhanced Footer */}
                <div className="border-t bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↵</kbd> to select •{" "}
                      <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to close
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onViewAllResults(searchQuery)} className="text-xs">
                      View all {totalResults} results
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
