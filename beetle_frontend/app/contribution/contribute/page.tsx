"use client";
export const dynamic = "force-dynamic";

import React from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { BranchContribute } from '@/components/branch-content/BranchContribute';
import { GitHubIssues } from '@/components/GitHubIssues';
import { CommitGuidelines } from '@/components/CommitGuidelines';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useBranch } from '@/contexts/BranchContext';
import { Code, Bug, BookOpen, Github, MessageSquare } from 'lucide-react';

export default function ContributePage() {
  const showContent = useAnimateIn(false, 300);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <AnimatedTransition show={showContent} animation="fade" duration={800}>
          <BranchContribute />
        </AnimatedTransition>
      </div>
    </div>
  );
} 