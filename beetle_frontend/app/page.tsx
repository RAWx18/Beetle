"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import {
  Github,
  Search,
  Star,
  GitBranch,
  Activity,
  ArrowRight,
  Play,
  Code,
  Moon,
  Sun,
  Check,
  TrendingUp,
  ExternalLink,
  Quote,
  PlayCircle,
  Mail,
  Twitter,
  Linkedin,
  Users,
  Zap,
  CheckCircle,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"
import Dashboard from "@/components/dashboard"
import { GitHubWorkflowVisualization } from "@/components/github-workflow-visualization"
import { BranchVisualization } from "@/components/branch-visualization"
import { PRReviewDemo } from "@/components/pr-review-demo"

export default function Home() {
  const { isAuthenticated, user, login, logout, loading } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [trendingRepos, setTrendingRepos] = useState(mockTrendingRepos)
  const [mounted, setMounted] = useState(false)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()

  const [currentProject, setCurrentProject] = useState(0)

  // Add this after the existing mock data
  const featuredProjects = [
    {
      name: "vercel/next.js",
      description:
        "The React Framework for the Web. Used by some of the world's largest companies, Next.js enables you to create full-stack web applications.",
      languages: ["TypeScript", "React", "JavaScript"],
      stars: "120k",
      forks: "26k",
      contributors: "2.1k",
      recentActivity: [
        { user: "timneutkens", action: "merged PR #58234", time: "2 hours ago" },
        { user: "shuding", action: "opened issue #58235", time: "4 hours ago" },
        { user: "ijjk", action: "released v14.0.4", time: "6 hours ago" },
        { user: "styfle", action: "commented on #58230", time: "8 hours ago" },
      ],
    },
    {
      name: "microsoft/vscode",
      description:
        "Visual Studio Code - Open source code editor built with TypeScript and Electron. The most popular code editor among developers worldwide.",
      languages: ["TypeScript", "JavaScript", "CSS"],
      stars: "155k",
      forks: "27k",
      contributors: "1.8k",
      recentActivity: [
        { user: "bpasero", action: "fixed editor performance", time: "1 hour ago" },
        { user: "joaomoreno", action: "updated extensions API", time: "3 hours ago" },
        { user: "mjbvz", action: "improved TypeScript support", time: "5 hours ago" },
        { user: "chrisdias", action: "merged accessibility fixes", time: "7 hours ago" },
      ],
    },
    {
      name: "facebook/react",
      description:
        "The library for web and native user interfaces. Declarative, efficient, and flexible JavaScript library for building user interfaces.",
      languages: ["JavaScript", "TypeScript", "Flow"],
      stars: "220k",
      forks: "45k",
      contributors: "1.5k",
      recentActivity: [
        { user: "gaearon", action: "updated React DevTools", time: "30 minutes ago" },
        { user: "sebmarkbage", action: "optimized reconciler", time: "2 hours ago" },
        { user: "acdlite", action: "improved Suspense", time: "4 hours ago" },
        { user: "rickhanlonii", action: "fixed concurrent features", time: "6 hours ago" },
      ],
    },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleGitHubLogin = () => {
    login()
  }

  const handleSignOut = () => {
    logout()
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    console.log("Searching for:", query)
  }

  if (!mounted) return null

  if (isAuthenticated) {
    return <Dashboard onSignOut={handleSignOut} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Minimalistic Hero Section */}
      <section className="min-h-screen flex items-center">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Theme Toggle - Top Right of Content */}
              <div className="flex justify-end lg:hidden">
                <motion.button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.button>
              </div>

              {/* Brand */}
              <div className="flex items-center space-x-3">
                <div className="w-240 h-120 rounded-2xl flex items-center overflow-hidden">
                  <Image 
                    src="/favicon.png" 
                    alt="Beetle Logo" 
                    width={240} 
                    height={120}
                    className="object-contain"
                  />
                </div>
                {/* <span className="text-2xl font-bold">Beetle</span> */}
              </div>

              {/* Headlines */}
              <div className="space-y-6">
                <motion.h1
                  className="text-5xl lg:text-6xl font-bold leading-tight text-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Branch Smarter.
                  <br />
                  Contribute Better.
                </motion.h1>

                <motion.p
                  className="text-xl text-muted-foreground leading-relaxed max-w-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                Bettle is an open-source tool to track, organize, and collaborate across multiple branches. With AI-powered assistance, branch-specific planning, and contributor dashboards, it brings structure and personalization to open-source workflows.
                </motion.p>
              </div>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    onClick={handleGitHubLogin}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg group"
                  >
                    <Github className="w-5 h-5 mr-3" />
                    Login with GitHub
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.location.href = '/contribution'}
                    className="px-8 py-6 text-lg rounded-xl border-2 hover:bg-muted/50"
                  >
                    <PlayCircle className="w-5 h-5 mr-3" />
                    Try Live Demo
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Side - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="relative"
            >
              {/* Theme Toggle - Desktop */}
              <div className="absolute top-0 right-0 hidden lg:block z-10">
                <motion.button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-muted/80 transition-colors shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.button>
              </div>

              {/* Main Visual - Abstract Branch Visualization */}
              <div className="relative w-full h-96 lg:h-[500px] bg-muted/30 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Abstract Branch Network */}
                  <svg width="400" height="300" viewBox="0 0 400 300" className="w-full h-full max-w-md">
                    {/* Main Branch */}
                    <motion.line
                      x1="50"
                      y1="150"
                      x2="350"
                      y2="150"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-orange-500"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 0.5 }}
                    />

                    {/* Feature Branches */}
                    <motion.line
                      x1="120"
                      y1="150"
                      x2="180"
                      y2="100"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-500"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 1 }}
                    />
                    <motion.line
                      x1="180"
                      y1="100"
                      x2="280"
                      y2="150"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-500"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 1.2 }}
                    />

                    <motion.line
                      x1="150"
                      y1="150"
                      x2="220"
                      y2="200"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-green-500"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 1.4 }}
                    />
                    <motion.line
                      x1="220"
                      y1="200"
                      x2="320"
                      y2="150"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-green-500"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 1.6 }}
                    />

                    {/* Commit Points */}
                    {[
                      { x: 50, y: 150, color: "text-orange-500", delay: 0.5 },
                      { x: 120, y: 150, color: "text-orange-500", delay: 1 },
                      { x: 180, y: 100, color: "text-blue-500", delay: 1.2 },
                      { x: 220, y: 200, color: "text-green-500", delay: 1.6 },
                      { x: 280, y: 150, color: "text-orange-500", delay: 1.8 },
                      { x: 320, y: 150, color: "text-orange-500", delay: 2 },
                      { x: 350, y: 150, color: "text-orange-500", delay: 2.2 },
                    ].map((point, index) => (
                      <motion.circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="6"
                        fill="currentColor"
                        className={point.color}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: point.delay }}
                      />
                    ))}

                    {/* Animated Pulse Effects */}
                    <motion.circle
                      cx="350"
                      cy="150"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-orange-500"
                      animate={{ r: [6, 20, 6], opacity: [1, 0, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 2.5 }}
                    />
                  </svg>
                </div>

                {/* Floating Elements */}
                <motion.div
                  className="absolute top-8 left-8 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-medium">main</span>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute top-20 right-12 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="font-medium">feature/ai</span>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute bottom-16 left-16 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 2 }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="font-medium">fix/bug</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Videos Section */}
      <section id="live-demo" className="py-32 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">See Beetle in Action</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Watch how Beetle transforms your GitHub workflow with intelligent automation
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {demoVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 hover:border-orange-500/20">
                  <div className="relative aspect-video bg-muted/50">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.button
                        className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPlayingVideo(video.id)}
                      >
                        <Play className="w-8 h-8 text-white ml-1" />
                      </motion.button>
                    </div>
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-orange-500 text-white">{video.duration}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">{video.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Play className="w-4 h-4" />
                        {video.views} views
                      </div>
                      <Button size="sm" variant="ghost" className="text-orange-500">
                        Watch Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GitHub Workflow Visualization */}
      <section className="py-32 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">See GitHub in Motion</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Watch how Beetle transforms your GitHub workflow with intelligent automation and visual insights
            </p>
          </motion.div>

          <GitHubWorkflowVisualization />
        </div>
      </section>

      {/* Interactive Demos */}
      <section className="py-32 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Experience Beetle Live</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Try our interactive demos to see how Beetle enhances your development workflow
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <PRReviewDemo />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <BranchVisualization />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews/Testimonials Section */}
      <section className="py-32 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Loved by Developers</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See what developers around the world are saying about Beetle
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-300 border-2 hover:border-orange-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <Quote className="w-8 h-8 text-orange-500 mb-4" />
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={testimonial.avatar || "/placeholder.jpeg"} />
                        <AvatarFallback>
                          {testimonial.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending GitHub Projects */}
      <section className="py-32 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 flex items-center justify-center gap-3">
              <TrendingUp className="w-12 h-12 text-orange-500" />
              Trending on GitHub
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Discover the hottest repositories and contribute to projects that matter
            </p>

            {/* Public Search */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search any GitHub repository, user, or organization..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg bg-background border-2 border-muted hover:border-orange-500/50 focus:border-orange-500 rounded-2xl"
                />
              </div>
            </div>
          </motion.div>

          {/* Compact Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingRepos.slice(0, 8).map((repo, index) => (
              <motion.div
                key={repo.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500/20">
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="font-bold text-sm group-hover:text-orange-500 transition-colors flex items-center gap-2 mb-2">
                        {repo.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{repo.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {repo.languages.slice(0, 2).map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-xs px-2 py-0">
                          {lang}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {repo.stars}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {repo.forks}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-green-500" />
                        <span className="text-green-500">Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Button size="lg" variant="outline" className="px-8 py-3">
              View All Trending Projects
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Major Projects on Platform */}
      <section className="py-32 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Major Projects on Beetle</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover the most impactful open-source projects being managed and enhanced through Beetle's platform
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {majorProjects.map((project, index) => (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-500 border-2 hover:border-orange-500/20 overflow-hidden">
                  <div className="relative">
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className={`${project.badgeColor} text-white`}>{project.category}</Badge>
                    </div>
                    <div className="h-48 bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
                      <div className="text-center">
                        <project.icon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                        <div className="text-6xl font-bold text-muted-foreground/20">{project.name.charAt(0)}</div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-muted-foreground mb-4">{project.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{project.stats.contributors}</div>
                        <div className="text-xs text-muted-foreground">Contributors</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{project.stats.prs}</div>
                        <div className="text-xs text-muted-foreground">PRs/Month</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{project.stats.aiSuggestions}</div>
                        <div className="text-xs text-muted-foreground">AI Fixes</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {project.stars}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="group-hover:bg-orange-500 group-hover:text-white transition-colors"
                      >
                        View Project
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

      {/* Featured Project of the Week */}
      <section className="py-32 px-4">
        <div className="container mx-auto">
          {/* Featured Project */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                Featured Projects of the Week
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentProject(currentProject > 0 ? currentProject - 1 : featuredProjects.length - 1)
                  }
                  className="rounded-full w-10 h-10 p-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentProject(currentProject < featuredProjects.length - 1 ? currentProject + 1 : 0)
                  }
                  className="rounded-full w-10 h-10 p-0"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="relative overflow-hidden">
              <motion.div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentProject * 100}%)` }}
              >
                {featuredProjects.map((project, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="flex-1 p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                                <p className="text-muted-foreground mb-4">{project.description}</p>
                              </div>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View on GitHub
                              </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {project.languages.map((lang) => (
                                <Badge key={lang} variant="secondary">
                                  {lang}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4" />
                                {project.stars}
                              </div>
                              <div className="flex items-center gap-1">
                                <GitBranch className="w-4 h-4" />
                                {project.forks}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {project.contributors} contributors
                              </div>
                            </div>
                          </div>

                          <div className="w-full md:w-80 p-6 bg-muted/30">
                            <h4 className="font-semibold mb-3">Recent Activity</h4>
                            <div className="space-y-3">
                              {project.recentActivity.map((activity, actIndex) => (
                                <div key={actIndex} className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                                  <div className="text-sm">
                                    <span className="font-medium">{activity.user}</span>
                                    <span className="text-muted-foreground"> {activity.action}</span>
                                    <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center mt-6 gap-2">
              {featuredProjects.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentProject(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentProject ? "bg-orange-500" : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </motion.section>
        </div>
      </section>

          {/* Platform Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8 text-center"
          >
            {platformStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="p-6 bg-background/50 rounded-xl border border-orange-500/10"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-orange-500" />
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start free and scale as your team grows. All plans include core GitHub integration.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative ${plan.popular ? "z-10" : ""}`}
              >
                <Card
                  className={`h-full transition-all duration-300 ${
                    plan.popular
                      ? "border-2 border-orange-500 shadow-2xl bg-gradient-to-br from-orange-500/5 to-orange-600/5"
                      : "hover:shadow-xl border-2 hover:border-orange-500/20"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-orange-500 text-white px-4 py-1">Most Popular</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}

                    <Button
                      className={`w-full mt-8 ${
                        plan.popular
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : "bg-background hover:bg-muted border-2 text-orange-600"
                      }`}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gated Content Preview */}
      <section className="py-32 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Your Personal GitHub Hub</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Sign in with GitHub to unlock personalized insights, starred repositories, and AI-powered analytics
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Starred Projects Preview */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/20 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Star className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-4">Your Starred Projects</h3>
                    <p className="text-muted-foreground mb-6">
                      Log in with GitHub to see your starred repositories with enhanced insights and AI-powered
                      recommendations.
                    </p>
                    <Button onClick={handleGitHubLogin} className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Github className="w-4 h-4 mr-2" />
                      Sign in to View
                    </Button>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-6 h-6" />
                    Starred Projects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 opacity-30">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">awesome-project-{i}</div>
                        <div className="text-sm text-muted-foreground">Amazing open source project</div>
                      </div>
                      <Badge variant="secondary">TypeScript</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* My Projects Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/20 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Code className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-4">Your Projects</h3>
                    <p className="text-muted-foreground mb-6">
                      Access your repositories with advanced analytics, branch insights, and AI-powered contribution
                      suggestions.
                    </p>
                    <Button onClick={handleGitHubLogin} className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Github className="w-4 h-4 mr-2" />
                      Sign in to View
                    </Button>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-6 h-6" />
                    My Projects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 opacity-30">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">my-awesome-app-{i}</div>
                        <div className="text-sm text-muted-foreground">Personal project</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">React</Badge>
                        <Badge variant="outline">3 PRs</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Modern Footer */}
      <footer className="relative py-24 px-4 bg-gradient-to-b from-background to-muted/30 border-t">
        <div className="container mx-auto">
          {/* Main Footer Content */}
          <div className="grid lg:grid-cols-5 gap-12 mb-16">
            {/* Brand Section - Spans 2 columns */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-bold">Beetle</span>
              </div>
              <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
                Transform your GitHub workflow with AI-powered contribution management, intelligent branch planning, and
                real-time collaboration insights that make every commit count.
              </p>

              {/* Social Links */}
              <div className="flex items-center space-x-3">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button size="sm" variant="outline" className="rounded-full w-10 h-10 p-0">
                    <Twitter className="w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button size="sm" variant="outline" className="rounded-full w-10 h-10 p-0">
                    <Github className="w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button size="sm" variant="outline" className="rounded-full w-10 h-10 p-0">
                    <Linkedin className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-lg mb-6">Product</h4>
              <div className="space-y-4">
                {[
                  { name: "Features", href: "#live-demo" },
                  { name: "Pricing", href: "#pricing" },
                ].map((link) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    className="block text-muted-foreground hover:text-foreground transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {link.name}
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold text-lg mb-6">Company</h4>
              <div className="space-y-4">
                {[
                  { name: "About", href: "#about" },
                  { name: "Blog", href: "#blog" },
                  { name: "Careers", href: "#careers" },
                  { name: "Contact", href: "#contact" },
                  { name: "Support", href: "#support" },
                ].map((link) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    className="block text-muted-foreground hover:text-foreground transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {link.name}
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="font-semibold text-lg mb-6">Resources</h4>
              <div className="space-y-4">
                {[
                  { name: "Documentation", href: "#docs" },
                  { name: "Tutorials", href: "#tutorials" },
                  { name: "Community", href: "#community" },
                  { name: "Status", href: "#status" },
                  { name: "Security", href: "#security" },
                ].map((link) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    className="block text-muted-foreground hover:text-foreground transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {link.name}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="border-t border-border pt-12 mb-12">
            <div className="max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h4 className="text-2xl font-bold mb-3">Stay in the Loop</h4>
                <p className="text-muted-foreground mb-8 text-lg">
                  Get the latest updates on new features, GitHub insights, and developer tips delivered to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    placeholder="Enter your email address"
                    className="flex-1 h-12 text-base rounded-xl border-2 focus:border-orange-500"
                  />
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white h-12 px-8 rounded-xl shadow-lg">
                      <Mail className="w-5 h-5 mr-2" />
                      Subscribe
                    </Button>
                  </motion.div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  No spam, unsubscribe at any time. We respect your privacy.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col lg:flex-row items-center justify-between pt-8 border-t border-border">
            <div className="mb-6 lg:mb-0">
              <p className="text-muted-foreground">© 2025 RAWx18. Built for developers, by developers.</p>
            </div>
            <div className="flex flex-wrap items-center gap-8 text-sm">
              {[
                { name: "Privacy Policy", href: "#privacy" },
                { name: "Terms of Service", href: "#terms" },
                { name: "Cookie Policy", href: "#cookies" },
                { name: "GDPR", href: "#gdpr" },
              ].map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {link.name}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-orange-500/50 to-transparent" />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        </div>
      </footer>
    </div>
  )
}

const majorProjects = [
  {
    name: "AIFAQ",
    description:
      "An open-source conversational AI tool that simplifies knowledge discovery within vast document repositories.",
    category: "Frontend",
    badgeColor: "bg-blue-500",
    icon: Code,
    stats: {
      contributors: "10+",
      prs: "10",
      aiSuggestions: "TBD",
    },
    technologies: ["Langchain", "Snowflake", "Hyperledger"],
    stars: "61",
  },
  {
    name: "Beetle",
    description:
    "Bettle is an open-source tool to track, organize, and collaborate across multiple branches.",
    category: "Framework",
    badgeColor: "bg-black",
    icon: Code,
    stats: {
      contributors: "3+",
      prs: "5",
      aiSuggestions: "TBD",
    },
    technologies: ["React", "Python", "Github"],
    stars: "4",
  },
]

const platformStats = [
  {
    icon: Users,
    value: "TBD",
    label: "Active Developers",
  },
  {
    icon: GitBranch,
    value: "TBD",
    label: "Branches Managed",
  },
  {
    icon: Zap,
    value: "TBD",
    label: "AI Suggestions",
  },
  {
    icon: CheckCircle,
    value: "TBD",
    label: "Success Rate",
  },
]

// Mock data
const mockTrendingRepos = [
  {
    name: "microsoft/vscode",
    description: "Visual Studio Code - Open source code editor",
    languages: ["TypeScript", "JavaScript", "CSS"],
    stars: "155k",
    forks: "27k",
    updated: "2 hours ago",
  },
  {
    name: "vercel/next.js",
    description: "The React Framework for the Web",
    languages: ["TypeScript", "JavaScript", "MDX"],
    stars: "120k",
    forks: "26k",
    updated: "1 hour ago",
  },
  {
    name: "facebook/react",
    description: "The library for web and native user interfaces",
    languages: ["JavaScript", "TypeScript"],
    stars: "220k",
    forks: "45k",
    updated: "3 hours ago",
  },
  {
    name: "tailwindlabs/tailwindcss",
    description: "A utility-first CSS framework for rapid UI development",
    languages: ["JavaScript", "CSS", "HTML"],
    stars: "78k",
    forks: "4k",
    updated: "5 hours ago",
  },
  {
    name: "openai/whisper",
    description: "Robust Speech Recognition via Large-Scale Weak Supervision",
    languages: ["Python", "Jupyter Notebook"],
    stars: "62k",
    forks: "7k",
    updated: "1 day ago",
  },
  {
    name: "rust-lang/rust",
    description: "Empowering everyone to build reliable and efficient software",
    languages: ["Rust", "C++", "Python"],
    stars: "92k",
    forks: "12k",
    updated: "4 hours ago",
  },
  {
    name: "tensorflow/tensorflow",
    description: "An Open Source Machine Learning Framework for Everyone",
    languages: ["C++", "Python", "CUDA"],
    stars: "185k",
    forks: "74k",
    updated: "6 hours ago",
  },
  {
    name: "kubernetes/kubernetes",
    description: "Production-Grade Container Scheduling and Management",
    languages: ["Go", "Shell", "Makefile"],
    stars: "108k",
    forks: "39k",
    updated: "2 hours ago",
  },
]

const demoVideos = [
  {
    id: "ai-review",
    title: "AI-Powered Code Review",
    description:
      "Watch how Beetle's AI analyzes your pull requests and provides intelligent suggestions for improvement.",
    duration: "TBD",
    views: "TBD",
  },
  {
    id: "branch-planning",
    title: "Developer and Operator Experience",
    description: "Beetle directly enhances the developer experience by organizing contributions along multiple branches.",
    duration: "TBD",
    views: "TBD",
  },
  {
    id: "collaboration",
    title: "Team Collaboration",
    description: "Discover how Beetle enhances team workflows with real-time branch wise insights and intelligent notifications.",
    duration: "TBD",
    views: "TBD",
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    description:
      "Explore Beetle's comprehensive analytics dashboard that tracks your contribution patterns and growth.",
    duration: "TBD",
    views: "TBD",
  },
]

const testimonials = [
  {
    name: "Ryan",
    role: "Contributor at LFDT",
    content:
      "Beetle has completely transformed how I manage my open-source contributions. The AI suggestions are incredibly accurate and have helped me become a better developer.",
    avatar: "/placeholder.jpeg?height=40&width=40",
  },
  {
    name: "Parv",
    role: "Contributor at Beetle",
    content:
      "The branch visualization feature is a game-changer. Our team can now see the entire project structure at a glance and make better decisions about merging strategies.",
    avatar: "/placeholder.jpeg?height=40&width=40",
  },
  {
    name: "Ronit",
    role: "Contributor at Zentoro",
    content:
      "As a maintainer of several popular repositories, Beetle's PR review automation has saved me countless hours while maintaining high code quality standards.",
    avatar: "/placeholder.jpeg?height=40&width=40",
  },
]

const pricingPlans = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for individual developers getting started",
    features: [
      "FEATURE #1",
      "FEATURE #2",
      "FEATURE #3",
      "FEATURE #4",
      "FEATURE #5",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "TBD",
    description: "Advanced features for serious developers",
    features: [
      "FEATURE #6",
      "FEATURE #7",
      "FEATURE #8",
      "FEATURE #9",
      "FEATURE #10",
      "FEATURE #11",
      "FEATURE #12",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Team",
    price: "TBD",
    description: "Collaboration tools for development teams",
    features: [
      "FEATURE #13",
      "FEATURE #14",
      "FEATURE #15",
      "FEATURE #16",
      "FEATURE #17",
      "FEATURE #18",
      "FEATURE #19",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]
