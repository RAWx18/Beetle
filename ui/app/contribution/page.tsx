"use client";

import { useState, useEffect, useRef } from 'react';
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
  const { setUserFromCallback, isAuthenticated, token } = useAuth();
  const { setRepository, repository, isRepositoryLoaded } = useRepository();
  const repoProcessedRef = useRef(false);

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
    if (repoParam && !repoProcessedRef.current) {
      try {
        const repoData = JSON.parse(decodeURIComponent(repoParam));
        
        // Validate required fields
        if (!repoData.name || !repoData.full_name || !repoData.owner?.login) {
          throw new Error('Invalid repository data structure');
        }
        
        // Ensure all required fields are present
        const validatedRepoData = {
          name: repoData.name,
          full_name: repoData.full_name,
          description: repoData.description || 'No description available',
          owner: {
            login: repoData.owner.login,
            avatar_url: repoData.owner.avatar_url || 'https://github.com/github.png',
            type: repoData.owner.type || 'User'
          },
          language: repoData.language || 'Unknown',
          stargazers_count: repoData.stargazers_count || 0,
          forks_count: repoData.forks_count || 0,
          html_url: repoData.html_url,
          clone_url: repoData.clone_url || (repoData.html_url ? `${repoData.html_url}.git` : ''),
          default_branch: repoData.default_branch || 'main',
          created_at: repoData.created_at || new Date().toISOString(),
          updated_at: repoData.updated_at || new Date().toISOString(),
          private: repoData.private || false,
          type: repoData.type || 'owned'
        };
        
        setRepository(validatedRepoData);
        repoProcessedRef.current = true;
        console.log('🔍 Repository data loaded successfully:', validatedRepoData.full_name);
        
        // Clean up URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        toast.success(`Opened ${validatedRepoData.full_name} in Beetle`);
      } catch (error) {
        console.error('Error parsing repository data:', error);
        toast.error('Invalid repository data. Please try again.');
        // Redirect to landing page on error
        router.push('/');
      }
    }
  }, [searchParams, setRepository, router]);

  // Set up demo repository if in demo mode and no repository is set
  useEffect(() => {
    console.log('🔍 Demo repo setup check:', { isAuthenticated, token, hasRepository: !!repository, repoProcessed: repoProcessedRef.current, isRepositoryLoaded });
    // Only set demo repository if:
    // 1. User is authenticated with demo token
    // 2. No repository is currently set
    // 3. Repository hasn't been processed from URL params
    // 4. Repository context has finished loading (to avoid overriding restored repository)
    if (isAuthenticated && token === 'demo-token' && !repository && !repoProcessedRef.current && isRepositoryLoaded) {
      console.log('Setting up demo repository for demo mode');
      const demoRepository = {
        name: 'beetle-app',
        full_name: 'demo-user/beetle-app',
        description: 'A demo repository for testing Beetle features',
        owner: {
          login: 'demo-user',
          avatar_url: 'https://github.com/github.png',
          type: 'User'
        },
        language: 'TypeScript',
        stargazers_count: 42,
        forks_count: 8,
        html_url: 'https://github.com/demo-user/beetle-app',
        clone_url: 'https://github.com/demo-user/beetle-app.git',
        default_branch: 'main',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        private: false,
        type: 'owned' as const
      };
      setRepository(demoRepository);
      repoProcessedRef.current = true;
      console.log('Demo repository set up:', demoRepository.name);
    }
  }, [isAuthenticated, token, repository, isRepositoryLoaded, setRepository]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 h-screen">
        <AnimatedTransition show={showContent} animation="fade" duration={800}>
          <div className="h-full overflow-y-auto">
            <BranchWhat />
          </div>
        </AnimatedTransition>
      </div>
    </div>
  );
} 