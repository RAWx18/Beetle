"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAnimateIn } from '@/lib/animations';
import { BranchWhat } from '@/components/branch-content/BranchWhat';
import AnimatedTransition from '@/components/AnimatedTransition';
import { useAuth } from '@/contexts/AuthContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { toast } from 'sonner';

export default function ContributionPage() {
  const [loading, setLoading] = useState(false);
  const [authProcessed, setAuthProcessed] = useState(false);
  const showContent = useAnimateIn(false, 300);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserFromCallback, isAuthenticated } = useAuth();
  const { setRepository } = useRepository();

  // Handle authentication parameters from OAuth callback
  useEffect(() => {
    const handleAuth = async () => {
      const authToken = searchParams.get('auth_token');
      const authUser = searchParams.get('auth_user');
      const authError = searchParams.get('auth_error');
      const authMessage = searchParams.get('auth_message');

      // Handle OAuth errors
      if (authError && authMessage) {
        console.error('OAuth error received:', authError, authMessage);
        
        // Clean up URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Show error toast
        toast.error(decodeURIComponent(authMessage), {
          description: "Redirecting to homepage",
          duration: 5000,
        });
        
        // Redirect to landing page on OAuth error
        router.push('/');
        return;
      }

      if (authToken && authUser && !authProcessed) {
        try {
          console.log('Processing authentication from URL params...');
          const userData = JSON.parse(decodeURIComponent(authUser));
          setUserFromCallback(userData, authToken);
          setAuthProcessed(true);
          
          // Clean up URL parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          
          console.log('Authentication successful, user logged in');
        } catch (error) {
          console.error('Error processing authentication:', error);
          // Redirect to landing page on error
          router.push('/');
        }
      }
    };

    handleAuth();
  }, [searchParams, setUserFromCallback, authProcessed, router]);

  // Handle repository data from URL parameters
  useEffect(() => {
    const repoParam = searchParams.get('repo');
    if (repoParam) {
      try {
        const repoData = JSON.parse(decodeURIComponent(repoParam));
        setRepository(repoData);
        console.log('Repository data loaded:', repoData.name);
        
        // Clean up URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } catch (error) {
        console.error('Error parsing repository data:', error);
        toast.error('Invalid repository data');
      }
    }
  }, [searchParams, setRepository]);

  // Redirect to landing page if not authenticated and no auth params
  useEffect(() => {
    const authToken = searchParams.get('auth_token');
    if (!isAuthenticated && !authToken && authProcessed) {
      console.log('Not authenticated, redirecting to landing page');
      router.push('/');
    }
  }, [isAuthenticated, searchParams, authProcessed, router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <AnimatedTransition show={showContent} animation="fade" duration={800}>
          <BranchWhat />
        </AnimatedTransition>
      </div>
    </div>
  );
} 