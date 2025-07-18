import React, { useState } from 'react';
import { 
  BarChart3, 
  GitPullRequest, 
  Calendar, 
  Bug, 
  Lightbulb, 
  Filter, 
  Pin, 
  MessageSquare, 
  Upload, 
  Bot, 
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type SidebarSection = {
  id: string;
  name: string;
  icon: React.ReactNode;
  badge?: number;
  tooltip?: string;
};

interface CortexSidebarProps {
  onCortexSelect: (categoryId: string, itemId: string | null) => void;
  selectedCategoryId: string;
  selectedItemId: string | null;
}

const CortexSidebar = ({ 
  onCortexSelect, 
  selectedCategoryId = 'overview', 
  selectedItemId = null,
  badgeCounts = {} // <-- add this prop
}: CortexSidebarProps & { badgeCounts?: Record<string, number> }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sections: SidebarSection[] = [
    {
      id: 'overview',
      name: 'Overview',
      icon: <BarChart3 size={16} className="text-orange-500" />,
      tooltip: 'Branch activity dashboard'
    },
    {
      id: 'my-contributions',
      name: 'My Contributions',
      icon: <GitPullRequest size={16} className="text-blue-500" />,
      badge: badgeCounts['my-contributions'],
      tooltip: 'Your PRs and issues'
    },
    {
      id: 'branch-planner',
      name: 'Branch Planner',
      icon: <Calendar size={16} className="text-green-500" />,
      tooltip: 'Project roadmap and planning'
    },
    {
      id: 'pr-tracker',
      name: 'Pull Request Tracker',
      icon: <GitPullRequest size={16} className="text-blue-500" />,
      badge: badgeCounts['pr-tracker'],
      tooltip: 'Track all pull requests'
    },
    {
      id: 'issue-tracker',
      name: 'Issue Tracker',
      icon: <Bug size={16} className="text-red-500" />,
      badge: badgeCounts['issue-tracker'],
      tooltip: 'Track all issues'
    },
    {
      id: 'smart-suggestions',
      name: 'Smart Suggestions',
      icon: <Lightbulb size={16} className="text-yellow-500" />,
      badge: badgeCounts['smart-suggestions'],
      tooltip: 'AI-powered recommendations'
    },
    {
      id: 'saved-filters',
      name: 'Saved Filters',
      icon: <Filter size={16} className="text-purple-500" />,
      tooltip: 'Your custom filter presets'
    },
    {
      id: 'pinned-watched',
      name: 'Pinned/Watched Issues',
      icon: <Pin size={16} className="text-pink-500" />,
      badge: badgeCounts['pinned-watched'],
      tooltip: 'Items you are watching'
    },
    {
      id: 'private-notes',
      name: 'Private Notes',
      icon: <MessageSquare size={16} className="text-indigo-500" />,
      tooltip: 'Your personal notes'
    },
    {
      id: 'bot-logs',
      name: 'Bot Logs',
      icon: <Bot size={16} className="text-gray-500" />,
      tooltip: 'Automated activity logs'
    },
  ];

  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSectionClick = (sectionId: string) => {
    onCortexSelect(sectionId, null);
  };

  return (
    <div className={cn(
      "border-r border-border/50 overflow-y-auto shrink-0 transition-all duration-300 bg-background h-full flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        {!isCollapsed && (
          <h3 className="font-semibold text-sm text-foreground">Control Panel</h3>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="p-2 flex-1">
        {filteredSections.map((section) => (
          <Tooltip key={section.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer rounded-md transition-all duration-200 mb-1",
                  selectedCategoryId === section.id
                    ? "bg-orange-500/10 text-orange-600 border-l-2 border-orange-500 shadow-sm" 
                    : "hover:bg-muted/50 text-foreground/80 hover:text-foreground"
                )}
                onClick={() => handleSectionClick(section.id)}
              >
                <div className="shrink-0">
                  {section.icon}
                </div>
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate font-medium">
                      {section.name}
                    </span>
                    {section.badge && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {section.badge}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </TooltipTrigger>
            {(isCollapsed || section.tooltip) && (
              <TooltipContent side="right" align="center">
                {section.tooltip || section.name}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>

      {/* Quick Stats (collapsed view) */}
      {isCollapsed && (
        <div className="p-2 border-t border-border/50 mt-auto pb-0">
          <div className="text-xs text-muted-foreground text-center">
            <div className="mb-1">PRs: 12</div>
            <div>Notes: 7</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CortexSidebar;
