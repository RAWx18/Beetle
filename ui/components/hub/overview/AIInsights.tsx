
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, X } from 'lucide-react';
import { useState } from 'react';

interface Insight {
  id: number;
  text: string;
}

interface AIInsightsProps {
  insights: Insight[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ insights: initialInsights }) => {
  const [insights, setInsights] = useState(initialInsights);

  const dismissInsight = (id: number) => {
    setInsights(insights.filter((insight) => insight.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li key={insight.id} className="flex items-start justify-between text-sm text-gray-600">
              <span>{insight.text}</span>
              <button onClick={() => dismissInsight(insight.id)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
