"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserSettings {
  profile: {
    displayName: string;
    bio: string;
    location: string;
    website: string;
    company: string;
    twitter: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
    pullRequestReviews: boolean;
    newIssues: boolean;
    mentions: boolean;
    securityAlerts: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    compactMode: boolean;
    showAnimations: boolean;
    highContrast: boolean;
  };
  integrations: {
    connectedAccounts: {
      github: { connected: boolean; username: string };
      gitlab: { connected: boolean; username: string };
      bitbucket: { connected: boolean; username: string };
    };
    webhookUrl: string;
    webhookSecret: string;
  };
  preferences: {
    autoSave: boolean;
    branchNotifications: boolean;
    autoSync: boolean;
    defaultBranch: string;
  };
  updatedAt?: string;
}

export function useSettings() {
  const { isAuthenticated, token } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings when authenticated
  useEffect(() => {
    if (isAuthenticated && token && token !== 'demo-token') {
      loadSettings();
    } else if (token === 'demo-token') {
      // Load demo settings
      setSettings(getDemoSettings());
    }
  }, [isAuthenticated, token]);

  const loadSettings = useCallback(async () => {
    if (!isAuthenticated || token === 'demo-token') return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getUserSettings();
      if (response.error) {
        setError(response.error.message);
        toast.error('Failed to load settings');
      } else {
        setSettings(response.data?.settings || null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const updateSettings = useCallback(async (settingsUpdate: Partial<UserSettings>) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to update settings');
      return false;
    }

    if (token === 'demo-token') {
      // Demo mode - update local state only
      setSettings(prev => prev ? { ...prev, ...settingsUpdate } : null);
      toast.success('Settings updated (demo mode)');
      return true;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await apiService.updateUserSettings(settingsUpdate);
      if (response.error) {
        setError(response.error.message);
        toast.error('Failed to save settings');
        return false;
      } else {
        setSettings(response.data?.settings || null);
        toast.success(response.data?.message || 'Settings updated successfully');
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated, token]);

  const resetSettings = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to reset settings');
      return false;
    }

    if (token === 'demo-token') {
      // Demo mode - reset to demo settings
      setSettings(getDemoSettings());
      toast.success('Settings reset to defaults (demo mode)');
      return true;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await apiService.resetUserSettings();
      if (response.error) {
        setError(response.error.message);
        toast.error('Failed to reset settings');
        return false;
      } else {
        setSettings(response.data?.settings || null);
        toast.success(response.data?.message || 'Settings reset to defaults');
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated, token]);

  return {
    settings,
    loading,
    saving,
    error,
    loadSettings,
    updateSettings,
    resetSettings
  };
}

// Demo settings for demo mode
function getDemoSettings(): UserSettings {
  return {
    profile: {
      displayName: 'Demo User',
      bio: 'This is a demo account showing Beetle functionality',
      location: 'Demo City',
      website: 'https://beetle-demo.com',
      company: 'Demo Company',
      twitter: 'demo_user'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: true,
      pullRequestReviews: true,
      newIssues: true,
      mentions: true,
      securityAlerts: true
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 7200000
    },
    appearance: {
      theme: 'system',
      language: 'en',
      compactMode: false,
      showAnimations: true,
      highContrast: false
    },
    integrations: {
      connectedAccounts: {
        github: { connected: true, username: 'demo-user' },
        gitlab: { connected: false, username: '' },
        bitbucket: { connected: false, username: '' }
      },
      webhookUrl: '',
      webhookSecret: ''
    },
    preferences: {
      autoSave: true,
      branchNotifications: true,
      autoSync: false,
      defaultBranch: 'main'
    },
    updatedAt: new Date().toISOString()
  };
}