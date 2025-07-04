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

export function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("repositories")
  const [filters, setFilters] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<any>({
    repositories: mockRepositories,
    users: mockUsers,
    organizations: mockOrganizations,
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // Simulate search filtering
    if (query) {
      const filteredRepos = mockRepositories.filter(
        (repo) =>
          repo.name.toLowerCase().includes(query.toLowerCase()) ||
          repo.description.toLowerCase().includes(query.toLowerCase()),
      )
      const filteredUsers = mockUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.username.toLowerCase().includes(query.toLowerCase()),
      )
      const filteredOrgs = mockOrganizations.filter(
        (org) =>
          org.name.toLowerCase().includes(query.toLowerCase()) ||
          org.description.toLowerCase().includes(query.toLowerCase()),
      )

      setSearchResults({
        repositories: filteredRepos,
        users: filteredUsers,
        organizations: filteredOrgs,
      })
    } else {
      setSearchResults({
        repositories: mockRepositories,
        users: mockUsers,
        organizations: mockOrganizations,
      })
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

      {/* Search Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="repositories" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Repositories ({searchResults.repositories.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Users ({searchResults.users.length})
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Organizations ({searchResults.organizations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repositories" className="space-y-4">
          {searchResults.repositories.map((repo: any, index: number) => (
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
                        {repo.languages.map((lang: string) => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
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
                      {repo.stars}
                    </div>
                    <div className="flex items-center gap-1">
                      <GitBranch className="w-4 h-4" />
                      {repo.forks}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Updated {repo.updated}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {searchResults.users.map((user: any, index: number) => (
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
                      <AvatarImage src={user.avatar || "/placeholder.jpeg"} />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <p className="text-muted-foreground mb-2">@{user.username}</p>
                      <p className="text-sm text-muted-foreground mb-3">{user.bio}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{user.followers} followers</span>
                        <span>{user.following} following</span>
                        <span>{user.repositories} repositories</span>
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
          {searchResults.organizations.map((org: any, index: number) => (
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
                      <AvatarImage src={org.avatar || "/placeholder.jpeg"} />
                      <AvatarFallback>{org.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{org.name}</h3>
                      <p className="text-muted-foreground mb-2">{org.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{org.members} members</span>
                        <span>{org.repositories} repositories</span>
                        <span>Founded {org.founded}</span>
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

// Mock data
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
    avatar: "/placeholder.jpeg?height=64&width=64",
    followers: "125k",
    following: "180",
    repositories: "89",
  },
  {
    id: 2,
    name: "Sindre Sorhus",
    username: "sindresorhus",
    bio: "Full-Time Open-Sourcerer. Maker of many npm packages and apps.",
    avatar: "/placeholder.jpeg?height=64&width=64",
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
    avatar: "/placeholder.jpeg?height=64&width=64",
    members: "15k",
    repositories: "3.2k",
    founded: "2014",
  },
  {
    id: 2,
    name: "Vercel",
    description: "Develop. Preview. Ship. For the best frontend teams",
    avatar: "/placeholder.jpeg?height=64&width=64",
    members: "180",
    repositories: "150",
    founded: "2015",
  },
]
