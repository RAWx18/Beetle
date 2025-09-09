import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserActivity } from '@/lib/github-api';

interface RecentActivityProps {
  activities: UserActivity[];
}

const renderActivityDetails = (activity: UserActivity) => {
  const { type, payload } = activity;
  switch (type) {
    case 'PushEvent':
      return (
        <p className="text-sm text-gray-500">
          Pushed {payload.commits.length} commit(s) to{' '}
          <a href={`https://github.com/${activity.repo.name}/tree/${payload.ref.split('/').pop()}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
            {payload.ref.split('/').pop()}
          </a>
          : {payload.commits[0].message}
        </p>
      );
    case 'PullRequestEvent':
      return (
        <p className="text-sm text-gray-500">
          {payload.action} a pull request:{' '}
          <a href={payload.pull_request.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
            {payload.pull_request.title}
          </a>
        </p>
      );
    case 'IssuesEvent':
      return (
        <p className="text-sm text-gray-500">
          {payload.action} an issue:{' '}
          <a href={payload.issue.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
            {payload.issue.title}
          </a>
        </p>
      );
    case 'IssueCommentEvent':
      return (
        <p className="text-sm text-gray-500">
          Commented on issue:{' '}
          <a href={payload.comment.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
            {payload.issue.title}
          </a>
        </p>
      );
    default:
      return null;
  }
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => (
  <ul className="space-y-4">
    {activities.map((activity) => (
      <li key={activity.id} className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <img className="w-8 h-8 rounded-full" src={activity.actor.avatar_url} alt={activity.actor.login} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            <a href={`https://github.com/${activity.actor.login}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
              {activity.actor.login}
            </a>
            <span className="text-gray-500"> in </span>
            <a href={`https://github.com/${activity.repo.name}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
              {activity.repo.name}
            </a>
          </p>
          {renderActivityDetails(activity)}
          <p className="text-xs text-gray-400 mt-1">{new Date(activity.created_at).toLocaleString()}</p>
        </div>
      </li>
    ))}
  </ul>
);