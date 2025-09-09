
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, GitMerge, BookOpen } from 'lucide-react';

interface Goal {
  id: number;
  title: string;
  progress: number;
  icon: React.ReactNode;
}

interface MonthlyGoalsProps {
  goals: Goal[];
}

const getProgressColor = (progress: number) => {
  if (progress < 40) return 'bg-red-500';
  if (progress < 80) return 'bg-yellow-500';
  return 'bg-green-500';
};

export const MonthlyGoals: React.FC<MonthlyGoalsProps> = ({ goals }) => (
  <Card>
    <CardHeader>
      <CardTitle>Monthly Goals</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-4">
        {goals.map((goal) => (
          <li key={goal.id}>
            <div className="flex items-center mb-2">
              {goal.icon}
              <div className="flex justify-between w-full ml-3">
                <span className="text-sm font-medium">{goal.title}</span>
                <span className="text-sm font-medium">{goal.progress}%</span>
              </div>
            </div>
            <Progress value={goal.progress} className={getProgressColor(goal.progress)} />
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);
