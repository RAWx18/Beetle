
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const HubProjectsSkeleton = () => (
  <div className="container mx-auto p-4 sm:p-6 lg:p-8">
    <Skeleton className="h-8 w-1/4 mb-4" />
    <Skeleton className="h-4 w-1/2 mb-6" />
    <div className="mt-6 flex justify-between items-center">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-10 w-[180px]" />
    </div>
    <div className="mt-6">
      <Skeleton className="h-10 w-1/2" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-8 w-1/4" />
          </CardFooter>
        </Card>
      ))}
    </div>
  </div>
);
