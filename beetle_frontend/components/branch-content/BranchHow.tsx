import { useBranch } from '@/contexts/BranchContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, Code, Database, ExternalLink } from 'lucide-react';
import { useRepository } from '@/contexts/RepositoryContext';

export const BranchHow = () => {
  const { selectedBranch, getBranchInfo } = useBranch();
  const branchInfo = getBranchInfo();
  const { repository } = useRepository();
  const projectName = repository?.name || 'Project';

  const content = {
    dev: {
      setup: [
        `Clone the repository and checkout the dev branch`,
        `Install dependencies with npm install or yarn`,
        `Set up environment variables for both agent and snowflake integrations`,
        `Run the development server and test integration endpoints`
      ],
      workflow: [
        `Create feature branches from dev for integration work`,
        `Test compatibility between agent and snowflake modules`,
        `Write integration tests and documentation`,
        `Submit PRs with clear integration impact descriptions`
      ]
    },
    agents: {
      setup: [
        `Clone the repository and checkout the agents branch`,
        `Install Python dependencies: pip install -r requirements.txt`,
        `Set up vector store (FAISS/Chroma) for document embeddings`,
        `Configure Mistral/Mixtral API keys and model settings`
      ],
      workflow: [
        `Pick an agent component to work on (ingestion, retrieval, generation)`,
        `Implement agent logic following the modular architecture`,
        `Test agent interactions and performance`,
        `Document agent interfaces and submit PRs`
      ]
    },
    snowflake: {
      setup: [
        `Clone the repository and checkout the snowflake branch`,
        `Set up Snowflake account and configure connection credentials`,
        `Install required packages: snowflake-connector-python, sqlalchemy`,
        `Configure role-based access and data masking policies`
      ],
      workflow: [
        `Work on SQL query generation or data security features`,
        `Test with sample Snowflake datasets`,
        `Implement audit logging and access controls`,
        `Validate enterprise security requirements and submit PRs`
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
      setup: [
        `Clone the repository and checkout the ${branch} branch`,
        `Install dependencies with npm install or yarn`,
        `Set up environment variables and configuration`,
        `Run the development server and test endpoints`
      ],
      workflow: [
        `Create feature branches from ${branch} for development work`,
        `Implement new features and improvements`,
        `Write tests and documentation`,
        `Submit PRs with clear descriptions`
      ]
    };
  };

  const currentContent = getBranchContent(selectedBranch);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent mb-4">
          How to Build with {projectName} ({branchInfo.name})
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
          Step-by-step guide to get started with development on the {branchInfo.name}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${branchInfo.color}`}>
              <Code className="w-6 h-6" />
              Setup & Installation
            </CardTitle>
            <CardDescription>
              Get your development environment ready
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {currentContent.setup.map((step: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${selectedBranch === 'dev' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : selectedBranch === 'agents' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300'}`}>
                    {idx + 1}
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${branchInfo.color}`}>
              <GitBranch className="w-6 h-6" />
              Development Workflow
            </CardTitle>
            <CardDescription>
              How to contribute effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {currentContent.workflow.map((step: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${selectedBranch === 'dev' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : selectedBranch === 'agents' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300'}`}>
                    {idx + 1}
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className={branchInfo.color}>Quick Start</CardTitle>
          <CardDescription>
            Jump into development with these commands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 font-mono text-sm">
            <div className="text-green-400"># Clone and setup</div>
            <div className="text-white">git clone {repository?.clone_url || 'https://github.com/your/repo.git'}</div>
            <div className="text-white">cd {projectName}</div>
            <div className="text-white">git checkout {selectedBranch}</div>
            <div className="text-green-400 mt-2"># Start development</div>
            <div className="text-white">npm install</div>
            <div className="text-white">npm run dev</div>
          </div>
          <div className="mt-4">
            <Button onClick={() => window.open(branchInfo.githubUrl, '_blank')} className={`${selectedBranch === 'dev' ? 'bg-blue-600 hover:bg-blue-700' : selectedBranch === 'agents' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View {branchInfo.name} on GitHub
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
