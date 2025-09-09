"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Github,
  Trash2,
  Plus,
  ExternalLink,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';

interface ConnectedRepository {
  id: string;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
  connected_at: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  commit_notifications: boolean;
  pr_notifications: boolean;
  issue_notifications: boolean;
  mention_notifications: boolean;
}

export default function HubSettings() {
  const { user, token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [connectedRepos, setConnectedRepos] = useState<ConnectedRepository[]>([]);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: false,
    commit_notifications: true,
    pr_notifications: true,
    issue_notifications: true,
    mention_notifications: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token || token === 'demo-token') {
        // Demo mode - show sample data
        const demoRepos: ConnectedRepository[] = [
          {
            id: '1',
            name: 'beetle-app',
            full_name: 'demo-user/beetle-app',
            owner: {
              login: 'demo-user',
              avatar_url: 'https://github.com/github.png'
            },
            private: false,
            permissions: {
              admin: true,
              push: true,
              pull: true
            },
            connected_at: '2024-01-15T00:00:00Z'
          },
          {
            id: '2',
            name: 'beetle-frontend',
            full_name: 'demo-user/beetle-frontend',
            owner: {
              login: 'demo-user',
              avatar_url: 'https://github.com/github.png'
            },
            private: true,
            permissions: {
              admin: false,
              push: true,
              pull: true
            },
            connected_at: '2024-02-01T00:00:00Z'
          }
        ];
        
        setConnectedRepos(demoRepos);
        setLoading(false);
        return;
      }

      try {
        // TODO: Replace with real API calls
        // const [reposRes, settingsRes] = await Promise.all([
        //   fetch('/api/user/connected-repositories', { headers: { Authorization: `Bearer ${token}` } }),
        //   fetch('/api/user/settings', { headers: { Authorization: `Bearer ${token}` } })
        // ]);
        
        // For now, show empty state until API is connected
        setConnectedRepos([]);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // TODO: Replace with real API call
      // await fetch('/api/user/settings', {
      //   method: 'PUT',
      //   headers: { 
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}` 
      //   },
      //   body: JSON.stringify({ notifications })
      // });
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectRepo = async (repoId: string) => {
    try {
      // TODO: Replace with real API call
      // await fetch(`/api/user/repositories/${repoId}/disconnect`, {
      //   method: 'DELETE',
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      
      setConnectedRepos(prev => prev.filter(repo => repo.id !== repoId));
    } catch (error) {
      console.error('Error disconnecting repository:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and connected repositories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your GitHub profile information is automatically synced
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback>
                    {user?.login?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{user?.name || user?.login}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">@{user?.login}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t">
                <Github className="w-4 h-4" />
                <span className="text-sm">Connected to GitHub</span>
                <Badge variant="secondary" className="text-green-600 bg-green-100">
                  <Check className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you want to be notified about activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notifications.email_notifications}
                    onCheckedChange={(checked) => handleNotificationChange('email_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notifications.push_notifications}
                    onCheckedChange={(checked) => handleNotificationChange('push_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="commit-notifications">Commit Activity</Label>
                    <p className="text-sm text-muted-foreground">Notify about commits and pushes</p>
                  </div>
                  <Switch
                    id="commit-notifications"
                    checked={notifications.commit_notifications}
                    onCheckedChange={(checked) => handleNotificationChange('commit_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pr-notifications">Pull Requests</Label>
                    <p className="text-sm text-muted-foreground">Notify about PR activity</p>
                  </div>
                  <Switch
                    id="pr-notifications"
                    checked={notifications.pr_notifications}
                    onCheckedChange={(checked) => handleNotificationChange('pr_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="issue-notifications">Issues</Label>
                    <p className="text-sm text-muted-foreground">Notify about issue activity</p>
                  </div>
                  <Switch
                    id="issue-notifications"
                    checked={notifications.issue_notifications}
                    onCheckedChange={(checked) => handleNotificationChange('issue_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mention-notifications">Mentions</Label>
                    <p className="text-sm text-muted-foreground">Notify when you're mentioned</p>
                  </div>
                  <Switch
                    id="mention-notifications"
                    checked={notifications.mention_notifications}
                    onCheckedChange={(checked) => handleNotificationChange('mention_notifications', checked)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Connected Repositories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  Connected Repositories
                </div>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Repository
                </Button>
              </CardTitle>
              <CardDescription>
                Repositories you've connected to Beetle for contribution tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectedRepos.length === 0 ? (
                <div className="text-center py-8">
                  <Github className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No repositories connected</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your GitHub repositories to start tracking contributions
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Your First Repository
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {connectedRepos.map((repo) => (
                    <div key={repo.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={repo.owner.avatar_url} />
                          <AvatarFallback>
                            {repo.owner.login.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{repo.name}</h4>
                            {repo.private && (
                              <Badge variant="secondary" className="text-xs">Private</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{repo.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Connected {formatDate(repo.connected_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {repo.permissions.admin && (
                            <Badge variant="outline" className="text-xs">Admin</Badge>
                          )}
                          {repo.permissions.push && (
                            <Badge variant="outline" className="text-xs">Write</Badge>
                          )}
                          {repo.permissions.pull && (
                            <Badge variant="outline" className="text-xs">Read</Badge>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://github.com/${repo.full_name}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnectRepo(repo.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Github className="w-4 h-4 mr-2" />
                Refresh GitHub Connection
              </Button>
              
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={logout}
              >
                <X className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-sm">
                Documentation
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                Contact Support
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                Report a Bug
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                Feature Requests
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}