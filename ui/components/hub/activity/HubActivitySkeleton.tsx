
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const HubActivitySkeleton = () => (
  <div className="container mx-auto p-4 sm:p-6 lg:p-8">
    <div className="flex items-center justify-between mb-6">
      <div>
        <Skeleton className="h-8 w-1/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="w-full">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);
