"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { useChat } from '@/contexts/ChatContext';
import { useBranch } from '@/contexts/BranchContext';
import { useKnowledgeBase } from '@/contexts/KnowledgeBaseContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Database, 
  Globe, 
  Upload, 
  Type, 
  GitBranch, 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  File, 
  X, 
  Check, 
  Search, 
  Filter, 
  Download, 
  Settings, 
  Info, 
  AlertCircle,
  GitPullRequest,
  GitCommit,
  Bug,
  Star,
  Activity,
  Users,
  Calendar,
  Clock,
  Code2,
  Shield,
  Eye,
  Zap,
  Target,
  MessageSquare,
  Award,
  Flame,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckSquare,
  Square,
  ChevronUp,
  Bot,
  PlusCircle,
  Send,
  User,
  Bot as BotIcon,
  FileCode,
  Hash,
  Clock as ClockIcon,
  Copy as CopyIcon,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Settings as SettingsIcon,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  List,
  Plus as PlusIcon
} from 'lucide-react';
import { toast } from 'sonner';
import GitHubAPI from '@/lib/github-api';
import { transformGitHubData, fallbackContributionData } from './manage/contribution-data';
import { ImportSource } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

import AnimatedTransition from './AnimatedTransition';
import { ChatSessionManager } from './ChatSessionManager';

// Import sources for unified interface
const importSources: ImportSource[] = [
  {
    id: 'csv',
    name: 'CSV File',
    type: 'csv',
    icon: 'FileText',
    description: 'Import structured data from CSV files'
  },
  {
    id: 'control-panel',
    name: 'Control Panel Data',
    type: 'control-panel',
    icon: 'Database',
    description: 'Import data from Manage page controls'
  },
  {
    id: 'api',
    name: 'API Integration',
    type: 'api',
    icon: 'Database',
    description: 'Connect to external APIs and services'
  },
  {
    id: 'url',
    name: 'Web URL',
    type: 'url',
    icon: 'Globe',
    description: 'Import content from websites and articles'
  },
  {
    id: 'file',
    name: 'Document Upload',
    type: 'file',
    icon: 'Upload',
    description: 'Upload documents, PDFs, and other files'
  },
  {
    id: 'text',
    name: 'Text Input',
    type: 'text',
    icon: 'Type',
    description: 'Directly input or paste text content'
  },
  {
    id: 'branch',
    name: 'Branch Import',
    type: 'branch',
    icon: 'GitBranch',
    description: 'Import context from other branches'
  }
];

// Types for the chat interface
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: string[]; // Files referenced in this message
  codeSnippets?: CodeSnippet[];
}

interface CodeSnippet {
  language: string;
  code: string;
  filePath?: string;
}

interface FileSystemItem {
  name: string;
  type: 'file' | 'folder';
  selected?: boolean;
  expanded?: boolean;
  children?: FileSystemItem[];
  size?: number;
  path?: string;
  branch?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  selectedFiles: Array<{branch: string, path: string, content: string}>;
  createdAt: Date;
  updatedAt: Date;
}

// Import source card component
interface ImportSourceCardProps {
  source: ImportSource;
  onClick: () => void;
  isActive: boolean;
}

const ImportSourceCard: React.FC<ImportSourceCardProps> = ({ source, onClick, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getIcon = () => {
    switch (source.icon) {
      case 'FileText': return <FileText size={20} />;
      case 'Database': return <Database size={20} />;
      case 'Globe': return <Globe size={20} />;
      case 'Upload': return <Upload size={20} />;
      case 'Type': return <Type size={20} />;
      case 'GitBranch': return <GitBranch size={20} />;
      default: return <FileText size={20} />;
    }
  };
  
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border border-border hover:border-primary cursor-pointer transition-all duration-200",
        isActive ? "bg-primary/10 border-primary" : "bg-card/50",
        isHovered ? "translate-y-[-2px] shadow-md" : ""
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm">{source.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {source.description}
          </p>
        </div>
      </div>
    </div>
  );
};

// File type icons mapping
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'ts':
    case 'tsx':
      return <Code2 size={12} className="mr-1 text-blue-500" />;
    case 'js':
    case 'jsx':
      return <Code2 size={12} className="mr-1 text-yellow-500" />;
    case 'json':
      return <Code2 size={12} className="mr-1 text-green-500" />;
    case 'md':
      return <FileText size={12} className="mr-1 text-purple-500" />;
    case 'css':
    case 'scss':
      return <FileText size={12} className="mr-1 text-pink-500" />;
    case 'html':
      return <FileText size={12} className="mr-1 text-orange-500" />;
    case 'py':
      return <Code2 size={12} className="mr-1 text-blue-600" />;
    case 'java':
      return <Code2 size={12} className="mr-1 text-red-500" />;
    case 'cpp':
    case 'c':
      return <Code2 size={12} className="mr-1 text-blue-700" />;
    default:
      return <File size={12} className="mr-1 text-blue-500" />;
  }
};

// File system node component
interface FileSystemNodeProps {
  item: FileSystemItem;
  level: number;
  onToggle: (item: FileSystemItem, path: string[]) => void;
  onSelect: (item: FileSystemItem, path: string[]) => void;
  path: string[];
  branch: string;
  onFileSelect?: (branch: string, filePath: string, content: string) => void;
  fileContent?: string;
  isLoadingContent?: boolean;
  selectedFiles: Array<{branch: string, path: string, content: string}>;
}

