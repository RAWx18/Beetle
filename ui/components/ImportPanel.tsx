"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { useKnowledgeBase } from '@/contexts/KnowledgeBaseContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  PlusCircle
} from 'lucide-react';
import { transformGitHubData, fallbackContributionData } from './manage/contribution-data';
import GitHubAPI from '@/lib/github-api';
import AnimatedTransition from './AnimatedTransition';
import { ImportSource } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

// Real contribution data will be fetched and transformed
let contributionData = fallbackContributionData;

interface ImportSourceCardProps {
  source: ImportSource;
  onClick: () => void;
  isActive: boolean;
}

// Get file type icon based on extension
const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'ts':
    case 'tsx':
      return <Code2 size={16} className="mr-1.5 text-blue-500" />;
    case 'js':
    case 'jsx':
      return <Code2 size={16} className="mr-1.5 text-yellow-500" />;
    case 'json':
      return <Code2 size={16} className="mr-1.5 text-green-500" />;
    case 'md':
      return <FileText size={16} className="mr-1.5 text-purple-500" />;
    case 'css':
    case 'scss':
      return <FileText size={16} className="mr-1.5 text-pink-500" />;
    case 'html':
      return <FileText size={16} className="mr-1.5 text-orange-500" />;
    case 'py':
      return <Code2 size={16} className="mr-1.5 text-blue-600" />;
    case 'java':
      return <Code2 size={16} className="mr-1.5 text-red-500" />;
    case 'cpp':
    case 'c':
      return <Code2 size={16} className="mr-1.5 text-blue-700" />;
    default:
      return <File size={16} className="mr-1.5 text-blue-500" />;
  }
};

