"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HubPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to hub overview as the default hub view
    router.replace('/hub/overview');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  );
}