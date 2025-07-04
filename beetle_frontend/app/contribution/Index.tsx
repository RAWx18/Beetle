"use client";

import { useState } from 'react';
import { useAnimateIn } from '@/lib/animations';
import { BranchWhat } from '@/components/branch-content/BranchWhat';
import AnimatedTransition from '@/components/AnimatedTransition';

const Index = () => {
  const [loading, setLoading] = useState(false);
  const showContent = useAnimateIn(false, 300);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <AnimatedTransition show={showContent} animation="fade" duration={800}>
          <BranchWhat />
        </AnimatedTransition>
      </div>
    </div>
  );
};

export default Index;