const ImportSourceCard: React.FC<ImportSourceCardProps> = ({ source, onClick, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getIcon = () => {
    switch (source.icon) {
      case 'FileText': return <FileText size={24} />;
      case 'Database': return <Database size={24} />;
      case 'Globe': return <Globe size={24} />;
      case 'Upload': return <Upload size={24} />;
      case 'Type': return <Type size={24} />;
      case 'GitBranch': return <GitBranch size={24} />;
      default: return <FileText size={24} />;
    }
  };
  
  return (
    <div 
      className={cn(
        "glass-panel p-4 rounded-xl cursor-pointer transition-all duration-300",
        isActive ? "ring-2 ring-primary" : "",
        isHovered ? "translate-y-[-4px] shadow-md" : ""
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          {getIcon()}
        </div>
        <div>
          <h3 className="font-medium">{source.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {source.description}
          </p>
        </div>
      </div>
    </div>
  );
};

interface BranchCardProps {
  branch: string;
  isContextBranch: boolean;
  isSelected: boolean;
  onSelect: (branch: string) => void;
  branchInfo: {
    name: string;
    color: string;
    description: string;
    maintainer: string;
    githubUrl: string;
  };
}

const BranchCard: React.FC<BranchCardProps> = ({ 
  branch, 
  isContextBranch, 
  isSelected, 
  onSelect,
  branchInfo
}) => {
  return (
    <div
      className={cn(
        "p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors",
        isContextBranch && "border-primary/40 bg-primary/5",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={() => onSelect(branch)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${branchInfo.color}`}>
          <GitBranch size={20} />
        </div>
        <div>
          <h4 className="font-medium capitalize">{branchInfo.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isContextBranch ? "Current Branch" : ""}
            {isSelected && (isContextBranch ? " • " : "") + "Selected"}
          </p>
        </div>
        {isSelected && (
          <div className="ml-auto">
            <Check size={16} className="text-primary" />
          </div>
        )}
      </div>
    </div>
  );
};

interface FileSystemNodeProps {
  item: any;
  level: number;
  onToggle: (item: any, path: string[]) => void;
  onSelect: (item: any, path: string[]) => void;
  path: string[];
  branch: string;
  onFileSelect?: (branch: string, filePath: string, content: string) => void;
  fileContent?: string;
  isLoadingContent?: boolean;
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
  isLoadingContent
}) => {
  const isFolder = item.type === 'folder';
  
  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center py-1.5 px-2 rounded-md hover:bg-primary/10 cursor-pointer transition-colors",
          item.selected && "bg-primary/20"
        )}
        style={{ paddingLeft: `${(level * 12) + 8}px` }}
      >
        {/* Selection checkbox for both files and folders */}
        <div 
          className="mr-1.5 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item, path);
          }}
        >
          {item.selected ? 
            <CheckSquare size={16} className="text-primary" /> : 
            <Square size={16} className="text-muted-foreground" />
          }
        </div>
        
        {/* Expand/collapse control for folders */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (isFolder) onToggle(item, path);
          }}
          className={cn(
            "mr-1.5 w-4 h-4 flex items-center justify-center",
            isFolder ? "cursor-pointer" : "opacity-0"
          )}
        >
          {isFolder && (
            item.expanded ? 
              <ChevronDown size={16} className="text-primary" /> : 
              <ChevronRight size={16} className="text-muted-foreground" />
          )}
        </div>
        
        {/* Icon and name - clicking on name also toggles folder or selects file */}
        <div 
          className="flex items-center flex-grow"
          onClick={() => {
            if (isFolder) {
              onToggle(item, path);
            } else {
              // For files, fetch content and show preview
              const filePath = path.join('/');
              if (onFileSelect) {
                onFileSelect(branch, filePath, '');
              }
              onSelect(item, path);
            }
          }}
        >
          {isFolder ? 
            <Folder size={16} className="mr-1.5 text-amber-500" /> : 
            getFileIcon(item.name)
          }
          
          <span className="text-sm truncate">{item.name}</span>
          {!isFolder && (
            <div className="flex items-center gap-1 ml-auto">
              {isLoadingContent && (
                <Loader2 size={12} className="animate-spin text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {item.size ? `${(item.size / 1024).toFixed(1)}KB` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Children for expanded folders */}
      {isFolder && item.expanded && item.children && (
        <div className="animate-fadeIn">
          {item.children.map((child: any, index: number) => (
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface BranchContentProps {
  branch: string;
  fileStructure: any;
  setFileStructure: React.Dispatch<React.SetStateAction<any>>;
  onRemove: () => void;
  branchInfo: {
    name: string;
    color: string;
  };
  loadingBranches: boolean;
  selectedFileContents: Array<{branch: string, path: string, content: string}>;
  setSelectedFileContents: React.Dispatch<React.SetStateAction<Array<{branch: string, path: string, content: string}>>>;
  onFileSelect: (branch: string, filePath: string, content: string) => void;
  fileContents: Record<string, string>;
  loadingFileContent: Record<string, boolean>;
}

const BranchContent: React.FC<BranchContentProps> = ({ 
  branch, 
  fileStructure, 
  setFileStructure,
  onRemove,
  branchInfo,
  loadingBranches,
  selectedFileContents,
  setSelectedFileContents,
  onFileSelect,
  fileContents,
  loadingFileContent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStructure, setFilteredStructure] = useState<any>(null);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update filtered structure when search query changes
  useEffect(() => {
    if (!searchQuery.trim() && !showOnlySelected) {
      setFilteredStructure(null);
      return;
    }
    
    const filterStructure = (items: any[], query: string, showSelected: boolean): any[] => {
      return items.filter(item => {
        const matchesQuery = !query || item.name.toLowerCase().includes(query.toLowerCase());
        const matchesSelected = !showSelected || item.selected;
        
        // For folders, check if any children match
        if (item.children) {
          const filteredChildren = filterStructure(item.children, query, showSelected);
          if (filteredChildren.length > 0) {
            return {
              ...item,
              expanded: true, // Auto-expand folders with matches
              children: filteredChildren
            };
          }
        }
        
        return matchesQuery && matchesSelected;
      });
    };
    
    const filtered = filterStructure(
      JSON.parse(JSON.stringify(fileStructure[branch])), 
      searchQuery, 
      showOnlySelected
    );
    
    setFilteredStructure(filtered);
  }, [searchQuery, showOnlySelected, branch, fileStructure]);

  // Function to toggle folder expansion
  const toggleFolder = (item: any, path: string[]) => {
    if (path.length === 0) return;
    
    const updateStructure = (items: any[], currentPath: string[], index: number): any[] => {
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
    
    const newStructure = { ...fileStructure };
    newStructure[branch] = updateStructure(fileStructure[branch], path, 0);
    setFileStructure(newStructure);
  };
  
  // Function to handle selection of files/folders
  const toggleNodeSelection = (item: any, path: string[]) => {
    if (path.length === 0) return;
    
    const updateStructure = (items: any[], currentPath: string[], index: number): any[] => {
      return items.map(currentItem => {
        if (currentItem.name === currentPath[index]) {
          if (index === currentPath.length - 1) {
            // This is the target item
            const newState = !currentItem.selected;
            
            // If it's a folder, also update all children
            if (currentItem.type === 'folder' && currentItem.children) {
              return {
                ...currentItem,
                selected: newState,
                children: updateChildrenSelection(currentItem.children, newState)
              };
            }
            
            return { ...currentItem, selected: newState };
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
    
    const updateChildrenSelection = (items: any[], selected: boolean): any[] => {
      return items.map(item => {
        if (item.type === 'folder' && item.children) {
          return {
            ...item,
            selected,
            children: updateChildrenSelection(item.children, selected)
          };
        }
        return { ...item, selected };
      });
    };
    
    const newStructure = { ...fileStructure };
    newStructure[branch] = updateStructure(fileStructure[branch], path, 0);
    setFileStructure(newStructure);
  };

  // Function to handle folder toggle in the UI
  const handleFolderToggle = (item: any, path: string[]) => {
    if (item.type === 'folder') {
      toggleFolder(item, path);
    }
  };
  
  // Function to handle file/folder selection in the UI
  const handleNodeSelect = (item: any, path: string[]) => {
    toggleNodeSelection(item, path);
  };

  // Count selected files and folders
  const countSelectedItems = (structure: any[]): { files: number, folders: number } => {
    let files = 0;
    let folders = 0;
    
    if (!structure || !Array.isArray(structure)) {
      return { files, folders };
    }
    
    const traverse = (items: any[]) => {
      if (!items || !Array.isArray(items)) {
        return;
      }
      
      items.forEach(item => {
        if (item.selected) {
          if (item.type === 'folder') {
            folders++;
          } else {
            files++;
          }
        }
        
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    
    traverse(structure);
    return { files, folders };
  };

  // Get the count of selected files and folders
  const getSelectedCounts = () => {
    const structure = fileStructure[branch] || [];
    return countSelectedItems(structure);
  };

  // Select all files and folders
  const selectAll = () => {
    const toggleAllSelections = (items: any[]): any[] => {
      return items.map(item => {
        if (item.children) {
          return {
            ...item,
            selected: true,
            children: toggleAllSelections(item.children)
          };
        }
        return { ...item, selected: true };
      });
    };
    
    const newStructure = { ...fileStructure };
    newStructure[branch] = toggleAllSelections(fileStructure[branch]);
    setFileStructure(newStructure);
  };
  
  // Clear all selections
  const clearSelections = () => {
    const clearAllSelections = (items: any[]): any[] => {
      return items.map(item => {
        if (item.children) {
          return {
            ...item,
            selected: false,
            children: clearAllSelections(item.children)
          };
        }
        return { ...item, selected: false };
      });
    };
    
    const newStructure = { ...fileStructure };
    newStructure[branch] = clearAllSelections(fileStructure[branch]);
    setFileStructure(newStructure);
  };
  
  // Expand all folders
  const expandAll = () => {
    const expandAllFolders = (items: any[]): any[] => {
      return items.map(item => {
        if (item.type === 'folder' && item.children) {
          return {
            ...item,
            expanded: true,
            children: expandAllFolders(item.children)
          };
        }
        return item;
      });
    };
    
    const newStructure = { ...fileStructure };
    newStructure[branch] = expandAllFolders(fileStructure[branch]);
    setFileStructure(newStructure);
  };
  
  // Collapse all folders
  const collapseAll = () => {
    const collapseAllFolders = (items: any[]): any[] => {
      return items.map(item => {
        if (item.type === 'folder' && item.children) {
          return {
            ...item,
            expanded: false,
            children: collapseAllFolders(item.children)
          };
        }
        return item;
      });
    };
    
    const newStructure = { ...fileStructure };
    newStructure[branch] = collapseAllFolders(fileStructure[branch]);
    setFileStructure(newStructure);
  };

  // Selected items summary
  const { files: selectedFiles, folders: selectedFolders } = getSelectedCounts();
  const hasSelections = selectedFiles > 0 || selectedFolders > 0;

  if (isCollapsed) {
    return (
      <div className="border border-border rounded-lg mb-4 overflow-hidden">
        <div className="flex items-center justify-between p-3 bg-card/50">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${branchInfo.color}`}>
              <GitBranch size={14} />
            </div>
            <h4 className="font-medium capitalize">{branchInfo.name}</h4>
            {hasSelections && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {selectedFiles + selectedFolders} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="p-1 rounded-md hover:bg-muted/50"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronDown size={16} />
            </button>
            <button 
              className="p-1 rounded-md hover:bg-muted/50 text-red-500"
              onClick={onRemove}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg mb-4 overflow-hidden">
      {/* Branch header */}
      <div className="flex items-center justify-between p-3 bg-card/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${branchInfo.color}`}>
            <GitBranch size={14} />
          </div>
          <h4 className="font-medium capitalize">{branchInfo.name}</h4>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="p-1 rounded-md hover:bg-muted/50"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronUp size={16} />
          </button>
          <button 
            className="p-1 rounded-md hover:bg-muted/50 text-red-500"
            onClick={onRemove}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-3">
        {/* Search and filter controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-grow">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card/50 text-sm"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                onClick={() => setSearchQuery('')}
              >
                <X size={12} />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              className={cn(
                "px-2 py-1.5 text-xs rounded-lg border border-border flex items-center gap-1",
                showOnlySelected ? "bg-primary/10 border-primary" : "bg-card/50"
              )}
              onClick={() => setShowOnlySelected(!showOnlySelected)}
            >
              <Filter size={12} />
              <span>Selected</span>
            </button>
            
            <button 
              className="px-2 py-1.5 text-xs rounded-lg border border-border bg-card/50 flex items-center gap-1"
              onClick={() => {
                setSearchQuery('');
                setShowOnlySelected(false);
              }}
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>
        
        {/* Selection controls */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button 
            className="px-2 py-1 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            onClick={selectAll}
          >
            Select All
          </button>
          <button 
            className="px-2 py-1 text-xs rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            onClick={clearSelections}
            disabled={!hasSelections}
          >
            Clear
          </button>
          <button 
            className="px-2 py-1 text-xs rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            onClick={expandAll}
          >
            Expand All
          </button>
          <button 
            className="px-2 py-1 text-xs rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            onClick={collapseAll}
          >
            Collapse All
          </button>
        </div>
        
        {/* File tree */}
        <div className="border border-border rounded-lg max-h-[250px] overflow-y-auto bg-card/30">
          {(() => {
            const structure = filteredStructure || fileStructure[branch] || [];
            
            // Show loading state if structure is empty and we're loading
            if (structure.length === 0 && loadingBranches) {
              return (
                <div className="p-4 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  <p>Loading file structure...</p>
                </div>
              );
            }
            
            return structure.length > 0 ? (
              <div className="py-1">
                {structure.map((item: any, index: number) => (
                  <FileSystemNode
                    key={`${item.name}-${index}`}
                    item={item}
                    level={0}
                    onToggle={handleFolderToggle}
                    onSelect={handleNodeSelect}
                    path={[item.name]}
                    branch={branch}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? 
                  `No files or folders matching "${searchQuery}"` : 
                  "No files or folders available"
                }
              </div>
            );
          })()}
        </div>
        
        {/* Code Preview Section */}
        {selectedFileContents.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <h4 className="text-sm font-medium mb-3">Selected Files Preview</h4>
            <div className="space-y-3">
              {selectedFileContents.map((file: any, index: number) => {
                const contentKey = `${file.branch}:${file.path}`;
                const isLoading = loadingFileContent[contentKey];
                const content = fileContents[contentKey] || file.content || 'Loading...';
                
                return (
                  <div key={index} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.path)}
                          <span className="text-sm font-medium">{file.path}</span>
                          {isLoading && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Branch: {file.branch}</span>
                          <button 
                            onClick={() => {
                              setSelectedFileContents((prev: any) => prev.filter((_: any, i: number) => i !== index));
                            }}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <pre className="text-xs p-3 bg-background">
                        <code className="whitespace-pre-wrap font-mono">{content}</code>
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Selection summary */}
        <div className="flex items-center justify-between pt-2 text-xs">
          <div className="text-muted-foreground">
            {hasSelections ? (
              <span>
                Selected: {selectedFiles > 0 && `${selectedFiles} file${selectedFiles !== 1 ? 's' : ''}`}
                {selectedFiles > 0 && selectedFolders > 0 && ', '}
                {selectedFolders > 0 && `${selectedFolders} folder${selectedFolders !== 1 ? 's' : ''}`}
              </span>
            ) : (
              <span>No items selected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ImportPanel: React.FC = () => {
  const { selectedBranch, getBranchInfo, branchList: contextBranchList } = useBranch();
  const { repository, setRepository } = useRepository();
  const { token, user } = useAuth();
  const { updateKnowledgeBase } = useKnowledgeBase();
  const githubAPI = new GitHubAPI(token || '');
  const router = useRouter();

  // Branches and file structure
  const [branchList, setBranchList] = useState<string[]>([]);
  const [branchFileStructures, setBranchFileStructures] = useState<Record<string, any[]>>({});
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  
  // Code content states
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [loadingFileContent, setLoadingFileContent] = useState<Record<string, boolean>>({});
  const [selectedFileContents, setSelectedFileContents] = useState<Array<{branch: string, path: string, content: string}>>([]);

  // Control Panel Data
  const [controlPanelData, setControlPanelData] = useState<any>(fallbackContributionData);
  const [controlPanelLoading, setControlPanelLoading] = useState(false);
  const [controlPanelError, setControlPanelError] = useState<string | null>(null);

  // Import states
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Fetch real branches for the selected repo
  useEffect(() => {
    console.log('Repository context:', repository);
    console.log('Token available:', !!token);
    
    if (repository?.owner?.login && repository?.name) {
      console.log('Fetching branches for:', repository.owner.login, repository.name);
      setLoadingBranches(true);
      
      // Use the new comprehensive endpoint to get branches with their file trees
      githubAPI.getBranchesWithTrees(repository.owner.login, repository.name)
        .then(data => {
          console.log('Fetched branches with trees:', data);
          setBranchList(data.branches.map((b: any) => b.name));
          
          // Pre-populate file structures for all branches
          const structures: Record<string, any[]> = {};
          Object.entries(data.treesByBranch).forEach(([branchName, branchData]: [string, any]) => {
            if (branchData.tree && !branchData.error) {
              structures[branchName] = convertTreeToFileStructure(branchData.tree);
            }
          });
          setBranchFileStructures(structures);
        })
        .catch(err => {
          console.error('Failed to fetch branches with trees:', err);
          // Fallback to just fetching branches
          githubAPI.getRepositoryBranches(repository.owner.login, repository.name)
            .then(branches => {
              console.log('Fetched branches (fallback):', branches);
              setBranchList(branches.map((b: any) => b.name));
            })
            .catch(branchErr => {
              console.error('Failed to fetch branches (fallback):', branchErr);
              setBranchError('Failed to fetch branches');
              setBranchList([]);
            });
        })
        .finally(() => setLoadingBranches(false));
    } else {
      console.log('Repository not available, setting default branches');
      // Set some default branches for testing
      setBranchList(['main']);
    }
  }, [repository, token]);

  // Set up demo repository if no repository is set and we're in demo mode
  useEffect(() => {
    if (!repository && token === 'demo-token') {
      console.log('Setting up demo repository for ImportPanel');
      const demoRepository = {
        name: 'beetle-app',
        full_name: 'demo-user/beetle-app',
        description: 'A demo repository for testing Beetle features',
        owner: {
          login: 'demo-user',
          avatar_url: 'https://github.com/github.png',
          type: 'User'
        },
        language: 'TypeScript',
        stargazers_count: 42,
        forks_count: 8,
        html_url: 'https://github.com/demo-user/beetle-app',
        clone_url: 'https://github.com/demo-user/beetle-app.git',
        default_branch: 'main',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        private: false,
        type: 'owned' as const
      };
      setRepository(demoRepository);
    }
  }, [repository, token, setRepository]);

  // Fetch file tree for a branch (updated to use comprehensive endpoint)
  const fetchBranchFileStructure = async (branch: string) => {
    if (!repository?.owner?.login || !repository?.name) return;
    
    // Check if we already have the structure for this branch
    if (branchFileStructures[branch]) {
      console.log(`File structure for branch ${branch} already loaded`);
      return;
    }
    
    setLoadingBranches(true);
    try {
      // Try to get the comprehensive data first
      const data = await githubAPI.getBranchesWithTrees(repository.owner.login, repository.name);
      const branchData = data.treesByBranch[branch];
      
      if (branchData && branchData.tree && !branchData.error) {
        setBranchFileStructures(prev => ({
          ...prev,
          [branch]: convertTreeToFileStructure(branchData.tree)
        }));
      } else {
        // Fallback to individual tree fetch
        const tree = await githubAPI.getRepositoryTree(repository.owner.login, repository.name, branch);
        setBranchFileStructures(prev => ({
          ...prev,
          [branch]: convertTreeToFileStructure(tree)
        }));
      }
    } catch (err) {
      console.error(`Failed to fetch file tree for branch ${branch}:`, err);
      setBranchError(`Failed to fetch file tree for branch ${branch}`);
    }
    setLoadingBranches(false);
  };

  // When a branch is selected, fetch its file tree if not already loaded
  const handleBranchSelect = (branch: string) => {
    console.log('Branch selected:', branch);
    console.log('Current branchFileStructures:', branchFileStructures);
    
    // Check if we already have the file structure for this branch
    if (!branchFileStructures[branch]) {
      console.log(`File structure for branch ${branch} not found, fetching...`);
      fetchBranchFileStructure(branch);
    } else {
      console.log(`File structure for branch ${branch} already available`);
    }
    
    setSelectedBranches(prev => {
      if (prev.includes(branch)) {
        return prev; // Already selected
      } else {
        console.log('Adding branch to selection:', branch);
        return [...prev, branch];
      }
    });
  };

  // Remove a branch from selection
  const handleBranchRemove = (branch: string) => {
    setSelectedBranches(prev => prev.filter(b => b !== branch));
  };

  // Fetch file content
  const fetchFileContent = async (branch: string, filePath: string) => {
    if (!repository?.owner?.login || !repository?.name) return;
    
    const contentKey = `${branch}:${filePath}`;
    setLoadingFileContent(prev => ({ ...prev, [contentKey]: true }));
    
    try {
      const content = await githubAPI.getFileContent(
        repository.owner.login, 
        repository.name, 
        filePath, 
        branch
      );
      
      setFileContents(prev => ({ ...prev, [contentKey]: content }));
      
      // Update the selectedFileContents with the fetched content
      setSelectedFileContents(prev => 
        prev.map(file => 
          file.branch === branch && file.path === filePath 
            ? { ...file, content: content }
            : file
        )
      );
      
      console.log(`Fetched content for ${filePath} in ${branch}:`, content.substring(0, 100) + '...');
    } catch (err) {
      console.error(`Failed to fetch content for ${filePath} in ${branch}:`, err);
      const errorMessage = 'Error loading file content';
      setFileContents(prev => ({ ...prev, [contentKey]: errorMessage }));
      
      // Update the selectedFileContents with error message
      setSelectedFileContents(prev => 
        prev.map(file => 
          file.branch === branch && file.path === filePath 
            ? { ...file, content: errorMessage }
            : file
        )
      );
    } finally {
      setLoadingFileContent(prev => ({ ...prev, [contentKey]: false }));
    }
  };

  // Fetch real control panel data (PRs, issues, activity)
  useEffect(() => {
    if (selectedSource === 'control-panel' && repository?.owner?.login && repository?.name && user?.login) {
      setControlPanelLoading(true);
      setControlPanelError(null);
      const githubAPI = new GitHubAPI(token || '');
      Promise.all([
        githubAPI.getRepositoryPullRequests(repository.owner.login, repository.name, 'all', 1, 100),
        githubAPI.getRepositoryIssues(repository.owner.login, repository.name, 'all', 1, 100),
        githubAPI.getUserActivity(user.login, 1, 100)
      ]).then(([prs, issues, activity]) => {
        const transformedData = transformGitHubData(
          activity, // userActivity
          prs,      // pullRequests
          issues,   // issues
          [],       // commits (not fetched here)
          user      // user (from context)
        );
        // Add fallback botLogs
        transformedData.botLogs = fallbackContributionData.botLogs;
        setControlPanelData(transformedData);
      }).catch(err => {
        console.error('Failed to fetch control panel data:', err);
        setControlPanelError('Failed to fetch control panel data. Using fallback data.');
        setControlPanelData(fallbackContributionData);
      }).finally(() => setControlPanelLoading(false));
    }
  }, [selectedSource, repository, user, token]);

  // Helper function to convert GitHub tree to file structure
  const convertTreeToFileStructure = (treeData: any[]): any[] => {
    const structure: any[] = [];
    const folderMap = new Map<string, any>();

    if (!treeData || !Array.isArray(treeData)) {
      return structure;
    }

    // First pass: create all items
    treeData.forEach((item: any) => {
      const pathParts = item.path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      if (item.type === 'tree') {
        // It's a folder
        const folderItem = {
          name: fileName,
          type: 'folder' as const,
          expanded: false,
          selected: false,
          children: []
        };
        
        if (pathParts.length === 1) {
          // Root level folder
          structure.push(folderItem);
        } else {
          // Nested folder
          const parentPath = pathParts.slice(0, -1).join('/');
          if (!folderMap.has(parentPath)) {
            folderMap.set(parentPath, { children: [] });
          }
          folderMap.get(parentPath).children.push(folderItem);
        }
        folderMap.set(item.path, folderItem);
      } else {
        // It's a file
        const fileItem = {
          name: fileName,
          type: 'file' as const,
          selected: false
        };
        
        if (pathParts.length === 1) {
          // Root level file
          structure.push(fileItem);
        } else {
          // Nested file
          const parentPath = pathParts.slice(0, -1).join('/');
          if (!folderMap.has(parentPath)) {
            folderMap.set(parentPath, { children: [] });
          }
          folderMap.get(parentPath).children.push(fileItem);
        }
      }
    });

    return structure;
  };

  // Add these state declarations inside the component
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
  
  // Move all the helper functions inside the component
  const toggleDataTypeSelection = (dataType: keyof typeof selectedDataTypes) => {
    setSelectedDataTypes(prev => ({
      ...prev,
      [dataType]: !prev[dataType]
    }));
  };

  const hasSelectedDataTypes = () => {
    return Object.values(selectedDataTypes).some(value => value);
  };

  const getFilteredData = () => {
    const branch = selectedBranchFilter;
    const isAllBranches = branch === "all";
    const dataToFilter = controlPanelData || fallbackContributionData;
    const result: any = {};
    if (selectedDataTypes.pullRequests) {
      result.pullRequests = dataToFilter.pullRequests.filter((pr: any) => 
        isAllBranches || pr.targetBranch === branch || pr.sourceBranch === branch
      );
    }
    if (selectedDataTypes.issues) {
      result.issues = dataToFilter.issues.filter((issue: any) => 
        isAllBranches || issue.branch === branch || (issue.labels || []).includes(branch)
      );
    }
    if (selectedDataTypes.botLogs) {
      result.botLogs = dataToFilter.botLogs.filter((log: any) => 
        isAllBranches || log.branch === branch
      );
    }
    if (selectedDataTypes.activities) {
      result.activities = (dataToFilter.activity || []).filter((activity: any) => 
        isAllBranches || activity.branch === branch
      );
    }
    return result;
  };

  const getSelectedDataCount = () => {
    const filteredData = getFilteredData();
    let count = 0;
    
    if (filteredData.pullRequests) count += filteredData.pullRequests.length;
    if (filteredData.issues) count += filteredData.issues.length;
    if (filteredData.botLogs) count += filteredData.botLogs.length;
    if (filteredData.activities) count += filteredData.activities.length;
    
    return count;
  };

  const getBranchDisplayName = (branch: string) => {
    if (branch === "all") return "All Branches";
    return branch.charAt(0).toUpperCase() + branch.slice(1) + " Branch";
  };



  // Function to get the branch color
  const getBranchColorClass = (branch: string): string => {
    switch(branch) {
      case 'main': return 'text-green-600';
      case 'master': return 'text-green-600';
      case 'dev': return 'text-blue-600';
      case 'develop': return 'text-blue-600';
      case 'agents': return 'text-emerald-600';
      case 'snowflake': return 'text-cyan-600';
      case 'feature': return 'text-purple-600';
      case 'hotfix': return 'text-red-600';
      case 'release': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };



  // Check if any branches have selections
  const hasAnySelections = () => {
    return selectedBranches.some(branch => {
      const structure = branchFileStructures[branch];
      
      if (!structure || !Array.isArray(structure)) {
        return false; // No selections if structure is not loaded
      }
      
      let hasSelection = false;

      const checkSelections = (items: any[]) => {
        if (!items || !Array.isArray(items)) {
          return; // Skip if items is not valid
        }
        
        for (const item of items) {
          if (item.selected) {
            hasSelection = true;
            return;
          }
          if (item.children) {
            checkSelections(item.children);
            if (hasSelection) return;
          }
        }
      };

      checkSelections(structure);
      return hasSelection;
    });
  };

  // Total selected items across all branches
  const getTotalSelectedItems = () => {
    let files = 0;
    let folders = 0;

    if (!selectedBranches || !Array.isArray(selectedBranches)) {
      return { files, folders };
    }

    selectedBranches.forEach(branch => {
      const structure = branchFileStructures[branch];
      
      if (!structure || !Array.isArray(structure)) {
        return; // Skip if structure is not loaded or invalid
      }
      
      const countItems = (items: any[]) => {
        if (!items || !Array.isArray(items)) {
          return; // Skip if items is not valid
        }
        
        items.forEach(item => {
          if (item.selected) {
            if (item.type === 'folder') {
              folders++;
            } else {
              files++;
            }
          }
          
          if (item.children) {
            countItems(item.children);
          }
        });
      };
      
      countItems(structure);
    });

    return { files, folders };
  };

  // Import selected items from all branches
  // Interface for files to be imported
  interface FileToImport {
    path: string;
    branch: string;
  }

  // Interface for file system item
  interface FileSystemItem {
    name: string;
    type: 'file' | 'folder';
    selected?: boolean;
    children?: FileSystemItem[];
  }

  const handleImport = async () => {
    setImportLoading(true);
    setImportError(null);
    
    try {
      let importedData: any = null;
      console.log('Selected source:', selectedSource);
      
      if (selectedSource === 'branch') {
        // Basic branch import for MVP
        if (selectedBranches.length === 0) {
          throw new Error('Please select at least one branch');
        }
        
        const filesToImport: FileToImport[] = [];
        
        // Collect all selected files
        const collectSelectedFiles = (items: FileSystemItem[], currentPath: string[] = [], currentBranch: string) => {
          if (!items) return;
          
          items.forEach(item => {
            const itemPath = [...currentPath, item.name].join('/');
            
            if (item.selected && item.type === 'file') {
              filesToImport.push({
                path: itemPath,
                branch: currentBranch
              });
            }
            
            if (item.children) {
              collectSelectedFiles(item.children, [...currentPath, item.name], currentBranch);
            }
          });
        };
        
        // Collect files from each selected branch
        selectedBranches.forEach(branch => {
          const structure = branchFileStructures[branch];
          if (structure) {
            collectSelectedFiles(structure, [], branch);
          }
        });
        
        if (filesToImport.length === 0) {
          throw new Error('No files selected for import');
        }
        
        importedData = {
          type: 'branch',
          branches: selectedBranches,
          files: filesToImport,
          fileStructures: branchFileStructures
        };
        
        toast.success(`Successfully prepared ${filesToImport.length} files from ${selectedBranches.length} branch(es) for chat!`);
      }
      
      // Store imported data in localStorage for chat context
      if (importedData) {
        const existingImports = JSON.parse(localStorage.getItem('beetle_imported_data') || '[]');
        const newImport = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          repository: repository?.full_name || 'default',
          data: importedData
        };
        localStorage.setItem('beetle_imported_data', JSON.stringify([...existingImports, newImport]));
      }
      
      // Clear form data after successful import
      if (selectedSource === 'text') {
        setTextTitle('');
        setTextContent('');
      }
      
      // Navigate to chat page after successful import
      if (importedData) {
        router.push('/contribution/chat');
      }
      
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : 'Import failed');
      toast.error('Failed to add data to chat. Please try again.');
    } finally {
      setImportLoading(false);
    }
  };

  // Total selected counts
  const { files: totalFiles, folders: totalFolders } = getTotalSelectedItems();
  const hasSelections = totalFiles > 0 || totalFolders > 0;



  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {importSources.map(source => (
          <ImportSourceCard
            key={source.id}
            source={source}
            onClick={() => {
              setSelectedSource(source.id);
              if (source.id !== 'branch') {
                setSelectedBranches([]);
              }
            }}
            isActive={selectedSource === source.id}
          />
        ))}
      </div>
      
      <AnimatedTransition
        show={!!selectedSource}
        animation="slide-up"
        className="mt-8 glass-panel p-6 rounded-xl"
      >
        {selectedSource === 'csv' && (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Import CSV File</h3>
            <p className="text-muted-foreground">
              Upload a CSV file to import structured data into your second brain.
            </p>
            <div className="border-2 border-dashed border-border rounded-xl p-10 text-center">
              <Upload size={40} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Drag and drop a CSV file here, or click to browse
              </p>
              <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Browse Files
              </button>
            </div>
          </div>
        )}
        
        {selectedSource === 'control-panel' && (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Import Control Panel Data</h3>
            
            {/* Branch selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Branch</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['all', ...branchList].map(branch => (
                  <button
                    key={branch}
                    className={cn(
                      "px-3 py-2 text-sm rounded-lg border border-border transition-colors",
                      selectedBranchFilter === branch 
                        ? "bg-primary/10 border-primary text-primary" 
                        : "bg-card hover:bg-muted"
                    )}
                    onClick={() => setSelectedBranchFilter(branch)}
                  >
                    <span className="flex items-center gap-1.5">
                      <GitBranch size={14} />
                      {branch === "all" ? "All Branches" : branch.charAt(0).toUpperCase() + branch.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Data type selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Data Types</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  className={cn(
                    "p-3 rounded-lg border border-border hover:border-primary cursor-pointer transition-colors",
                    selectedDataTypes.pullRequests && "bg-primary/5 border-primary"
                  )}
                  onClick={() => toggleDataTypeSelection('pullRequests')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      <GitPullRequest size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Pull Requests</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Import PR data and related context
                      </p>
                    </div>
                    <div className="ml-auto">
                      {selectedDataTypes.pullRequests ? (
                        <CheckSquare size={16} className="text-primary" />
                      ) : (
                        <Square size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div 
                  className={cn(
                    "p-3 rounded-lg border border-border hover:border-primary cursor-pointer transition-colors",
                    selectedDataTypes.issues && "bg-primary/5 border-primary"
                  )}
                  onClick={() => toggleDataTypeSelection('issues')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                      <Bug size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Issues</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Import issue data and related context
                      </p>
                    </div>
                    <div className="ml-auto">
                      {selectedDataTypes.issues ? (
                        <CheckSquare size={16} className="text-primary" />
                      ) : (
                        <Square size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div 
                  className={cn(
                    "p-3 rounded-lg border border-border hover:border-primary cursor-pointer transition-colors",
                    selectedDataTypes.botLogs && "bg-primary/5 border-primary"
                  )}
                  onClick={() => toggleDataTypeSelection('botLogs')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Bot Logs</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Import bot activity and logs
                      </p>
                    </div>
                    <div className="ml-auto">
                      {selectedDataTypes.botLogs ? (
                        <CheckSquare size={16} className="text-primary" />
                      ) : (
                        <Square size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div 
                  className={cn(
                    "p-3 rounded-lg border border-border hover:border-primary cursor-pointer transition-colors",
                    selectedDataTypes.activities && "bg-primary/5 border-primary"
                  )}
                  onClick={() => toggleDataTypeSelection('activities')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Activity Logs</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Import branch activity history
                      </p>
                    </div>
                    <div className="ml-auto">
                      {selectedDataTypes.activities ? (
                        <CheckSquare size={16} className="text-primary" />
                      ) : (
                        <Square size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Preview and import section */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">Data Summary</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasSelectedDataTypes() ? (
                      <>
                        <span className="font-medium">{getSelectedDataCount()}</span> items will be imported from <span className="font-medium">{getBranchDisplayName(selectedBranchFilter)}</span>
                      </>
                    ) : (
                      "Select at least one data type to import"
                    )}
                  </p>
                </div>
                
                <button 
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!hasSelectedDataTypes()}
                  onClick={() => {
                    const filteredData = getFilteredData();
                    try {
                      updateKnowledgeBase(filteredData);
                      toast.success('Control Panel data added to chat!');
                      router.push('/contribution/chat');
                    } catch (e) {
                      toast.error('Failed to add control panel data to chat.');
                    }
                  }}
                >
                  Add to Chat
                </button>
              </div>
              
              {/* Data preview */}
              {hasSelectedDataTypes() && (
                <div className="border border-border rounded-lg p-3 bg-card/30 space-y-2 max-h-[250px] overflow-y-auto">
                  {selectedDataTypes.pullRequests && getFilteredData().pullRequests?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <GitPullRequest size={14} className="text-blue-600" />
                      <span>{getFilteredData().pullRequests.length} Pull Requests</span>
                    </div>
                  )}
                  
                  {selectedDataTypes.issues && getFilteredData().issues?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Bug size={14} className="text-orange-600" />
                      <span>{getFilteredData().issues.length} Issues</span>
                    </div>
                  )}
                  
                  {selectedDataTypes.botLogs && getFilteredData().botLogs?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Bot size={14} className="text-purple-600" />
                      <span>{getFilteredData().botLogs.length} Bot Logs</span>
                    </div>
                  )}
                  
                  {selectedDataTypes.activities && getFilteredData().activities?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Activity size={14} className="text-green-600" />
                      <span>{getFilteredData().activities.length} Activities</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedSource === 'api' && (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">API Integration</h3>
            <p className="text-muted-foreground">
              Connect to external APIs to import data into your second brain.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">API Endpoint URL</label>
                <input 
                  type="text" 
                  className="w-full p-2 rounded-lg border border-border bg-card"
                  placeholder="https://api.example.com/data"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Authentication Method</label>
                <select className="w-full p-2 rounded-lg border border-border bg-card">
                  <option>API Key</option>
                  <option>OAuth 2.0</option>
                  <option>Bearer Token</option>
                  <option>No Authentication</option>
                </select>
              </div>
            </div>
            <button className="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Connect API
            </button>
          </div>
        )}
        
        {selectedSource === 'url' && (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Import from URL</h3>
            <p className="text-muted-foreground">
              Import content from a website or article URL.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Website URL</label>
              <input 
                type="text" 
                className="w-full p-2 rounded-lg border border-border bg-card"
                placeholder="https://example.com/article"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="extractText" />
              <label htmlFor="extractText" className="text-sm">Extract main text content</label>
            </div>
            <button className="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Import URL
            </button>
          </div>
        )}
        
        {selectedSource === 'file' && (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Document Upload</h3>
            <p className="text-muted-foreground">
              Upload documents, PDFs, and other files to import into your second brain.
            </p>
            <div className="border-2 border-dashed border-border rounded-xl p-10 text-center">
              <Upload size={40} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: PDF, DOCX, TXT, MD
              </p>
              <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Browse Files
              </button>
            </div>
          </div>
        )}
        
        {selectedSource === 'text' && (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Text Input</h3>
            <p className="text-muted-foreground">
              Directly input or paste text content.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input 
                type="text" 
                className="w-full p-2 rounded-lg border border-border bg-card"
                placeholder="Enter a title for this content"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea 
                className="w-full p-2 rounded-lg border border-border bg-card min-h-32"
                placeholder="Enter or paste your content here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
            </div>
            <button 
              className="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!textTitle.trim() || !textContent.trim()}
              onClick={() => {
                const dataToImport = {
                  files: [{
                    path: `${textTitle}.txt`,
                    content: textContent
                  }]
                };
                updateKnowledgeBase(dataToImport);
                toast.success('Text content added to chat!');
                setTextTitle('');
                setTextContent('');
                router.push('/contribution/chat');
              }}
            >
              Add to Chat
            </button>
          </div>
        )}
        
        {selectedSource === 'branch' && (
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Branch Import</h3>
            <p className="text-muted-foreground">
              Import context from other branches in your repository.
            </p>
            
            {/* Branch selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Branches to Import</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {branchList.map(branch => (
                  <BranchCard
                    key={branch}
                    branch={branch}
                    isContextBranch={selectedBranch === branch}
                    isSelected={selectedBranches.includes(branch)}
                    onSelect={handleBranchSelect}
                    branchInfo={{
                      name: branch,
                      color: getBranchColorClass(branch),
                      description: branch === repository?.default_branch ? 'Default branch' : '',
                      maintainer: '',
                      githubUrl: repository ? `${repository.html_url}/tree/${branch}` : ''
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Selected branches */}
            {selectedBranches.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Selected branches:</h4>
                
                {selectedBranches.map(branch => (
                  <BranchContent
                    key={branch}
                    branch={branch}
                    fileStructure={branchFileStructures}
                    setFileStructure={setBranchFileStructures}
                    onRemove={() => handleBranchRemove(branch)}
                    branchInfo={{
                      name: `${branch} Branch`,
                      color: getBranchColorClass(branch)
                    }}
                    loadingBranches={loadingBranches}
                    selectedFileContents={selectedFileContents}
                    setSelectedFileContents={setSelectedFileContents}
                    onFileSelect={(branch, filePath, content) => {
                      // Fetch file content when a file is selected
                      fetchFileContent(branch, filePath);
                      // Add to selected files with loading state
                      setSelectedFileContents(prev => {
                        // Check if file is already selected
                        const existingIndex = prev.findIndex(f => f.branch === branch && f.path === filePath);
                        if (existingIndex >= 0) {
                          return prev; // Already selected
                        }
                        return [...prev, { branch, path: filePath, content: 'Loading...' }];
                      });
                    }}
                    fileContents={fileContents}
                    loadingFileContent={loadingFileContent}
                  />
                ))}
                
                {/* Select another branch button */}
                {selectedBranches.length < branchList.length && (
                  <div className="text-center">
                    <button
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                      onClick={() => {
                        const remainingBranches = branchList.filter(b => !selectedBranches.includes(b));
                        if (remainingBranches.length > 0) {
                          handleBranchSelect(remainingBranches[0]);
                        }
                      }}
                    >
                      + Add Another Branch
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </AnimatedTransition>
      
      {/* Global Add to Chat Button */}
      {selectedSource && (
        <div className="mt-6 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Add to Chat</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {(() => {
                  switch (selectedSource) {
                    case 'control-panel':
                      return hasSelectedDataTypes() 
                        ? `${getSelectedDataCount()} items from ${getBranchDisplayName(selectedBranchFilter)}`
                        : "Select at least one data type to add";
                    case 'branch':
                      return hasSelections 
                        ? `${totalFiles} files and ${totalFolders} folders from ${selectedBranches.length} branch(es)`
                        : "Select files and folders to add";
                    case 'text':
                      return textTitle && textContent 
                        ? `"${textTitle}" content`
                        : "Enter title and content to add";
                    default:
                      return "Ready to add data to chat";
                  }
                })()}
              </p>
            </div>
            
            <button 
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={(() => {
                switch (selectedSource) {
                  case 'control-panel':
                    return !hasSelectedDataTypes();
                  case 'branch':
                    return !hasSelections;
                  case 'text':
                    return !textTitle.trim() || !textContent.trim();
                  default:
                    return false;
                }
              })()}
              onClick={handleImport}
            >
              <MessageSquare size={16} />
              Add to Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPanel;