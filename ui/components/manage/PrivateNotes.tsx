import React, { useEffect, useState, useMemo } from 'react';
import { MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface PrivateNotesProps {
  branch: string;
}

const PrivateNotes = ({ branch }: PrivateNotesProps) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchNotes = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.getNotes();
        if (res.error) {
          setError(res.error.message);
        } else {
          setNotes(res.data?.notes || []);
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [isAuthenticated]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    const note = { 
      id: Date.now().toString(), 
      text: newNote, 
      branch, 
      createdAt: new Date().toISOString() 
    };
    
    const originalNotes = notes;
    setNotes(prev => [note, ...prev]); // Optimistic update
    setNewNote('');

    try {
      const res = await apiService.addNote(note);
      if (res.error) {
        setError(res.error.message);
        setNotes(originalNotes); // Revert on error
      } else {
        setNotes(res.data?.notes || []); // Sync with server
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save note.');
      setNotes(originalNotes);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const originalNotes = notes;
    setNotes(prev => prev.filter(n => n.id !== id)); // Optimistic update

    try {
      const res = await apiService.deleteNote(id);
      if (res.error) {
        setError(res.error.message);
        setNotes(originalNotes); // Revert on error
      } else {
        setNotes(res.data?.notes || []); // Sync with server
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete note.');
      setNotes(originalNotes);
    }
  };

  const branchNotes = useMemo(() => {
    return notes.filter(note => note.branch === branch).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notes, branch]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold">
            Private Notes for <span className="font-mono bg-muted px-2 py-1 rounded">{branch}</span>
          </h3>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a new note for this branch..."
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
          disabled={saving}
        />
        <Button onClick={handleAddNote} disabled={saving || !newNote.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Add Note</span>
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8">Loading notes...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : branchNotes.length === 0 ? (
        <Card className="text-center">
          <CardContent className="p-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No private notes for this branch yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Your notes are saved locally and are only visible to you.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {branchNotes.map(note => (
            <Card key={note.id} className="group">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm">{note.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(note.createdAt).toLocaleString()}</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleDeleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrivateNotes;