"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, User, Building, Code, Star, GitBranch, ExternalLink, Loader2, Filter, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    repositories: any[]
    users: any[]
    organizations: any[]
  }>({
    repositories: [],
    users: [],
    organizations: [],
  })
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (query.length > 2) {
      setIsLoading(true)
      setIsOpen(true)

      // Simulate API call with more realistic data
      setTimeout(() => {
        const filteredRepos = mockRepositories
          .filter(
            (repo) =>
              repo.name.toLowerCase().includes(query.toLowerCase()) ||
              repo.description.toLowerCase().includes(query.toLowerCase()) ||
              repo.topics.some((topic: string) => topic.toLowerCase().includes(query.toLowerCase())),
          )
          .slice(0, 4)

        const filteredUsers = mockUsers
          .filter(
            (user) =>
              user.name.toLowerCase().includes(query.toLowerCase()) ||
              user.username.toLowerCase().includes(query.toLowerCase()) ||
              user.bio.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 3)

        const filteredOrgs = mockOrganizations
          .filter(
            (org) =>
              org.name.toLowerCase().includes(query.toLowerCase()) ||
              org.description.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 3)

        setSearchResults({
          repositories: filteredRepos,
          users: filteredUsers,
          organizations: filteredOrgs,
        })
        setIsLoading(false)
      }, 300)
    } else {
      setIsOpen(false)
      setSearchResults({ repositories: [], users: [], organizations: [] })
    }
  }

  const handleResultClick = (type: "repository" | "user" | "organization", data: any) => {
    onResultSelect({ type, id: data.id || data.username || data.name, data })
    setIsOpen(false)
    setSearchQuery("")
  }

  const totalResults =
    searchResults.repositories.length + searchResults.users.length + searchResults.organizations.length
  const hasResults = totalResults > 0

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl">
      {/* Enhanced Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search repositories, users, organizations... (Press / to focus)"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchQuery.length > 2 && setIsOpen(true)}
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
            {!isLoading && !hasResults && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No results found</h3>
                <p className="text-sm">Try adjusting your search terms or browse trending repositories</p>
              </div>
            )}

            {!isLoading && hasResults && (
              <div className="max-h-[80vh] overflow-y-auto">
                {/* Quick Stats Header */}
                <div className="p-4 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Found {totalResults} results for "{searchQuery}"
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {searchResults.repositories.length} repos
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {searchResults.users.length} users
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {searchResults.organizations.length} orgs
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Repositories Section */}
                {searchResults.repositories.length > 0 && (
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
                      {searchResults.repositories.map((repo: any, index: number) => (
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
                              {repo.isPrivate && (
                                <Badge variant="outline" className="text-xs">
                                  Private
                                </Badge>
                              )}
                              {repo.isArchived && (
                                <Badge variant="secondary" className="text-xs">
                                  Archived
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{repo.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${repo.languageColor}`} />
                                {repo.primaryLanguage}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {repo.stars}
                              </span>
                              <span className="flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                {repo.forks}
                              </span>
                              <span>Updated {repo.updatedAt}</span>
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
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Section */}
                {searchResults.users.length > 0 && (
                  <>
                    {searchResults.repositories.length > 0 && <Separator />}
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
                        {searchResults.users.map((user: any, index: number) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleResultClick("user", user)}
                            className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-xl cursor-pointer group transition-all duration-200"
                          >
                            <Avatar className="w-12 h-12 border-2 border-muted">
                              <AvatarImage src={user.avatar || "/placeholder.jpeg"} />
                              <AvatarFallback>
                                {user.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm group-hover:text-orange-500 transition-colors">
                                  {user.name}
                                </h4>
                                {user.isVerified && (
                                  <Badge variant="default" className="text-xs">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">@{user.username}</p>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{user.bio}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{user.followers} followers</span>
                                <span>{user.following} following</span>
                                <span>{user.publicRepos} repos</span>
                                {user.company && <span>{user.company}</span>}
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
                {searchResults.organizations.length > 0 && (
                  <>
                    {(searchResults.repositories.length > 0 || searchResults.users.length > 0) && <Separator />}
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
                        {searchResults.organizations.map((org: any, index: number) => (
                          <motion.div
                            key={org.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleResultClick("organization", org)}
                            className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-xl cursor-pointer group transition-all duration-200"
                          >
                            <Avatar className="w-12 h-12 border-2 border-muted">
                              <AvatarImage src={org.avatar || "/placeholder.jpeg"} />
                              <AvatarFallback>{org.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm group-hover:text-orange-500 transition-colors">
                                  {org.name}
                                </h4>
                                {org.isVerified && (
                                  <Badge variant="default" className="text-xs">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{org.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{org.publicMembers} public members</span>
                                <span>{org.publicRepos} repositories</span>
                                {org.location && <span>{org.location}</span>}
                                <span>Since {org.createdAt}</span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

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

// Enhanced mock data with more realistic GitHub-like information
const mockRepositories = [
  {
    id: "1",
    name: "microsoft/vscode",
    description: "Visual Studio Code - Open source code editor built with TypeScript and Electron",
    primaryLanguage: "TypeScript",
    languageColor: "bg-blue-500",
    stars: "155k",
    forks: "27k",
    updatedAt: "2 hours ago",
    topics: ["editor", "typescript", "electron", "ide"],
    isPrivate: false,
    isArchived: false,
    license: "MIT",
  },
  {
    id: "2",
    name: "vercel/next.js",
    description: "The React Framework for the Web - Production-ready React applications",
    primaryLanguage: "JavaScript",
    languageColor: "bg-yellow-500",
    stars: "120k",
    forks: "26k",
    updatedAt: "1 hour ago",
    topics: ["react", "nextjs", "framework", "ssr"],
    isPrivate: false,
    isArchived: false,
    license: "MIT",
  },
  {
    id: "3",
    name: "facebook/react",
    description: "The library for web and native user interfaces. Declarative, efficient, and flexible.",
    primaryLanguage: "JavaScript",
    languageColor: "bg-yellow-500",
    stars: "220k",
    forks: "45k",
    updatedAt: "3 hours ago",
    topics: ["react", "javascript", "library", "ui"],
    isPrivate: false,
    isArchived: false,
    license: "MIT",
  },
  {
    id: "4",
    name: "tailwindlabs/tailwindcss",
    description: "A utility-first CSS framework for rapid UI development",
    primaryLanguage: "CSS",
    languageColor: "bg-blue-400",
    stars: "78k",
    forks: "4k",
    updatedAt: "5 hours ago",
    topics: ["css", "framework", "utility-first", "design"],
    isPrivate: false,
    isArchived: false,
    license: "MIT",
  },
]

const mockUsers = [
  {
    id: "1",
    name: "Ryan Madhuwala",
    username: "RAWx18",
    bio: "Working on @aifaq. Author of Beetle and Zentoro. Building developer tools.",
    avatar: "/placeholder.jpeg?height=48&width=48",
    followers: "125k",
    following: "180",
    publicRepos: "89",
    company: "LFDT",
    location: "Ahmedabad, IN",
    isVerified: true,
    hireable: true,
  },
  {
    id: "2",
    name: "Sindre Sorhus",
    username: "sindresorhus",
    bio: "Full-Time Open-Sourcerer. Maker of many npm packages and apps. Unicorn enthusiast.",
    avatar: "/placeholder.jpeg?height=48&width=48",
    followers: "45k",
    following: "12",
    publicRepos: "1.2k",
    company: null,
    location: "Norway",
    isVerified: true,
    hireable: false,
  },
  {
    id: "3",
    name: "Evan You",
    username: "yyx990803",
    bio: "Creator of Vue.js, Vite. Core team @vuejs. Previously @meteor & @google",
    avatar: "/placeholder.jpeg?height=48&width=48",
    followers: "95k",
    following: "25",
    publicRepos: "156",
    company: "Independent",
    location: "Singapore",
    isVerified: true,
    hireable: false,
  },
]

const mockOrganizations = [
  {
    id: "1",
    name: "Microsoft",
    description:
      "Open source projects and samples from Microsoft. Empowering every person and organization on the planet to achieve more.",
    avatar: "/placeholder.jpeg?height=48&width=48",
    publicMembers: "15k",
    publicRepos: "3.2k",
    location: "Redmond, WA",
    createdAt: "2014",
    isVerified: true,
    websiteUrl: "https://microsoft.com",
  },
  {
    id: "2",
    name: "Vercel",
    description: "Develop. Preview. Ship. For the best frontend teams. The platform for frontend developers.",
    avatar: "/placeholder.jpeg?height=48&width=48",
    publicMembers: "180",
    publicRepos: "150",
    location: "San Francisco, CA",
    createdAt: "2015",
    isVerified: true,
    websiteUrl: "https://vercel.com",
  },
  {
    id: "3",
    name: "Google",
    description:
      "Google's mission is to organize the world's information and make it universally accessible and useful.",
    avatar: "/placeholder.jpeg?height=48&width=48",
    publicMembers: "2.5k",
    publicRepos: "2.8k",
    location: "Mountain View, CA",
    createdAt: "2012",
    isVerified: true,
    websiteUrl: "https://google.com",
  },
]
