
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Issue, PullRequest } from '@/lib/github-api';

interface AssignedIssuesProps {
  issues: Issue[];
  pullRequests: PullRequest[];
}

export const AssignedIssues: React.FC<AssignedIssuesProps> = ({ issues, pullRequests }) => {
  const items = [...(issues || []), ...(pullRequests || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned to You</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <div className="flex justify-between items-center">
                <div>
                  <a href={item.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                    {item.title}
                  </a>
                  <p className="text-sm text-gray-500">
                    #{item.number} in {item.repository_url?.split('/').slice(-2).join('/') || 'unknown repo'}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    'labels' in item ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                  {'labels' in item ? 'Issue' : 'Pull Request'}
                </span>
              </div>
              {'labels' in item && (item.labels.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.labels.map((label: any) => (
                    <span key={label.id} className="px-2 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: `#${label.color}` }}>
                      {label.name}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
