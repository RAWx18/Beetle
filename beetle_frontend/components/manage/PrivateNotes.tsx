
import React from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PrivateNotesProps {
  branch: string;
}

const PrivateNotes = ({ branch }: PrivateNotesProps) => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold">Private Notes</h3>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No private notes yet</p>
            <p className="text-sm mt-2">Add personal notes about PRs, issues, or general thoughts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivateNotes;
