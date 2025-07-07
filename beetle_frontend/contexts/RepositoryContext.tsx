"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  const handleSetRepository = (repo: RepositoryData | null) => {
    setRepository(repo);
    setIsRepositoryLoaded(true);
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