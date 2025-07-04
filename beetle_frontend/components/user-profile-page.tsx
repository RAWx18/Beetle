"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  User,
  MapPin,
  Calendar,
  ExternalLink,
  Github,
  Twitter,
  Mail,
  Building,
  Star,
  GitBranch,
  Users,
  Activity,
  ArrowLeft,
  Code,
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

interface UserProfilePageProps {
  user: any
  onBack: () => void
}

export function UserProfilePage({ user, onBack }: UserProfilePageProps) {
  const [isFollowing, setIsFollowing] = useState(false)

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
                <AvatarImage src={user.avatar || "/placeholder.jpeg"} />
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold">{user.name}</h1>
              {user.isVerified && <Badge variant="default">Verified</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* User Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-6"
            >
              <Avatar className="w-32 h-32 border-4 border-muted">
                <AvatarImage src={user.avatar || "/placeholder.jpeg"} />
                <AvatarFallback className="text-2xl">
                  {user.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <p className="text-xl text-muted-foreground">@{user.username}</p>
                </div>

                <p className="text-lg text-muted-foreground max-w-2xl">{user.bio}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {user.company && (
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {user.company}
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {user.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined GitHub in 2018
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{user.followers}</span> followers
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{user.following}</span> following
                  </div>
                  <div className="flex items-center gap-1">
                    <Code className="w-4 h-4" />
                    <span className="font-medium">{user.publicRepos}</span> repositories
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={isFollowing ? "bg-muted text-foreground hover:bg-muted/80" : ""}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline">
                    <Github className="w-4 h-4 mr-2" />
                    View on GitHub
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Tabs Content */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="repositories">Repositories</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="starred">Starred</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Current Projects */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Projects Currently Working On
                    </CardTitle>
                    <CardDescription>Based on recent commits and active pull requests</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentProjects.map((project, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Code className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{project.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${project.languageColor}`} />
                              {project.language}
                            </span>
                            <span>Last commit {project.lastCommit}</span>
                            <Badge variant="outline" className="text-xs">
                              {project.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Contribution Stats */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Contribution Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Commits this year</span>
                          <span className="font-medium">1,247</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Pull requests</span>
                          <span className="font-medium">89</span>
                        </div>
                        <Progress value={60} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Issues opened</span>
                          <span className="font-medium">156</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Growth Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">+15%</div>
                        <div className="text-sm text-muted-foreground">Followers this month</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">+23%</div>
                        <div className="text-sm text-muted-foreground">Repository stars</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">+8%</div>
                        <div className="text-sm text-muted-foreground">Contributions</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* README Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Profile README
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose dark:prose-invert max-w-none">
                    <div className="space-y-4">
                      <h3>👋 Hi there!</h3>
                      <p>
                        I'm an AI/ML engineer at IIIT Gwalior working on LLMs and diverse ML architectures
                      </p>

                      <h4>🔧 Technologies & Tools</h4>
                      <div className="flex flex-wrap gap-2 not-prose">
                        {technologies.map((tech) => (
                          <Badge key={tech} variant="outline">
                            {tech}
                          </Badge>
                        ))}
                      </div>

                      <h4>📈 GitHub Stats</h4>
                      <p>
                        I'm actively contributing to the open-source community and always learning new technologies.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="repositories" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Public Repositories ({user.publicRepos})</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Star className="w-4 h-4 mr-2" />
                        Sort by stars
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {userRepositories.map((repo, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-600 hover:underline cursor-pointer mb-2">
                                {repo.name}
                              </h4>
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
                            <Button variant="outline" size="sm">
                              <Star className="w-4 h-4" />
                            </Button>
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
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentActivity.map((activity, index) => (
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

              <TabsContent value="starred" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Starred Repositories</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Recently starred
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {starredRepositories.map((repo, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-600 hover:underline cursor-pointer mb-2">
                                {repo.name}
                              </h4>
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
                                <span>Starred {repo.starredAt}</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Zap className="w-4 h-4 mr-2" />
                              Open in Beetle
                            </Button>
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
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Public repos</span>
                  <span className="font-medium">{user.publicRepos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Followers</span>
                  <span className="font-medium">{user.followers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Following</span>
                  <span className="font-medium">{user.following}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total stars</span>
                  <span className="font-medium">2.3k</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total forks</span>
                  <span className="font-medium">456</span>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${achievement.bgColor}`}>
                        <achievement.icon className={`w-4 h-4 ${achievement.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{achievement.title}</div>
                        <div className="text-xs text-muted-foreground">{achievement.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topLanguages.map((lang, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${lang.color}`} />
                          <span>{lang.name}</span>
                        </div>
                        <span className="font-medium">{lang.percentage}%</span>
                      </div>
                      <Progress value={lang.percentage} className="h-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub Profile
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Website
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
const currentProjects = [
  {
    name: "react-awesome-components",
    description: "A collection of reusable React components with TypeScript support",
    language: "TypeScript",
    languageColor: "bg-blue-500",
    lastCommit: "2 hours ago",
    status: "Active",
  },
  {
    name: "api-gateway-service",
    description: "Microservices API gateway built with Node.js and Express",
    language: "JavaScript",
    languageColor: "bg-yellow-500",
    lastCommit: "1 day ago",
    status: "In Review",
  },
  {
    name: "ml-data-pipeline",
    description: "Machine learning data processing pipeline using Python",
    language: "Python",
    languageColor: "bg-green-500",
    lastCommit: "3 days ago",
    status: "Development",
  },
]

const technologies = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Docker",
  "Kubernetes",
  "AWS",
  "PostgreSQL",
  "MongoDB",
  "GraphQL",
  "Next.js",
]

const userRepositories = [
  {
    name: "awesome-react-hooks",
    description: "A collection of useful React hooks for modern applications",
    language: "TypeScript",
    languageColor: "bg-blue-500",
    stars: "1.2k",
    forks: "89",
    updatedAt: "2 days ago",
    topics: ["react", "hooks", "typescript", "frontend"],
  },
  {
    name: "node-microservices",
    description: "Scalable microservices architecture with Node.js",
    language: "JavaScript",
    languageColor: "bg-yellow-500",
    stars: "856",
    forks: "124",
    updatedAt: "1 week ago",
    topics: ["nodejs", "microservices", "api", "backend"],
  },
  {
    name: "python-ml-toolkit",
    description: "Machine learning toolkit for data scientists",
    language: "Python",
    languageColor: "bg-green-500",
    stars: "2.1k",
    forks: "345",
    updatedAt: "3 days ago",
    topics: ["python", "machine-learning", "data-science", "ai"],
  },
]

const recentActivity = [
  {
    icon: GitBranch,
    description: "Opened pull request in microsoft/vscode",
    time: "2 hours ago",
    color: "text-green-500",
  },
  {
    icon: Star,
    description: "Starred vercel/next.js",
    time: "4 hours ago",
    color: "text-yellow-500",
  },
  {
    icon: Code,
    description: "Pushed 3 commits to awesome-react-hooks",
    time: "1 day ago",
    color: "text-blue-500",
  },
  {
    icon: Users,
    description: "Started following sindresorhus",
    time: "2 days ago",
    color: "text-purple-500",
  },
]

const starredRepositories = [
  {
    name: "microsoft/vscode",
    description: "Visual Studio Code - Open source code editor",
    language: "TypeScript",
    languageColor: "bg-blue-500",
    stars: "155k",
    forks: "27k",
    starredAt: "1 week ago",
    topics: ["editor", "typescript", "electron"],
  },
  {
    name: "vercel/next.js",
    description: "The React Framework for the Web",
    language: "JavaScript",
    languageColor: "bg-yellow-500",
    stars: "120k",
    forks: "26k",
    starredAt: "2 weeks ago",
    topics: ["react", "framework", "ssr"],
  },
]

const achievements = [
  {
    icon: Star,
    title: "Stargazer",
    description: "Earned 1000+ stars",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
    iconColor: "text-yellow-600",
  },
  {
    icon: Users,
    title: "Collaborator",
    description: "Active in 10+ projects",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    iconColor: "text-blue-600",
  },
  {
    icon: Code,
    title: "Prolific Coder",
    description: "1000+ commits this year",
    bgColor: "bg-green-100 dark:bg-green-900",
    iconColor: "text-green-600",
  },
]

const topLanguages = [
  { name: "TypeScript", percentage: 35, color: "bg-blue-500" },
  { name: "JavaScript", percentage: 28, color: "bg-yellow-500" },
  { name: "Python", percentage: 20, color: "bg-green-500" },
  { name: "Go", percentage: 12, color: "bg-cyan-500" },
  { name: "Rust", percentage: 5, color: "bg-orange-500" },
]
