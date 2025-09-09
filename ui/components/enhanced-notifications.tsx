"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  Star,
  GitBranch,
  MessageSquare,
  GitCommit,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  MoreVertical,
  Filter,
  Search,
  Check,
  X,
  ChevronDown,
  Settings,
  Zap,
  Archive,
  MessageCircle,
  GitMerge,
  AlertCircle,
  Info,
  Trash2,
  RefreshCw,
  BookOpen,
  Code,
  Users,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

// Enhanced notification types
export interface EnhancedNotification {
  id: string
  type: 'pr' | 'issue' | 'commit' | 'star' | 'security' | 'deployment' | 'ci' | 'review' | 'mention' | 'activity'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  description?: string
  time: string
  read: boolean
  dismissed: boolean
  actions?: NotificationAction[]
  metadata?: {
    repository?: string
    number?: number
    url?: string
    author?: {
      login: string
      avatar_url?: string
    }
    status?: string
    labels?: string[]
  }
}

interface NotificationAction {
  type: 'primary' | 'secondary' | 'danger'
  label: string
  action: () => void
  icon?: any
}

interface NotificationSettings {
  types: {
    pr: boolean
    issue: boolean
    commit: boolean
    star: boolean
    security: boolean
    deployment: boolean
    ci: boolean
    review: boolean
    mention: boolean
    activity: boolean
  }
  priorities: {
    low: boolean
    medium: boolean
    high: boolean
    urgent: boolean
  }
  emailNotifications: boolean
  browserNotifications: boolean
  dailyDigest: boolean
}

interface EnhancedNotificationsProps {
  notifications: any[]
  onMarkAsRead: (index: number) => void
  onRefresh?: () => void
  repositories?: any[]
  openPRs?: any[]
  openIssues?: any[]
  recentCommits?: any[]
  userActivity?: any[]
}

const defaultSettings: NotificationSettings = {
  types: {
    pr: true,
    issue: true,
    commit: true,
    star: true,
    security: true,
    deployment: true,
    ci: true,
    review: true,
    mention: true,
    activity: false,
  },
  priorities: {
    low: false,
    medium: true,
    high: true,
    urgent: true,
  },
  emailNotifications: true,
  browserNotifications: true,
  dailyDigest: false,
}

