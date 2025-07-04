"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Star,
  GitBranch,
  Eye,
  Download,
  ExternalLink,
  Users,
  Calendar,
  Code,
  FileText,
  AlertCircle,
  Zap,
  ArrowLeft,
  Copy,
  Check,
  Globe,
  Shield,
  Activity,
  TrendingUp,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface RepositoryDetailPageProps {
  repository: any
  onBack: () => void
}

export function RepositoryDetailPage({ repository, onBack }: RepositoryDetailPageProps) {
  const [copied, setCopied] = useState(false)
  const [starCount, setStarCount] = useState(repository.stars)
  const [isStarred, setIsStarred] = useState(false)

  const handleCopyClone = () => {
    navigator.clipboard.writeText(`git clone https://github.com/${repository.name}.git`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStar = () => {
    setIsStarred(!isStarred)
    setStarCount(isStarred ? starCount - 1 : starCount + 1)
  }

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
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Code className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold">{repository.name}</h1>
              {repository.isPrivate && <Badge variant="outline">Private</Badge>}
              {repository.isArchived && <Badge variant="secondary">Archived</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Repository Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-lg">{repository.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${repository.languageColor}`} />
                      {repository.primaryLanguage}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {starCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <GitBranch className="w-4 h-4" />
                      {repository.forks}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {repository.watchers || "1.2k"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Updated {repository.updatedAt}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {repository.topics.map((topic: string) => (
                      <Badge key={topic} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleStar}>
                    <Star className={`w-4 h-4 mr-2 ${isStarred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    {isStarred ? "Starred" : "Star"}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Watch
                  </Button>
                  <Button variant="outline" size="sm">
                    <GitBranch className="w-4 h-4 mr-2" />
                    Fork
                  </Button>
                </div>
              </div>

              {/* Clone Section */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-lg px-3 py-2 font-mono text-sm">
                      git clone https://github.com/{repository.name}.git
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopyClone}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download ZIP
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs Content */}
            <Tabs defaultValue="readme" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="readme">README</TabsTrigger>
                <TabsTrigger value="branches">Branches</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="ai-suggestions">AI Suggestions</TabsTrigger>
              </TabsList>

              <TabsContent value="readme" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      README.md
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose dark:prose-invert max-w-none">
                    <div className="space-y-4">
                      <h2>Getting Started</h2>
                      <p>
                        This is a comprehensive guide to get you started with {repository.name}. Follow the installation
                        steps below to set up your development environment.
                      </p>

                      <h3>Installation</h3>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code>npm install {repository.name.split("/")[1]}</code>
                      </pre>

                      <h3>Usage</h3>
                      <p>Here's a quick example of how to use this library in your project:</p>

                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code>{`import { ${repository.name.split("/")[1]} } from '${repository.name.split("/")[1]}'

const app = new ${repository.name.split("/")[1]}()
app.start()`}</code>
                      </pre>

                      <h3>Contributing</h3>
                      <p>We welcome contributions! Please see our contributing guidelines for more information.</p>

                      <h3>License</h3>
                      <p>This project is licensed under the {repository.license} License.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="branches" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      Branch Planning & Management
                    </CardTitle>
                    <CardDescription>AI-powered branch insights and planning recommendations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockBranches.map((branch, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <GitBranch className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{branch.name}</div>
                            <div className="text-sm text-muted-foreground">{branch.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={branch.status === "active" ? "default" : "secondary"}>{branch.status}</Badge>
                          <span className="text-sm text-muted-foreground">{branch.commits} commits</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="issues" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Open Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockIssues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                        <AlertCircle className="w-4 h-4 text-green-500 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium">{issue.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {issue.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">#{issue.number}</span>
                            <span className="text-xs text-muted-foreground">opened {issue.createdAt}</span>
                          </div>
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
                        <Activity className="w-5 h-5" />
                        Activity Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Commits this month</span>
                          <span className="font-medium">247</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Pull requests</span>
                          <span className="font-medium">18</span>
                        </div>
                        <Progress value={60} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Issues resolved</span>
                          <span className="font-medium">34</span>
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
                        <div className="text-2xl font-bold text-green-600">+12%</div>
                        <div className="text-sm text-muted-foreground">Stars this month</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">+8%</div>
                        <div className="text-sm text-muted-foreground">Forks this month</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">+15%</div>
                        <div className="text-sm text-muted-foreground">Contributors</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="ai-suggestions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      AI-Powered Suggestions
                    </CardTitle>
                    <CardDescription>Intelligent recommendations to improve your repository</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aiSuggestions.map((suggestion, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <suggestion.icon className={`w-4 h-4 ${suggestion.color}`} />
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        <Button size="sm" variant="outline">
                          Apply Suggestion
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Repository Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Repository Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Stars</span>
                  <span className="font-medium">{starCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Forks</span>
                  <span className="font-medium">{repository.forks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Watchers</span>
                  <span className="font-medium">{repository.watchers || "1.2k"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Issues</span>
                  <span className="font-medium">{repository.openIssues || "23"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">License</span>
                  <span className="font-medium">{repository.license}</span>
                </div>
              </CardContent>
            </Card>

            {/* Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockContributors.map((contributor, index) => (
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

            {/* Similar Repositories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Similar Repositories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {similarRepositories.map((repo, index) => (
                    <div key={index} className="space-y-1">
                      <div className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                        {repo.name}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{repo.description}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${repo.languageColor}`} />
                        <span>{repo.language}</span>
                        <Star className="w-3 h-3" />
                        <span>{repo.stars}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on GitHub
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Globe className="w-4 h-4 mr-2" />
                  Visit Website
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discussions
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Security
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
const mockBranches = [
  { name: "main", description: "Primary development branch", status: "active", commits: 1247 },
  { name: "feature/auth", description: "User authentication system", status: "active", commits: 23 },
  { name: "fix/memory-leak", description: "Fix memory leak in parser", status: "review", commits: 8 },
  { name: "docs/api", description: "API documentation updates", status: "merged", commits: 12 },
]

const mockIssues = [
  {
    number: 1234,
    title: "Memory leak in large file processing",
    description: "Application crashes when processing files larger than 100MB",
    label: "bug",
    createdAt: "2 days ago",
  },
  {
    number: 1235,
    title: "Add dark mode support",
    description: "Users have requested dark mode theme option",
    label: "enhancement",
    createdAt: "1 week ago",
  },
  {
    number: 1236,
    title: "Update documentation for v2.0",
    description: "Documentation needs to be updated for the new API",
    label: "documentation",
    createdAt: "3 days ago",
  },
]

const aiSuggestions = [
  {
    icon: Shield,
    title: "Security Vulnerability Detected",
    description: "Update dependency 'lodash' to fix known security vulnerability",
    priority: "High",
    color: "text-red-500",
  },
  {
    icon: TrendingUp,
    title: "Performance Optimization",
    description: "Consider implementing lazy loading for better performance",
    priority: "Medium",
    color: "text-yellow-500",
  },
  {
    icon: FileText,
    title: "Documentation Improvement",
    description: "Add code examples to README for better developer experience",
    priority: "Low",
    color: "text-blue-500",
  },
]

const mockContributors = [
  { name: "Ryan", avatar: "/placeholder-logo.png?height=32&width=32", contributions: 247 },
  { name: "Heena", avatar: "/placeholder.jpeg?height=32&width=32", contributions: 189 },
  { name: "Neil", avatar: "/placeholder.jpeg?height=32&width=32", contributions: 156 },
  { name: "Gaurav", avatar: "/placeholder.jpeg?height=32&width=32", contributions: 134 },
]

const similarRepositories = [
  {
    name: "similar/repo-1",
    description: "Another great repository with similar functionality",
    language: "TypeScript",
    languageColor: "bg-blue-500",
    stars: "12k",
  },
  {
    name: "awesome/project",
    description: "Awesome project that does similar things",
    language: "JavaScript",
    languageColor: "bg-yellow-500",
    stars: "8.5k",
  },
  {
    name: "cool/library",
    description: "Cool library for developers",
    language: "Python",
    languageColor: "bg-green-500",
    stars: "15k",
  },
]
