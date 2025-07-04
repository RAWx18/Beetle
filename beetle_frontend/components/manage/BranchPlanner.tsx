
import React from 'react';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BranchPlannerProps {
  branch: string;
}

const BranchPlanner = ({ branch }: BranchPlannerProps) => {
  const stages = [
    {
      id: 'planning',
      name: 'Planning',
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800',
      items: [
        { id: 1, title: 'Feature specification review', assignee: 'sarah_chen' },
        { id: 2, title: 'Architecture planning', assignee: 'mike_wilson' }
      ]
    },
    {
      id: 'in-progress',
      name: 'In Progress',
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-800',
      items: [
        { id: 3, title: 'Implement user authentication', assignee: 'john_doe' },
        { id: 4, title: 'Database migration scripts', assignee: 'alex_kim' },
        { id: 5, title: 'API endpoint development', assignee: 'lisa_martinez' }
      ]
    },
    {
      id: 'review',
      name: 'Under Review',
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-800',
      items: [
        { id: 6, title: 'Code review for login flow', assignee: 'sarah_chen' },
        { id: 7, title: 'Security audit', assignee: 'mike_wilson' }
      ]
    },
    {
      id: 'completed',
      name: 'Completed',
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800',
      items: [
        { id: 8, title: 'Initial project setup', assignee: 'john_doe' },
        { id: 9, title: 'Environment configuration', assignee: 'alex_kim' }
      ]
    }
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <Card key={stage.id} className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {stage.icon}
                {stage.name}
                <Badge variant="secondary" className="ml-auto">
                  {stage.items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stage.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                >
                  <h4 className="text-sm font-medium mb-2">{item.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      @{item.assignee}
                    </span>
                    <Badge className={stage.color} variant="outline">
                      {stage.name}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BranchPlanner;
