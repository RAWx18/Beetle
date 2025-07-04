"use client";

import ClientProviders from '@/components/ClientProviders';
import "./globals.css";

export default function ContributionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProviders>
      <main className="pt-20">{children}</main>
    </ClientProviders>
  );
} 