export function EnhancedNotifications({
  notifications: rawNotifications,
  onMarkAsRead,
  onRefresh,
  repositories = [],
  openPRs = [],
  openIssues = [],
  recentCommits = [],
  userActivity = []
}: EnhancedNotificationsProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['pr', 'issue', 'security', 'ci', 'review'])
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])

  // Generate enhanced notifications from the basic data
  const enhancedNotifications = useMemo(() => {
    const enhanced: EnhancedNotification[] = []

    // Convert existing notifications
    rawNotifications.forEach((notif, index) => {
      const priority = notif.type === 'security' ? 'urgent' : 
                     notif.type === 'pr' ? 'high' :
                     notif.type === 'issue' ? 'medium' : 'low'

      enhanced.push({
        id: `${notif.type}-${index}`,
        type: notif.type,
        priority,
        title: notif.title,
        message: notif.message,
        time: notif.time,
        read: notif.read || false,
        dismissed: false,
        actions: generateNotificationActions(notif),
        metadata: {
          repository: extractRepositoryFromMessage(notif.message),
          author: notif.author
        }
      })
    })

    // Add some intelligent notifications based on GitHub data
    if (openPRs.length > 0) {
      const stalePRs = openPRs.filter(pr => {
        const daysSinceUpdate = Math.floor((Date.now() - new Date(pr.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        return daysSinceUpdate > 3
      })

      if (stalePRs.length > 0) {
        enhanced.push({
          id: 'stale-prs',
          type: 'pr',
          priority: 'medium',
          title: 'Stale Pull Requests',
          message: `${stalePRs.length} PR(s) haven't been updated in over 3 days`,
          description: 'Consider reviewing or updating these pull requests to keep development moving',
          time: 'ongoing',
          read: false,
          dismissed: false,
          actions: [
            {
              type: 'primary',
              label: 'Review PRs',
              icon: Eye,
              action: () => window.open('https://github.com/pulls', '_blank')
            },
            {
              type: 'secondary',
              label: 'Dismiss',
              icon: X,
              action: () => {}
            }
          ]
        })
      }
    }

    // Security notifications
    if (repositories.length > 0) {
      // Simulate security vulnerability detection
      const reposWithVulns = repositories.filter(repo => Math.random() > 0.8) // Random selection for demo
      if (reposWithVulns.length > 0) {
        enhanced.push({
          id: 'security-alert',
          type: 'security',
          priority: 'urgent',
          title: 'Security Vulnerabilities Detected',
          message: `${reposWithVulns.length} repositories have dependency vulnerabilities`,
          description: 'Update dependencies to fix security issues',
          time: '2 hours ago',
          read: false,
          dismissed: false,
          actions: [
            {
              type: 'danger',
              label: 'View Details',
              icon: Shield,
              action: () => window.open('https://github.com/settings/security_analysis', '_blank')
            },
            {
              type: 'primary',
              label: 'Update Dependencies',
              icon: RefreshCw,
              action: () => {}
            }
          ]
        })
      }
    }

    // CI/CD notifications
    if (recentCommits.length > 0) {
      enhanced.push({
        id: 'ci-status',
        type: 'ci',
        priority: 'high',
        title: 'CI/CD Pipeline Status',
        message: '2 builds failed, 3 deployments successful',
        description: 'Check failed builds and address any issues',
        time: '1 hour ago',
        read: false,
        dismissed: false,
        actions: [
          {
            type: 'primary',
            label: 'View Builds',
            icon: Activity,
            action: () => window.open('https://github.com/actions', '_blank')
          },
          {
            type: 'secondary',
            label: 'Debug Failures',
            icon: AlertTriangle,
            action: () => {}
          }
        ]
      })
    }

    // Collaboration notifications
    enhanced.push({
      id: 'team-activity',
      type: 'activity',
      priority: 'low',
      title: 'Team Activity Summary',
      message: 'Your team has been active: 15 commits, 5 PRs merged',
      description: 'See what your collaborators have been working on',
      time: '6 hours ago',
      read: false,
      dismissed: false,
      actions: [
        {
          type: 'secondary',
          label: 'View Activity',
          icon: Users,
          action: () => {}
        }
      ]
    })

    // Smart suggestions
    enhanced.push({
      id: 'ai-suggestion',
      type: 'review',
      priority: 'medium',
      title: 'AI Code Review Suggestion',
      message: 'Consider refactoring duplicated code in 3 files',
      description: 'AI detected potential improvements in your recent commits',
      time: '4 hours ago',
      read: false,
      dismissed: false,
      actions: [
        {
          type: 'primary',
          label: 'View Suggestions',
          icon: Zap,
          action: () => {}
        },
        {
          type: 'secondary',
          label: 'Learn More',
          icon: BookOpen,
          action: () => {}
        }
      ]
    })

    return enhanced.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [rawNotifications, openPRs, repositories, recentCommits])

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return enhancedNotifications.filter(notification => {
      // Filter by read status
      if (filter === 'unread' && notification.read) return false
      if (filter === 'urgent' && notification.priority !== 'urgent') return false

      // Filter by type
      if (selectedTypes.length > 0 && !selectedTypes.includes(notification.type)) return false

      // Filter by search query
      if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false

      return true
    })
  }, [enhancedNotifications, filter, selectedTypes, searchQuery])

  const unreadCount = enhancedNotifications.filter(n => !n.read).length
  const urgentCount = enhancedNotifications.filter(n => n.priority === 'urgent' && !n.read).length

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return AlertTriangle
      case 'high': return AlertCircle
      case 'medium': return Info
      case 'low': return Clock
      default: return Bell
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pr': return GitBranch
      case 'issue': return MessageSquare
      case 'commit': return GitCommit
      case 'star': return Star
      case 'security': return Shield
      case 'deployment': return Zap
      case 'ci': return Activity
      case 'review': return Eye
      case 'mention': return MessageCircle
      case 'activity': return Users
      default: return Bell
    }
  }

  const markAsRead = (notificationId: string) => {
    // Find the original notification index and mark as read
    const originalIndex = rawNotifications.findIndex((_, index) => 
      enhancedNotifications.find(n => n.id === notificationId)?.id === `${rawNotifications[index]?.type}-${index}`
    )
    if (originalIndex !== -1) {
      onMarkAsRead(originalIndex)
    }
  }

  const markAllAsRead = () => {
    enhancedNotifications.forEach(notification => {
      if (!notification.read) {
        markAsRead(notification.id)
      }
    })
  }

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex items-center justify-center"
            >
              <span className="w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
              {urgentCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-lg">Notifications</h4>
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread, {urgentCount} urgent
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button variant="ghost" size="sm" onClick={onRefresh}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <NotificationSettings settings={settings} onSettingsChange={setSettings} />
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-3 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {(['all', 'unread', 'urgent'] as const).map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  className="h-7 text-xs"
                >
                  {filterType === 'all' && 'All'}
                  {filterType === 'unread' && `Unread (${unreadCount})`}
                  {filterType === 'urgent' && `Urgent (${urgentCount})`}
                </Button>
              ))}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7">
                  <Filter className="w-3 h-3 mr-1" />
                  Types
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(['pr', 'issue', 'security', 'ci', 'review', 'star', 'commit'] as const).map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes(prev => [...prev, type])
                      } else {
                        setSelectedTypes(prev => prev.filter(t => t !== type))
                      }
                    }}
                  >
                    {type.toUpperCase()}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Actions Bar */}
        {unreadCount > 0 && (
          <div className="p-2 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
                {selectedNotifications.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Archive className="w-3 h-3 mr-1" />
                    Archive ({selectedNotifications.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          <AnimatePresence>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onToggleSelection={() => toggleNotificationSelection(notification.id)}
                    isSelected={selectedNotifications.includes(notification.id)}
                  />
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications found</p>
                <p className="text-xs">Try adjusting your filters</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/20">
          <Button variant="ghost" className="w-full justify-center text-sm" size="sm">
            View all notifications
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Individual notification item component
function NotificationItem({
  notification,
  onMarkAsRead,
  onToggleSelection,
  isSelected
}: {
  notification: EnhancedNotification
  onMarkAsRead: () => void
  onToggleSelection: () => void
  isSelected: boolean
}) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pr': return GitBranch
      case 'issue': return MessageSquare
      case 'commit': return GitCommit
      case 'star': return Star
      case 'security': return Shield
      case 'deployment': return Zap
      case 'ci': return Activity
      case 'review': return Eye
      case 'mention': return MessageCircle
      case 'activity': return Users
      default: return Bell
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return AlertTriangle
      case 'high': return AlertCircle
      case 'medium': return Info
      case 'low': return Clock
      default: return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const TypeIcon = getTypeIcon(notification.type)
  const PriorityIcon = getPriorityIcon(notification.priority)

  return (
    <div className="flex items-start gap-3">
      {/* Selection checkbox */}
      <div className="mt-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="w-3 h-3 rounded"
        />
      </div>

      {/* Icon and priority indicator */}
      <div className="relative">
        <TypeIcon className="w-5 h-5 text-muted-foreground" />
        <PriorityIcon className={`w-3 h-3 absolute -bottom-1 -right-1 ${getPriorityColor(notification.priority)}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium truncate">{notification.title}</p>
          {!notification.read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
        
        {notification.description && (
          <p className="text-xs text-muted-foreground/80 mb-2 italic">{notification.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-1 py-0">
              {notification.type.toUpperCase()}
            </Badge>
            <Badge variant="outline" className={`text-xs px-1 py-0 ${getPriorityColor(notification.priority)}`}>
              {notification.priority}
            </Badge>
            <span className="text-xs text-muted-foreground">{notification.time}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {!notification.read && (
                <DropdownMenuItem onClick={onMarkAsRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action buttons */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            {notification.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.type === 'primary' ? 'default' : action.type === 'danger' ? 'destructive' : 'outline'}
                size="sm"
                onClick={action.action}
                className="h-6 text-xs"
              >
                {action.icon && <action.icon className="w-3 h-3 mr-1" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Notification settings dialog
function NotificationSettings({
  settings,
  onSettingsChange
}: {
  settings: NotificationSettings
  onSettingsChange: (settings: NotificationSettings) => void
}) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pr': return GitBranch
      case 'issue': return MessageSquare
      case 'commit': return GitCommit
      case 'star': return Star
      case 'security': return Shield
      case 'deployment': return Zap
      case 'ci': return Activity
      case 'review': return Eye
      case 'mention': return MessageCircle
      case 'activity': return Users
      default: return Bell
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return AlertTriangle
      case 'high': return AlertCircle
      case 'medium': return Info
      case 'low': return Clock
      default: return Bell
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Notification Settings</DialogTitle>
      </DialogHeader>
      
      <Tabs defaultValue="types" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="priorities">Priorities</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>
        
        <TabsContent value="types" className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Notification Types</h4>
            <div className="space-y-3">
              {Object.entries(settings.types).map(([type, enabled]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {React.createElement(getTypeIcon(type), { className: "w-4 h-4" })}
                    <Label className="capitalize">{type}</Label>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        ...settings,
                        types: { ...settings.types, [type]: checked }
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="priorities" className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Priority Levels</h4>
            <div className="space-y-3">
              {Object.entries(settings.priorities).map(([priority, enabled]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {React.createElement(getPriorityIcon(priority), { 
                      className: `w-4 h-4 ${getPriorityColor(priority)}` 
                    })}
                    <Label className="capitalize">{priority}</Label>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        ...settings,
                        priorities: { ...settings.priorities, [priority]: checked }
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="delivery" className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Delivery Options</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    onSettingsChange({
                      ...settings,
                      emailNotifications: checked
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">Show desktop notifications</p>
                </div>
                <Switch
                  checked={settings.browserNotifications}
                  onCheckedChange={(checked) =>
                    onSettingsChange({
                      ...settings,
                      browserNotifications: checked
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">Get a daily summary email</p>
                </div>
                <Switch
                  checked={settings.dailyDigest}
                  onCheckedChange={(checked) =>
                    onSettingsChange({
                      ...settings,
                      dailyDigest: checked
                    })
                  }
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  )
}

// Helper functions
function generateNotificationActions(notification: any): NotificationAction[] {
  const actions: NotificationAction[] = []

  switch (notification.type) {
    case 'pr':
      actions.push(
        {
          type: 'primary',
          label: 'Review',
          icon: Eye,
          action: () => window.open('https://github.com/pulls', '_blank')
        },
        {
          type: 'secondary',
          label: 'View PR',
          icon: ExternalLink,
          action: () => {}
        }
      )
      break
    case 'issue':
      actions.push(
        {
          type: 'primary',
          label: 'View Issue',
          icon: ExternalLink,
          action: () => window.open('https://github.com/issues', '_blank')
        },
        {
          type: 'secondary',
          label: 'Comment',
          icon: MessageCircle,
          action: () => {}
        }
      )
      break
    case 'security':
      actions.push(
        {
          type: 'danger',
          label: 'View Details',
          icon: Shield,
          action: () => window.open('https://github.com/settings/security_analysis', '_blank')
        }
      )
      break
  }

  return actions
}

function extractRepositoryFromMessage(message: string): string | undefined {
  const match = message.match(/in (\S+)/)
  return match ? match[1] : undefined
}