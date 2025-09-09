import { useBranch } from '@/contexts/BranchContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitPullRequest, Bug, Lightbulb, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Issue {
  number: number;
  title: string;
  description: string;
  labels: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  assignee?: string;
  createdAt: string;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-primary/10 text-primary';
    case 'medium':
      return 'bg-secondary/10 text-secondary-foreground';
    case 'hard':
      return 'bg-accent/10 text-accent-foreground';
    default:
      return 'bg-muted text-foreground';
  }
};

const getLabelColor = (label: string) => {
  if (label.includes('bug')) return 'bg-destructive/10 text-destructive';
  if (label.includes('enhancement')) return 'bg-primary/10 text-primary';
  if (label.includes('documentation')) return 'bg-secondary/10 text-secondary-foreground';
  if (label.includes('good first issue')) return 'bg-accent/10 text-accent-foreground';
  return 'bg-muted text-foreground';
};

export const GitHubIssues = () => {
  const { selectedBranch, getBranchInfo } = useBranch();
  const branchInfo = getBranchInfo();
  
  // Mock issues for each branch
  const issuesByBranch: Record<string, Issue[]> = {
    dev: [
      {
        number: 42,
        title: "Fix integration tests for agent-data communication",
        description: "The integration tests for the agent-data communication layer are failing intermittently. We need to identify the race condition and fix it.",
        labels: ["bug", "integration", "test"],
        difficulty: "medium",
        createdAt: "2025-06-15"
      },
      {
        number: 45,
        title: "Add documentation for API endpoints",
        description: "We need comprehensive documentation for all the API endpoints in the integration layer.",
        labels: ["documentation", "good first issue"],
        difficulty: "easy",
        createdAt: "2025-06-18"
      },
      {
        number: 47,
        title: "Optimize bundle size for production builds",
        description: "The current bundle size is too large and causing slow load times. We need to optimize it.",
        labels: ["enhancement", "performance"],
        difficulty: "medium",
        createdAt: "2025-06-20"
      }
    ],
    agents: [
      {
        number: 23,
        title: "Improve token usage efficiency in Q&A generation",
        description: "The current implementation uses too many tokens when generating Q&A pairs. We need to optimize the prompts and context management.",
        labels: ["enhancement", "optimization"],
        difficulty: "hard",
        createdAt: "2025-06-12"
      },
      {
        number: 27,
        title: "Add support for Mixtral 8x7B model",
        description: "We need to add support for the Mixtral 8x7B model in the agent architecture.",
        labels: ["enhancement", "model integration"],
        difficulty: "medium",
        createdAt: "2025-06-16"
      },
      {
        number: 31,
        title: "Fix memory leak in long-running agent processes",
        description: "There's a memory leak when agents run for extended periods. We need to identify and fix the source.",
        labels: ["bug", "memory", "critical"],
        difficulty: "hard",
        createdAt: "2025-06-19"
      }
    ],
    snowflake: [
      {
        number: 15,
        title: "Add role-based access control for data queries",
        description: "We need to implement RBAC for all data queries to ensure proper security.",
        labels: ["enhancement", "security"],
        difficulty: "medium",
        createdAt: "2025-06-10"
      },
      {
        number: 18,
        title: "Optimize JOIN queries for large datasets",
        description: "The JOIN queries are slow on large datasets. We need to optimize them using Snowflake best practices.",
        labels: ["enhancement", "performance"],
        difficulty: "hard",
        createdAt: "2025-06-14"
      },
      {
        number: 22,
        title: "Fix data type conversion in query results",
        description: "There's an issue with data type conversion when returning query results from Snowflake.",
        labels: ["bug", "data types"],
        difficulty: "easy",
        createdAt: "2025-06-17"
      }
    ]
  };

  const branchIssues = issuesByBranch[selectedBranch] || [];

  return (
    <Card className="glass-panel mt-8">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${branchInfo.color}`}>
          <Bug className="w-6 h-6" />
          Open Issues
        </CardTitle>
        <CardDescription>
          Get started by working on one of these issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {branchIssues.map((issue) => (
            <div 
              key={issue.number}
              className="p-4 border border-border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${branchInfo.color}`}>#{issue.number}</span>
                  <h3 className="font-semibold">{issue.title}</h3>
                </div>
                <Badge 
                  variant="outline" 
                  className={getDifficultyColor(issue.difficulty)}
                >
                  {issue.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{issue.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {issue.labels.map((label, idx) => (
                    <Badge 
                      key={idx} 
                      className={getLabelColor(label)}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center text-xs text-slate-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{issue.createdAt}</span>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center mt-6">
            <Button 
              variant="outline"
              onClick={() => window.open(`${branchInfo.githubUrl}/issues`, '_blank')}
              className="flex items-center gap-2"
            >
              <GitPullRequest className="w-4 h-4" />
              View All Issues
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
