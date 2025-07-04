
import React from 'react';
import { Pin, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PinnedWatchedProps {
  branchData: any;
  branch: string;
}

const PinnedWatched = ({ branchData, branch }: PinnedWatchedProps) => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Pin className="h-5 w-5 text-pink-500" />
        <h3 className="text-lg font-semibold">Pinned & Watched Items</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Pin className="h-4 w-4" />
              Pinned Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No pinned items yet</p>
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
    </div>
  );
};

export default PinnedWatched;
