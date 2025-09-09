"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { HubNavigation } from '@/components/hub/HubNavigation';

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, setUserFromCallback } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle authentication parameters from OAuth callback
  useEffect(() => {
    const handleAuth = async () => {
      const authToken = searchParams.get('auth_token');
      const authUser = searchParams.get('auth_user');

      if (authToken && authUser && !isAuthenticated) {
        try {
          console.log('Processing authentication in hub layout...');
          const userData = JSON.parse(decodeURIComponent(authUser));
          setUserFromCallback(userData, authToken);
          
          // Clean up URL parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (error) {
          console.error('Error processing authentication:', error);
          router.push('/');
        }
      }
    };

    handleAuth();
  }, [searchParams, setUserFromCallback, isAuthenticated, router]);

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated && !searchParams.get('auth_token')) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router, searchParams]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <HubNavigation />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}