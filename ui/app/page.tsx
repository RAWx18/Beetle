"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Github, GitBranch, ArrowRight, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

export default function Home() {
  const { isAuthenticated, login } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  

  const handleGitHubLogin = () => {
    login()
  }

  if (!mounted) return null

  // Redirect authenticated users to hub overview
  if (isAuthenticated) {
    router.push('/hub/overview');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      {/* Clean Landing Page */}
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
              {/* Theme Toggle - Mobile */}
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
                <div className="w-60 h-30 rounded-2xl flex items-center overflow-hidden">
                  <Image 
                    src="/favicon.png" 
                    alt="Beetle Logo" 
                    width={240} 
                    height={120}
                    className="object-contain"
                  />
                </div>
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
                  Beetle is an open-source tool to track, organize, and collaborate across multiple branches. 
                  With AI-powered assistance and contributor dashboards.
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

              {/* Branch Visualization */}
              <div className="relative w-full h-96 lg:h-[500px] bg-muted/30 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="400" height="300" viewBox="0 0 400 300" className="w-full h-full max-w-md">
                    {/* Main Branch */}
                    <motion.line
                      x1="50" y1="150" x2="350" y2="150"
                      stroke="currentColor" strokeWidth="3" className="text-orange-500"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 0.5 }}
                    />
                    
                    {/* Feature Branches */}
                    <motion.line
                      x1="120" y1="150" x2="180" y2="100"
                      stroke="currentColor" strokeWidth="2" className="text-blue-500"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 1 }}
                    />
                    <motion.line
                      x1="180" y1="100" x2="280" y2="150"
                      stroke="currentColor" strokeWidth="2" className="text-blue-500"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 1.2 }}
                    />

                    {/* Commit Points */}
                    {[
                      { x: 50, y: 150, color: "text-orange-500", delay: 0.5 },
                      { x: 120, y: 150, color: "text-orange-500", delay: 1 },
                      { x: 180, y: 100, color: "text-blue-500", delay: 1.2 },
                      { x: 280, y: 150, color: "text-orange-500", delay: 1.8 },
                      { x: 350, y: 150, color: "text-orange-500", delay: 2.2 },
                    ].map((point, index) => (
                      <motion.circle
                        key={index} cx={point.x} cy={point.y} r="6"
                        fill="currentColor" className={point.color}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: point.delay }}
                      />
                    ))}
                  </svg>
                </div>

                {/* Floating Branch Labels */}
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
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}