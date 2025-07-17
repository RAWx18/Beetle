"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from 'next-themes'
import { useSettings } from '@/hooks/useSettings'
import {
  User,
  Bell,
  Shield,
  Palette,
  Code,
  Github,
  Key,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Plus,
  Zap,
  Mail,
  CreditCard,
  Download,
  FileText,
  AlertTriangle,
  Gitlab,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

export function SettingsPage() {
  const { user, token } = useAuth()
  const { theme, setTheme } = useTheme()
  const { settings, loading, saving, updateSettings, resetSettings } = useSettings()
  const [showApiKey, setShowApiKey] = useState(false)
  const [currentPlan, setCurrentPlan] = useState("open source")

  // Form state for profile information
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    company: '',
    twitter: ''
  })

  // Form state for settings
  const [settingsData, setSettingsData] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    pullRequestReviews: true,
    newIssues: true,
    mentions: true,
    securityAlerts: true,
    twoFactorEnabled: false,
    compactMode: false,
    showAnimations: true,
    highContrast: false,
    webhookUrl: '',
    webhookSecret: ''
  })

  // Update form data when user or settings change
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.blog || '',
        company: user.company || '',
        twitter: user.twitter_username || ''
      })
    }
  }, [user])

  useEffect(() => {
    if (settings) {
      setSettingsData({
        emailNotifications: settings.notifications?.emailNotifications ?? true,
        pushNotifications: settings.notifications?.pushNotifications ?? true,
        weeklyDigest: settings.notifications?.weeklyDigest ?? true,
        pullRequestReviews: settings.notifications?.pullRequestReviews ?? true,
        newIssues: settings.notifications?.newIssues ?? true,
        mentions: settings.notifications?.mentions ?? true,
        securityAlerts: settings.notifications?.securityAlerts ?? true,
        twoFactorEnabled: settings.security?.twoFactorEnabled ?? false,
        compactMode: settings.appearance?.compactMode ?? false,
        showAnimations: settings.appearance?.showAnimations ?? true,
        highContrast: settings.appearance?.highContrast ?? false,
        webhookUrl: settings.integrations?.webhookUrl ?? '',
        webhookSecret: settings.integrations?.webhookSecret ?? ''
      })
    }
  }, [settings])

  const connectedAccounts = [
    { platform: "GitHub", username: user?.login || "", connected: !!token, icon: Github },
    { platform: "GitLab", username: "", connected: false, icon: Gitlab },
    { platform: "Bitbucket", username: "", connected: false, icon: Code },
  ]

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleSettingsChange = (field: string, value: boolean | string) => {
    setSettingsData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    // Update profile settings
    const profileUpdate = {
      profile: {
        displayName: `${profileData.firstName} ${profileData.lastName}`.trim(),
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        company: profileData.company,
        twitter: profileData.twitter
      }
    }

    const success = await updateSettings(profileUpdate)
    if (success) {
      toast.success('Profile updated successfully!')
    }
  }

  const handleSaveNotifications = async () => {
    const notificationUpdate = {
      notifications: {
        emailNotifications: settingsData.emailNotifications,
        pushNotifications: settingsData.pushNotifications,
        weeklyDigest: settingsData.weeklyDigest,
        pullRequestReviews: settingsData.pullRequestReviews,
        newIssues: settingsData.newIssues,
        mentions: settingsData.mentions,
        securityAlerts: settingsData.securityAlerts
      }
    }

    const success = await updateSettings(notificationUpdate)
    if (success) {
      toast.success('Notification settings updated!')
    }
  }

  const handleSaveAppearance = async () => {
    const appearanceUpdate = {
      appearance: {
        theme: theme || 'system',
        compactMode: settingsData.compactMode,
        showAnimations: settingsData.showAnimations,
        highContrast: settingsData.highContrast
      }
    }

    const success = await updateSettings(appearanceUpdate)
    if (success) {
      toast.success('Appearance settings updated!')
    }
  }

  const handleSaveIntegrations = async () => {
    const integrationUpdate = {
      integrations: {
        webhookUrl: settingsData.webhookUrl,
        webhookSecret: settingsData.webhookSecret
      }
    }

    const success = await updateSettings(integrationUpdate)
    if (success) {
      toast.success('Integration settings updated!')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.avatar_url || "/placeholder.jpeg?height=96&width=96"} />
                    <AvatarFallback>{user?.login?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline">Change Avatar</Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      Remove Avatar
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={profileData.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      value={profileData.location}
                      onChange={(e) => handleProfileChange('location', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      value={profileData.website}
                      onChange={(e) => handleProfileChange('website', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input 
                      id="company" 
                      value={profileData.company}
                      onChange={(e) => handleProfileChange('company', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter Username</Label>
                    <Input 
                      id="twitter" 
                      value={profileData.twitter}
                      onChange={(e) => handleProfileChange('twitter', e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  className="bg-orange-500 hover:bg-orange-600" 
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified about activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{setting.title}</div>
                      <div className="text-sm text-muted-foreground">{setting.description}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <Switch 
                          checked={settingsData[setting.field as keyof typeof settingsData] as boolean}
                          onCheckedChange={(checked) => handleSettingsChange(setting.field, checked)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <Switch 
                          checked={settingsData.pushNotifications}
                          onCheckedChange={(checked) => handleSettingsChange('pushNotifications', checked)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  onClick={handleSaveNotifications} 
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Notifications
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rest of the tabs remain similar but with dynamic data... */}
        {/* I'll add the remaining tabs in the next update to keep the response manageable */}
        
        {/* Security */}
        <TabsContent value="security">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Password & Authentication</CardTitle>
                <CardDescription>Manage your password and two-factor authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button variant="outline">Update Password</Button>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch 
                      checked={settingsData.twoFactorEnabled}
                      onCheckedChange={(checked) => handleSettingsChange('twoFactorEnabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage your API keys for integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">Personal Access Token</div>
                    <div className="text-sm text-muted-foreground">
                      {showApiKey ? "sk-1234567890abcdef..." : "sk-••••••••••••••••"}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Token
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
                <CardDescription>Customize the appearance of your interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Interface Preferences</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Compact mode</span>
                      <Switch 
                        checked={settingsData.compactMode}
                        onCheckedChange={(checked) => handleSettingsChange('compactMode', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Show animations</span>
                      <Switch 
                        checked={settingsData.showAnimations}
                        onCheckedChange={(checked) => handleSettingsChange('showAnimations', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>High contrast</span>
                      <Switch 
                        checked={settingsData.highContrast}
                        onCheckedChange={(checked) => handleSettingsChange('highContrast', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveAppearance} 
                  disabled={saving}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Appearance
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>Link your accounts from different platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectedAccounts.map((account, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <account.icon className="w-8 h-8" />
                      <div>
                        <div className="font-medium">{account.platform}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.connected ? `@${account.username}` : "Not connected"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.connected && (
                        <Badge variant="secondary" className="text-green-600">
                          Connected
                        </Badge>
                      )}
                      <Button variant={account.connected ? "outline" : "default"} size="sm">
                        {account.connected ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Settings</CardTitle>
                <CardDescription>Configure webhooks for external integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input 
                    id="webhookUrl" 
                    placeholder="https://your-app.com/webhook" 
                    value={settingsData.webhookUrl}
                    onChange={(e) => handleSettingsChange('webhookUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Secret</Label>
                  <Input 
                    id="webhookSecret" 
                    type="password" 
                    placeholder="Enter webhook secret" 
                    value={settingsData.webhookSecret}
                    onChange={(e) => handleSettingsChange('webhookSecret', e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Test Webhook</Button>
                  <Button 
                    onClick={handleSaveIntegrations} 
                    disabled={saving}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Integrations
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Manage your subscription and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl">
                  <div>
                    <h3 className="text-xl font-bold">Open Source Plan</h3>
                    <p className="text-muted-foreground">Free • Runs locally</p>
                    <p className="text-sm text-muted-foreground mt-2">Self-hosted solution with full control</p>
                  </div>
                  <div className="text-right">
                    <Button variant="outline">Upgrade Plan</Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex gap-3">
                    <Button variant="destructive" size="sm">
                      Cancel Subscription
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetSettings}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        'Reset All Settings'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cancelling will downgrade your account to the Open Source plan.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Mock data
const notificationSettings = [
  {
    id: 1,
    title: "Pull Request Reviews",
    description: "Get notified when someone requests your review",
    field: "pullRequestReviews"
  },
  {
    id: 2,
    title: "New Issues",
    description: "Notifications for new issues in your repositories",
    field: "newIssues"
  },
  {
    id: 3,
    title: "Mentions",
    description: "When someone mentions you in comments or discussions",
    field: "mentions"
  },
  {
    id: 4,
    title: "Security Alerts",
    description: "Important security notifications for your repositories",
    field: "securityAlerts"
  },
]
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.avatar_url || "/placeholder.jpeg?height=96&width=96"} />
                    <AvatarFallback>{user?.login?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline">Change Avatar</Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      Remove Avatar
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={profileData.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      value={profileData.location}
                      onChange={(e) => handleProfileChange('location', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      value={profileData.website}
                      onChange={(e) => handleProfileChange('website', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input 
                      id="company" 
                      value={profileData.company}
                      onChange={(e) => handleProfileChange('company', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter Username</Label>
                    <Input 
                      id="twitter" 
                      value={profileData.twitter}
                      onChange={(e) => handleProfileChange('twitter', e.target.value)}
                    />
                  </div>
                </div>

                <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSaveProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified about activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{setting.title}</div>
                      <div className="text-sm text-muted-foreground">{setting.description}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <Switch defaultChecked={setting.email} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <Switch defaultChecked={setting.push} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Password & Authentication</CardTitle>
                <CardDescription>Manage your password and two-factor authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button variant="outline">Update Password</Button>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage your API keys for integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">Personal Access Token</div>
                    <div className="text-sm text-muted-foreground">
                      {showApiKey ? "sk-1234567890abcdef..." : "sk-••••••••••••••••"}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Token
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>Link your accounts from different platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectedAccounts.map((account, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <account.icon className="w-8 h-8" />
                      <div>
                        <div className="font-medium">{account.platform}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.connected ? `@${account.username}` : "Not connected"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.connected && (
                        <Badge variant="secondary" className="text-green-600">
                          Connected
                        </Badge>
                      )}
                      <Button variant={account.connected ? "outline" : "default"} size="sm">
                        {account.connected ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Settings</CardTitle>
                <CardDescription>Configure webhooks for external integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input id="webhookUrl" placeholder="https://your-app.com/webhook" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Secret</Label>
                  <Input id="webhookSecret" type="password" placeholder="Enter webhook secret" />
                </div>
                <Button variant="outline">Test Webhook</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
                <CardDescription>Customize the appearance of your interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Interface Preferences</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Compact mode</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Show animations</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>High contrast</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced Billing */}
        <TabsContent value="billing">
          <div className="grid gap-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Manage your subscription and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl">
                  <div>
                    <h3 className="text-xl font-bold">Open Source Plan</h3>
                    <p className="text-muted-foreground">Free • Runs locally</p>
                    <p className="text-sm text-muted-foreground mt-2">Self-hosted solution with full control</p>
                  </div>
                  <div className="text-right">
                    <Button variant="outline">Upgrade Plan</Button>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">TBD</div>
                    <div className="text-sm text-muted-foreground">Projects</div>
                    <div className="text-xs text-muted-foreground mt-1">Unlimited available</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">TBD</div>
                    <div className="text-sm text-muted-foreground">API Calls</div>
                    <div className="text-xs text-muted-foreground mt-1">Run locally</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-500">TBD</div>
                    <div className="text-sm text-muted-foreground">AI Reviews</div>
                    <div className="text-xs text-muted-foreground mt-1">Run locally</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
                <CardDescription>Choose the plan that best fits your needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {availablePlans.map((plan, index) => (
                    <div
                      key={plan.name}
                      className={`p-6 border rounded-xl relative ${
                        plan.name.toLowerCase().replace(/\s+/g, '') === currentPlan.replace(/\s+/g, '')
                          ? "border-green-500 bg-green-500/5"
                          : "border-border hover:border-green-500/50"
                      } transition-colors`}
                    >
                      {plan.name.toLowerCase().replace(/\s+/g, '') === currentPlan.replace(/\s+/g, '') && (
                        <Badge className="absolute -top-2 left-4 bg-green-500">Current Plan</Badge>
                      )}

                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <div className="mt-2">
                          <span className="text-3xl font-bold">{plan.price === 0 ? "Free" : `$${plan.price}`}</span>
                          {plan.price !== 0 && <span className="text-muted-foreground">/month</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                      </div>

                      <div className="space-y-2 mb-6">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                            {feature}
                          </div>
                        ))}
                      </div>

                      <Button
                        className={`w-full ${
                          plan.name.toLowerCase().replace(/\s+/g, '') === currentPlan.replace(/\s+/g, '')
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                        disabled={plan.name.toLowerCase().replace(/\s+/g, '') === currentPlan.replace(/\s+/g, '')}
                      >
                        {plan.name.toLowerCase().replace(/\s+/g, '') === currentPlan.replace(/\s+/g, '') ? "Current Plan" : `Upgrade to ${plan.name}`}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Manage your payment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">•••• •••• •••• 4242</div>
                    <div className="text-sm text-muted-foreground">Expires 12/25</div>
                  </div>
                  <Button variant="outline" size="sm">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View and download your past invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billingHistory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{item.description}</div>
                          <div className="text-sm text-muted-foreground">{item.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium">${item.amount}</div>
                          <Badge variant={item.status === "paid" ? "secondary" : "destructive"} className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
                <CardDescription>Important information about your subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    By continuing your subscription, you agree to our updated Terms of Service and Privacy Policy.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                    <span>Subscriptions automatically renew unless cancelled before the next billing cycle.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                    <span>You can cancel your subscription at any time from this settings page.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                    <span>Refunds are available within 30 days of purchase for annual plans.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                    <span>All prices are in USD and exclude applicable taxes.</span>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Terms of Service
                  </Button>
                  <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="destructive" size="sm">
                    Cancel Subscription
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cancelling will downgrade your account to the Open Source plan at the end of your current billing period.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Mock data
const notificationSettings = [
  {
    id: 1,
    title: "Pull Request Reviews",
    description: "Get notified when someone requests your review",
    email: true,
    push: true,
  },
  {
    id: 2,
    title: "New Issues",
    description: "Notifications for new issues in your repositories",
    email: true,
    push: false,
  },
  {
    id: 3,
    title: "Mentions",
    description: "When someone mentions you in comments or discussions",
    email: true,
    push: true,
  },
  {
    id: 4,
    title: "Security Alerts",
    description: "Important security notifications for your repositories",
    email: true,
    push: true,
  },
]

const availablePlans = [
  {
    name: "Open Source",
    price: 0,
    description: "Free self-hosted solution",
    features: ["Unlimited projects", "Full GitHub integration", "Runs locally", "Community support", "Complete control"],
  },
  {
    name: "Contributor",
    price: "TBD",
    description: "For individual contributors",
    features: [
      "Cloud-hosted solution",
      "AI-powered reviews",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
    ],
  },
  {
    name: "Organization",
    price: "TBD",
    description: "For development teams",
    features: ["Everything in Contributor", "Team collaboration", "Advanced security", "SSO integration", "Dedicated support"],
  },
]

const billingHistory = [
  {
    description: "Contributor Plan - Monthly",
    date: "Dec 15, 2023",
    amount: "0.00",
    status: "paid",
  },
  {
    description: "Contributor Plan - Monthly",
    date: "Nov 15, 2023",
    amount: "0.00",
    status: "paid",
  },
  {
    description: "Contributor Plan - Monthly",
    date: "Oct 15, 2023",
    amount: "0.00",
    status: "paid",
  },
]
