"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, TrendingUp, Award, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ContributionData {
  day: number;
  contributions: number;
  date: Date;
}

interface ContributionHeatmapProps {
  contributionData?: ContributionData[];
  loading?: boolean;
}

export function ContributionHeatmap({ contributionData: propData, loading = false }: ContributionHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => {
        const nextPhase = (prev + 1) % 365
        // Snake pattern animation
        const row = Math.floor(nextPhase / 52)
        const col = nextPhase % 52
        return row % 2 === 0 ? nextPhase : row * 52 + (51 - col)
      })
    }, 100) // Faster snake movement
    return () => clearInterval(interval)
  }, [])

  // Generate contribution data from real activity or fallback to mock data
  const generateContributionData = (): ContributionData[] => {
    if (propData && propData.length > 0) {
      return propData;
    }
    
    // Fallback to mock data if no real data provided
    return Array.from({ length: 365 }, (_, i) => {
      const intensity = Math.random()
      return {
        day: i,
        contributions: intensity > 0.8 ? 4 : intensity > 0.6 ? 3 : intensity > 0.4 ? 2 : intensity > 0.2 ? 1 : 0,
        date: new Date(Date.now() - (364 - i) * 24 * 60 * 60 * 1000),
      }
    })
  }

  const contributionData = generateContributionData()

  const getIntensityColor = (contributions: number) => {
    switch (contributions) {
      case 0:
        return "bg-muted"
      case 1:
        return "bg-green-200 dark:bg-green-900"
      case 2:
        return "bg-green-300 dark:bg-green-700"
      case 3:
        return "bg-green-400 dark:bg-green-600"
      case 4:
        return "bg-green-500 dark:bg-green-500"
      default:
        return "bg-muted"
    }
  }

  const totalContributions = contributionData.reduce((sum, day) => sum + day.contributions, 0)
  const currentStreak = calculateStreak(contributionData)
  const longestStreak = calculateLongestStreak(contributionData)

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-green-500/5 to-green-600/5 border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Contribution Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-green-500/5 to-green-600/5 border-green-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          Contribution Activity
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalContributions}</div>
            <div className="text-xs text-muted-foreground">Total contributions</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">Current streak</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{longestStreak}</div>
            <div className="text-xs text-muted-foreground">Longest streak</div>
          </div>
        </div>

        {/* FIXED Heatmap Grid - Snake Animation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Less</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div key={level} className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`} />
              ))}
            </div>
            <span className="text-muted-foreground">More</span>
          </div>

          {/* Snake Pattern Grid - 7 rows x 52 columns */}
          <div className="grid grid-rows-7 grid-flow-col gap-1 max-w-full overflow-hidden will-change-transform">
            {Array.from({ length: 7 * 52 }, (_, index) => {
              const row = index % 7
              const col = Math.floor(index / 7)

              // Snake pattern: reverse every other row
              const snakeIndex = row % 2 === 0 ? row * 52 + col : row * 52 + (51 - col)

              const dayData = contributionData[Math.min(snakeIndex, contributionData.length - 1)]

              return (
                <motion.div
                  key={index}
                  className={`w-2.5 h-2.5 rounded-sm cursor-pointer ${getIntensityColor(dayData?.contributions || 0)}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    delay: snakeIndex * 0.003, // Snake-like reveal
                    duration: 0.2,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  whileHover={{
                    scale: 1.5,
                    zIndex: 10,
                    transition: { duration: 0.1 },
                  }}
                  onHoverStart={() => setHoveredDay(snakeIndex)}
                  onHoverEnd={() => setHoveredDay(null)}
                  style={{
                    transform: animationPhase === snakeIndex ? "scale(1.3)" : "scale(1)",
                    boxShadow: animationPhase === snakeIndex ? "0 0 12px rgba(34, 197, 94, 0.8)" : "none",
                    filter: animationPhase === snakeIndex ? "brightness(1.3)" : "brightness(1)",
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredDay !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background border rounded-lg p-3 shadow-lg"
          >
            <div className="text-sm font-medium">{contributionData[hoveredDay].contributions} contributions</div>
            <div className="text-xs text-muted-foreground">
              {contributionData[hoveredDay].date.toLocaleDateString()}
            </div>
          </motion.div>
        )}

        {/* Achievement Badges */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            Recent Achievements
          </h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              7-day streak
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              100+ contributions
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Active contributor
            </Badge>
          </div>
        </div>

        {/* AI Insights */}
        <motion.div
          className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="font-medium text-sm">Contribution Insights</span>
          </div>
          <p className="text-xs text-muted-foreground">
            You're most active on Tuesdays and Wednesdays. Consider scheduling important commits during these peak
            productivity days.
          </p>
        </motion.div>
      </CardContent>
    </Card>
  )
}

function calculateStreak(data: any[]) {
  let streak = 0
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].contributions > 0) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function calculateLongestStreak(data: any[]) {
  let maxStreak = 0
  let currentStreak = 0

  for (const day of data) {
    if (day.contributions > 0) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  return maxStreak
}
