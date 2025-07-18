import React, { useState, useEffect, useMemo } from 'react';
import { Bot, Settings, List, ShieldCheck, BarChart2, GitPullRequestArrow } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useRepository } from '@/contexts/RepositoryContext';

// A list of recommended bots that users can manage
const recommendedBots = [
  {
    id: 'dependabot',
    name: 'Dependabot',
    description: 'Automates dependency updates to keep your project secure.',
    icon: <ShieldCheck className="h-6 w-6 text-green-500" />,
    identifier: 'dependabot[bot]',
  },
  {
    id: 'codecov',
    name: 'Codecov',
    description: 'Provides intelligent code coverage reports in your pull requests.',
    icon: <BarChart2 className="h-6 w-6 text-blue-500" />,
    identifier: 'codecov-commenter',
  },
  {
    id: 'stale',
    name: 'Stale Bot',
    description: 'Closes abandoned issues and pull requests after a period of inactivity.',
    icon: <GitPullRequestArrow className="h-6 w-6 text-red-500" />,
    identifier: 'stale[bot]',
  },
];

const BotLogs = ({ activities, branch }: { activities: any[], branch: string }) => {
  const { user } = useAuth();
  const { repository } = useRepository();
  const [enabledBots, setEnabledBots] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const isOwner = user?.login === repository?.owner?.login;
  const storageKey = `beetle-bots-${repository?.owner?.login}-${repository?.name}`;

  // Load bot settings from local storage for the owner
  useEffect(() => {
    if (isOwner) {
      try {
        const storedSettings = localStorage.getItem(storageKey);
        if (storedSettings) {
          setEnabledBots(JSON.parse(storedSettings));
        }
      } catch (e) {
        console.error("Failed to load bot settings from localStorage", e);
      }
    }
    setLoading(false);
  }, [isOwner, storageKey]);

  // Save bot settings to local storage when they change
  useEffect(() => {
    if (isOwner && !loading) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(enabledBots));
      } catch (e) {
        console.error("Failed to save bot settings to localStorage", e);
      }
    }
  }, [enabledBots, isOwner, storageKey, loading]);

  const handleBotToggle = (botId: string, isEnabled: boolean) => {
    setEnabledBots(prev => ({ ...prev, [botId]: isEnabled }));
  };

  // Filter activities to find logs from known bots
  const botActivities = useMemo(() => {
    const botIdentifiers = recommendedBots.map(b => b.identifier);
    return (activities || []).filter(activity =>
      botIdentifiers.includes(activity.user?.toLowerCase()) || activity.user?.endsWith('[bot]')
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities]);

  return (
    <div className="p-6 space-y-6">
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Manage Repository Bots
            </CardTitle>
            <CardDescription>Enable or disable automated bots for this repository. Your settings are saved locally.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedBots.map(bot => (
              <div key={bot.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  {bot.icon}
                  <div>
                    <h4 className="font-semibold">{bot.name}</h4>
                    <p className="text-sm text-muted-foreground">{bot.description}</p>
                  </div>
                </div>
                <Switch
                  checked={!!enabledBots[bot.id]}
                  onCheckedChange={(checked) => handleBotToggle(bot.id, checked)}
                  aria-label={`Enable ${bot.name}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5 text-primary" />
            Bot Activity Logs
          </CardTitle>
          <CardDescription>
            {isOwner ? "Recent activities from your enabled bots." : "Recent activities from bots on this repository."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {botActivities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No bot activity found.
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {botActivities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-md">
                  <Bot className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm break-words">
                      <span className="font-semibold">{activity.user}</span>: {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleString()} on branch <Badge variant="secondary">{activity.branch}</Badge>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BotLogs;