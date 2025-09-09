/**
 * TypeScript interfaces for Hub-specific data structures
 * Used across overview, projects, activity, and insights components
 */

/**
 * Base interface for all entities with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User interface
 */
export interface User extends BaseEntity {
  username: string;
  email?: string;
  githubId?: string;
  githubUsername?: string;
  avatarUrl?: string;
  displayName?: string;
  bio?: string;
  location?: string;
  company?: string;
  websiteUrl?: string;
  twitterUsername?: string;
  publicRepos: number;
  followers: number;
  following: number;
}

/**
 * Repository interface
 */
export interface Repository extends BaseEntity {
  githubId: number;
  name: string;
  fullName: string;
  description?: string;
  owner: User;
  language?: string;
  languages: Record<string, number>;
  stargazersCount: number;
  forksCount: number;
  watchersCount: number;
  openIssuesCount: number;
  size: number;
  defaultBranch: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  hasIssues: boolean;
  hasPullRequests: boolean;
  hasWiki: boolean;
  hasPages: boolean;
  license?: {
    key: string;
    name: string;
    spdxId: string;
  };
  topics: string[];
  visibility: 'public' | 'private' | 'internal';
  pushedAt?: Date;
  cloneUrl: string;
  sshUrl: string;
  homepageUrl?: string;
  contributorsCount: number;
  contributors: User[];
}

/**
 * Branch interface
 */
export interface Branch extends BaseEntity {
  name: string;
  repository: Repository;
  isDefault: boolean;
  isProtected: boolean;
  lastCommit?: {
    sha: string;
    message: string;
    author: User;
    date: Date;
  };
  aheadBy: number;
  behindBy: number;
}

/**
 * Project interface
 */
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  repository?: Repository;
  owner: User;
  members: User[];
  status: 'active' | 'completed' | 'paused' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number; // 0-100
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  tags: string[];
  milestones: Milestone[];
  tasks: Task[];
  visibility: 'public' | 'private' | 'team';
}

/**
 * Milestone interface
 */
export interface Milestone extends BaseEntity {
  title: string;
  description?: string;
  project: Project;
  dueDate?: Date;
  completedAt?: Date;
  progress: number;
  tasks: Task[];
  status: 'open' | 'closed';
}

/**
 * Task interface
 */
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  project: Project;
  milestone?: Milestone;
  assignee?: User;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  labels: string[];
}

/**
 * Activity interface
 */
export interface Activity extends BaseEntity {
  type: ActivityType;
  actor: User;
  repository?: Repository;
  project?: Project;
  target?: {
    type: 'issue' | 'pull_request' | 'commit' | 'branch' | 'release' | 'project' | 'task';
    id: string;
    title?: string;
    url?: string;
  };
  action: string;
  description: string;
  metadata?: Record<string, any>;
  isPublic: boolean;
}

/**
 * Activity types
 */
export type ActivityType = 
  | 'commit'
  | 'push'
  | 'pull_request'
  | 'issue'
  | 'branch'
  | 'release'
  | 'fork'
  | 'star'
  | 'watch'
  | 'project'
  | 'task'
  | 'milestone'
  | 'collaboration';

/**
 * Metrics interface for analytics and insights
 */
export interface Metrics {
  [key: string]: number | string | Date | Metrics | Array<MetricDataPoint>;
}

/**
 * Metric data point for charts and graphs
 */
export interface MetricDataPoint {
  date: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

/**
 * Chart data interface
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }>;
}

/**
 * Filter interfaces for different views
 */
export interface ProjectFilters {
  status?: Project['status'][];
  priority?: Project['priority'][];
  search?: string;
  tags?: string[];
  owner?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'name' | 'created' | 'updated' | 'priority' | 'progress' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityFilters {
  type?: ActivityType[];
  actor?: string;
  repository?: string;
  project?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  isPublic?: boolean;
  sortBy?: 'date' | 'type' | 'actor';
  sortOrder?: 'asc' | 'desc';
}

export interface InsightsFilters {
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'all';
  repository?: string;
  project?: string;
  metricType?: 'contributions' | 'collaboration' | 'performance' | 'growth';
}

/**
 * Hub view types
 */
export type HubView = 'overview' | 'projects' | 'activity' | 'insights';
export type ContributionView = 'what' | 'why' | 'how' | 'overview' | 'chat' | 'contribute' | 'import' | 'manage' | 'profile' | 'search' | 'settings';
export type AllViews = HubView | ContributionView;

/**
 * Hub state interface
 */
export interface HubState {
  currentView: AllViews;
  repository?: Repository;
  project?: Project;
  user?: User;
  filters: {
    projects: ProjectFilters;
    activity: ActivityFilters;
    insights: InsightsFilters;
  };
  loading: {
    overview: boolean;
    projects: boolean;
    activity: boolean;
    insights: boolean;
  };
  errors: {
    overview?: string;
    projects?: string;
    activity?: string;
    insights?: string;
  };
}

/**
 * API response interfaces
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

/**
 * Error interfaces
 */
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Loading state interface
 */
export interface LoadingState {
  isLoading: boolean;
  error?: ApiError;
  lastUpdated?: Date;
}

/**
 * Component prop interfaces
 */
export interface HubComponentProps {
  repository?: Repository;
  project?: Project;
  user?: User;
  className?: string;
  onError?: (error: ApiError) => void;
  onLoading?: (isLoading: boolean) => void;
}

/**
 * Navigation interfaces
 */
export interface HubNavigation {
  currentView: HubView;
  availableViews: Array<{
    key: HubView;
    label: string;
    icon?: string;
    disabled?: boolean;
  }>;
  onViewChange: (view: HubView) => void;
}

/**
 * Export all types
 */
export type {
  BaseEntity,
  User,
  Repository,
  Branch,
  Project,
  Milestone,
  Task,
  Activity,
  ActivityType,
  Metrics,
  MetricDataPoint,
  ChartData,
  ProjectFilters,
  ActivityFilters,
  InsightsFilters,
  HubView,
  HubState,
  ApiResponse,
  PaginatedResponse,
  ApiError,
  LoadingState,
  HubComponentProps,
  HubNavigation,
};