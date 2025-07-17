"use client";

import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

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

export const RepositoryProvider: React.FC<RepositoryProviderProps> = ({ children }) => {
  const [repository, setRepository] = useState<RepositoryData | null>(null);
  const [isRepositoryLoaded, setIsRepositoryLoaded] = useState(false);
  const prevRepositoryRef = useRef<RepositoryData | null>(null);

  const handleSetRepository = (repo: RepositoryData | null) => {
    // Compare only essential properties to avoid issues with timestamps
    const prevKey = prevRepositoryRef.current ? `${prevRepositoryRef.current.owner.login}/${prevRepositoryRef.current.name}` : null;
    const newKey = repo ? `${repo.owner.login}/${repo.name}` : null;
    
    if (prevKey !== newKey) {
      prevRepositoryRef.current = repo;
      setRepository(repo);
      setIsRepositoryLoaded(true);
      console.log('🔍 RepositoryContext: Repository set to:', newKey);
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