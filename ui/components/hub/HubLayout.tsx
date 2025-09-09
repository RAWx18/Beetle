'use client';

import { ReactNode } from 'react';
import { HubNavigation } from './HubNavigation';
import { HubView } from '@/types/hub';

interface HubLayoutProps {
  children: ReactNode;
  currentView: HubView;
  onViewChange: (view: HubView) => void;
  className?: string;
  repository?: any;
  user?: any;
}

export const HubLayout: React.FC<HubLayoutProps> = ({
  children,
  currentView,
  onViewChange,
  className = '',
  repository,
  user
}) => {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Hub Navigation */}
      <HubNavigation 
        currentView={currentView}
        onViewChange={onViewChange}
        repository={repository}
        user={user}
      />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default HubLayout;