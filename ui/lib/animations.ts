"use client";

import { useEffect, useState } from 'react';

// Used for animating elements into view
export function useAnimateIn(initialState = false, delay = 0) {
  const [isVisible, setIsVisible] = useState(initialState);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isVisible;
}

// Used for smooth transitions between pages
export function usePageTransition() {
  const [isExiting, setIsExiting] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const navigateTo = (path: string) => {
    if (path === currentPath) return;
    
    setIsExiting(true);
    setTimeout(() => {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      setIsExiting(false);
    }, 300);
  };

  return { isExiting, currentPath, navigateTo };
}

// Hook to create ripple effect on elements
export function useRippleEffect() {
  return (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.top = `${y}px`;
    ripple.style.left = `${x}px`;
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';
    ripple.style.width = '200px';
    ripple.style.height = '200px';
    ripple.style.borderRadius = '50%';
    ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    ripple.style.pointerEvents = 'none';
    ripple.className = 'animate-ripple';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 1000);
  };
}
