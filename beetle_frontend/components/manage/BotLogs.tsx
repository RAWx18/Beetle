import React, { useState } from 'react';
import { Bot, Clock, CheckCircle, AlertTriangle, XCircle, Plus, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { contributionData } from './contribution-data';

interface BotLogsProps {
  activities: any[];
  branch: string;
}

const BotLogs = ({ activities, branch }: BotLogsProps) => {
  const [selectedBot, setSelectedBot] = useState<string>('all');
  
  const botLogs = contributionData.botLogs;
  const botActivities = activities.filter(activity => 
    activity.user.includes('bot') || activity.type === 'automated'
  );

  const availableBots = [
    { name: 'Auto-Labeler', description: 'Automatically labels PRs and issues', status: 'active' },
    { name: 'Code-Review-Bot', description: 'Requests reviews and checks code quality', status: 'active' },
    { name: 'CI-Bot', description: 'Runs continuous integration checks', status: 'active' },
    { name: 'Security-Scanner', description: 'Scans for security vulnerabilities', status: 'inactive' },
    { name: 'Dependency-Bot', description: 'Updates dependencies automatically', status: 'inactive' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={14} className="text-green-500" />;
      case 'error': return <XCircle size={14} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={14} className="text-yellow-500" />;
      default: return <Clock size={14} className="text-blue-500" />;
    }
  };

  const getBotColor = (botName: string) => {
    const colors = {
      'Auto-Labeler': 'bg-blue-100 text-blue-800',
      'Code-Review-Bot': 'bg-green-100 text-green-800',
      'CI-Bot': 'bg-purple-100 text-purple-800',
      'Security-Scanner': 'bg-red-100 text-red-800',
      'Dependency-Bot': 'bg-orange-100 text-orange-800'
    } as Record<string, string>;
    return colors[botName] || 'bg-gray-100 text-gray-800';
  };

  const filteredLogs = selectedBot === 'all' 
    ? botLogs 
    : botLogs.filter(log => log.botName === selectedBot);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Bot Activity & Management</h3>
          <Badge variant="secondary">{botLogs.length} entries</Badge>
        </div>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Bot
        </Button>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="management">Bot Management</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={selectedBot === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedBot('all')}
            >
              All Bots
            </Button>
            {Array.from(new Set(botLogs.map(log => log.botName))).map(botName => (
              <Button
                key={botName}
                variant={selectedBot === botName ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedBot(botName)}
              >
                {botName}
              </Button>
            ))}
          </div>

          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bot activity logged yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getStatusIcon(log.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getBotColor(log.botName)}>
                            {log.botName}
                          </Badge>
                          <span className="text-sm font-medium">{log.action}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{log.description}</p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            {log.details}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock size={12} />
                          {log.timestamp}
                          <Badge variant="outline" className="text-xs">
                            {log.branch}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableBots.map((bot) => (
              <Card key={bot.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      {bot.name}
                    </CardTitle>
                    <Badge variant={bot.status === 'active' ? 'default' : 'secondary'}>
                      {bot.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{bot.description}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={bot.status === 'active' ? 'destructive' : 'default'}
                      className="flex-1"
                    >
                      {bot.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BotLogs;
