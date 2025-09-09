
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterBarProps {
  onFilterChange: (value: string) => void;
}

const activityTypes = [
  'all',
  'PushEvent',
  'PullRequestEvent',
  'IssuesEvent',
  'IssueCommentEvent',
];

export const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => (
  <Select onValueChange={onFilterChange} defaultValue="all">
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Filter by type..." />
    </SelectTrigger>
    <SelectContent>
      {activityTypes.map((type) => (
        <SelectItem key={type} value={type}>{
          type
        }</SelectItem>
      ))}
    </SelectContent>
  </Select>
);
