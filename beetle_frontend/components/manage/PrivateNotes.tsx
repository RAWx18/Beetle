
import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/lib/api';

interface PrivateNotesProps {
  branch: string;
}

const PrivateNotes = ({ branch }: PrivateNotesProps) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError(null);
      const res = await apiService.getNotes();
      if (res.error) setError(res.error.message);
      else setNotes(res.data?.notes || []);
      setLoading(false);
    };
    fetchNotes();
  }, []);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    const note = { id: Date.now().toString(), text: newNote, branch, createdAt: new Date().toISOString() };
    setNotes(prev => [note, ...prev]);
    setNewNote('');
    const res = await apiService.addNote(note);
    if (res.error) setError(res.error.message);
    else setNotes(res.data?.notes || []);
    setSaving(false);
  };

  const handleDeleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    const res = await apiService.deleteNote(id);
    if (res.error) setError(res.error.message);
    else setNotes(res.data?.notes || []);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold">Private Notes</h3>
        </div>
        <div className="flex gap-2">
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Add a note..."
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            disabled={saving}
          />
          <Button size="sm" onClick={handleAddNote} disabled={saving || !newNote.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No private notes yet</p>
              <p className="text-sm mt-2">Add personal notes about PRs, issues, or general thoughts</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <Card key={note.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm">{note.text}</div>
                  <div className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteNote(note.id)}>
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
