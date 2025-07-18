"use client";

import ClientProviders from '@/components/ClientProviders';
import "./globals.css";
import { KnowledgeBaseProvider } from '@/contexts/KnowledgeBaseContext';

export default function ContributionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProviders>
      <KnowledgeBaseProvider>
        <main className="pt-16">{children}</main>
      </KnowledgeBaseProvider>
    </ClientProviders>
  );
} 