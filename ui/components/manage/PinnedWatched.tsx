
import React, { useEffect, useState } from 'react';
import { Pin, Eye, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiService } from '@/lib/api';

interface PinnedWatchedProps {
  branchData: any;
  branch: string;
}

const PinnedWatched = ({ branchData, branch }: PinnedWatchedProps) => {
  const [pins, setPins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPins = async () => {
      setLoading(true);
      setError(null);
      const res = await apiService.getPins();
      if (res.error) setError(res.error.message);
      else setPins(res.data?.pins || []);
      setLoading(false);
    };
    fetchPins();
  }, []);

  const handleAddPin = async () => {
    if (!newPin.trim()) return;
    setSaving(true);
    const pin = { id: Date.now().toString(), name: newPin, branch, createdAt: new Date().toISOString() };
    setPins(prev => [pin, ...prev]);
    setNewPin('');
    const res = await apiService.addPin(pin);
    if (res.error) setError(res.error.message);
    else setPins(res.data?.pins || []);
    setSaving(false);
  };

  const handleDeletePin = async (id: string) => {
    setPins(prev => prev.filter(p => p.id !== id));
    const res = await apiService.deletePin(id);
    if (res.error) setError(res.error.message);
    else setPins(res.data?.pins || []);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Pin className="h-5 w-5 text-pink-500" />
        <h3 className="text-lg font-semibold">Pinned & Watched Items</h3>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Pin name or id"
          value={newPin}
          onChange={e => setNewPin(e.target.value)}
          disabled={saving}
        />
        <Button size="sm" onClick={handleAddPin} disabled={saving || !newPin.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Pin className="h-4 w-4" />
                Pinned Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pins.length === 0 ? (
                <p className="text-muted-foreground text-sm">No pinned items yet</p>
              ) : (
                <ul className="space-y-2">
                  {pins.map(pin => (
                    <li key={pin.id} className="flex items-center justify-between">
                      <span>{pin.name}</span>
                      <Button size="icon" variant="ghost" onClick={() => handleDeletePin(pin.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" />
                Watched Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">No watched items yet</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PinnedWatched;
