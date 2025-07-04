"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GitBranch, GitMerge, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function BranchVisualization() {
  const [activeBranch, setActiveBranch] = useState(0)
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 12)
      if (animationPhase % 3 === 0) {
        setActiveBranch((prev) => (prev + 1) % branches.length)
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [animationPhase])

  return (
    <Card className="h-full bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          Branch Planning Board
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Clean Branch Tree Visualization - Better Spaced */}
        <div className="relative bg-background/50 rounded-xl p-8 border border-blue-500/10" style={{ height: "280px" }}>
          {/* Main Branch Label */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <Badge variant="outline" className="text-xs bg-background">
              main
            </Badge>
          </div>

          {/* Main Branch Line */}
          <div className="absolute left-1/2 top-16 w-0.5 h-40 bg-gray-400 -translate-x-1/2 rounded-full" />

          {/* Branch Network - Better Spaced */}
          <div className="absolute inset-0 top-16">
            {branches.map((branch, index) => {
              const isLeft = index % 2 === 0
              const yPosition = 30 + index * 50 // Increased spacing from 35 to 50

              return (
                <motion.div
                  key={branch.name}
                  className="absolute"
                  style={{
                    left: "50%",
                    top: `${yPosition}px`,
                    transform: "translateX(-50%)",
                  }}
                  initial={{ opacity: 0.6 }}
                  animate={{
                    opacity: activeBranch === index ? 1 : 0.7,
                    scale: activeBranch === index ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Branch Line - Better Positioned */}
                  <motion.div
                    className={`absolute h-0.5 ${branch.color} rounded-full shadow-sm`}
                    style={{
                      width: "70px", // Increased from 60px
                      left: isLeft ? "-35px" : "0px", // Adjusted positioning
                      top: "50%",
                      transform: `translateY(-50%) rotate(${isLeft ? "-25deg" : "25deg"})`, // Slightly more angle
                      transformOrigin: isLeft ? "right center" : "left center",
                    }}
                    animate={{
                      scaleX: activeBranch === index ? 1.1 : 1,
                      opacity: activeBranch === index ? 1 : 0.7,
                    }}
                    transition={{ duration: 0.4 }}
                  />

                  {/* Branch Info Card - Better Positioned to Avoid Overlap */}
                  <motion.div
                    className={`absolute ${isLeft ? "right-12" : "left-12"} top-1/2 -translate-y-1/2 bg-background border rounded-lg p-2.5 min-w-36 max-w-40 shadow-sm z-10`}
                    style={{
                      // Additional positioning to prevent overlap
                      [isLeft ? "right" : "left"]: "55px",
                    }}
                    animate={{
                      borderColor:
                        activeBranch === index ? branch.color.replace("bg-", "").replace("-500", "") : "transparent",
                      boxShadow: activeBranch === index ? `0 4px 12px rgba(0,0,0,0.1)` : "0 2px 6px rgba(0,0,0,0.05)",
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <GitBranch className={`w-3 h-3 ${branch.color.replace("bg-", "text-")}`} />
                      <span className="font-medium text-xs truncate">{branch.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{branch.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">
                        {branch.commits}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {branch.status === "ready" ? (
                          <CheckCircle className="w-2.5 h-2.5 text-green-500" />
                        ) : branch.status === "review" ? (
                          <Clock className="w-2.5 h-2.5 text-blue-500" />
                        ) : (
                          <AlertTriangle className="w-2.5 h-2.5 text-yellow-500" />
                        )}
                        <span className="text-xs capitalize">{branch.status}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Branch Point */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 w-3 h-3 bg-background border-2 border-gray-400 rounded-full -translate-x-1/2 -translate-y-1/2 z-20 shadow-sm"
                    animate={{
                      borderColor:
                        activeBranch === index ? branch.color.replace("bg-", "").replace("-500", "") : "#9ca3af",
                      scale: activeBranch === index ? 1.3 : 1,
                    }}
                    transition={{ duration: 0.4 }}
                  />

                  {/* Animated Commit Flow - Cleaner Animation */}
                  <AnimatePresence>
                    {activeBranch === index && (
                      <motion.div
                        className={`absolute left-1/2 top-1/2 w-1.5 h-1.5 ${branch.color} rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm z-10`}
                        initial={{ scale: 0 }}
                        animate={{
                          scale: [0, 1.2, 0],
                          x: isLeft ? [0, -30] : [0, 30], // Adjusted for better spacing
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1.8,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Branch Status List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Active Branches</h4>
            <Button size="sm" variant="outline" className="text-xs h-7">
              <GitMerge className="w-3 h-3 mr-1" />
              Merge Strategy
            </Button>
          </div>

          {branches.map((branch, index) => (
            <motion.div
              key={branch.name}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                activeBranch === index ? "border-blue-500/50 bg-blue-500/5" : "border-muted bg-muted/30"
              }`}
              animate={{
                scale: activeBranch === index ? 1.01 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 ${branch.color} rounded-full`} />
                  <div>
                    <div className="font-medium text-sm">{branch.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {branch.author} • {branch.lastUpdate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs h-5">
                    {branch.commits}
                  </Badge>
                  <Badge variant={branch.status === "ready" ? "default" : "secondary"} className="text-xs h-5">
                    {branch.status}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Insights */}
        <motion.div
          className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl"
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <GitBranch className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="font-medium text-sm">AI Branch Insights</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Feature branch "user-dashboard" is ready for merge. No conflicts detected with main branch.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs h-6">
              Auto-merge
            </Button>
            <Button size="sm" variant="ghost" className="text-xs h-6">
              Review Changes
            </Button>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}

const branches = [
  {
    name: "feature/user-dashboard",
    description: "New user dashboard with analytics",
    commits: 8,
    status: "ready",
    author: "RAWx18",
    lastUpdate: "2h ago",
    color: "bg-green-500",
  },
  {
    name: "fix/auth-bug",
    description: "Fix authentication token expiry",
    commits: 3,
    status: "draft",
    author: "Parvm1102",
    lastUpdate: "4h ago",
    color: "bg-yellow-500",
  },
  {
    name: "feature/api-v2",
    description: "REST API version 2 implementation",
    commits: 12,
    status: "review",
    author: "Ronit-Raj9",
    lastUpdate: "1d ago",
    color: "bg-blue-500",
  },
]
