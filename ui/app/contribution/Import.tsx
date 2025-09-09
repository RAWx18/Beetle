"use client";

import React from 'react';
import ImportPanel from '@/components/ImportPanel';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { useBranch } from '@/contexts/BranchContext';
import { useRepository } from '@/contexts/RepositoryContext';

const Import = () => {
  const showContent = useAnimateIn(false, 300);
  const { selectedBranch, getBranchInfo } = useBranch();
  const { repository } = useRepository();
  const branchInfo = getBranchInfo();
  const projectName = repository?.name || 'Project';
  
  return (
    <div className="max-w-7xl mx-auto px-4 pt-10 pb-16 h-screen">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="h-full overflow-y-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Import Data</h1>
          <p className="text-muted-foreground mt-2">
            Add knowledge to your second brain from various sources for {projectName} ({selectedBranch})
          </p>
        </div>
        
        <ImportPanel />
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default Import;
