
import React from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SmartSuggestionsProps {
  branch: string;
  branchData: any;
}

const SmartSuggestions = ({ branch, branchData }: SmartSuggestionsProps) => {
  const suggestions = [
    {
      id: 1,
      type: 'optimization',
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
      title: 'Merge stale PRs',
      description: 'You have 3 PRs that have been approved for over a week. Consider merging them.',
      priority: 'medium',
      action: 'Review PRs'
    },
    {
      id: 2,
      type: 'collaboration',
      icon: <Users className="h-4 w-4 text-blue-500" />,
      title: 'Assign reviewers',
      description: '2 PRs are missing reviewers. Auto-assign based on code ownership?',
      priority: 'high',
      action: 'Auto-assign'
    },
    {
      id: 3,
      type: 'warning',
      icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
      title: 'Potential conflicts',
      description: 'PR #23 and #25 are modifying the same files. Review for conflicts.',
      priority: 'high',
      action: 'Check Conflicts'
    },
    {
      id: 4,
      type: 'insight',
      icon: <Lightbulb className="h-4 w-4 text-yellow-500" />,
      title: 'Create issue template',
      description: 'Based on recent issues, consider creating a bug report template.',
      priority: 'low',
      action: 'Create Template'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold">AI-Powered Suggestions</h3>
        <Badge variant="secondary">Based on {branch} activity</Badge>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {suggestion.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {suggestion.description}
                      </p>
                    </div>
                    
                    <Badge className={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      {suggestion.action}
                    </Button>
                    <Button size="sm" variant="ghost">
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SmartSuggestions;
