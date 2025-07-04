
import React from 'react';
import { 
  Activity, 
  GitCommit, 
  GitPullRequest, 
  MessageSquare, 
  Clock, 
  User 
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ActivityItem } from './contribution-data';

interface BranchActivityProps {
  activities: ActivityItem[];
  branch: string;
}

const BranchActivity = ({ activities, branch }: BranchActivityProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'commit': return <GitCommit size={16} className="text-green-500" />;
      case 'pr_opened': return <GitPullRequest size={16} className="text-blue-500" />;
      case 'pr_merged': return <GitPullRequest size={16} className="text-purple-500" />;
      case 'comment': return <MessageSquare size={16} className="text-gray-500" />;
      case 'review': return <User size={16} className="text-orange-500" />;
      default: return <Activity size={16} className="text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'commit': return 'border-l-green-500';
      case 'pr_opened': return 'border-l-blue-500';
      case 'pr_merged': return 'border-l-purple-500';
      case 'comment': return 'border-l-gray-500';
      case 'review': return 'border-l-orange-500';
      default: return 'border-l-muted-foreground';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-4">
        <Activity size={48} className="mb-4" />
        <p>No recent activity for {branch} branch</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Activity size={20} className="text-orange-500" />
        <h3 className="text-lg font-semibold">Live Activity Feed</h3>
        <Badge variant="secondary">{activities.length} recent activities</Badge>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <Card key={activity.id} className={`border-l-4 ${getActivityColor(activity.type)}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {activity.user.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{activity.user}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={12} />
                      {activity.timestamp}
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground mb-2">
                    {activity.description}
                  </p>
                  
                  {activity.details && (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 font-mono">
                      {activity.details}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                    {activity.branch && (
                      <Badge variant="secondary" className="text-xs">
                        {activity.branch}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {activities.length > 10 && (
        <div className="text-center pt-4">
          <button className="text-sm text-orange-500 hover:text-orange-600">
            Load more activities...
          </button>
        </div>
      )}
    </div>
  );
};

export default BranchActivity;
