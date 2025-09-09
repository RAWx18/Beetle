"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import KeyManager from '@/lib/key-manager';
import { useLocalStorage } from '@/contexts/LocalStorageContext';

interface User {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  location: string;
  company: string;
  blog: string;
  twitter_username: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  lastLogin: string;
  analytics?: {
    totalCommits: number;
    totalPRs: number;
    totalIssues: number;
    activeRepositories: number;
  };
}

import GitHubAPI from '@/lib/github-api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  githubApi: GitHubAPI | null;
  login: () => void;
  logout: () => void;
  forceLogout: () => void;
  validateToken: () => Promise<boolean>;
  setUserFromCallback: (userData: User, authToken: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const localStorage = useLocalStorage();
  const keyManager = useMemo(() => new KeyManager(localStorage), [localStorage]);

  const [githubApi, setGithubApi] = useState<GitHubAPI | null>(null);

  useEffect(() => {
    if (token) {
      setGithubApi(new GitHubAPI(token));
    } else {
      setGithubApi(null);
    }
  }, [token]);

  // Initialize auth state from localStorage
  useEffect(() => {
    console.log('AuthContext: Initializing auth state');
    const storedToken = keyManager.getGitmeshToken();
    console.log('Stored token:', storedToken ? 'Available' : 'Not available');
    
    // Check if we're in demo mode and should skip it
    if (storedToken) {
      console.log('Found token, validating...');
      setToken(storedToken);
      validateToken(storedToken);
    } else {
      console.log('No valid token found');
      setLoading(false);
    }
  }, []);

  const validateToken = async (authToken?: string) => {
    try {
      const tokenToUse = authToken || token;
      console.log('Validating token:', tokenToUse ? 'Available' : 'Not available');
      
      if (!tokenToUse) {
        console.log('No token to validate');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return false;
      }

      console.log('Making validation request to:', `${API_BASE_URL}/auth/validate`);
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Validation response status:', response.status);
      console.log('Validation response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Validation successful, user data:', data.user);
        setIsAuthenticated(true);
        setUser(data.user);
        setToken(tokenToUse);
        keyManager.setGitmeshToken(tokenToUse);
        setLoading(false);
        return true;
      } else {
        console.log('Token validation failed');
        const errorText = await response.text();
        console.error('Validation error response:', errorText);
        // Token is invalid, clear everything
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        keyManager.removeGitmeshToken();
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      keyManager.removeGitmeshToken();
      setLoading(false);
      return false;
    }
  };

  // Function to set user data from OAuth callback
  const setUserFromCallback = useCallback((userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
    keyManager.setGitmeshToken(authToken);
    setLoading(false);
  }, [keyManager]);

  const login = async () => {
    try {
      // Get GitHub OAuth URL from backend
      const response = await fetch(`${API_BASE_URL}/auth/github/url`);
      const data = await response.json();
      console.log('auth_url:', data.auth_url);
      // Redirect to GitHub OAuth
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  

  const logout = async () => {
    try {
      if (token) {
        // Call backend logout endpoint
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of backend response
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      keyManager.removeGitmeshToken();
      localStorage.removeItem('isAuthenticated');
    }
  };

  // Force logout and clear all demo mode settings
  const forceLogout = () => {
    console.log('Force logout - clearing all data including demo mode');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    keyManager.removeGitmeshToken();
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('auto_demo_mode');
    setLoading(false);
  };

  

  // OAuth callback is now handled by the dedicated callback page

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      token, 
      githubApi,
      login, 
      logout, 
      forceLogout,
      validateToken,
      setUserFromCallback,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
