"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Bell, Shield, Palette, Globe, Database, Zap, GitBranch, Save, RefreshCw } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { useSettings } from '@/hooks/useSettings';
import { toast } from 'sonner';

export default function SettingsPage() {
  const showContent = useAnimateIn(false, 300);
  const { selectedBranch, getBranchInfo } = useBranch();
  const { repository } = useRepository();
  const { settings, loading, saving, updateSettings, resetSettings } = useSettings();
  const branchInfo = getBranchInfo();
  const projectName = repository?.name || 'Project';

  // Local state for form fields
  const [formData, setFormData] = useState({
    branchNotifications: true,
    autoSync: false,
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    publicProfile: true,
    twoFactorEnabled: false,
    theme: 'system',
    language: 'en',
    autoSave: true,
    hardwareAcceleration: true
  });

  // Update form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        branchNotifications: settings.preferences?.branchNotifications ?? true,
        autoSync: settings.preferences?.autoSync ?? false,
        emailNotifications: settings.notifications?.emailNotifications ?? true,
        pushNotifications: settings.notifications?.pushNotifications ?? false,
        weeklyDigest: settings.notifications?.weeklyDigest ?? true,
        publicProfile: true, // This could be added to settings schema later
        twoFactorEnabled: settings.security?.twoFactorEnabled ?? false,
        theme: settings.appearance?.theme ?? 'system',
        language: settings.appearance?.language ?? 'en',
        autoSave: settings.preferences?.autoSave ?? true,
        hardwareAcceleration: settings.appearance?.showAnimations ?? true
      });
    }
  }, [settings]);

  const handleSwitchChange = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    const settingsUpdate = {
      preferences: {
        branchNotifications: formData.branchNotifications,
        autoSync: formData.autoSync,
        autoSave: formData.autoSave,
        defaultBranch: selectedBranch || 'main'
      },
      notifications: {
        emailNotifications: formData.emailNotifications,
        pushNotifications: formData.pushNotifications,
        weeklyDigest: formData.weeklyDigest,
        pullRequestReviews: formData.emailNotifications, // Use a default from form data
        newIssues: formData.emailNotifications, // Use a default from form data
        mentions: formData.emailNotifications, // Use a default from form data
        securityAlerts: formData.emailNotifications // Use a default from form data
      },
      security: {
        twoFactorEnabled: formData.twoFactorEnabled,
        sessionTimeout: 7200000
      },
      appearance: {
        theme: formData.theme as 'light' | 'dark' | 'system',
        language: formData.language,
        compactMode: false,
        showAnimations: formData.hardwareAcceleration,
        highContrast: false
      }
    };

    const success = await updateSettings(settingsUpdate);
    if (success) {
      toast.success('Settings saved successfully!');
    }
  };

  const handleResetSettings = async () => {
    const success = await resetSettings();
    if (success) {
      toast.success('Settings reset to defaults!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-16 h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-10 pb-16 h-screen">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="h-full overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your Beetle experience and manage your preferences for {projectName}
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
              <GitBranch className="w-4 h-4" />
              {selectedBranch} branch
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Branch-specific Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Branch Settings
              </CardTitle>
              <CardDescription>
                Manage settings specific to the {selectedBranch} branch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Branch Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for {selectedBranch} branch activity
                  </p>
                </div>
                <Switch 
                  checked={formData.branchNotifications}
                  onCheckedChange={(checked) => handleSwitchChange('branchNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-sync with {selectedBranch}</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync changes from {selectedBranch} branch
                  </p>
                </div>
                <Switch 
                  checked={formData.autoSync}
                  onCheckedChange={(checked) => handleSwitchChange('autoSync', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your contributions and projects
                  </p>
                </div>
                <Switch 
                  checked={formData.emailNotifications}
                  onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get real-time notifications in your browser
                  </p>
                </div>
                <Switch 
                  checked={formData.pushNotifications}
                  onCheckedChange={(checked) => handleSwitchChange('pushNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of your activity
                  </p>
                </div>
                <Switch 
                  checked={formData.weeklyDigest}
                  onCheckedChange={(checked) => handleSwitchChange('weeklyDigest', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control your privacy settings and data security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to see your public contributions
                  </p>
                </div>
                <Switch 
                  checked={formData.publicProfile}
                  onCheckedChange={(checked) => handleSwitchChange('publicProfile', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {formData.twoFactorEnabled ? 'Enabled' : 'Enable'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={formData.theme} onValueChange={(value) => handleSelectChange('theme', value)}>
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
              <Separator />
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={formData.language} onValueChange={(value) => handleSelectChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data & Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data & Storage
              </CardTitle>
              <CardDescription>
                Manage your data and storage preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save your work as you type
                  </p>
                </div>
                <Switch 
                  checked={formData.autoSave}
                  onCheckedChange={(checked) => handleSwitchChange('autoSave', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Export Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Download a copy of your data
                  </p>
                </div>
                <Button variant="outline" size="sm">Export</Button>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance
              </CardTitle>
              <CardDescription>
                Optimize your experience and performance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hardware Acceleration</Label>
                  <p className="text-sm text-muted-foreground">
                    Use GPU acceleration for better performance
                  </p>
                </div>
                <Switch 
                  checked={formData.hardwareAcceleration}
                  onCheckedChange={(checked) => handleSwitchChange('hardwareAcceleration', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cache Management</Label>
                  <p className="text-sm text-muted-foreground">
                    Clear cached data to free up space
                  </p>
                </div>
                <Button variant="outline" size="sm">Clear Cache</Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button 
                  onClick={handleSaveSettings} 
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
                      Save Settings
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleResetSettings} 
                  disabled={saving}
                >
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </AnimatedTransition>
    </div>
  );
} 