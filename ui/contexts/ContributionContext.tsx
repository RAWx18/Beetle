"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

interface ContributionContextType {
  owner: string | null;
  repo: string | null;
  branch: string | null;
}

const ContributionContext = createContext<ContributionContextType | null>(null);

export const ContributionProvider = ({ children }: { children: ReactNode }) => {
  const searchParams = useSearchParams();
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const branch = searchParams.get('branch');

  return (
    <ContributionContext.Provider value={{ owner, repo, branch }}>
      {children}
    </ContributionContext.Provider>
  );
};

export const useContribution = () => {
  const context = useContext(ContributionContext);
  if (!context) {
    throw new Error('useContribution must be used within a ContributionProvider');
  }
  return context;
};
