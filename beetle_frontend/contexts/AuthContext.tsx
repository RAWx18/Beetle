"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: () => void;
  loginDemo: () => void;
  logout: () => void;
  validateToken: () => Promise<boolean>;
  setUserFromCallback: (userData: User, authToken: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:3001/api';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('beetle_token');
    if (storedToken) {
      setToken(storedToken);
      validateToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (authToken?: string) => {
    try {
      const tokenToUse = authToken || token;
      if (!tokenToUse) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUser(data.user);
        setToken(tokenToUse);
        localStorage.setItem('beetle_token', tokenToUse);
        setLoading(false);
        return true;
      } else {
        // Token is invalid, clear everything
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        localStorage.removeItem('beetle_token');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      localStorage.removeItem('beetle_token');
      setLoading(false);
      return false;
    }
  };

  // Function to set user data from OAuth callback
  const setUserFromCallback = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
    localStorage.setItem('beetle_token', authToken);
    setLoading(false);
  };

  const login = async () => {
    try {
      // Get GitHub OAuth URL from backend
      const response = await fetch(`${API_BASE_URL}/auth/github/url`);
      const data = await response.json();
      
      // Redirect to GitHub OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Login error:', error);
      // Fallback to mock login for development
      console.log('Using mock login for development');
      setIsAuthenticated(true);
      setUser({
        id: 1,
        login: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        avatar_url: 'https://github.com/github.png',
        bio: 'Demo user for development',
        location: 'Demo City',
        company: 'Demo Corp',
        blog: 'https://demo.com',
        twitter_username: 'demo',
        public_repos: 10,
        followers: 100,
        following: 50,
        created_at: '2023-01-01T00:00:00Z',
        lastLogin: new Date().toISOString(),
        analytics: {
          totalCommits: 150,
          totalPRs: 25,
          totalIssues: 30,
          activeRepositories: 5
        }
      });
      setToken('demo-token');
      localStorage.setItem('beetle_token', 'demo-token');
      localStorage.setItem('isAuthenticated', 'true');
    }
  };

  // Demo mode login function
  const loginDemo = () => {
    console.log('Logging in with demo mode');
    setIsAuthenticated(true);
    setUser({
      id: 1,
      login: 'demo-user',
      name: 'Demo User',
      email: 'demo@example.com',
      avatar_url: 'https://github.com/github.png',
      bio: 'Demo user for development',
      location: 'Demo City',
      company: 'Demo Corp',
      blog: 'https://demo.com',
      twitter_username: 'demo',
      public_repos: 2,
      followers: 50,
      following: 25,
      created_at: '2023-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
      analytics: {
        totalCommits: 45,
        totalPRs: 2,
        totalIssues: 3,
        activeRepositories: 2
      }
    });
    setToken('demo-token');
    localStorage.setItem('beetle_token', 'demo-token');
    localStorage.setItem('isAuthenticated', 'true');
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
      localStorage.removeItem('beetle_token');
      localStorage.removeItem('isAuthenticated');
    }
  };

  // OAuth callback is now handled by the dedicated callback page

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      token, 
      login, 
      loginDemo,
      logout, 
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
