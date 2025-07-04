
import React from 'react';
import { Filter, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SavedFiltersProps {
  onFilterSelect: (filter: string) => void;
}

const SavedFilters = ({ onFilterSelect }: SavedFiltersProps) => {
  const savedFilters = [
    { id: 1, name: 'My Open PRs', query: 'author:me status:open', count: 3 },
    { id: 2, name: 'Needs Review', query: 'status:review', count: 7 },
    { id: 3, name: 'Bug Issues', query: 'label:bug', count: 12 },
    { id: 4, name: 'High Priority', query: 'label:priority-high', count: 5 }
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-purple-500" />
        <h3 className="text-lg font-semibold">Saved Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedFilters.map((filter) => (
          <Card key={filter.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{filter.name}</h4>
                <Badge variant="secondary">{filter.count}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3 font-mono">
                {filter.query}
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => onFilterSelect(filter.query)}
                  className="flex-1"
                >
                  Apply Filter
                </Button>
                <Button size="sm" variant="outline">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SavedFilters;
