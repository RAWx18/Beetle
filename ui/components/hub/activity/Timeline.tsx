
import { UserActivity } from '@/lib/github-api';
import { TimelineItem } from './TimelineItem';

interface TimelineProps {
  activities: UserActivity[];
}

export const Timeline: React.FC<TimelineProps> = ({ activities }) => {
  return (
    <div className="relative pl-6 after:absolute after:left-6 after:top-0 after:h-full after:w-px after:bg-gray-200 dark:after:bg-gray-700">
      {activities.map((activity, index) => (
        <TimelineItem key={activity.id} activity={activity} isLast={index === activities.length - 1} />
      ))}
    </div>
  );
};
