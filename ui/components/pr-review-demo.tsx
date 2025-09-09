"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, AlertCircle, Zap, Clock, Code, GitPullRequest, Shield, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

export function PRReviewDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % reviewSteps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (currentStep === 2) {
      // Simulate AI suggestions appearing
      const timer = setTimeout(() => {
        setAiSuggestions(mockAISuggestions)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setAiSuggestions([])
    }
  }, [currentStep])

  return (
    <Card className="h-full bg-gradient-to-br from-purple-500/5 to-purple-600/5 border-purple-500/20 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          AI-Powered PR Review
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* PR Header */}
        <div className="flex items-start gap-4 p-4 bg-background/50 rounded-xl border border-purple-500/10">
          <Avatar className="w-10 h-10">
            <AvatarImage src="/placeholder.jpeg?height=40&width=40" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">Add user authentication system</h4>
              <Badge variant="outline" className="text-xs">
                #247
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Implements JWT-based authentication with password hashing and session management
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <GitPullRequest className="w-3 h-3" />3 files changed
              </span>
              <span className="flex items-center gap-1">
                <Code className="w-3 h-3" />
                +127 -23
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />2 hours ago
              </span>
            </div>
          </div>
        </div>

        {/* Review Steps */}
        <div className="space-y-3">
          {reviewSteps.map((step, index) => (
            <motion.div
              key={index}
              className={`p-4 rounded-xl border-2 transition-all duration-500 ${
                currentStep === index
                  ? "border-purple-500/50 bg-purple-500/5 shadow-lg"
                  : currentStep > index
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-muted bg-muted/30"
              }`}
              animate={{
                scale: currentStep === index ? 1.02 : 1,
              }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep > index
                      ? "bg-green-500 text-white"
                      : currentStep === index
                        ? "bg-purple-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                  animate={{
                    rotate: currentStep === index ? [0, 360] : 0,
                  }}
                  transition={{ duration: 2, ease: "linear" }}
                >
                  {currentStep > index ? <CheckCircle className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                </motion.div>
                <div className="flex-1">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-sm text-muted-foreground">{step.description}</div>
                </div>
                {currentStep === index && (
                  <motion.div
                    className="flex items-center gap-1 text-xs text-purple-500"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    Processing...
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Suggestions - Fixed Height Container */}
        <div className="h-52 relative">
          <AnimatePresence mode="wait">
            {aiSuggestions.length > 0 ? (
              <motion.div
                key="suggestions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-purple-600 mb-3">
                  <Zap className="w-4 h-4" />
                  AI Suggestions
                </div>
                <ScrollArea className="h-44">
                  <div className="space-y-3 pr-4">
                    {aiSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className={`p-3 rounded-lg border-l-4 ${
                          suggestion.type === "security"
                            ? "border-red-500 bg-red-500/5"
                            : suggestion.type === "performance"
                              ? "border-yellow-500 bg-yellow-500/5"
                              : "border-blue-500 bg-blue-500/5"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <suggestion.icon
                            className={`w-4 h-4 mt-0.5 ${
                              suggestion.type === "security"
                                ? "text-red-500"
                                : suggestion.type === "performance"
                                  ? "text-yellow-500"
                                  : "text-blue-500"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium mb-1">{suggestion.title}</div>
                            <div className="text-xs text-muted-foreground mb-2">{suggestion.description}</div>
                            <Button size="sm" variant="outline" className="text-xs">
                              Apply Fix
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            ) : currentStep === reviewSteps.length - 1 ? (
              <motion.div
                key="final-review"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-700 dark:text-green-400 text-lg">Review Complete</div>
                    <div className="text-sm text-muted-foreground">Ready for merge with 3 AI suggestions applied</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div className="p-2 bg-background/50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">98%</div>
                    <div className="text-xs text-muted-foreground">Quality</div>
                  </div>
                  <div className="p-2 bg-background/50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">0</div>
                    <div className="text-xs text-muted-foreground">Conflicts</div>
                  </div>
                  <div className="p-2 bg-background/50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">3</div>
                    <div className="text-xs text-muted-foreground">Fixes</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="bg-green-500 hover:bg-green-600 text-white flex-1 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Merge
                  </Button>
                  <Button variant="outline" className="flex-1 text-sm">
                    Request Changes
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center text-muted-foreground"
              >
                <div className="text-center">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">AI suggestions will appear here</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

const reviewSteps = [
  {
    icon: Code,
    title: "Code Analysis",
    description: "Scanning for potential issues and improvements",
  },
  {
    icon: Shield,
    title: "Security Check",
    description: "Identifying security vulnerabilities and best practices",
  },
  {
    icon: Zap,
    title: "AI Suggestions",
    description: "Generating intelligent recommendations",
  },
  {
    icon: CheckCircle,
    title: "Final Review",
    description: "Compiling comprehensive review summary",
  },
]

const mockAISuggestions = [
  {
    type: "security",
    icon: AlertCircle,
    title: "Password Hashing Improvement",
    description: "Consider using bcrypt with a higher salt rounds (12-14) for better security",
  },
  {
    type: "performance",
    icon: TrendingUp,
    title: "Database Query Optimization",
    description: "Add database index on user.email for faster authentication lookups",
  },
  {
    type: "code",
    icon: Code,
    title: "Error Handling Enhancement",
    description: "Add specific error messages for different authentication failure scenarios",
  },
  {
    type: "security",
    icon: Shield,
    title: "Input Validation",
    description: "Add input sanitization for email field to prevent injection attacks",
  },
  {
    type: "performance",
    icon: TrendingUp,
    title: "Caching Strategy",
    description: "Implement Redis caching for frequently accessed user sessions",
  },
]
