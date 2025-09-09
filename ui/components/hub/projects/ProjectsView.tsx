'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Calendar,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Pause,
  Archive
} from 'lucide-react';
import { Project, ProjectFilters as ProjectFiltersType } from '@/types/hub';
import { hubApi } from '@/lib/api/hub-api';
import { ProjectCard } from './ProjectCard';
import { ProjectFilters } from './ProjectFilters';

interface ProjectsViewProps {
  className?: string;
  onError?: (error: Error) => void;
  onLoading?: (isLoading: boolean) => void;
}

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  paused: number;
  archived: number;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  className = '',
  onError,
  onLoading
}) => {
  const { token } = useAuth();
  const { repository } = useRepository();
  
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    active: 0,
    completed: 0,
    paused: 0,
    archived: 0
  });
  
  const [filters, setFilters] = useState<ProjectFiltersType>({
    search: '',
    status: [],
    priority: [],
    sortBy: 'updated',
    sortOrder: 'desc'
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch projects data
  const fetchProjects = useCallback(async () => {
    if (!token || !repository) return;

    setLoading(true);
    onLoading?.(true);

    try {
      // TODO: Replace with real API call
      // const projects = await hubApi.projects.getProjects(repository.id, filters);
      
      // For now, return empty array until API is connected
      const projects: Project[] = [];

      setProjects(projects);
      
      // Calculate empty stats
      const newStats: ProjectStats = {
        total: 0,
        active: 0,
        completed: 0,
        paused: 0,
        archived: 0
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error fetching projects:', error);
      onError?.(error as Error);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  }, [token, repository, onError, onLoading]);

  // Filter and sort projects
  useEffect(() => {
    let filtered = [...projects];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(project => filters.status!.includes(project.status));
    }

    // Apply priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(project => filters.priority!.includes(project.priority));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updated':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          break;
        default:
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredProjects(filtered);
  }, [projects, filters]);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading projects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-primary" />
            Projects
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and track projects for {repository?.name}
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.paused}</p>
              </div>
              <Pause className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Archived</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              </div>
              <Archive className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Controls */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('grid')}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <List className="w-4 h-4" />
        </Button>
      </div>

      {/* Advanced Filters Component */}
      <ProjectFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalProjects={projects.length}
        filteredCount={filteredProjects.length}
        isExpanded={showFilters}
        onExpandedChange={setShowFilters}
      />

      {/* Projects Grid/List */}
      {filteredProjects.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              viewMode={viewMode}
              onView={(project) => {
                console.log('View project:', project.name);
                // TODO: Navigate to project details page
              }}
              onEdit={(project) => {
                console.log('Edit project:', project.name);
                // TODO: Open project edit modal/page
              }}
              onDelete={(project) => {
                console.log('Delete project:', project.name);
                // TODO: Show delete confirmation dialog
              }}
              onShare={(project) => {
                console.log('Share project:', project.name);
                // TODO: Open share dialog
              }}
              onStatusChange={(project, status) => {
                console.log('Change status:', project.name, status);
                // TODO: Update project status
              }}
              onPriorityChange={(project, priority) => {
                console.log('Change priority:', project.name, priority);
                // TODO: Update project priority
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {projects.length === 0 ? 'No Projects Yet' : 'No Projects Found'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {projects.length === 0 
                ? `Create your first project to start organizing your work on ${repository?.name}`
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {projects.length === 0 && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectsView;