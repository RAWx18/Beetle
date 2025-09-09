
import React, { useEffect, useState } from 'react';
import { Filter, Star, Trash2, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiService } from '@/lib/api';

interface SavedFiltersProps {
  onFilterSelect: (filter: string) => void;
}

const SavedFilters = ({ onFilterSelect }: SavedFiltersProps) => {
  const [filters, setFilters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newQuery, setNewQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchFilters = async () => {
      setLoading(true);
      setError(null);
      const res = await apiService.getFilters();
      if (res.error) setError(res.error.message);
      else setFilters(res.data?.filters || []);
      setLoading(false);
    };
    fetchFilters();
  }, []);

  const handleAddFilter = async () => {
    if (!newName.trim() || !newQuery.trim()) return;
    setSaving(true);
    const filter = { id: Date.now().toString(), name: newName, query: newQuery, count: 0 };
    setFilters(prev => [filter, ...prev]);
    setNewName('');
    setNewQuery('');
    const res = await apiService.addFilter(filter);
    if (res.error) setError(res.error.message);
    else setFilters(res.data?.filters || []);
    setSaving(false);
  };

  const handleDeleteFilter = async (id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
    const res = await apiService.deleteFilter(id);
    if (res.error) setError(res.error.message);
    else setFilters(res.data?.filters || []);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-purple-500" />
        <h3 className="text-lg font-semibold">Saved Filters</h3>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Filter name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          disabled={saving}
        />
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Query"
          value={newQuery}
          onChange={e => setNewQuery(e.target.value)}
          disabled={saving}
        />
        <Button size="sm" onClick={handleAddFilter} disabled={saving || !newName.trim() || !newQuery.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filters.map((filter) => (
            <Card key={filter.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{filter.name}</h4>
                  <Badge variant="secondary">{filter.count ?? 0}</Badge>
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
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteFilter(filter.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedFilters;
