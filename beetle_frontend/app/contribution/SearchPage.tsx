"use client";

import React from 'react';
import Search from '@/components/search';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';

const SearchPage = () => {
  const showContent = useAnimateIn(false, 300);
  
  return (
    <div className="max-w-full mx-auto px-4 pt-20 overflow-hidden fixed bottom-0 left-0 right-0 h-screen">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="h-[calc(100vh-80px)]">
          <Search />
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default SearchPage;
