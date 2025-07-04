"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  Github,
  Globe,
  Users,
  Star,
  GitBranch,
  Activity,
  ArrowLeft,
  Code,
  TrendingUp,
  Filter,
  Search,
  Zap,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OrganizationProfilePageProps {
  organization: any
  onBack: () => void
}

export function OrganizationProfilePage({ organization, onBack }: OrganizationProfilePageProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [repoFilter, setRepoFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredRepos = orgRepositories.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      repoFilter === "all" ||
      (repoFilter === "active" && repo.isActive) ||
      (repoFilter === "popular" && Number.parseInt(repo.stars.replace("k", "000")) > 1000)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={organization.avatar || "/placeholder.jpeg"} />
                <AvatarFallback>{organization.name[0]}</AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold">{organization.name}</h1>
              {organization.isVerified && <Badge variant="default">Verified</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Organization Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-6"
            >
              <Avatar className="w-32 h-32 border-4 border-muted">
                <AvatarImage src={organization.avatar || "/placeholder.jpeg"} />
                <AvatarFallback className="text-2xl">{organization.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">{organization.name}</h1>
                  <p className="text-xl text-muted-foreground">@{organization.name.toLowerCase()}</p>
                </div>

                <p className="text-lg text-muted-foreground max-w-2xl">{organization.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {organization.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {organization.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Founded in {organization.createdAt}
                  </div>
                  {organization.websiteUrl && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <a href={organization.websiteUrl} className="hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{organization.publicMembers}</span> public members
                  </div>
                  <div className="flex items-center gap-1">
                    <Code className="w-4 h-4" />
                    <span className="font-medium">{organization.publicRepos}</span> repositories
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={isFollowing ? "bg-muted text-foreground hover:bg-muted/80" : ""}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline">
                    <Github className="w-4 h-4 mr-2" />
                    View on GitHub
                  </Button>
                  <Button variant="outline">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Organization Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              {orgStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4 text-center">
                      <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="repositories" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="repositories">Repositories</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="repositories" className="mt-6 space-y-6">
                {/* Repository Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search repositories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={repoFilter} onValueChange={setRepoFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All repositories</SelectItem>
                      <SelectItem value="active">Active projects</SelectItem>
                      <SelectItem value="popular">Popular (1k+ stars)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    More filters
                  </Button>
                </div>

                {/* Featured Repositories */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Featured Repositories
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredRepos.slice(0, 4).map((repo, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-blue-600 hover:underline cursor-pointer">
                                  {repo.name}
                                </h4>
                                {repo.isPrivate && (
                                  <Badge variant="outline" className="text-xs">
                                    Private
                                  </Badge>
                                )}
                                {repo.isActive && (
                                  <Badge variant="default" className="text-xs">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{repo.description}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <div className={`w-3 h-3 rounded-full ${repo.languageColor}`} />
                                  {repo.language}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4" />
                                  {repo.stars}
                                </div>
                                <div className="flex items-center gap-1">
                                  <GitBranch className="w-4 h-4" />
                                  {repo.forks}
                                </div>
                                <span>Updated {repo.updatedAt}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {repo.topics.map((topic: string) => (
                              <Badge key={topic} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* All Repositories Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">All Repositories ({filteredRepos.length})</h3>
                  <div className="space-y-2">
                    {filteredRepos.map((repo, index) => (
                      <Card key={index} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-blue-600 hover:underline cursor-pointer">
                                  {repo.name}
                                </h4>
                                {repo.isPrivate && (
                                  <Badge variant="outline" className="text-xs">
                                    Private
                                  </Badge>
                                )}
                                {repo.isActive && (
                                  <Badge variant="default" className="text-xs">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{repo.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${repo.languageColor}`} />
                                  {repo.language}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  {repo.stars}
                                </div>
                                <div className="flex items-center gap-1">
                                  <GitBranch className="w-3 h-3" />
                                  {repo.forks}
                                </div>
                                <span>Updated {repo.updatedAt}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Zap className="w-4 h-4 mr-1" />
                                Beetle
                              </Button>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="members" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Public Members ({organization.publicMembers})</h3>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orgMembers.map((member, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={member.avatar || "/placeholder.jpeg"} />
                              <AvatarFallback>
                                {member.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{member.name}</h4>
                              <p className="text-sm text-muted-foreground">@{member.username}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Organization Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {orgActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <activity.icon className={`w-4 h-4 mt-1 ${activity.color}`} />
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Growth Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">+25%</div>
                        <div className="text-sm text-muted-foreground">Repository growth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">+18%</div>
                        <div className="text-sm text-muted-foreground">Member growth</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">+32%</div>
                        <div className="text-sm text-muted-foreground">Total stars</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="w-5 h-5" />
                        Technology Stack
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {techStack.map((tech, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${tech.color}`} />
                            <span className="text-sm">{tech.name}</span>
                          </div>
                          <span className="text-sm font-medium">{tech.percentage}%</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organization Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Public repos</span>
                  <span className="font-medium">{organization.publicRepos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Public members</span>
                  <span className="font-medium">{organization.publicMembers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Founded</span>
                  <span className="font-medium">{organization.createdAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total stars</span>
                  <span className="font-medium">45.2k</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total forks</span>
                  <span className="font-medium">12.8k</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topContributors.map((contributor, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={contributor.avatar || "/placeholder.jpeg"} />
                        <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{contributor.name}</div>
                        <div className="text-xs text-muted-foreground">{contributor.contributions} contributions</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub Profile
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Globe className="w-4 h-4 mr-2" />
                  Official Website
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  GitHub Actions
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Advisories
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mock data
const orgStats = [
  { icon: Code, label: "Repositories", value: "3.2k", color: "text-blue-500" },
  { icon: Users, label: "Members", value: "15k", color: "text-green-500" },
  { icon: Star, label: "Total Stars", value: "45.2k", color: "text-yellow-500" },
  { icon: GitBranch, label: "Total Forks", value: "12.8k", color: "text-purple-500" },
]

const orgRepositories = [
  {
    name: "vscode",
    description: "Visual Studio Code - Open source code editor",
    language: "TypeScript",
    languageColor: "bg-blue-500",
    stars: "155k",
    forks: "27k",
    updatedAt: "2 hours ago",
    topics: ["editor", "typescript", "electron"],
    isPrivate: false,
    isActive: true,
  },
  {
    name: "TypeScript",
    description: "TypeScript is a superset of JavaScript that compiles to clean JavaScript output",
    language: "TypeScript",
    languageColor: "bg-blue-500",
    stars: "98k",
    forks: "12k",
    updatedAt: "1 day ago",
    topics: ["typescript", "javascript", "compiler"],
    isPrivate: false,
    isActive: true,
  },
  {
    name: "PowerToys",
    description: "Windows system utilities to maximize productivity",
    language: "C#",
    languageColor: "bg-purple-500",
    stars: "105k",
    forks: "6k",
    updatedAt: "3 hours ago",
    topics: ["windows", "utilities", "productivity"],
    isPrivate: false,
    isActive: true,
  },
  {
    name: "terminal",
    description: "The new Windows Terminal and the original Windows console host",
    language: "C++",
    languageColor: "bg-red-500",
    stars: "93k",
    forks: "8k",
    updatedAt: "1 day ago",
    topics: ["terminal", "windows", "console"],
    isPrivate: false,
    isActive: true,
  },
]

const orgMembers = [
  { name: "Satya Nadella", username: "satyanadella", role: "CEO", avatar: "/placeholder.jpeg?height=48&width=48" },
  {
    name: "Scott Hanselman",
    username: "shanselman",
    role: "Principal PM",
    avatar: "/placeholder.jpeg?height=48&width=48",
  },
  {
    name: "Erich Gamma",
    username: "egamma",
    role: "Distinguished Engineer",
    avatar: "/placeholder.jpeg?height=48&width=48",
  },
  { name: "Chris Dias", username: "chrisdias", role: "Principal PM", avatar: "/placeholder.jpeg?height=48&width=48" },
  { name: "Matt Bierner", username: "mjbvz", role: "Senior SWE", avatar: "/placeholder.jpeg?height=48&width=48" },
  {
    name: "Johannes Rieken",
    username: "jrieken",
    role: "Principal SWE",
    avatar: "/placeholder.jpeg?height=48&width=48",
  },
]

const orgActivity = [
  {
    icon: Code,
    description: "Released TypeScript 5.3 with new features and improvements",
    time: "2 hours ago",
    color: "text-blue-500",
  },
  {
    icon: Star,
    description: "vscode repository reached 155k stars",
    time: "1 day ago",
    color: "text-yellow-500",
  },
  {
    icon: Users,
    description: "Welcome 50 new members to the organization",
    time: "3 days ago",
    color: "text-green-500",
  },
  {
    icon: GitBranch,
    description: "Merged 127 pull requests across all repositories",
    time: "1 week ago",
    color: "text-purple-500",
  },
]

const techStack = [
  { name: "TypeScript", percentage: 35, color: "bg-blue-500" },
  { name: "C#", percentage: 25, color: "bg-purple-500" },
  { name: "C++", percentage: 20, color: "bg-red-500" },
  { name: "JavaScript", percentage: 15, color: "bg-yellow-500" },
  { name: "Python", percentage: 5, color: "bg-green-500" },
]

const topContributors = [
  { name: "Erich Gamma", avatar: "/placeholder.jpeg?height=32&width=32", contributions: 2847 },
  { name: "Johannes Rieken", avatar: "/placeholder.jpeg?height=32&width=32", contributions: 2156 },
  { name: "Matt Bierner", avatar: "/placeholder.jpeg?height=32&width=32", contributions: 1934 },
  { name: "Chris Dias", avatar: "/placeholder.jpeg?height=32&width=32", contributions: 1678 },
]
