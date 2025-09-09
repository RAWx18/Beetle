
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, GitMerge, Search } from 'lucide-react';

export const QuickActions = () => (
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button variant="outline">
        <PlusCircle className="mr-2 h-4 w-4" />
        New Repository
      </Button>
      <Button variant="outline">
        <GitMerge className="mr-2 h-4 w-4" />
        Create Pull Request
      </Button>
      <Button variant="outline">
        <Search className="mr-2 h-4 w-4" />
        Search Repositories
      </Button>
    </CardContent>
  </Card>
);
