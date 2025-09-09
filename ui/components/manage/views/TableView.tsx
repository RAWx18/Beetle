
import React from 'react';
import { ArrowUpDown, Check, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CortexItem, columns } from '../cortex-data';
import { cn } from '@/lib/utils';

interface TableViewProps {
  items: CortexItem[];
  selectedItems?: string[];
  onSelectItem?: (id: string) => void;
}

const TableView = ({ 
  items, 
  selectedItems = [], 
  onSelectItem = () => {} 
}: TableViewProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10"></TableHead>
          {columns.map((column) => (
            <TableHead key={column.id} className="py-2">
              <div className="flex items-center">
                {column.name}
                {column.sortable && (
                  <Button variant="ghost" size="sm" className="ml-1 h-6 w-6 p-0">
                    <ArrowUpDown size={14} />
                  </Button>
                )}
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          
          return (
            <TableRow 
              key={item.id} 
              className={cn(
                "hover:bg-muted/30",
                isSelected && "bg-primary/5"
              )}
            >
              <TableCell className="w-10">
                <div 
                  className="cursor-pointer"
                  onClick={() => onSelectItem(item.id)}
                >
                  {isSelected ? (
                    <div className="rounded-md bg-primary text-white p-0.5">
                      <Check size={16} />
                    </div>
                  ) : (
                    <div className="rounded-md border border-border p-0.5">
                      <Square size={16} />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell className="text-blue-500 hover:underline">
                <a href={item.url}>{item.url}</a>
              </TableCell>
              <TableCell>
                <span className="px-2 py-1 rounded-full bg-primary/10 text-xs font-medium">
                  {item.type}
                </span>
              </TableCell>
              <TableCell>{item.createdDate}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {item.keywords.map((keyword, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 rounded-full bg-secondary/20 text-xs"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>{item.source}</TableCell>
              <TableCell>{item.pitch}</TableCell>
              <TableCell>{item.writer}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default TableView;
