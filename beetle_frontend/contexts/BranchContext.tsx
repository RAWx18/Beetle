"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type BranchType = 'dev' | 'agents' | 'snowflake';

interface BranchContextType {
  selectedBranch: BranchType;
  setSelectedBranch: (branch: BranchType) => void;
  getBranchInfo: () => {
    name: string;
    color: string;
    description: string;
    maintainer: string;
    githubUrl: string;
  };
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};

interface BranchProviderProps {
  children: ReactNode;
}

export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const [selectedBranch, setSelectedBranch] = useState<BranchType>('dev');

  const branchInfo = {
    dev: {
      name: 'Dev Branch',
      color: 'text-blue-600',
      description: 'Integration layer where multi-agent architecture and Snowflake enterprise integrations come together',
      maintainer: 'Gianluca',
      githubUrl: 'https://github.com/hyperledger-labs/aifaq/tree/dev'
    },
    agents: {
      name: 'Agents Branch',
      color: 'text-emerald-600',
      description: 'Multi-agent AI systems for intelligent FAQ discovery using advanced LLMs and RAG pipelines',
      maintainer: 'Ryan & Lochan Paudel',
      githubUrl: 'https://github.com/hyperledger-labs/aifaq/tree/agents'
    },
    snowflake: {
      name: 'Snowflake Branch',
      color: 'text-cyan-600',
      description: 'Enterprise-grade data integrations using Snowflake and retrieval-augmented generation techniques',
      maintainer: 'Jayaram & Sumana',
      githubUrl: 'https://github.com/hyperledger-labs/aifaq/tree/snowflake'
    }
  };

  const getBranchInfo = () => branchInfo[selectedBranch];

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch, getBranchInfo }}>
      {children}
    </BranchContext.Provider>
  );
};
