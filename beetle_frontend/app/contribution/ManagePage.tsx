"use client";

import React, { useState, useEffect } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import BranchContributionManager from '@/components/manage/BranchContributionManager';
import CortexSidebar from '@/components/manage/CortexSidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';

const ManagePage = () => {
  const showContent = useAnimateIn(false, 300);
  const [selectedCategory, setSelectedCategory] = useState('overview');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleCortexSelect = (categoryId: string, itemId: string | null) => {
    setSelectedCategory(categoryId);
    setSelectedItem(itemId);
  };

  return (
    <div className="max-w-full mx-auto h-screen pt-20 overflow-hidden fixed bottom-0 left-0 right-0">
      <Toaster position="top-right" />
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="flex h-[calc(100vh-80px)]">
          <TooltipProvider>
            <CortexSidebar 
              onCortexSelect={handleCortexSelect}
              selectedCategoryId={selectedCategory}
              selectedItemId={selectedItem}
            />
          </TooltipProvider>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <TooltipProvider>
                <BranchContributionManager selectedSection={selectedCategory} />
              </TooltipProvider>
            </div>
          </div>
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default ManagePage;
