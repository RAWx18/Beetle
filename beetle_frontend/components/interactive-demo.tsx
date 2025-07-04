"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function InteractiveDemo() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentDemo, setCurrentDemo] = useState(0)

  const demos = [
    {
      title: "AI Code Review",
      description: "Watch AI analyze and suggest improvements",
      component: <div>AI Review Demo</div>,
    },
    {
      title: "Branch Visualization",
      description: "See branch relationships in real-time",
      component: <div>Branch Demo</div>,
    },
    {
      title: "Smart Planning",
      description: "AI-powered project planning assistance",
      component: <div>Planning Demo</div>,
    },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Play className="w-5 h-5 text-white" />
          </div>
          Interactive Demo
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Demo Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className={isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCurrentDemo(0)}>
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {demos.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentDemo === index ? "bg-purple-500" : "bg-muted"
                  }`}
                  onClick={() => setCurrentDemo(index)}
                />
              ))}
            </div>
          </div>

          {/* Demo Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDemo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-64 bg-muted/30 rounded-xl p-6 flex items-center justify-center"
            >
              {demos[currentDemo].component}
            </motion.div>
          </AnimatePresence>

          {/* Demo Info */}
          <div className="text-center">
            <h3 className="font-semibold mb-2">{demos[currentDemo].title}</h3>
            <p className="text-sm text-muted-foreground">{demos[currentDemo].description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
