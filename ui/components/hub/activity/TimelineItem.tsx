import { UserActivity } from '@/lib/github-api';
import { GitCommit, GitPullRequest, GitBranch, Star, Book, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TimelineItemProps {
  activity: UserActivity;
  isLast: boolean;
}

const eventIcons: { [key: string]: React.ReactNode } = {
  PushEvent: <GitCommit className="w-5 h-5 text-blue-500" />,
  PullRequestEvent: <GitPullRequest className="w-5 h-5 text-green-500" />,
  CreateEvent: <GitBranch className="w-5 h-5 text-purple-500" />,
  WatchEvent: <Star className="w-5 h-5 text-yellow-500" />,
  IssuesEvent: <AlertCircle className="w-5 h-p text-red-500" />,
  ForkEvent: <Book className="w-5 h-5 text-gray-500" />,
};

const renderContent = (activity: UserActivity) => {
  switch (activity.type) {
    case 'PushEvent':
      return (
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Pushed {activity.payload.commits.length} commit(s) to{" "}
            <span className="font-semibold">{activity.payload.ref.replace('refs/heads/', '')}</span>
          </p>
          <ul className="mt-2 space-y-1">
            {activity.payload.commits.map((commit: any) => (
              <li key={commit.sha} className="flex items-center gap-2">
                <GitCommit className="w-4 h-4" />
                <a
                  href={`https://github.com/${activity.repo.name}/commit/${commit.sha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  {commit.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'PullRequestEvent':
      return (
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {activity.payload.action} pull request{" "}
            <a
              href={activity.payload.pull_request.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-500 hover:underline"
            >
              #{activity.payload.pull_request.number}
            </a>
          </p>
          <p className="mt-1 text-sm">{activity.payload.pull_request.title}</p>
        </div>
      );
    case 'CreateEvent':
      return (
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Created a {activity.payload.ref_type} named <span className="font-semibold">{activity.payload.ref}</span>
        </p>
      );
    case 'WatchEvent':
      return (
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Starred the repository
        </p>
      );
    case 'IssuesEvent':
      return (
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {activity.payload.action} issue{" "}
            <a
              href={activity.payload.issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-500 hover:underline"
            >
              #{activity.payload.issue.number}
            </a>
          </p>
          <p className="mt-1 text-sm">{activity.payload.issue.title}</p>
        </div>
      );
    case 'ForkEvent':
      return (
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Forked the repository to{" "}
          <a
            href={activity.payload.forkee.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-500 hover:underline"
          >
            {activity.payload.forkee.full_name}
          </a>
        </p>
      );
    default:
      return <p className="text-sm text-gray-700 dark:text-gray-300">Unhandled event type: {activity.type}</p>;
  }
};

export const TimelineItem: React.FC<TimelineItemProps> = ({ activity, isLast }) => {
  const icon = eventIcons[activity.type] || <AlertCircle className="w-5 h-5 text-gray-500" />;

  return (
    <div className={`relative mb-8 pl-8 ${isLast ? '' : 'after:absolute after:left-6 after:top-10 after:h-[calc(100%-2.5rem)] after:w-px after:bg-gray-200 dark:after:bg-gray-700'}`}>
      <div className="absolute -left-1.5 top-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900">
          {icon}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            <a href={`https://github.com/${activity.repo.name}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {activity.repo.name}
            </a>
          </CardTitle>
          <CardDescription>{new Date(activity.created_at).toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent>{renderContent(activity)}</CardContent>
      </Card>
    </div>
  );
};