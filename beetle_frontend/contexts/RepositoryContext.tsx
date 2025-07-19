"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';

interface RepositoryData {
  name: string;
  full_name: string;
  description: string;
  owner: any;
  language: string;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  clone_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  private: boolean;
  type: "starred" | "owned";
}

interface RepositoryContextType {
  repository: RepositoryData | null;
  setRepository: (repo: RepositoryData | null) => void;
  isRepositoryLoaded: boolean;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export const useRepository = () => {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
};

interface RepositoryProviderProps {
  children: ReactNode;
}

const REPOSITORY_STORAGE_KEY = 'beetle-selected-repository';

export const RepositoryProvider: React.FC<RepositoryProviderProps> = ({ children }) => {
  const [repository, setRepository] = useState<RepositoryData | null>(null);
  const [isRepositoryLoaded, setIsRepositoryLoaded] = useState(false);
  const prevRepositoryRef = useRef<RepositoryData | null>(null);

  // Load repository from sessionStorage on initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedRepo = sessionStorage.getItem(REPOSITORY_STORAGE_KEY);
        if (storedRepo) {
          const parsedRepo = JSON.parse(storedRepo);
          setRepository(parsedRepo);
          prevRepositoryRef.current = parsedRepo;
          console.log('🔍 RepositoryContext: Restored repository from storage:', parsedRepo.full_name);
        }
      } catch (error) {
        console.error('Error loading repository from storage:', error);
        // Clear invalid data
        sessionStorage.removeItem(REPOSITORY_STORAGE_KEY);
      }
      // Always mark as loaded after initialization attempt
      setIsRepositoryLoaded(true);
    }
  }, []);

  const handleSetRepository = (repo: RepositoryData | null) => {
    // Compare only essential properties to avoid issues with timestamps
    const prevKey = prevRepositoryRef.current ? `${prevRepositoryRef.current.owner.login}/${prevRepositoryRef.current.name}` : null;
    const newKey = repo ? `${repo.owner.login}/${repo.name}` : null;
    
    if (prevKey !== newKey) {
      prevRepositoryRef.current = repo;
      setRepository(repo);
      setIsRepositoryLoaded(true);
      
      // Persist to sessionStorage
      if (typeof window !== 'undefined') {
        try {
          if (repo) {
            sessionStorage.setItem(REPOSITORY_STORAGE_KEY, JSON.stringify(repo));
            console.log('🔍 RepositoryContext: Repository stored and set to:', newKey);
          } else {
            sessionStorage.removeItem(REPOSITORY_STORAGE_KEY);
            console.log('🔍 RepositoryContext: Repository cleared from storage');
          }
        } catch (error) {
          console.error('Error saving repository to storage:', error);
        }
      } else {
        console.log('🔍 RepositoryContext: Repository set to:', newKey);
      }
    }
  };

  return (
    <RepositoryContext.Provider value={{ 
      repository, 
      setRepository: handleSetRepository, 
      isRepositoryLoaded 
    }}>
      {children}
    </RepositoryContext.Provider>
  );
}; 