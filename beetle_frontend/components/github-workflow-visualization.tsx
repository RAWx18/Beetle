"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GitBranch, GitCommit, GitPullRequest, CheckCircle, Code2, GitMerge, Github } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function GitHubWorkflowVisualization() {
  const [activeStep, setActiveStep] = useState(0)
  const [flowPhase, setFlowPhase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFlowPhase((prev) => (prev + 1) % 16)
      if (flowPhase % 4 === 0) {
        setActiveStep((prev) => (prev + 1) % 4)
      }
    }, 800)
    return () => clearInterval(interval)
  }, [flowPhase])

  return (
    <div className="relative max-w-6xl mx-auto">
      {/* Clean Modern Workflow Cards */}
      <div className="grid lg:grid-cols-4 gap-6 mb-12">
        {workflowSteps.map((step, index) => (
          <motion.div
            key={step.title}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-700 ${
              activeStep === index
                ? "border-orange-500/30 bg-orange-500/5 shadow-lg shadow-orange-500/10"
                : "border-border bg-card hover:border-orange-500/20"
            }`}
            animate={{
              scale: activeStep === index ? 1.02 : 1,
              y: activeStep === index ? -4 : 0,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Step Icon */}
            <motion.div
              className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all duration-500 ${
                activeStep === index ? "bg-orange-500 text-white shadow-lg" : "bg-muted text-muted-foreground"
              }`}
              animate={{
                rotate: activeStep === index ? [0, 360] : 0,
              }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <step.icon className="w-6 h-6" />
            </motion.div>

            {/* Step Content */}
            <div className="text-center space-y-3">
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

              {/* Clean Progress Indicators */}
              <div className="flex justify-center gap-2 pt-2">
                {step.metrics.map((metric, metricIndex) => (
                  <motion.div
                    key={metricIndex}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                      activeStep === index
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                    animate={{
                      scale: activeStep === index ? [1, 1.05, 1] : 1,
                    }}
                    transition={{ duration: 0.5, delay: metricIndex * 0.1 }}
                  >
                    {metric}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Active Indicator */}
            <AnimatePresence>
              {activeStep === index && (
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Live Activity Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <GitCommit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">Live Commits</h4>
                  <p className="text-sm text-muted-foreground">Real-time activity</p>
                </div>
              </div>

              <div className="space-y-3">
                {recentCommits.map((commit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-background/60 rounded-xl border border-green-500/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.3 }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{commit.message}</div>
                      <div className="text-xs text-muted-foreground">
                        {commit.author} • {commit.time}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {commit.branch}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <GitPullRequest className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">Active PRs</h4>
                  <p className="text-sm text-muted-foreground">Review pipeline</p>
                </div>
              </div>

              <div className="space-y-3">
                {activePRs.map((pr, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-background/60 rounded-xl border border-blue-500/10"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        pr.status === "approved"
                          ? "bg-green-500"
                          : pr.status === "review"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{pr.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {pr.author} • {pr.time}
                      </div>
                    </div>
                    <Badge variant={pr.status === "approved" ? "default" : "secondary"} className="text-xs shrink-0">
                      {pr.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

const workflowSteps = [
  {
    icon: Github,
    title: "Connect via GitHub",
    description: "Instantly sync your repos, branches, and activity.",
    metrics: ["Sync", "Authenticate", "Import"],
  },
  {
    icon: GitBranch,
    title: "Branch-Centric Workspace",
    description: "Get a smart dashboard for every branch.",
    metrics: ["Branches", "Organise", "Structure"],
  },
  {
    icon: GitPullRequest,
    title: "AI-Powered Contribution Flow",
    description: "AI help plan, suggest, and summarize your workflow.",
    metrics: ["Plan", "Suggest", "Automate"],
  },
  {
    icon: GitMerge,
    title: "Track, Collaborate & Merge",
    description: "Manage progress and merge with clarity.",
    metrics: ["Track", "Review", "Merge"],
  },
]

const recentCommits = [
  { message: "feat: add user authentication system", author: "RAWx18", time: "2m ago", branch: "main" },
  { message: "fix: resolve memory leak in parser", author: "Parvm1102", time: "5m ago", branch: "bugfix" },
  { message: "docs: update API documentation", author: "Ronit-Raj9", time: "8m ago", branch: "docs" },
]

const activePRs = [
  { title: "Optimize database queries", author: "RAWx18", time: "1h ago", status: "approved" },
  { title: "Add dark mode support", author: "Parvm1102", time: "3h ago", status: "review" },
  { title: "Implement user dashboard", author: "Ronit-Raj9", time: "5h ago", status: "draft" },
]
