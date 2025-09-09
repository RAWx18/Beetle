import { useLocalStorage } from '@/contexts/LocalStorageContext';
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  Trophy,
  Zap,
  GitCommit,
  GitBranch,
  Folder,
  Star,
  CheckCircle,
  Circle,
  Plus,
  Edit,
  X,
  Check,
  Trash2,
  Clock,
  Award,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Goal {
  id: number
  title: string
  current: number
  target: number
  description: string
  type: "repositories" | "commits" | "prs" | "custom"
  icon?: React.ComponentType<{ className?: string }>
  color?: string
  trend?: number // percentage change from last month
  lastMonthValue?: number
}

interface MonthlyGoalsProps {
  goals: Goal[]
  onGoalsUpdate: (goals: Goal[]) => void
  dashboardStats: {
    totalRepos: number
    totalCommits: number
    totalPRs: number
  }
}

export function MonthlyGoals({ goals, onGoalsUpdate, dashboardStats }: MonthlyGoalsProps) {
  const [isEditingGoals, setIsEditingGoals] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: "", target: 0, description: "", type: "custom" as const })
  
  // Calculate days remaining in current month
  const getDaysRemainingInMonth = () => {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const diffTime = endOfMonth.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Get goal icon based on type
  const getGoalIcon = (type: string) => {
    switch (type) {
      case "repositories": return Folder
      case "commits": return GitCommit
      case "prs": return GitBranch
      default: return Target
    }
  }

  // Get goal color based on progress and type
  const getGoalColor = (goal: Goal) => {
    const progress = (goal.current / goal.target) * 100
    if (progress >= 100) return "text-green-500"
    if (progress >= 75) return "text-blue-500"
    if (progress >= 50) return "text-yellow-500"
    if (goal.type === "repositories") return "text-purple-500"
    if (goal.type === "commits") return "text-green-500"
    if (goal.type === "prs") return "text-blue-500"
    return "text-orange-500"
  }

  // Get goal background based on progress
  const getGoalBackground = (goal: Goal) => {
    const progress = (goal.current / goal.target) * 100
    if (progress >= 100) return "from-green-500/10 to-green-600/5"
    if (progress >= 75) return "from-blue-500/10 to-blue-600/5"
    if (progress >= 50) return "from-yellow-500/10 to-yellow-600/5"
    return "from-orange-500/10 to-orange-600/5"
  }

  // Calculate goal completion status
  const getGoalStatus = (goal: Goal) => {
    const progress = (goal.current / goal.target) * 100
    if (progress >= 100) return { status: "completed", text: "Completed!", icon: CheckCircle }
    if (progress >= 75) return { status: "almost", text: "Almost there!", icon: TrendingUp }
    if (progress >= 50) return { status: "progress", text: "On track", icon: Circle }
    return { status: "behind", text: "Needs attention", icon: Clock }
  }

  // Update goals with real data
  const updateGoalsWithRealData = (goalsToUpdate: Goal[]) => {
    return goalsToUpdate.map(goal => {
      switch (goal.type) {
        case "repositories":
          return { ...goal, current: dashboardStats.totalRepos }
        case "commits":
          return { ...goal, current: dashboardStats.totalCommits }
        case "prs":
          return { ...goal, current: dashboardStats.totalPRs }
        default:
          return goal
      }
    })
  }

  // Handle goal editing
  const handleGoalEdit = () => {
    setIsEditingGoals(true)
  }

  const { setItem } = useLocalStorage();
  const handleGoalSave = () => {
    setIsEditingGoals(false)
    const updatedGoals = updateGoalsWithRealData(goals)
    onGoalsUpdate(updatedGoals)
    setItem('monthlyGoals', updatedGoals)
  }

  const handleGoalCancel = () => {
    setIsEditingGoals(false)
    // Reset to current values
    const resetGoals = updateGoalsWithRealData(goals)
    onGoalsUpdate(resetGoals)
  }

  const addNewGoal = () => {
    if (newGoal.title && newGoal.target > 0) {
      const updatedGoals = [...goals, {
        id: Date.now(),
        title: newGoal.title,
        current: 0,
        target: newGoal.target,
        description: newGoal.description,
        type: "custom" as const
      }]
      onGoalsUpdate(updatedGoals)
      setNewGoal({ title: "", target: 0, description: "", type: "custom" })
    }
  }

  const removeGoal = (id: number) => {
    const updatedGoals = goals.filter(goal => goal.id !== id)
    onGoalsUpdate(updatedGoals)
  }

  const updateGoalTarget = (id: number, newTarget: number) => {
    const updatedGoals = goals.map(goal => 
      goal.id === id ? { ...goal, target: newTarget } : goal
    )
    onGoalsUpdate(updatedGoals)
  }

  const updateGoalTitle = (id: number, newTitle: string) => {
    const updatedGoals = goals.map(goal => 
      goal.id === id ? { ...goal, title: newTitle } : goal
    )
    onGoalsUpdate(updatedGoals)
  }

  // Calculate overall progress
  const overallProgress = goals.length > 0 
    ? goals.reduce((sum, goal) => sum + Math.min((goal.current / goal.target) * 100, 100), 0) / goals.length
    : 0

  const completedGoals = goals.filter(goal => (goal.current / goal.target) * 100 >= 100).length
  const daysRemaining = getDaysRemainingInMonth()

  return (
    <TooltipProvider>
      <Card className="relative overflow-hidden w-full">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-purple-500/5 to-blue-500/5" />
        
        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-purple-600 flex-shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  Monthly Goals
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {daysRemaining} days left
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm">
                  {completedGoals} of {goals.length} goals completed • {Math.round(overallProgress)}%
                </CardDescription>
              </div>
            </div>
            {isEditingGoals ? (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleGoalSave} className="bg-green-500 hover:bg-green-600">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleGoalCancel}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={handleGoalEdit} className="hover:bg-orange-500/10">
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Overall progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <div className="relative overflow-hidden rounded-full">
              <Progress value={overallProgress} className="h-3" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(overallProgress, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4 p-4">
          <AnimatePresence>
            {goals.map((goal, index) => {
              const IconComponent = getGoalIcon(goal.type)
              const progress = (goal.current / goal.target) * 100
              const status = getGoalStatus(goal)
              const StatusIcon = status.icon
              
              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative group p-4 rounded-xl border bg-gradient-to-r ${getGoalBackground(goal)} hover:shadow-md transition-all duration-300 overflow-hidden`}
                >
                  {/* Achievement badge for completed goals */}
                  {progress >= 100 && (
                    <motion.div
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-2 -right-2 z-10"
                    >
                      <div className="p-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${progress >= 100 ? 'bg-green-500' : 'bg-background/50'}`}>
                      <IconComponent className={`w-4 h-4 ${progress >= 100 ? 'text-white' : getGoalColor(goal)}`} />
                    </div>

                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {isEditingGoals ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Input
                                value={goal.title}
                                onChange={(e) => updateGoalTitle(goal.id, e.target.value)}
                                className="flex-1 min-w-0 text-sm h-8"
                                style={{ minWidth: '120px' }}
                              />
                              <Input
                                type="number"
                                value={goal.target}
                                onChange={(e) => updateGoalTarget(goal.id, parseInt(e.target.value) || 0)}
                                className="w-16 text-sm h-8 flex-shrink-0"
                              />
                              <Button size="sm" variant="ghost" onClick={() => removeGoal(goal.id)} className="h-8 w-8 p-0 flex-shrink-0">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-sm">{goal.title}</h4>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className={`text-xs flex-shrink-0 ${status.status === 'completed' ? 'bg-green-100 text-green-800' : ''}`}>
                                      <StatusIcon className="w-3 h-3 mr-1" />
                                      {status.text}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{goal.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 break-words">{goal.description}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="font-bold text-lg">
                              {goal.current}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">
                              {goal.target}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(progress)}% complete
                          </div>
                        </div>
                      </div>

                      {/* Enhanced progress bar */}
                      <div className="space-y-2">
                        <div className="relative overflow-hidden rounded-full">
                          <Progress value={Math.min(progress, 100)} className="h-2" />
                          {progress > 100 && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full overflow-hidden"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <div className="w-full h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 animate-pulse" />
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Progress insights */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {goal.trend !== undefined && (
                              <div className={`flex items-center gap-1 ${goal.trend > 0 ? 'text-green-500' : goal.trend < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {goal.trend > 0 ? <ArrowUp className="w-3 h-3" /> : goal.trend < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                <span>{Math.abs(goal.trend)}%</span>
                              </div>
                            )}
                            <span>vs last month</span>
                          </div>
                          
                          {progress < 100 && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{Math.max(0, goal.target - goal.current)} to go</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Celebration particles for completed goals */}
                  {progress >= 100 && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Sparkles className="absolute top-2 right-4 w-4 h-4 text-yellow-500" />
                      <Sparkles className="absolute bottom-2 left-4 w-3 h-3 text-orange-500" />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
          
          {/* Add new goal */}
          {isEditingGoals && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-2 border-t border-dashed overflow-hidden"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  placeholder="Goal title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="flex-1 h-8 min-w-0"
                  style={{ minWidth: '120px' }}
                />
                <Input
                  placeholder="Description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  className="flex-1 h-8 min-w-0"
                  style={{ minWidth: '120px' }}
                />
                <Input
                  type="number"
                  placeholder="Target"
                  value={newGoal.target || ""}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                  className="w-20 h-8 flex-shrink-0"
                />
                <Button size="sm" onClick={addNewGoal} className="h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600 flex-shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Motivational footer */}
          {!isEditingGoals && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center pt-4 border-t border-dashed"
            >
              <div className="text-center">
                {overallProgress >= 100 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Award className="w-4 h-4" />
                    <span className="text-sm font-medium">All goals completed! 🎉</span>
                  </div>
                ) : overallProgress >= 75 ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">You're doing great! Keep it up!</span>
                  </div>
                ) : overallProgress >= 50 ? (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Good progress! Stay focused!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">{daysRemaining} days left. You can do this!</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}