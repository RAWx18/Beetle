import { useBranch } from '@/contexts/BranchContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Database, Brain } from 'lucide-react';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import { createDiagram } from '@/components/ui/diagram';

export const BranchWhat = () => {
  const { selectedBranch, getBranchInfo } = useBranch();
  const branchInfo = getBranchInfo();

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

  const currentContent = content[selectedBranch];

  const branchDiagrams = {
    dev: (
      <div className="flex flex-col items-center my-6">
        {/* Example: Integration diagram */}
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
        {/* Example: Agent workflow diagram */}
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
        {/* Example: Data flow diagram */}
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
      { label: 'Production Release', description: 'Deploy stable, unified AIFAQ releases' },
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

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${selectedBranch === 'dev' ? 'bg-blue-500' : selectedBranch === 'agents' ? 'bg-emerald-500' : 'bg-cyan-500'}`}>
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
              {currentContent.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedBranch === 'dev' ? 'bg-blue-500' : selectedBranch === 'agents' ? 'bg-emerald-500' : 'bg-cyan-500'}`}></div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="my-8">
        <h4 className="font-semibold text-lg mb-3">Architecture Diagram</h4>
        {branchDiagrams[selectedBranch]}
        <h4 className="font-semibold text-lg mb-3 mt-8">Development Timeline</h4>
        <Timeline color={branchInfo.color}>
          {branchTimelines[selectedBranch].map((item, idx) => (
            <TimelineItem key={idx} label={item.label} description={item.description} />
          ))}
        </Timeline>
      </div>
    </div>
  );
};
