'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  SortAsc,
  SortDesc,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ProjectFilters as ProjectFiltersType, Project } from '@/types/hub';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ProjectFiltersProps {
  filters: ProjectFiltersType;
  onFiltersChange: (filters: ProjectFiltersType) => void;
  totalProjects: number;
  filteredCount: number;
  className?: string;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const statusOptions = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
  { value: 'paused', label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-100 text-gray-800' }
];

const priorityOptions = [
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' }
];

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'created', label: 'Created Date' },
  { value: 'updated', label: 'Last Updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'progress', label: 'Progress' },
  { value: 'dueDate', label: 'Due Date' }
];

const visibilityOptions = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team' }
];

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  filters,
  onFiltersChange,
  totalProjects,
  filteredCount,
  className = '',
  isExpanded = false,
  onExpandedChange
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localFilters, setLocalFilters] = useState<ProjectFiltersType>(filters);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Sync local filters with props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Update URL parameters when filters change
  const updateUrlParams = useCallback((newFilters: ProjectFiltersType) => {
    const params = new URLSearchParams(searchParams);
    
    // Update search parameter
    if (newFilters.search) {
      params.set('search', newFilters.search);
    } else {
      params.delete('search');
    }
    
    // Update status parameters
    if (newFilters.status && newFilters.status.length > 0) {
      params.set('status', newFilters.status.join(','));
    } else {
      params.delete('status');
    }
    
    // Update priority parameters
    if (newFilters.priority && newFilters.priority.length > 0) {
      params.set('priority', newFilters.priority.join(','));
    } else {
      params.delete('priority');
    }
    
    // Update tags parameters
    if (newFilters.tags && newFilters.tags.length > 0) {
      params.set('tags', newFilters.tags.join(','));
    } else {
      params.delete('tags');
    }
    
    // Update owner parameter
    if (newFilters.owner) {
      params.set('owner', newFilters.owner);
    } else {
      params.delete('owner');
    }
    
    // Update date range parameters
    if (newFilters.dateRange) {
      params.set('date_start', newFilters.dateRange.start.toISOString());
      params.set('date_end', newFilters.dateRange.end.toISOString());
    } else {
      params.delete('date_start');
      params.delete('date_end');
    }
    
    // Update sort parameters
    if (newFilters.sortBy) {
      params.set('sort_by', newFilters.sortBy);
    } else {
      params.delete('sort_by');
    }
    
    if (newFilters.sortOrder) {
      params.set('sort_order', newFilters.sortOrder);
    } else {
      params.delete('sort_order');
    }

    // Update URL without navigation
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchParams]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ProjectFiltersType>) => {
    const updatedFilters = { ...localFilters, ...newFilters };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
    updateUrlParams(updatedFilters);
  }, [localFilters, onFiltersChange, updateUrlParams]);

  // Handle search input
  const handleSearchChange = (value: string) => {
    handleFilterChange({ search: value });
  };

  // Handle status toggle
  const handleStatusToggle = (status: Project['status']) => {
    const currentStatus = localFilters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status];
    handleFilterChange({ status: newStatus });
  };

  // Handle priority toggle
  const handlePriorityToggle = (priority: Project['priority']) => {
    const currentPriority = localFilters.priority || [];
    const newPriority = currentPriority.includes(priority)
      ? currentPriority.filter(p => p !== priority)
      : [...currentPriority, priority];
    handleFilterChange({ priority: newPriority });
  };

  // Handle sort change
  const handleSortChange = (sortBy: string) => {
    handleFilterChange({ sortBy: sortBy as ProjectFiltersType['sortBy'] });
  };

  // Handle sort order toggle
  const handleSortOrderToggle = () => {
    const newOrder = localFilters.sortOrder === 'asc' ? 'desc' : 'asc';
    handleFilterChange({ sortOrder: newOrder });
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters: ProjectFiltersType = {
      search: '',
      status: [],
      priority: [],
      tags: [],
      owner: '',
      dateRange: undefined,
      sortBy: 'updated',
      sortOrder: 'desc'
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    updateUrlParams(clearedFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = 
    (localFilters.search && localFilters.search.length > 0) ||
    (localFilters.status && localFilters.status.length > 0) ||
    (localFilters.priority && localFilters.priority.length > 0) ||
    (localFilters.tags && localFilters.tags.length > 0) ||
    (localFilters.owner && localFilters.owner.length > 0) ||
    localFilters.dateRange;

  // Get active filter count
  const activeFilterCount = 
    (localFilters.search ? 1 : 0) +
    (localFilters.status?.length || 0) +
    (localFilters.priority?.length || 0) +
    (localFilters.tags?.length || 0) +
    (localFilters.owner ? 1 : 0) +
    (localFilters.dateRange ? 1 : 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search and Quick Filters */}
        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={localFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
            {localFilters.search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearchChange('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <Button
            variant="outline"
            onClick={() => onExpandedChange?.(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {activeFilterCount}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <Select value={localFilters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSortOrderToggle}
            className="p-2"
          >
            {localFilters.sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalProjects} projects
          {hasActiveFilters && ' (filtered)'}
        </span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Expanded Filter Panel */}
      <Collapsible open={isExpanded} onOpenChange={onExpandedChange}>
        <CollapsibleContent>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Filter Projects</CardTitle>
                  <CardDescription>
                    Refine your project list with advanced filters
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="text-xs"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Advanced
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Filters */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={localFilters.status?.includes(option.value as Project['status']) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusToggle(option.value as Project['status'])}
                      className="capitalize"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Priority Filters */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={localFilters.priority?.includes(option.value as Project['priority']) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePriorityToggle(option.value as Project['priority'])}
                      className="capitalize"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Advanced Filters */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleContent>
                  <div className="space-y-6 pt-4 border-t">
                    {/* Owner Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Project Owner</Label>
                      <Input
                        placeholder="Filter by owner username..."
                        value={localFilters.owner || ''}
                        onChange={(e) => handleFilterChange({ owner: e.target.value })}
                      />
                    </div>

                    {/* Tags Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Tags</Label>
                      <Input
                        placeholder="Enter tags separated by commas..."
                        value={localFilters.tags?.join(', ') || ''}
                        onChange={(e) => {
                          const tags = e.target.value
                            .split(',')
                            .map(tag => tag.trim())
                            .filter(tag => tag.length > 0);
                          handleFilterChange({ tags });
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Separate multiple tags with commas
                      </p>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Date Range</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">From</Label>
                          <Input
                            type="date"
                            value={localFilters.dateRange?.start.toISOString().split('T')[0] || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                const start = new Date(e.target.value);
                                const end = localFilters.dateRange?.end || new Date();
                                handleFilterChange({ dateRange: { start, end } });
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">To</Label>
                          <Input
                            type="date"
                            value={localFilters.dateRange?.end.toISOString().split('T')[0] || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                const end = new Date(e.target.value);
                                const start = localFilters.dateRange?.start || new Date();
                                handleFilterChange({ dateRange: { start, end } });
                              }
                            }}
                          />
                        </div>
                      </div>
                      {localFilters.dateRange && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFilterChange({ dateRange: undefined })}
                          className="mt-2 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Clear date range
                        </Button>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Active Filters</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {localFilters.search && (
                      <Badge variant="secondary" className="text-xs">
                        Search: "{localFilters.search}"
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSearchChange('')}
                          className="ml-1 p-0 h-auto"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    )}
                    {localFilters.status?.map((status) => (
                      <Badge key={status} variant="secondary" className="text-xs">
                        Status: {status}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusToggle(status)}
                          className="ml-1 p-0 h-auto"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                    {localFilters.priority?.map((priority) => (
                      <Badge key={priority} variant="secondary" className="text-xs">
                        Priority: {priority}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePriorityToggle(priority)}
                          className="ml-1 p-0 h-auto"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                    {localFilters.owner && (
                      <Badge variant="secondary" className="text-xs">
                        Owner: {localFilters.owner}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFilterChange({ owner: '' })}
                          className="ml-1 p-0 h-auto"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    )}
                    {localFilters.dateRange && (
                      <Badge variant="secondary" className="text-xs">
                        Date Range
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFilterChange({ dateRange: undefined })}
                          className="ml-1 p-0 h-auto"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ProjectFilters;