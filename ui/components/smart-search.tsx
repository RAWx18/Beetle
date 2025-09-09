"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, User, Building, Code, Star, GitBranch, ExternalLink, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { githubSearchService, GitHubRepository, GitHubUser, GitHubOrganization } from "@/lib/search-service"
import { useDebouncedSearch } from "@/hooks/useDebounce"
import { toast } from "sonner"

export function SmartSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Use debounced search with real GitHub data
  const {
    results: searchResults,
    isLoading,
    error,
    search
  } = useDebouncedSearch(
    async (query: string) => {
      try {
        return await githubSearchService.searchAll(query, 1, 3); // Get 3 results per category for compact view
      } catch (error) {
        toast.error('Search failed. Please check your connection and try again.');
        throw error;
      }
    },
    300 // 300ms debounce
  );

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

  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (query.length > 2) {
      setIsOpen(true)
      search(query)
    } else {
      setIsOpen(false)
    }
  }

  const hasResults = searchResults && (
    (searchResults.repositories?.length || 0) + 
    (searchResults.users?.length || 0) + 
    (searchResults.organizations?.length || 0)
  ) > 0

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search repositories, users, organizations..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchQuery.length > 2 && setIsOpen(true)}
          className="pl-12 pr-4 py-3 text-base bg-background border-2 border-muted hover:border-orange-500/50 focus:border-orange-500 rounded-xl"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Compact Dropdown Results */}
      <AnimatePresence>
        {isOpen && searchQuery.length > 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background border-2 border-muted rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden"
          >
            {!isLoading && error && (
              <div className="p-6 text-center text-red-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Error: {error}</p>
              </div>
            )}

            {!isLoading && !error && !hasResults && searchQuery.length > 2 && (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{searchQuery}"</p>
              </div>
            )}

            {!isLoading && !error && hasResults && searchResults && (
              <div className="max-h-96 overflow-y-auto">
                {/* Repositories Section */}
                {searchResults.repositories && searchResults.repositories.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                      <Code className="w-4 h-4" />
                      Repositories
                    </div>
                    <div className="space-y-2">
                      {searchResults.repositories.map((repo: GitHubRepository) => (
                        <motion.div
                          key={repo.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer group transition-colors"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Code className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm group-hover:text-orange-500 transition-colors truncate">
                              {repo.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{repo.description}</div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {repo.stargazers_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                {repo.forks_count}
                              </span>
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {repo.language || 'Unknown'}
                              </Badge>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Section */}
                {searchResults.users && searchResults.users.length > 0 && (
                  <>
                    {searchResults.repositories && searchResults.repositories.length > 0 && <Separator />}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                        <User className="w-4 h-4" />
                        Users
                      </div>
                      <div className="space-y-2">
                        {searchResults.users.map((user: GitHubUser) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer group transition-colors"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {(user.name || user.login)
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm group-hover:text-orange-500 transition-colors">
                                {user.name || user.login}
                              </div>
                              <div className="text-xs text-muted-foreground">@{user.login}</div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{user.followers} followers</span>
                                <span>{user.public_repos} repos</span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Organizations Section */}
                {searchResults.organizations && searchResults.organizations.length > 0 && (
                  <>
                    {((searchResults.repositories && searchResults.repositories.length > 0) || (searchResults.users && searchResults.users.length > 0)) && <Separator />}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                        <Building className="w-4 h-4" />
                        Organizations
                      </div>
                      <div className="space-y-2">
                        {searchResults.organizations.map((org: GitHubOrganization) => (
                          <motion.div
                            key={org.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer group transition-colors"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={org.avatar_url} />
                              <AvatarFallback className="text-xs">{(org.name || org.login)[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm group-hover:text-orange-500 transition-colors">
                                {org.name || org.login}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{org.bio}</div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{org.public_repos} repos</span>
                                {org.location && <span>{org.location}</span>}
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* View All Results Footer */}
                <div className="border-t bg-muted/30 p-3">
                  <Button variant="ghost" size="sm" className="w-full text-sm">
                    View all results for "{searchQuery}"
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