const FileSystemNode: React.FC<FileSystemNodeProps> = ({ 
  item, 
  level, 
  onToggle, 
  onSelect,
  path,
  branch,
  onFileSelect,
  fileContent,
  isLoadingContent,
  selectedFiles
}) => {
  const isFolder = item.type === 'folder';
  
  // Check if this item is selected based on the selectedFiles array
  const isItemSelected = selectedFiles.some(file => 
    file.branch === branch && file.path === path.join('/')
  );
  
  // Check if folder has selected files
  const hasSelectedFiles = isFolder && item.children && item.children.some(child => {
    if (child.type === 'file') {
      const childPath = [...path, child.name].join('/');
      return selectedFiles.some(file => file.branch === branch && file.path === childPath);
    }
    return false;
  });
  
  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center py-1 px-1 rounded-md hover:bg-primary/10 cursor-pointer transition-colors",
          item.selected && "bg-primary/20",
          hasSelectedFiles && "bg-green-500/10 border border-green-500/20"
        )}
        style={{ paddingLeft: `${(level * 8) + 4}px` }}
      >
        {/* Selection checkbox for both files and folders */}
        <div 
          className="mr-1 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item, path);
          }}
        >
          {isItemSelected ? 
            <CheckSquare size={12} className="text-primary" /> : 
            <Square size={12} className="text-muted-foreground" />
          }
        </div>
        
        {/* Expand/collapse control for folders */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (isFolder) onToggle(item, path);
          }}
          className={cn(
            "mr-1 w-3 h-3 flex items-center justify-center",
            isFolder ? "cursor-pointer" : "opacity-0"
          )}
        >
          {isFolder && (
            item.expanded ? 
              <ChevronDown size={12} className="text-primary" /> : 
              <ChevronRight size={12} className="text-muted-foreground" />
          )}
        </div>
        
        {/* Icon and name */}
        <div 
          className="flex items-center flex-grow"
          onClick={() => {
            if (isFolder) {
              onToggle(item, path);
            } else {
              const filePath = path.join('/');
              if (onFileSelect) {
                onFileSelect(branch, filePath, '');
              }
              onSelect(item, path);
            }
          }}
        >
          {isFolder ? 
            <Folder size={12} className={cn(
              "mr-1",
              hasSelectedFiles ? "text-green-500" : "text-amber-500"
            )} /> : 
            getFileIcon(item.name)
          }
          
          <span className="text-xs truncate">{item.name}</span>
          <div className="flex items-center gap-1 ml-auto">
            {isFolder && item.children && (
              <span className="text-xs text-muted-foreground">
                {item.children.length} item{item.children.length !== 1 ? 's' : ''}
              </span>
            )}
            {!isFolder && isLoadingContent && (
              <Loader2 size={10} className="animate-spin text-muted-foreground" />
            )}
            {!isFolder && (
              <span className="text-xs text-muted-foreground">
                {item.size ? `${(item.size / 1024).toFixed(1)}KB` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Children for expanded folders */}
      {isFolder && item.expanded && item.children && (
        <div className="animate-fadeIn">
          {item.children.map((child: FileSystemItem, index: number) => (
            <FileSystemNode 
              key={`${child.name}-${index}`}
              item={child}
              level={level + 1}
              onToggle={onToggle}
              onSelect={onSelect}
              path={[...path, child.name]}
              branch={branch}
              onFileSelect={onFileSelect}
              fileContent={fileContent}
              isLoadingContent={isLoadingContent}
              selectedFiles={selectedFiles}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Chat message component
interface ChatMessageProps {
  message: ChatMessage;
  onCopy: (content: string) => void;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, onCopy }) => {
  const isUser = message.type === 'user';
  
  return (
    <div className={cn(
      "flex gap-3 mb-6",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex gap-3 max-w-[80%]",
        isUser && "flex-row-reverse"
      )}>
        {/* Avatar */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {isUser ? <User size={16} /> : <BotIcon size={16} />}
        </div>
        
        {/* Message content */}
        <div className={cn(
          "rounded-lg p-4",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-sm font-medium">
              {isUser ? 'You' : 'Beetle AI'}
            </span>
            <div className="flex items-center gap-1 text-xs opacity-70">
              <ClockIcon size={12} />
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              <button
                onClick={() => onCopy(message.content)}
                className="ml-2 hover:opacity-100 opacity-70 transition-opacity"
              >
                <CopyIcon size={12} />
              </button>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Custom styling for different markdown elements
                h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-medium mb-1">{children}</h3>,
                h4: ({ children }) => <h4 className="text-sm font-medium mb-1">{children}</h4>,
                p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-2">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  if (isInline) {
                    return <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>;
                  }
                  return <code className={className}>{children}</code>;
                },
                pre: ({ children }) => (
                  <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-2">
                    {children}
                  </pre>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-2">
                    <table className="min-w-full border border-border">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border px-3 py-2 text-left font-medium bg-muted">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-3 py-2">
                    {children}
                  </td>
                ),
                a: ({ children, href }) => (
                  <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                hr: () => <hr className="border-border my-4" />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          
          {/* File references */}
          {message.files && message.files.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/20">
              <div className="flex items-center gap-2 text-xs opacity-70 mb-2">
                <FileCode size={12} />
                <span>Referenced files:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {message.files.map((file, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {file}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Code snippets */}
          {message.codeSnippets && message.codeSnippets.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.codeSnippets.map((snippet, index) => (
                <div key={index} className="bg-background/50 rounded-md p-3">
                  {snippet.filePath && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <FileCode size={12} />
                      <span>{snippet.filePath}</span>
                    </div>
                  )}
                  <pre className="text-xs overflow-x-auto">
                    <code className={`language-${snippet.language}`}>
                      {snippet.code}
                    </code>
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main chat interface component
interface ImportedFile {
  branch: string;
  path: string;
  content?: string;
}

interface ImportedData {
  type: 'branch' | 'file' | 'text' | 'control-panel';
  branch?: string;
  branches?: string[];
  files?: ImportedFile[];
  fileStructures?: Record<string, FileSystemItem[]>;
  dataTypes?: string[];
  title?: string;
  content?: string;
}

interface FileChatInterfaceProps {
  importedData?: ImportedData;
}

export const FileChatInterface: React.FC<FileChatInterfaceProps> = ({ importedData }) => {
  const { token, user, githubApi } = useAuth();
  const { repository } = useRepository();
  const { selectedBranch, getBranchInfo } = useBranch();
  const { updateKnowledgeBase } = useKnowledgeBase();
  const {
    state,
    getActiveSession,
    addMessage,
    sendMessage,
    setSelectedFiles,
    addSelectedFile,
    removeSelectedFile,
    getCachedFileContent,
    cacheFileContent,
    setFileStructure,
    setLoadingState,
    setError,
    clearErrors,
    getFileCacheKey,
    getFileHash,
    createSession
  } = useChat();
  
  const githubAPI = githubApi;
  
  // Local state management
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sending' | 'sent' | 'failed'>>({});
  
  // Import state management
  const [selectedImportSource, setSelectedImportSource] = useState<string | null>(null);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [branchList, setBranchList] = useState<string[]>([]);
  const [branchFileStructures, setBranchFileStructures] = useState<Record<string, any[]>>({});
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [loadingFileContent, setLoadingFileContent] = useState<Record<string, boolean>>({});
  const [selectedFileContents, setSelectedFileContents] = useState<Array<{branch: string, path: string, content: string}>>([]);
  const [controlPanelData, setControlPanelData] = useState<any>(fallbackContributionData);
  const [selectedDataTypes, setSelectedDataTypes] = useState<{
    pullRequests: boolean;
    issues: boolean;
    botLogs: boolean;
    activities: boolean;
  }>({
    pullRequests: false,
    issues: false,
    botLogs: false,
    activities: false
  });
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");
  
  // Enhanced import state for unified experience
  const [importProgress, setImportProgress] = useState<{
    isImporting: boolean;
    progress: number;
    message: string;
    importedFiles: number;
    totalFiles: number;
  }>({
    isImporting: false,
    progress: 0,
    message: '',
    importedFiles: 0,
    totalFiles: 0
  });
  
  // Auto-import state
  const [autoImportEnabled, setAutoImportEnabled] = useState(true);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  
  // Get active session and its data
  const activeSession = getActiveSession();
  const messages = activeSession?.messages || [];
  const selectedFiles = state.selectedFiles;
  const isLoading = state.loadingStates.chat;
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Initialize chat session if none exists
  useEffect(() => {
    if (!activeSession && repository && !state.loadingStates.sessions) {
      createSession('New Chat');
    }
  }, [activeSession, repository]); // Removed createSession from dependencies

  // Track processed imports to prevent infinite loops
  const [processedImports, setProcessedImports] = useState<Set<string>>(new Set());
  
  // Debounce mechanism to prevent rapid successive API calls
  const [fetchTimeouts, setFetchTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  
  // Use ref to track current selected files to avoid circular dependencies
  const selectedFilesRef = useRef(selectedFiles);
  selectedFilesRef.current = selectedFiles;

  // Fetch file content function - moved before useEffect that uses it
  const fetchFileContent = useCallback(async (branch: string, filePath: string) => {
    if (!repository?.owner?.login || !repository?.name) return;
    
    const contentKey = getFileCacheKey(branch, filePath);
    
    // Check if we're already fetching this file
    if (fetchTimeouts[contentKey]) {
      clearTimeout(fetchTimeouts[contentKey]);
    }
    
    // Debounce the fetch request
    const timeoutId = setTimeout(async () => {
      setLoadingState('files', contentKey, true);
      
      try {
        const content = await githubAPI.getFileContent(
          repository.owner.login, 
          repository.name, 
          filePath, 
          branch
        );
        
        const contentHash = getFileHash(content);
        cacheFileContent(contentKey, content, contentHash);
        
        // Update selected files with content using ref to avoid circular dependency
        const currentFiles = selectedFilesRef.current;
        const updatedFiles = currentFiles.map(file => 
          file.branch === branch && file.path === filePath 
            ? { ...file, content, contentHash: contentHash || undefined }
            : file
        );
        setSelectedFiles(updatedFiles);
        
        console.log(`Successfully fetched content for ${filePath} (${content.length} characters)`);
        
      } catch (err) {
        console.error(`Failed to fetch content for ${filePath} in ${branch}:`, err);
        const errorMessage = 'Error loading file content';
        cacheFileContent(contentKey, '', '', errorMessage);
        setError('files', contentKey, 'Failed to load file content');
        
        // Update selected files with error using ref
        const currentFiles = selectedFilesRef.current;
        const errorFiles = currentFiles.map(file => 
          file.branch === branch && file.path === filePath 
            ? { ...file, content: errorMessage }
            : file
        );
        setSelectedFiles(errorFiles);
      } finally {
        setLoadingState('files', contentKey, false);
        // Clear the timeout reference
        setFetchTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[contentKey];
          return newTimeouts;
        });
      }
    }, 300); // 300ms debounce
    
    // Store the timeout reference
    setFetchTimeouts(prev => ({ ...prev, [contentKey]: timeoutId }));
  }, [repository, getFileCacheKey, setLoadingState, cacheFileContent, getFileHash, setSelectedFiles, setError, fetchTimeouts]); // Removed selectedFiles dependency

  // Handle imported data with enhanced workflow
  useEffect(() => {
    if (importedData && repository && !processedImports.has(importedData.type + importedData.branch)) {
      console.log('Processing imported data:', importedData);
      
      // Mark this import as processed
      setProcessedImports(prev => new Set([...prev, importedData.type + importedData.branch]));
      
      // Show import progress
      setImportProgress({
        isImporting: true,
        progress: 0,
        message: 'Processing imported data...',
        importedFiles: 0,
        totalFiles: 0
      });
      
      const timeoutId = setTimeout(async () => {
        let totalFiles = 0;
        let processedFiles = 0;
        
        if (importedData.type === 'branch' && importedData.branches) {
          // Set selected branches
          setSelectedBranches(importedData.branches);
          
          // Set file structures for imported branches
          if (importedData.fileStructures) {
            Object.entries(importedData.fileStructures).forEach(([branch, structure]) => {
              setFileStructure(branch, structure as FileSystemItem[]);
            });
          }
          
          // Add imported files to selected files and fetch content
          if (importedData.files) {
            totalFiles = importedData.files.length;
            for (const file of importedData.files) {
              // Check if file is already selected to avoid duplicates
              const isAlreadySelected = selectedFiles.some(f => f.branch === file.branch && f.path === file.path);
              
              if (!isAlreadySelected) {
                // Add file to selected files with loading state
                addSelectedFile({
                  branch: file.branch,
                  path: file.path,
                  content: 'Loading...'
                });
                
                // Fetch the actual content
                try {
                  await fetchFileContent(file.branch, file.path);
                } catch (error) {
                  console.error(`Failed to fetch content for ${file.path}:`, error);
                }
              }
              
              processedFiles++;
              setImportProgress(prev => ({
                ...prev,
                progress: (processedFiles / totalFiles) * 100,
                importedFiles: processedFiles,
                totalFiles
              }));
            }
          }
          
          toast.success(`Imported ${importedData.branches.length} branch(es) with ${totalFiles} files. You can now chat with your imported content!`);
        } else if (importedData.type === 'file' && importedData.files && importedData.branch) {
          // Handle single file imports
          totalFiles = importedData.files.length;
          for (const file of importedData.files) {
            const isAlreadySelected = selectedFiles.some(f => f.branch === importedData.branch && f.path === file.path);
            
            if (!isAlreadySelected) {
              if (file.content && file.content !== 'No content available') {
                // Use provided content
                addSelectedFile({
                  branch: importedData.branch!,
                  path: file.path,
                  content: file.content
                });
              } else {
                // Fetch content
                addSelectedFile({
                  branch: importedData.branch!,
                  path: file.path,
                  content: 'Loading...'
                });
                
                try {
                  await fetchFileContent(importedData.branch!, file.path);
                } catch (error) {
                  console.error(`Failed to fetch content for ${file.path}:`, error);
                }
              }
            }
            
            processedFiles++;
            setImportProgress(prev => ({
              ...prev,
              progress: (processedFiles / totalFiles) * 100,
              importedFiles: processedFiles,
              totalFiles
            }));
          }
          
          setSelectedBranches([importedData.branch]);
          toast.success(`Imported ${importedData.files.length} file(s). You can now chat with your imported content!`);
        } else if (importedData.type === 'text' && importedData.branch && importedData.content) {
          // Handle text imports - create a virtual file
          const virtualFilePath = `imported-text-${Date.now()}.txt`;
          addSelectedFile({
            branch: importedData.branch,
            path: virtualFilePath,
            content: importedData.content
          });
          setSelectedBranches([importedData.branch]);
          toast.success('Imported text content. You can now chat with your imported content!');
        } else if (importedData.type === 'control-panel' && importedData.branch && importedData.dataTypes) {
          // Handle control panel imports
          setSelectedBranches([importedData.branch]);
          toast.success(`Imported ${importedData.dataTypes.join(', ')} data. You can now chat with your imported content!`);
        }
        
        // Complete import process
        setImportProgress(prev => ({
          ...prev,
          isImporting: false,
          progress: 100,
          message: 'Import completed!'
        }));
        
        setShowImportSuccess(true);
        setTimeout(() => setShowImportSuccess(false), 3000);
        
      }, 1000);
      
      // Cleanup timeout on unmount or dependency change
      return () => clearTimeout(timeoutId);
    }
  }, [importedData, repository, setFileStructure, addSelectedFile, setSelectedBranches]); // Removed fetchFileContent from dependencies


  
  // Fetch branches and file structures
  useEffect(() => {
    if (repository?.owner?.login && repository?.name) {
      setLoadingState('sessions', undefined, true);
      
      githubAPI.getBranchesWithTrees(repository.owner.login, repository.name)
        .then(data => {
          console.log('Fetched repository data:', data);
          setSelectedBranches(data.branches.map((b: { name: string }) => b.name));
          
          Object.entries(data.treesByBranch).forEach(([branchName, branchData]) => {
            const typedBranchData = branchData as { tree?: Array<{ path: string; type: string; size?: number }>; error?: string };
            if (typedBranchData.tree && !typedBranchData.error) {
              const fileStructure = convertTreeToFileStructure(typedBranchData.tree);
              console.log(`Setting file structure for branch ${branchName}:`, fileStructure);
              
              // Set in both places to ensure compatibility
              setFileStructure(branchName, fileStructure);
              setBranchFileStructures(prev => ({
                ...prev,
                [branchName]: fileStructure
              }));
            }
          });
        })
        .catch(err => {
          console.error('Failed to fetch branches with trees:', err);
          setError('sessions', undefined, 'Failed to load repository structure');
          
          // Fallback: fetch branches first, then individual trees
          githubAPI.getRepositoryBranches(repository.owner.login, repository.name)
            .then(branches => {
              console.log('Fetched branches (fallback):', branches);
              setSelectedBranches(branches.map((b: { name: string }) => b.name));
              
              // Fetch tree for each branch individually
              branches.forEach(async (branch: { name: string }) => {
                try {
                  const tree = await githubAPI.getRepositoryTree(repository.owner.login, repository.name, branch.name);
                  console.log(`Fetched tree for branch ${branch.name}:`, tree);
                  
                  const fileStructure = convertTreeToFileStructure(tree);
                  setFileStructure(branch.name, fileStructure);
                  setBranchFileStructures(prev => ({
                    ...prev,
                    [branch.name]: fileStructure
                  }));
                } catch (treeErr) {
                  console.error(`Failed to fetch tree for branch ${branch.name}:`, treeErr);
                }
              });
            })
            .catch(branchErr => {
              console.error('Failed to fetch branches (fallback):', branchErr);
              setError('sessions', undefined, 'Failed to load branches');
            });
        })
        .finally(() => setLoadingState('sessions', undefined, false));
    }
  }, [repository, token, setLoadingState, setFileStructure, setError]);
  
  // Get filtered file structure for a branch
  const getFilteredStructure = (branch: string): FileSystemItem[] => {
    // Try to get structure from local state first, then from context
    const structure = branchFileStructures[branch] || state.fileStructures[branch] || [];
    
    console.log(`Getting filtered structure for branch ${branch}:`, structure);
    
    if (!searchQuery.trim() && !showOnlySelected) {
      return structure;
    }
    
    const filterItems = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.filter(item => {
        const matchesSearch = !searchQuery.trim() || 
          item.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesSelection = !showOnlySelected || 
          (item.type === 'file' && selectedFiles.some(f => 
            f.branch === branch && f.path === item.path
          )) ||
          (item.type === 'folder' && item.children && 
           item.children.some(child => 
             selectedFiles.some(f => f.branch === branch && f.path === child.path)
           ));
        
        if (item.type === 'folder' && item.children) {
          const filteredChildren = filterItems(item.children);
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
        }
        
        return matchesSearch && matchesSelection;
      });
    };
    
    return filterItems(structure);
  };

  // Helper function to convert GitHub tree to file structure
  const convertTreeToFileStructure = (treeData: Array<{ path: string; type: string; size?: number }>): FileSystemItem[] => {
    const structure: FileSystemItem[] = [];
    const folderMap = new Map<string, FileSystemItem>();

    if (!treeData || !Array.isArray(treeData)) {
      return structure;
    }

    treeData.forEach((item) => {
      const pathParts = item.path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      if (item.type === 'tree') {
        const folderItem: FileSystemItem = {
          name: fileName,
          type: 'folder',
          expanded: false,
          selected: false,
          children: []
        };
        
        if (pathParts.length === 1) {
          structure.push(folderItem);
        } else {
          const parentPath = pathParts.slice(0, -1).join('/');
          if (!folderMap.has(parentPath)) {
            folderMap.set(parentPath, { name: '', type: 'folder', children: [] });
          }
          folderMap.get(parentPath)!.children!.push(folderItem);
        }
        folderMap.set(item.path, folderItem);
      } else {
        const fileItem: FileSystemItem = {
          name: fileName,
          type: 'file',
          selected: false,
          size: item.size || 0,
          path: item.path
        };
        
        if (pathParts.length === 1) {
          structure.push(fileItem);
        } else {
          const parentPath = pathParts.slice(0, -1).join('/');
          if (!folderMap.has(parentPath)) {
            folderMap.set(parentPath, { name: '', type: 'folder', children: [] });
          }
          folderMap.get(parentPath)!.children!.push(fileItem);
        }
      }
    });

    return structure;
  };
  

  
  // Folder expansion handler
  const handleFolderToggle = useCallback((item: FileSystemItem, path: string[]) => {
    if (item.type !== 'folder') return;
    
    const branch = selectedBranches[0] || 'main';
    const currentStructure = branchFileStructures[branch] || [];
    
    // Update the structure to toggle the folder's expanded state
    const updateStructure = (items: FileSystemItem[], currentPath: string[], index: number): FileSystemItem[] => {
      return items.map(currentItem => {
        if (currentItem.name === currentPath[index]) {
          if (index === currentPath.length - 1) {
            // This is the target item
            return { ...currentItem, expanded: !currentItem.expanded };
          } else if (currentItem.children) {
            // Keep traversing the path
            return {
              ...currentItem,
              children: updateStructure(currentItem.children, currentPath, index + 1)
            };
          }
        }
        return currentItem;
      });
    };
    
    const newStructure = updateStructure(currentStructure, path, 0);
    setBranchFileStructures(prev => ({
      ...prev,
      [branch]: newStructure
    }));
  }, [selectedBranches, branchFileStructures]);

  // File and folder selection handler
  const handleFileSelect = useCallback(async (item: FileSystemItem, path: string[]) => {
    const branch = selectedBranches[0] || 'main';
    
    if (item.type === 'file') {
      const filePath = path.join('/');
      
      // Check if file is already selected
      const isSelected = selectedFiles.some(f => f.branch === branch && f.path === filePath);
      
      if (isSelected) {
        // Remove file
        removeSelectedFile(branch, filePath);
      } else {
        // Add file with loading state first
        addSelectedFile({ branch, path: filePath, content: 'Loading...' });
        
        // Then fetch the actual content
        try {
          await fetchFileContent(branch, filePath);
        } catch (error) {
          console.error(`Failed to fetch content for ${filePath}:`, error);
          // Update the file with error content using the current state
          const errorFiles = selectedFiles.map(file => 
            file.branch === branch && file.path === filePath 
              ? { ...file, content: 'Error: Failed to load file content' }
              : file
          );
          setSelectedFiles(errorFiles);
        }
      }
    } else if (item.type === 'folder') {
      // Handle folder selection - select all files in the folder recursively
      const selectFilesInFolder = (folderItem: FileSystemItem, folderPath: string[]): string[] => {
        const filePaths: string[] = [];
        
        if (folderItem.children) {
          folderItem.children.forEach(child => {
            const childPath = [...folderPath, child.name];
            if (child.type === 'file') {
              filePaths.push(childPath.join('/'));
            } else if (child.type === 'folder') {
              filePaths.push(...selectFilesInFolder(child, childPath));
            }
          });
        }
        
        return filePaths;
      };
      
      const filePaths = selectFilesInFolder(item, path);
      
      // Add all files in the folder to selected files
      for (const filePath of filePaths) {
        const isAlreadySelected = selectedFiles.some(f => f.branch === branch && f.path === filePath);
        if (!isAlreadySelected) {
          addSelectedFile({ branch, path: filePath, content: 'Loading...' });
          try {
            await fetchFileContent(branch, filePath);
          } catch (error) {
            console.error(`Failed to fetch content for ${filePath}:`, error);
          }
        }
      }
    }
  }, [selectedBranches, selectedFiles, removeSelectedFile, addSelectedFile, fetchFileContent, setSelectedFiles]);

  // Utility function to expand all folders
  const expandAllFolders = useCallback((branch: string) => {
    const currentStructure = branchFileStructures[branch] || [];
    
    const expandItems = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map(item => {
        if (item.type === 'folder' && item.children) {
          return {
            ...item,
            expanded: true,
            children: expandItems(item.children)
          };
        }
        return item;
      });
    };
    
    const newStructure = expandItems(currentStructure);
    setBranchFileStructures(prev => ({
      ...prev,
      [branch]: newStructure
    }));
  }, [branchFileStructures]);

  // Utility function to collapse all folders
  const collapseAllFolders = useCallback((branch: string) => {
    const currentStructure = branchFileStructures[branch] || [];
    
    const collapseItems = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map(item => {
        if (item.type === 'folder' && item.children) {
          return {
            ...item,
            expanded: false,
            children: collapseItems(item.children)
          };
        }
        return item;
      });
    };
    
    const newStructure = collapseItems(currentStructure);
    setBranchFileStructures(prev => ({
      ...prev,
      [branch]: newStructure
    }));
  }, [branchFileStructures]);

  // Utility function to select all files in a branch
  const selectAllFiles = useCallback(async (branch: string) => {
    const currentStructure = branchFileStructures[branch] || [];
    
    const getAllFilePaths = (items: FileSystemItem[], currentPath: string[] = []): string[] => {
      const filePaths: string[] = [];
      
      items.forEach(item => {
        const itemPath = [...currentPath, item.name];
        if (item.type === 'file') {
          filePaths.push(itemPath.join('/'));
        } else if (item.type === 'folder' && item.children) {
          filePaths.push(...getAllFilePaths(item.children, itemPath));
        }
      });
      
      return filePaths;
    };
    
    const allFilePaths = getAllFilePaths(currentStructure);
    
    // Add all files to selected files
    for (const filePath of allFilePaths) {
      const isAlreadySelected = selectedFiles.some(f => f.branch === branch && f.path === filePath);
      if (!isAlreadySelected) {
        addSelectedFile({ branch, path: filePath, content: 'Loading...' });
        try {
          await fetchFileContent(branch, filePath);
        } catch (error) {
          console.error(`Failed to fetch content for ${filePath}:`, error);
        }
      }
    }
  }, [branchFileStructures, selectedFiles, addSelectedFile, fetchFileContent]);
  
  // Chat handlers
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !activeSession) return;
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userMessage = {
      type: 'user' as const,
      content: inputMessage,
      files: selectedFiles.map(f => f.path)
    };
    addMessage(activeSession.id, userMessage);
    setInputMessage('');
    setLoadingState('chat', undefined, true);
    
    // Set message status to sending
    setMessageStatuses(prev => ({ ...prev, [messageId]: 'sending' }));
    
    try {
      // Use the sendMessage function from context
      await sendMessage(activeSession.id, inputMessage);
      
      // Update message status to sent
      setMessageStatuses(prev => ({ ...prev, [messageId]: 'sent' }));
      
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
      setError('chat', undefined, 'Failed to send message');
      
      // Update message status to failed
      setMessageStatuses(prev => ({ ...prev, [messageId]: 'failed' }));
    } finally {
      setLoadingState('chat', undefined, false);
    }
  };
  
  // Enhanced import handler with seamless transition to chat
  const handleImportAndChat = async (importData: any, importType: string) => {
    setImportProgress({
      isImporting: true,
      progress: 0,
      message: `Importing ${importType}...`,
      importedFiles: 0,
      totalFiles: 1
    });
    
    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Process the import
      if (importType === 'text' && importData.title && importData.content) {
        const fileData = {
          branch: 'local',
          path: `${importData.title}.txt`,
          content: importData.content
        };
        
        addSelectedFile(fileData);
        
        setImportProgress({
          isImporting: false,
          progress: 100,
          message: 'Import completed!',
          importedFiles: 1,
          totalFiles: 1
        });
        
        setShowImportSuccess(true);
        setTimeout(() => setShowImportSuccess(false), 3000);
        
        // Auto-generate a chat message about the imported content
        const autoMessage = `I've imported "${importData.title}". Can you help me understand this content?`;
        setInputMessage(autoMessage);
        
        // Show welcome message if this is the first import
        if (!hasShownWelcome) {
          setHasShownWelcome(true);
          toast.success('Welcome! Your content is ready for chat. Try asking questions about your imported files.');
        }
        
        toast.success('Content imported and ready for chat!');
      }
      
      // Close import panel
      setShowImportPanel(false);
      setSelectedImportSource(null);
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import content. Please try again.');
      setImportProgress({
        isImporting: false,
        progress: 0,
        message: 'Import failed',
        importedFiles: 0,
        totalFiles: 0
      });
    }
  };
  
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  

  
  const clearAllSelections = () => {
    setSelectedFiles([]);
  };
  
  const selectByType = (fileType: string) => {
    // Implementation for selecting files by type
  };
  

  
  return (
    <div className="w-full h-screen flex bg-background">
      {/* Unified File & Import Sidebar */}
      <div className={cn(
        "border-r border-border bg-card/50 transition-all duration-300",
        isSidebarCollapsed ? "w-16" : "w-72"
      )}>
        {!isSidebarCollapsed && (
          <div className="p-3 space-y-3 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Files & Import</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportPanel(!showImportPanel)}
                  className={cn(
                    "p-1 rounded-md transition-colors",
                    showImportPanel ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                  title={showImportPanel ? "Hide Import" : "Show Import"}
                >
                  <Upload size={16} />
                </button>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1 rounded-md hover:bg-muted"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
            
            {/* Import Progress Indicator */}
            {importProgress.isImporting && (
              <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  <span className="text-sm font-medium text-primary">Importing...</span>
                </div>
                <Progress value={importProgress.progress} className="h-2 mb-2" />
                <div className="text-xs text-muted-foreground">
                  {importProgress.message}
                  {importProgress.totalFiles > 0 && (
                    <span className="ml-2">
                      ({importProgress.importedFiles}/{importProgress.totalFiles} files)
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Import Success Message */}
            {showImportSuccess && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-green-600" />
                  <span className="text-sm font-medium text-green-800">Import Successful!</span>
                  <button
                    onClick={() => setShowImportSuccess(false)}
                    className="ml-auto p-1 rounded hover:bg-green-100"
                  >
                    <X size={12} className="text-green-600" />
                  </button>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Files have been added to your context and are ready for chat.
                </p>
              </div>
            )}
            
            {/* Import Panel */}
            {showImportPanel && <ImportPanel />}
            
            {/* Search and filters */}
            <div className="space-y-1">
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  className="w-full pl-6 pr-2 py-1 rounded-lg border border-border bg-card/50 text-xs"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-1">
                <button 
                  className={cn(
                    "px-1.5 py-0.5 text-xs rounded border border-border flex items-center gap-1",
                    showOnlySelected ? "bg-primary/10 border-primary" : "bg-card/50"
                  )}
                  onClick={() => setShowOnlySelected(!showOnlySelected)}
                >
                  <FilterIcon size={10} />
                  <span>Selected</span>
                </button>
                
                <button 
                  className="px-1.5 py-0.5 text-xs rounded border border-border bg-card/50 flex items-center gap-1"
                  onClick={() => {
                    setSearchQuery('');
                    setShowOnlySelected(false);
                  }}
                >
                  <RefreshCw size={10} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
            
            {/* File selection controls */}
            <div className="flex flex-wrap gap-1">
              <button 
                className="px-1.5 py-0.5 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                onClick={() => selectedBranches.forEach(branch => selectAllFiles(branch))}
              >
                Select All
              </button>
              <button 
                className="px-1.5 py-0.5 text-xs rounded bg-muted hover:bg-muted/80 transition-colors"
                onClick={clearAllSelections}
                disabled={selectedFiles.length === 0}
              >
                Clear
              </button>
              <button 
                className="px-1.5 py-0.5 text-xs rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                onClick={() => selectedBranches.forEach(branch => expandAllFolders(branch))}
              >
                Expand All
              </button>
              <button 
                className="px-1.5 py-0.5 text-xs rounded bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors"
                onClick={() => selectedBranches.forEach(branch => collapseAllFolders(branch))}
              >
                Collapse All
              </button>
              <button 
                className="px-1.5 py-0.5 text-xs rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                onClick={() => {
                  if (repository?.owner?.login && repository?.name) {
                    setLoadingState('sessions', undefined, true);
                    githubAPI.getBranchesWithTrees(repository.owner.login, repository.name)
                      .then(data => {
                        console.log('Manual refresh - fetched repository data:', data);
                        setSelectedBranches(data.branches.map((b: { name: string }) => b.name));
                        
                        Object.entries(data.treesByBranch).forEach(([branchName, branchData]) => {
                          const typedBranchData = branchData as { tree?: Array<{ path: string; type: string; size?: number }>; error?: string };
                          if (typedBranchData.tree && !typedBranchData.error) {
                            const fileStructure = convertTreeToFileStructure(typedBranchData.tree);
                            console.log(`Manual refresh - setting file structure for branch ${branchName}:`, fileStructure);
                            
                            setFileStructure(branchName, fileStructure);
                            setBranchFileStructures(prev => ({
                              ...prev,
                              [branchName]: fileStructure
                            }));
                          }
                        });
                      })
                      .catch(err => {
                        console.error('Manual refresh failed:', err);
                        setError('sessions', undefined, 'Failed to refresh repository');
                      })
                      .finally(() => setLoadingState('sessions', undefined, false));
                  }
                }}
                disabled={state.loadingStates.sessions}
              >
                {state.loadingStates.sessions ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {/* Selected files summary */}
            {selectedFiles.length > 0 && (
              <div className="p-2 bg-primary/5 rounded-lg flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Selected Files</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedFiles.length}
                  </Badge>
                </div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      {getFileIcon(file.path.split('/').pop() || '')}
                      <span className="truncate">{file.path}</span>

                      <button
                        onClick={() => removeSelectedFile(file.branch, file.path)}
                        className="ml-auto text-red-500 hover:text-red-700"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            

            
            {/* File tree */}
            <div className="border border-border rounded-lg flex-1 overflow-y-auto bg-card/30 min-h-0">
              {selectedBranches.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-xs mb-2">No branches loaded</p>
                  <p className="text-xs">Repository: {repository?.owner?.login}/{repository?.name || 'Unknown'}</p>
                  <p className="text-xs">Token: {token ? 'Available' : 'Missing'}</p>
                </div>
              ) : (
                selectedBranches.map(branch => (
                  <div key={branch} className="p-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GitBranch size={12} className="text-primary" />
                      <span className="text-xs font-medium capitalize">{branch}</span>
                    </div>
                    
                    {state.loadingStates.sessions ? (
                      <div className="p-2 text-center text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin mx-auto mb-1" />
                        <p className="text-xs">Loading files...</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {(() => {
                          const structure = getFilteredStructure(branch);
                          console.log(`Rendering structure for branch ${branch}:`, structure);
                          return structure.map((item, index) => {
                            const contentKey = getFileCacheKey(branch, item.path || '');
                            const cachedContent = getCachedFileContent(contentKey);
                            return (
                              <FileSystemNode
                                key={`${item.name}-${index}`}
                                item={item}
                                level={0}
                                onToggle={handleFolderToggle}
                                onSelect={handleFileSelect}
                                path={[item.name]}
                                branch={branch}
                                onFileSelect={fetchFileContent}
                                fileContent={cachedContent?.content || ''}
                                isLoadingContent={state.loadingStates.files[contentKey] || false}
                                selectedFiles={selectedFiles}
                              />
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Collapsed sidebar */}
        {isSidebarCollapsed && (
          <div className="p-2">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="w-full p-2 rounded-lg hover:bg-muted flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat Header */}
        <div className="border-b border-border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h2 className="font-medium">Chat with Files</h2>
                {activeSession && (
                  <Badge variant="outline" className="text-xs">
                    {activeSession.title}
                  </Badge>
                )}
              </div>
              {selectedFiles.length > 0 && (
                <Badge variant="secondary">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSessionManager(true)}
                className="flex items-center gap-2"
              >
                <List size={16} />
                <span className="hidden sm:inline">Sessions</span>
              </Button>
              {!isSidebarCollapsed && (
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-2 rounded-lg hover:bg-muted"
                >
                  <Maximize2 size={16} />
                </button>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <SettingsIcon size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-2 max-w-md">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-medium mb-1">Start Chatting with Your Files</h3>
                  <p className="text-xs text-muted-foreground">
                    Import files or select from your repository to start chatting. 
                    Beetle AI will analyze the selected files and provide context-aware responses.
                  </p>
                </div>
                
                {selectedFiles.length === 0 && (
                  <div className="p-2 bg-muted/50 rounded-lg space-y-1">
                    <p className="text-xs text-muted-foreground">
                      No files selected. You can:
                    </p>
                    <div className="space-y-1 text-left">
                      <button
                        onClick={() => setShowImportPanel(true)}
                        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors w-full text-left"
                      >
                        <Upload size={12} />
                        <span>Click here to import files</span>
                      </button>
                      <button
                        onClick={() => setSelectedImportSource('text')}
                        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors w-full text-left"
                      >
                        <Type size={12} />
                        <span>Add text content directly</span>
                      </button>
                      <button
                        onClick={() => setSelectedImportSource('branch')}
                        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors w-full text-left"
                      >
                        <GitBranch size={12} />
                        <span>Import from GitHub branches</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  onCopy={handleCopyMessage}
                />
              ))}
              
              {isLoading && (
                <div className="flex gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <BotIcon size={16} />
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">Beetle AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t border-border p-3">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedFiles.length > 0 ? "Ask about your files..." : "Import files to start chatting..."}
                className="w-full p-2 pr-10 rounded-lg border border-border bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={1}
                style={{
                  minHeight: '36px',
                  maxHeight: '80px'
                }}
              />
              
              {selectedFiles.length > 0 && (
                <div className="absolute top-1 right-1">
                  <Badge variant="secondary" className="text-xs">
                    {selectedFiles.length} files
                  </Badge>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || selectedFiles.length === 0}
              className="px-3 py-2"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
          
                      {/* Context Status and Quick Actions */}
            <div className="mt-1 flex items-center justify-between">
            {selectedFiles.length > 0 ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText size={12} />
                  <span>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} in context</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle size={12} />
                <span>No files in context</span>
              </div>
            )}
            
            {selectedFiles.length === 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportPanel(true)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Import files
                </button>
                <span className="text-xs text-muted-foreground">or</span>
                <button
                  onClick={() => setSelectedImportSource('text')}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Add text
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Context Panel */}
      <div className="w-56 border-l border-border bg-card/30 h-full flex flex-col">
        <div className="p-3 space-y-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Context</h3>
            <Badge variant="secondary" className="text-xs">
              {selectedFiles.length} files
            </Badge>
          </div>
          
                      {/* Context Stats */}
            {selectedFiles.length > 0 && (
              <div className="p-2 bg-muted/30 rounded-lg space-y-1 flex-shrink-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total files:</span>
                  <span className="font-medium">{selectedFiles.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total size:</span>
                  <span className="font-medium">
                    {selectedFiles.reduce((acc, file) => acc + (file.content?.length || 0), 0).toLocaleString()} chars
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Branches:</span>
                  <span className="font-medium">
                    {new Set(selectedFiles.map(f => f.branch)).size}
                  </span>
                </div>
              </div>
            )}
          
                      {selectedFiles.length > 0 ? (
              <div className="space-y-1 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between flex-shrink-0">
                  <div className="text-xs text-muted-foreground">
                    Active files in context:
                  </div>
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-1 flex-1 overflow-y-auto min-h-0">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-1 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors">
                      {getFileIcon(file.path.split('/').pop() || '')}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{file.path}</div>
                        <div className="text-xs text-muted-foreground">
                          Branch: {file.branch} • {(file.content?.length || 0).toLocaleString()} chars
                        </div>
                      </div>
                      <button
                        onClick={() => removeSelectedFile(file.branch, file.path)}
                        className="p-1 rounded hover:bg-muted text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              
              {/* Quick Actions */}
              <div className="pt-1 border-t border-border space-y-1 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Generate a summary of all files
                    const summary = selectedFiles.map(f => `${f.path} (${f.branch})`).join(', ');
                    setInputMessage(`Please provide a summary of these files: ${summary}`);
                  }}
                  className="w-full text-xs h-7"
                >
                  <MessageSquare size={10} className="mr-1" />
                  Ask about all files
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Generate a comparison
                    const branches = [...new Set(selectedFiles.map(f => f.branch))];
                    if (branches.length > 1) {
                      setInputMessage(`Please compare the differences between these branches: ${branches.join(', ')}`);
                    }
                  }}
                  disabled={new Set(selectedFiles.map(f => f.branch)).size <= 1}
                  className="w-full text-xs h-7"
                >
                  <GitBranch size={10} className="mr-1" />
                  Compare branches
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-muted-foreground flex-1 flex flex-col justify-center">
              <FileText size={20} className="mx-auto mb-1 opacity-50" />
              <p className="text-xs">No files in context</p>
              <p className="text-xs mt-1">Import or select files to add them here</p>
              
              {/* Quick Import Suggestions */}
              <div className="mt-1 space-y-1 flex-shrink-0">
                <button
                  onClick={() => setShowImportPanel(true)}
                  className="w-full px-2 py-1 text-xs rounded border border-border hover:bg-muted transition-colors"
                >
                  <Upload size={10} className="mr-1" />
                  Import files
                </button>
                <button
                  onClick={() => setSelectedImportSource('text')}
                  className="w-full px-2 py-1 text-xs rounded border border-border hover:bg-muted transition-colors"
                >
                  <Type size={10} className="mr-1" />
                  Add text content
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Session Manager Modal */}
      <ChatSessionManager 
        isOpen={showSessionManager}
        onClose={() => setShowSessionManager(false)}
      />
    </div>
  );
};

export default FileChatInterface;
