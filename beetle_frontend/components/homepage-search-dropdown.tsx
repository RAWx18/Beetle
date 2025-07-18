"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, User, Building, Code, Star, GitBranch, ExternalLink, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { SearchResults } from "@/hooks/useHomepageSearch"

interface HomepageSearchDropdownProps {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  searchResults: SearchResults | null
  isSearching: boolean
  searchError: string | null
  onClearSearch: () => void
  className?: string
}

export function HomepageSearchDropdown({
  searchQuery,
  onSearchQueryChange,
  searchResults,
  isSearching,
  searchError,
  onClearSearch,
  className
}: HomepageSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

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

  // Open dropdown when there are results or when searching
  useEffect(() => {
    if (searchQuery.trim() && (searchResults || isSearching || searchError)) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [searchQuery, searchResults, isSearching, searchError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchQueryChange(e.target.value)
  }

  const handleClear = () => {
    onClearSearch()
    setIsOpen(false)
  }

  const handleResultClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const hasResults = searchResults && (
    searchResults.repositories.length > 0 ||
    searchResults.users.length > 0 ||
    searchResults.organizations.length > 0
  )

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search any GitHub repository, user, or organization..."
          value={searchQuery}
          onChange={handleInputChange}
          className="pl-12 pr-12 py-4 text-lg bg-background border-2 border-muted hover:border-orange-500/50 focus:border-orange-500 rounded-2xl"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="border-2 border-orange-500/20 shadow-2xl bg-background/95 backdrop-blur-sm">
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                {/* Loading State */}
                {isSearching && (
                  <div className="p-6 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                    <p className="text-sm text-muted-foreground">Searching GitHub...</p>
                  </div>
                )}

                {/* Error State */}
                {searchError && !isSearching && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-red-500 mb-2">Search failed</p>
                    <p className="text-xs text-muted-foreground">{searchError}</p>
                  </div>
                )}

                {/* Results */}
                {!isSearching && !searchError && hasResults && (
                  <div className="py-2">
                    {/* Repositories */}
                    {searchResults.repositories.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Repositories
                        </div>
                        {searchResults.repositories.map((repo, index) => (
                          <motion.div
                            key={repo.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleResultClick(repo.html_url)}
                          >
                            <div className="flex items-start gap-3">
                              <Code className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm truncate">{repo.full_name}</span>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                </div>
                                {repo.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                    {repo.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {repo.language && (
                                    <Badge variant="secondary" className="text-xs px-2 py-0">
                                      {repo.language}
                                    </Badge>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    {repo.stargazers_count.toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <GitBranch className="w-3 h-3" />
                                    {repo.forks_count.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Users */}
                    {searchResults.users.length > 0 && (
                      <div>
                        {searchResults.repositories.length > 0 && <Separator />}
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Users
                        </div>
                        {searchResults.users.map((user, index) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (searchResults.repositories.length + index) * 0.05 }}
                            className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleResultClick(user.html_url)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={user.avatar_url} alt={user.login} />
                                <AvatarFallback>
                                  <User className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{user.login}</span>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                </div>
                                {user.name && (
                                  <p className="text-xs text-muted-foreground">{user.name}</p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  <span>{user.public_repos} repos</span>
                                  <span>{user.followers} followers</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Organizations */}
                    {searchResults.organizations.length > 0 && (
                      <div>
                        {(searchResults.repositories.length > 0 || searchResults.users.length > 0) && <Separator />}
                        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Organizations
                        </div>
                        {searchResults.organizations.map((org, index) => (
                          <motion.div
                            key={org.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (searchResults.repositories.length + searchResults.users.length + index) * 0.05 }}
                            className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleResultClick(org.html_url)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={org.avatar_url} alt={org.login} />
                                <AvatarFallback>
                                  <Building className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{org.login}</span>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                </div>
                                {org.name && (
                                  <p className="text-xs text-muted-foreground">{org.name}</p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  <span>{org.public_repos} repos</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* No Results */}
                {!isSearching && !searchError && searchQuery.trim() && !hasResults && (
                  <div className="p-6 text-center">
                    <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-1">No results found</p>
                    <p className="text-xs text-muted-foreground">
                      Try different keywords or check spelling
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}