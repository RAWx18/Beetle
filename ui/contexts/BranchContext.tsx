"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRepository } from './RepositoryContext';
import { apiService } from '../lib/api';
import { useLocalStorage } from '@/contexts/LocalStorageContext';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export type BranchType = string; // Now any branch name

interface BranchInfo {
  name: string;
  sha: string;
  color: string;
  description: string;
  maintainer: string;
  githubUrl: string;
}

interface BranchContextType {
  selectedBranch: BranchType;
  setSelectedBranch: (branch: BranchType) => void;
  branchList: string[];
  branchInfoMap: Record<string, BranchInfo>;
  getBranchInfo: () => BranchInfo;
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
  const { repository } = useRepository();
  const [branchList, setBranchList] = useState<string[]>(['main']);
  const [selectedBranch, setSelectedBranch] = useState<BranchType>('main');
  const [branchInfoMap, setBranchInfoMap] = useState<Record<string, BranchInfo>>({});
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const { getItem } = useLocalStorage();

  useEffect(() => {
    console.log('🔍 BranchContext: Repository changed:', repository?.full_name);
    console.log('🔍 BranchContext: isLoadingBranches:', isLoadingBranches);
    if (repository && !isLoadingBranches) {
      // Fetch branches for the current repository
      const fetchBranches = async () => {
        try {
          setIsLoadingBranches(true);
          
          // Debug: Check authentication status
          const token = getItem('gitmesh_token');
          console.log('🔍 Fetching branches for repository:', repository.full_name);
          console.log('🔍 Using token:', token ? 'Available' : 'Not available');
          console.log('🔍 Token type:', token === 'demo-token' ? 'Demo' : 'Real GitHub');
          
          const response = await apiService.getRepositoryBranches(repository.owner.login, repository.name);
          
          if (response.error) {
            console.error('❌ API error:', response.error);
            setBranchList([repository.default_branch || 'main']);
            return;
          }
          
          console.log('🔍 BranchContext: API response:', response);
          
          const branches = response.data?.branches?.map((b: any) => b.name) || [repository.default_branch || 'main'];
          console.log('🔍 Fetched branches:', branches);
          
          if (branches.length > 1) {
            console.log('✅ Successfully loaded', branches.length, 'branches for', repository.full_name);
          }
          
          // Only update if the branch list has actually changed
          setBranchList(prevBranches => {
            if (JSON.stringify(prevBranches) !== JSON.stringify(branches)) {
              return branches;
            }
            return prevBranches;
          });
          
          // Set selected branch to default if it's not in the new branch list
          setSelectedBranch(prevBranch => {
            if (branches.includes(prevBranch)) {
              return prevBranch;
            }
            const newBranch = repository.default_branch || branches[0] || 'main';
            return newBranch;
          });
          
          // Update branch info map
          const infoMap: Record<string, BranchInfo> = {};
          branches.forEach((branch: any) => {
            infoMap[branch.name] = {
              name: branch.name,
              sha: branch.commit.sha,
              color: branch.name === 'main' || branch.name === 'dev' ? 'text-blue-600' : branch.name === 'agents' ? 'text-emerald-600' : branch.name === 'snowflake' ? 'text-cyan-600' : 'text-gray-600',
              description: branch.name === repository.default_branch ? 'Default branch' : '',
              maintainer: '',
              githubUrl: `${repository.html_url}/tree/${branch.name}`,
            };
          });
          setBranchInfoMap(infoMap);
        } catch (e) {
          console.error('❌ Error fetching branches:', e);
          setBranchList([repository.default_branch || 'main']);
        } finally {
          setIsLoadingBranches(false);
        }
      };
      fetchBranches();
    }
  }, [repository]); // Changed dependency to repository object instead of just full_name

  const getBranchInfo = () => branchInfoMap[selectedBranch] || {
    name: selectedBranch,
    color: 'text-gray-600',
    description: '',
    maintainer: '',
    githubUrl: repository ? `${repository.html_url}/tree/${selectedBranch}` : '',
  };

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch, branchList, branchInfoMap, getBranchInfo }}>
      {children}
    </BranchContext.Provider>
  );
};
