
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface InsightCardProps {
  text: string;
}

export function InsightCard({ text }: InsightCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-800 dark:text-gray-200">{text}</p>
      </CardContent>
    </Card>
  );
}
