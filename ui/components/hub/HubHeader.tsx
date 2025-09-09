
import React from 'react';

interface HubHeaderProps {
  title: string;
  subtitle: string;
}

export function HubHeader({ title, subtitle }: HubHeaderProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
      <p className="mt-1 text-lg text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
}
