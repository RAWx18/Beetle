"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
  const { user, token, isAuthenticated, forceLogout, login } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<any>({});

  useEffect(() => {
    // Check localStorage
    setLocalStorageData({
      token: localStorage.getItem('beetle_token'),
      autoDemo: localStorage.getItem('auto_demo_mode'),
      isAuthenticated: localStorage.getItem('isAuthenticated'),
    });
  }, []);

  const clearAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const clearDemoMode = () => {
    localStorage.removeItem('auto_demo_mode');
    localStorage.removeItem('beetle_token');
    localStorage.removeItem('isAuthenticated');
    window.location.reload();
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Auth State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
              <p><strong>Token:</strong> {token || 'None'}</p>
              <p><strong>User:</strong> {user?.login || 'None'}</p>
              <p><strong>Is Demo Mode:</strong> {token === 'demo-token' ? 'Yes' : 'No'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>localStorage Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Token:</strong> {localStorageData.token || 'None'}</p>
              <p><strong>Auto Demo:</strong> {localStorageData.autoDemo || 'None'}</p>
              <p><strong>Is Authenticated:</strong> {localStorageData.isAuthenticated || 'None'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {token === 'demo-token' && (
                <div>
                  <p className="text-orange-600 mb-2">You are in demo mode.</p>
                  <div className="space-x-2">
                    <Button onClick={clearDemoMode}>Exit Demo Mode</Button>
                    <Button onClick={login} variant="outline">Connect GitHub</Button>
                  </div>
                </div>
              )}
              
              <div className="space-x-2">
                <Button onClick={forceLogout} variant="outline">Force Logout</Button>
                <Button onClick={clearAllData} variant="destructive">Clear All Data</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
