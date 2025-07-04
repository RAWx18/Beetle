"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, User, Building, Code, Star, GitBranch, ExternalLink, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export function SmartSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any>({
    repositories: [],
    users: [],
    organizations: [],
  })
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

      // Simulate API call
      setTimeout(() => {
        const filteredRepos = mockRepositories
          .filter(
            (repo) =>
              repo.name.toLowerCase().includes(query.toLowerCase()) ||
              repo.description.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 3) // Limit to 3 results

        const filteredUsers = mockUsers
          .filter(
            (user) =>
              user.name.toLowerCase().includes(query.toLowerCase()) ||
              user.username.toLowerCase().includes(query.toLowerCase()),
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
      }, 500)
    } else {
      setIsOpen(false)
      setSearchResults({ repositories: [], users: [], organizations: [] })
    }
  }

  const hasResults =
    searchResults.repositories.length > 0 || searchResults.users.length > 0 || searchResults.organizations.length > 0

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
            {!isLoading && !hasResults && (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{searchQuery}"</p>
              </div>
            )}

            {!isLoading && hasResults && (
              <div className="max-h-96 overflow-y-auto">
                {/* Repositories Section */}
                {searchResults.repositories.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                      <Code className="w-4 h-4" />
                      Repositories
                    </div>
                    <div className="space-y-2">
                      {searchResults.repositories.map((repo: any) => (
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
                                {repo.stars}
                              </span>
                              <span className="flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                {repo.forks}
                              </span>
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {repo.languages[0]}
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
                {searchResults.users.length > 0 && (
                  <>
                    {searchResults.repositories.length > 0 && <Separator />}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                        <User className="w-4 h-4" />
                        Users
                      </div>
                      <div className="space-y-2">
                        {searchResults.users.map((user: any) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer group transition-colors"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar || "/placeholder.jpeg"} />
                              <AvatarFallback className="text-xs">
                                {user.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm group-hover:text-orange-500 transition-colors">
                                {user.name}
                              </div>
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{user.followers} followers</span>
                                <span>{user.repositories} repos</span>
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
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                        <Building className="w-4 h-4" />
                        Organizations
                      </div>
                      <div className="space-y-2">
                        {searchResults.organizations.map((org: any) => (
                          <motion.div
                            key={org.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer group transition-colors"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={org.avatar || "/placeholder.jpeg"} />
                              <AvatarFallback className="text-xs">{org.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm group-hover:text-orange-500 transition-colors">
                                {org.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{org.description}</div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{org.members} members</span>
                                <span>{org.repositories} repos</span>
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

// Mock data (same as before but limited)
const mockRepositories = [
  {
    id: 1,
    name: "microsoft/vscode",
    description: "Visual Studio Code - Open source code editor",
    languages: ["TypeScript", "JavaScript", "CSS"],
    stars: "155k",
    forks: "27k",
    updated: "2 hours ago",
  },
  {
    id: 2,
    name: "vercel/next.js",
    description: "The React Framework for the Web",
    languages: ["TypeScript", "JavaScript", "MDX"],
    stars: "120k",
    forks: "26k",
    updated: "1 hour ago",
  },
  {
    id: 3,
    name: "facebook/react",
    description: "The library for web and native user interfaces",
    languages: ["JavaScript", "TypeScript"],
    stars: "220k",
    forks: "45k",
    updated: "3 hours ago",
  },
]

const mockUsers = [
  {
    id: 1,
    name: "Ryan Madhuwala",
    username: "RAWx18",
    bio: "Working on @reactjs. Co-author of Redux and Create React App.",
    avatar: "/placeholder.jpeg?height=32&width=32",
    followers: "125k",
    following: "180",
    repositories: "89",
  },
  {
    id: 2,
    name: "Sindre Sorhus",
    username: "sindresorhus",
    bio: "Full-Time Open-Sourcerer. Maker of many npm packages and apps.",
    avatar: "/placeholder.jpeg?height=32&width=32",
    followers: "45k",
    following: "12",
    repositories: "1.2k",
  },
]

const mockOrganizations = [
  {
    id: 1,
    name: "Microsoft",
    description: "Open source projects and samples from Microsoft",
    avatar: "/placeholder.jpeg?height=32&width=32",
    members: "15k",
    repositories: "3.2k",
    founded: "2014",
  },
  {
    id: 2,
    name: "Vercel",
    description: "Develop. Preview. Ship. For the best frontend teams",
    avatar: "/placeholder.jpeg?height=32&width=32",
    members: "180",
    repositories: "150",
    founded: "2015",
  },
]
