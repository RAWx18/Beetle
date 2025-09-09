"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  FileText, 
  Code2, 
  GitBranch, 
  Settings,
  Bot,
  Zap,
  Sparkles,
  BookOpen,
  Search,
  Filter,
  Users,
  Activity,
  TrendingUp,
  Shield,
  Globe,
  Database,
  Upload,
  Type,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';
import FileChatInterface from '@/components/FileChatInterface';
import AnimatedTransition from '@/components/AnimatedTransition';
import { ChatProvider } from '@/contexts/ChatContext';
import { toast } from 'sonner';

interface ImportedData {
  type: 'branch' | 'file' | 'text' | 'control-panel';
  branch?: string;
  branches?: string[];
  files?: Array<{branch: string, path: string, content?: string}>;
  fileStructures?: Record<string, any[]>;
  dataTypes?: string[];
  title?: string;
  content?: string;
}

export default function ChatPage() {
  const { token, user } = useAuth();
  const { repository } = useRepository();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [importedData, setImportedData] = useState<ImportedData | null>(null);

  // Demo repository setup for testing
  React.useEffect(() => {
    if (!repository && token === 'demo-token') {
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
      // Note: You'll need to implement setRepository in your RepositoryContext
    }
  }, [repository, token]);

  // Load imported data from localStorage on component mount
  React.useEffect(() => {
    const savedImports = localStorage.getItem('beetle_imported_data');
    if (savedImports) {
      try {
        const imports = JSON.parse(savedImports);
        if (imports.length > 0) {
          // Get the most recent import
          const latestImport = imports[imports.length - 1];
          setImportedData(latestImport.data);
        }
      } catch (error) {
        console.error('Error loading imported data:', error);
      }
    }
  }, []);

  const features = [
    {
      icon: <Code2 size={20} />,
      title: "Code Analysis",
      description: "Ask questions about your codebase and get intelligent responses"
    },
    {
      icon: <FileText size={20} />,
      title: "File Context",
      description: "Select specific files to focus the AI's attention"
    },
    {
      icon: <GitBranch size={20} />,
      title: "Multi-Branch Support",
      description: "Chat across different branches and compare code"
    },
    {
      icon: <Search size={20} />,
      title: "Smart Search",
      description: "Find specific functions, classes, or patterns in your code"
    },
    {
      icon: <Bot size={20} />,
      title: "AI-Powered",
      description: "Powered by advanced AI models for accurate code understanding"
    },
    {
      icon: <Shield size={20} />,
      title: "Secure",
      description: "Your code stays private and secure during analysis"
    }
  ];

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-primary" />
            </div>
            <CardTitle>Connect to Start Chatting</CardTitle>
            <CardDescription>
              Sign in with your GitHub account to start chatting with your codebase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Connect GitHub Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitBranch size={24} className="text-primary" />
            </div>
            <CardTitle>Select a Repository</CardTitle>
            <CardDescription>
              Choose a repository to start chatting with your codebase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Browse Repositories
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-background to-muted/20",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MessageSquare size={16} className="text-primary" />
                </div>
                <h1 className="text-xl font-semibold">Unified Chat Interface</h1>
              </div>
              
              {repository && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>•</span>
                  <span className="font-medium">{repository.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {repository.language}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles size={12} />
                AI Powered
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield size={12} />
                Secure
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Unified Chat Interface */}
      <div className="container mx-auto px-4 py-2">
        <AnimatedTransition show={true} animation="slide-up">
          <div className="h-[calc(100vh-120px)]">
            <FileChatInterface importedData={importedData || undefined} />
          </div>
        </AnimatedTransition>
      </div>
    </div>
  );
}
