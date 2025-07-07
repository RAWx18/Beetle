import { useBranch } from '@/contexts/BranchContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Database, Brain, Github, Star, GitBranch, Calendar, User, Lock, Globe } from 'lucide-react';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import { createDiagram } from '@/components/ui/diagram';
import { Badge } from '@/components/ui/badge';

// Repository View Component
const RepositoryView = ({ repository }: { repository: any }) => {
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Github className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
          {repository.name}
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
          {repository.description || "No description available"}
        </p>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-blue-600">Repository Information</CardTitle>
          <CardDescription>
            {repository.private ? "Private Repository" : "Public Repository"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Repository Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{repository.stargazers_count}</div>
                <div className="text-xs text-muted-foreground">Stars</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{repository.forks_count}</div>
                <div className="text-xs text-muted-foreground">Forks</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{repository.language || "N/A"}</div>
                <div className="text-xs text-muted-foreground">Language</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{repository.default_branch}</div>
                <div className="text-xs text-muted-foreground">Default Branch</div>
              </div>
            </div>

            {/* Repository Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Owner:</span>
                <span className="font-medium">{repository.owner?.login}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Created:</span>
                <span className="font-medium">{new Date(repository.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Last Updated:</span>
                <span className="font-medium">{getRelativeTime(repository.updated_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                {repository.private ? (
                  <Lock className="w-4 h-4 text-red-500" />
                ) : (
                  <Globe className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm text-muted-foreground">Visibility:</span>
                <Badge variant={repository.private ? "destructive" : "default"}>
                  {repository.private ? "Private" : "Public"}
                </Badge>
              </div>
            </div>

            {/* Repository Type */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Type:</span>
              <Badge variant="secondary" className="capitalize">
                {repository.type}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repository Actions */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Repository Actions</CardTitle>
          <CardDescription>
            Quick actions for this repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href={repository.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <Github className="w-5 h-5" />
              <div>
                <div className="font-medium">View on GitHub</div>
                <div className="text-sm text-muted-foreground">Open repository page</div>
              </div>
            </a>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
              <GitBranch className="w-5 h-5" />
              <div>
                <div className="font-medium">Clone Repository</div>
                <div className="text-sm text-muted-foreground">Copy clone URL</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
              <Star className="w-5 h-5" />
              <div>
                <div className="font-medium">Star Repository</div>
                <div className="text-sm text-muted-foreground">Show your support</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// AIFAQ View Component (Updated for Dynamic Branches)
const AIFAQView = ({ selectedBranch, branchInfo }: { selectedBranch: string; branchInfo: any }) => {
  const { repository } = useRepository();
  const projectName = repository?.name || 'Project';

  const content = {
    dev: {
      icon: <Code className="w-8 h-8" />,
      title: "Integration & Orchestration Hub",
      description: "The dev branch serves as the mainline integration layer where features from both agents and snowflake branches are tested, aligned, and prepared for production.",
      features: [
        "Core conversational logic integration",
        "Module syncing utilities between branches",
        "Interface compatibility testing",
        "Shared utilities development",
        "Cross-branch feature alignment"
      ]
    },
    agents: {
      icon: <Brain className="w-8 h-8" />,
      title: "Multi-Agent AI Architecture",
      description: "The agents branch focuses on building modular conversational AI systems using advanced LLMs and RAG pipelines for intelligent FAQ discovery.",
      features: [
        "Data Ingestion Agent for document processing",
        "Retriever Agent for semantic search",
        "Query Agent for intent understanding",
        "Generation Agent with Mistral/Mixtral",
        "Agent Orchestrator for workflow management"
      ]
    },
    snowflake: {
      icon: <Database className="w-8 h-8" />,
      title: "Enterprise Data Integration",
      description: "The snowflake branch delivers enterprise-grade data integrations using Snowflake's cloud data platform with secure, scalable retrieval-augmented generation.",
      features: [
        "Snowflake Connector with role-based authentication",
        "Dynamic SQL Query Generator from natural language",
        "Data Masking & Security Layer for compliance",
        "Result Summarization Agent for insights",
        "Audit & Logging System for governance"
      ]
    }
  };

  // Get content for the selected branch, with fallback for unknown branches
  const getBranchContent = (branch: string) => {
    if (content[branch as keyof typeof content]) {
      return content[branch as keyof typeof content];
    }
    
    // Fallback for unknown branches
    return {
      icon: <GitBranch className="w-8 h-8" />,
      title: `${projectName} ${branch} Branch`,
      description: `The ${branch} branch focuses on specific features and improvements for ${projectName}.`,
      features: [
        `Active development on ${branch} branch`,
        "Code quality and testing",
        "Feature implementation and bug fixes",
        "Documentation and guides",
        "Team collaboration and reviews"
      ]
    };
  };

  const currentContent = getBranchContent(selectedBranch);

  const branchDiagrams = {
    dev: (
      <div className="flex flex-col items-center my-6">
        <div className="flex items-center gap-4">
          <span className="bg-blue-500 text-white rounded-full px-3 py-1">Agents</span>
          <span className="text-2xl">+</span>
          <span className="bg-cyan-500 text-white rounded-full px-3 py-1">Snowflake</span>
          <span className="text-2xl">→</span>
          <span className="bg-blue-700 text-white rounded-full px-3 py-1">Dev Integration</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Unified integration of multi-agent AI and enterprise data</p>
      </div>
    ),
    agents: (
      <div className="flex flex-col items-center my-6">
        <div className="flex items-center gap-4">
          <span className="bg-emerald-500 text-white rounded-full px-3 py-1">Ingest</span>
          <span className="text-2xl">→</span>
          <span className="bg-emerald-600 text-white rounded-full px-3 py-1">Retrieve</span>
          <span className="text-2xl">→</span>
          <span className="bg-emerald-700 text-white rounded-full px-3 py-1">Generate</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Multi-agent pipeline for FAQ discovery</p>
      </div>
    ),
    snowflake: (
      <div className="flex flex-col items-center my-6">
        <div className="flex items-center gap-4">
          <span className="bg-cyan-500 text-white rounded-full px-3 py-1">User Query</span>
          <span className="text-2xl">→</span>
          <span className="bg-cyan-600 text-white rounded-full px-3 py-1">Snowflake</span>
          <span className="text-2xl">→</span>
          <span className="bg-cyan-700 text-white rounded-full px-3 py-1">Insights</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Secure, real-time enterprise data retrieval</p>
      </div>
    ),
  };

  const branchTimelines = {
    dev: [
      { label: 'Feature Merging', description: 'Integrate new features from agents and snowflake branches' },
      { label: 'Interface Testing', description: 'Ensure compatibility and stability across modules' },
      { label: 'Production Release', description: `Deploy stable, unified ${projectName} releases` },
    ],
    agents: [
      { label: 'Data Ingestion', description: 'Process and structure documents for FAQ discovery' },
      { label: 'Semantic Retrieval', description: 'Retrieve relevant information using advanced LLMs' },
      { label: 'Answer Generation', description: 'Generate accurate, context-aware FAQ responses' },
    ],
    snowflake: [
      { label: 'Secure Connection', description: 'Authenticate and connect to enterprise Snowflake data' },
      { label: 'Query Generation', description: 'Translate user questions into SQL queries' },
      { label: 'Insight Delivery', description: 'Summarize and present results with compliance' },
    ],
  };

  // Get diagram and timeline for the selected branch, with fallback
  const getBranchDiagram = (branch: string) => {
    return branchDiagrams[branch as keyof typeof branchDiagrams] || (
      <div className="flex flex-col items-center my-6">
        <div className="flex items-center gap-4">
          <span className="bg-gray-500 text-white rounded-full px-3 py-1">Development</span>
          <span className="text-2xl">→</span>
          <span className="bg-gray-600 text-white rounded-full px-3 py-1">Testing</span>
          <span className="text-2xl">→</span>
          <span className="bg-gray-700 text-white rounded-full px-3 py-1">Production</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Standard development workflow</p>
      </div>
    );
  };

  const getBranchTimeline = (branch: string) => {
    return branchTimelines[branch as keyof typeof branchTimelines] || [
      { label: 'Development', description: `Active development on ${branch} branch` },
      { label: 'Testing', description: 'Code review and testing processes' },
      { label: 'Deployment', description: 'Production deployment and monitoring' },
    ];
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${selectedBranch === 'dev' ? 'bg-blue-500' : selectedBranch === 'agents' ? 'bg-emerald-500' : selectedBranch === 'snowflake' ? 'bg-cyan-500' : 'bg-gray-500'}`}>
            <div className="text-white">
              {currentContent.icon}
            </div>
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent mb-4">
          {currentContent.title}
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
          {currentContent.description}
        </p>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className={branchInfo.color}>What is the {branchInfo.name}?</CardTitle>
          <CardDescription>
            Maintained by {branchInfo.maintainer}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {branchInfo.description}
            </p>
            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Key Components & Features:</h4>
            <ul className="space-y-2">
              {currentContent.features.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedBranch === 'dev' ? 'bg-blue-500' : selectedBranch === 'agents' ? 'bg-emerald-500' : selectedBranch === 'snowflake' ? 'bg-cyan-500' : 'bg-gray-500'}`}></div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="my-8">
        <h4 className="font-semibold text-lg mb-3">Architecture Diagram</h4>
        {getBranchDiagram(selectedBranch)}
        <h4 className="font-semibold text-lg mb-3 mt-8">Development Timeline</h4>
        <Timeline color={branchInfo.color}>
          {getBranchTimeline(selectedBranch).map((item: { label: string; description: string }, idx: number) => (
            <TimelineItem key={idx} label={item.label} description={item.description} />
          ))}
        </Timeline>
      </div>
    </div>
  );
};

// Main BranchWhat Component
export const BranchWhat = () => {
  const { selectedBranch, getBranchInfo } = useBranch();
  const { repository, isRepositoryLoaded } = useRepository();
  const branchInfo = getBranchInfo();

  // Always show repository info if we have repository data
  if (repository) {
    return <RepositoryView repository={repository} />;
  }

  // Otherwise show the AIFAQ content with dynamic branch support
  return <AIFAQView selectedBranch={selectedBranch} branchInfo={branchInfo} />;
};
