
import React from 'react';
import { Card } from '@/components/ui/card';
import { CortexItem } from '../cortex-data';

interface KanbanViewProps {
  items: CortexItem[];
}

const KanbanView = ({ items }: KanbanViewProps) => {
  return (
    <div className="flex gap-4 p-4 overflow-x-auto h-full">
      {['To Read', 'In Progress', 'Completed'].map((column) => (
        <div key={column} className="flex-shrink-0 w-72 bg-card rounded-md shadow-sm">
          <div className="p-3 border-b border-border/50">
            <h3 className="font-medium">{column}</h3>
          </div>
          <div className="p-2 flex flex-col gap-2">
            {items.slice(0, column === 'To Read' ? 3 : column === 'In Progress' ? 1 : 1).map((item) => (
              <Card key={item.id} className="p-3 bg-background hover:shadow-md transition-shadow">
                <h4 className="text-sm font-medium mb-1">{item.title}</h4>
                <div className="mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.pitch}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanView;
