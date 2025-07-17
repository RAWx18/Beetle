
import React, { useEffect, useState } from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRepository } from '@/contexts/RepositoryContext';
import { apiService } from '@/lib/api';

interface SmartSuggestionsProps {
  branch: string;
  branchData: any;
}

const SmartSuggestions = ({ branch }: SmartSuggestionsProps) => {
  const { repository } = useRepository();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!repository) return;
      setLoading(true);
      setError(null);
      const projectId = `${repository.owner.login}/${repository.name}`;
      try {
        const res = await apiService.getSmartSuggestions(projectId, branch);
        if ('error' in res && res.error) setError(res.error.message);
        else setSuggestions(res.data?.suggestions || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch suggestions');
      }
      setLoading(false);
    };
    fetchSuggestions();
  }, [repository, branch]);

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
      {loading ? (
        <div className="text-center text-muted-foreground">Loading suggestions...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : suggestions.length === 0 ? (
        <div className="text-center text-muted-foreground">No suggestions at this time. Keep up the good work!</div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion: any) => (
            <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {/* Optionally, show an icon based on suggestion.type */}
                    {suggestion.type === 'optimization' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {suggestion.type === 'collaboration' && <Users className="h-4 w-4 text-blue-500" />}
                    {suggestion.type === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    {suggestion.type === 'insight' && <Lightbulb className="h-4 w-4 text-yellow-500" />}
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
      )}
    </div>
  );
};

export default SmartSuggestions;
