"use client";

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BranchProvider } from "@/contexts/BranchContext";
import { RepositoryProvider } from "@/contexts/RepositoryContext";
import Navbar from "@/components/Navbar";

const queryClient = new QueryClient();

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BranchProvider>
            <RepositoryProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <div className="min-h-screen">
                  <Navbar />
                  {children}
                </div>
              </TooltipProvider>
            </RepositoryProvider>
          </BranchProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
} 