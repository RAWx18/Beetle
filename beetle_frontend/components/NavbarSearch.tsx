"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  User, 
  Building, 
  Code, 
  Star, 
  GitBranch, 
  ExternalLink, 
  Loader2, 
  X 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { publicGitHubSearchService } from "@/lib/public-search-service";
import { GitHubRepository, GitHubUser, GitHubOrganization } from "@/lib/search-service";

interface SearchResults {
  repositories: GitHubRepository[];
  users: GitHubUser[];
  organizations: GitHubOrganization[];
}

interface NavbarSearchProps {
  className?: string;
}

export function NavbarSearch({ className }: NavbarSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut to focus search (/)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !isOpen && inputRef.current) {
        event.preventDefault();
        inputRef.current.focus();
      }
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchQuery("");
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSearch = async (query: string) => {
    if (query.trim().length === 0) {
      setSearchResults(null);
      setIsOpen(false);
      return;
    }

    if (query.trim().length < 2) {
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      setIsOpen(true);

      const results = await publicGitHubSearchService.searchAll(query.trim());
      setSearchResults(results);
    } catch (error: any) {
      console.error('Search failed:', error);
      setSearchError(error.message || 'Search failed. Please try again.');
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Debounced search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchResults(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
    setSearchQuery("");
  };

  const hasResults = searchResults && (
    searchResults.repositories.length > 0 ||
    searchResults.users.length > 0 ||
    searchResults.organizations.length > 0
  );

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      {/* Compact Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder="Search GitHub..."
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            if (searchQuery.trim().length > 1) setIsOpen(true);
          }}
          className={cn(
            "pl-9 pr-8 h-9 text-sm bg-background border-border hover:border-primary/50 focus:border-primary rounded-lg transition-all duration-200",
            "w-48 focus:w-64"
          )}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && searchQuery.trim().length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 min-w-[400px]"
          >
            <Card className="border-2 border-primary/20 shadow-xl bg-background/95 backdrop-blur-sm">
              <CardContent className="p-0 max-h-80 overflow-y-auto">
                {/* Loading State */}
                {isSearching && (
                  <div className="p-4 text-center">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-xs text-muted-foreground">Searching GitHub...</p>
                  </div>
                )}

                {/* Error State */}
                {searchError && !isSearching && (
                  <div className="p-4 text-center">
                    <p className="text-xs text-red-500 mb-1">Search failed</p>
                    <p className="text-xs text-muted-foreground">{searchError}</p>
                  </div>
                )}

                {/* No Results */}
                {!isSearching && !searchError && searchQuery.trim() && !hasResults && (
                  <div className="p-4 text-center">
                    <Search className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground mb-1">No results found</p>
                    <p className="text-xs text-muted-foreground">
                      Try different keywords or check spelling
                    </p>
                  </div>
                )}

                {/* Results */}
                {!isSearching && !searchError && hasResults && searchResults && (
                  <div className="py-1">
                    {/* Repositories */}
                    {searchResults.repositories.length > 0 && (
                      <div>
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Repositories
                        </div>
                        {searchResults.repositories.slice(0, 3).map((repo, index) => (
                          <motion.div
                            key={repo.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleResultClick(repo.html_url)}
                          >
                            <div className="flex items-start gap-2">
                              <Code className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-xs truncate">{repo.full_name}</span>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                </div>
                                {repo.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                                    {repo.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {repo.language && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                      {repo.language}
                                    </Badge>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    {repo.stargazers_count.toLocaleString()}
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
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Users
                        </div>
                        {searchResults.users.slice(0, 2).map((user, index) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (searchResults.repositories.length + index) * 0.03 }}
                            className="px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleResultClick(user.html_url)}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={user.avatar_url} alt={user.login} />
                                <AvatarFallback>
                                  <User className="w-3 h-3" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium text-xs">{user.login}</span>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                </div>
                                {user.name && (
                                  <p className="text-xs text-muted-foreground truncate">{user.name}</p>
                                )}
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
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Organizations
                        </div>
                        {searchResults.organizations.slice(0, 2).map((org, index) => (
                          <motion.div
                            key={org.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (searchResults.repositories.length + searchResults.users.length + index) * 0.03 }}
                            className="px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleResultClick(org.html_url)}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={org.avatar_url} alt={org.login} />
                                <AvatarFallback>
                                  <Building className="w-3 h-3" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium text-xs">{org.login}</span>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                </div>
                                {org.name && org.name !== org.login && (
                                  <p className="text-xs text-muted-foreground truncate">{org.name}</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Footer with tip */}
                    <div className="border-t bg-muted/20 px-3 py-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">/</kbd> to focus</span>
                        <span>Exact word matching</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}