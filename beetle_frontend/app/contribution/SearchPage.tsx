"use client";

import React from 'react';
import Search from '@/components/search';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';

const SearchPage = () => {
  const showContent = useAnimateIn(false, 300);
  
  return (
    <div className="max-w-full mx-auto px-4 pt-24 pb-6">
      <AnimatedTransition show={showContent} animation="slide-up">
        <Search />
      </AnimatedTransition>
    </div>
  );
};

export default SearchPage;
