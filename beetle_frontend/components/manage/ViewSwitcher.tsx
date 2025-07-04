
import React from 'react';
import { LayoutGrid, List, Table2, Columns } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ViewSwitcherProps {
  activeView: 'table' | 'grid' | 'list' | 'kanban';
  onViewChange: (view: 'table' | 'grid' | 'list' | 'kanban') => void;
}

const ViewSwitcher = ({ activeView, onViewChange }: ViewSwitcherProps) => {
  return (
    <div className="bg-card rounded-md p-1 shadow-sm">
      <ToggleGroup type="single" value={activeView} onValueChange={(value) => {
        if (value) onViewChange(value as 'table' | 'grid' | 'list' | 'kanban');
      }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="table" aria-label="Table view">
              <Table2 size={18} />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Table View</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid size={18} />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Grid View</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="list" aria-label="List view">
              <List size={18} />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>List View</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
              <Columns size={18} />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kanban View</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </div>
  );
};

export default ViewSwitcher;
