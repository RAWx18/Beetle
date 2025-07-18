import { useBranch } from '@/contexts/BranchContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Code, BookOpen, Users, Star, GitPullRequest } from 'lucide-react';

export const BranchContribute = () => {
  const { selectedBranch, getBranchInfo } = useBranch();
  const branchInfo = getBranchInfo();

  const content = {
    dev: {
      icon: <Code className="w-6 h-6" />,
      title: "Contribute to Integration",
      description: "Help build the bridge between multi-agent AI and enterprise data systems",
      areas: [
        {
          title: "Integration Testing",
          description: "Test compatibility between agent and snowflake modules",
          skills: ["TypeScript", "Jest", "React Testing Library"]
        },
        {
          title: "API Documentation",
          description: "Document integration interfaces and shared utilities",
          skills: ["Technical Writing", "OpenAPI", "Markdown"]
        },
        {
          title: "Performance Optimization",
          description: "Optimize module loading and cross-branch compatibility",
          skills: ["Performance Profiling", "Webpack", "Bundle Analysis"]
        }
      ],
      quickStart: [
        "Fork the repository and checkout the dev branch",
        "Review integration test patterns in /tests/integration",
        "Pick an open issue labeled 'integration' or 'good-first-issue'",
        "Submit a PR with clear integration impact documentation"
      ],
      maintainers: ["Gianluca", "Core Team"],
      mentors: ["Ryan", "Lead Integrator"],
      guide: "The Dev branch serves as the integration layer where all components come together. Your contributions should maintain compatibility with both agent and data layer systems.",
      bestPractices: [
        "Write integration tests that verify cross-component compatibility",
        "Document all public APIs with complete JSDoc comments",
        "Follow the project's TypeScript style guide",
        "Create small, focused PRs with clear integration purposes"
      ],
      pullRequestTemplate: `## Description
What does this PR do?

## Integration Impact
How does this change affect the integration between components?

## Testing
How has this been tested across branches?`,
      meetingTimes: "Tuesdays at 11am PT / 2pm ET / 8pm CET"
    },
    agents: {
      icon: <Users className="w-6 h-6" />,
      title: "Build AI Agents",
      description: "Contribute to the multi-agent architecture powering intelligent FAQ discovery",
      areas: [
        {
          title: "Agent Development",
          description: "Build new agents or improve existing ones (ingestion, retrieval, generation)",
          skills: ["Python", "LangChain", "Mistral/Mixtral", "Vector Databases"]
        },
        {
          title: "RAG Pipeline Enhancement",
          description: "Improve retrieval-augmented generation workflows and accuracy",
          skills: ["Embeddings", "FAISS/Chroma", "Semantic Search", "Prompt Engineering"]
        },
        {
          title: "Agent Orchestration",
          description: "Enhance agent communication and workflow management",
          skills: ["Async Programming", "Message Queues", "State Management"]
        }
      ],
      quickStart: [
        "Set up Python environment with requirements.txt",
        "Explore the agent architecture in /agents/ directory",
        "Run existing agents locally with sample data",
        "Choose an agent component to enhance or create"
      ],
      maintainers: ["Ryan", "Lochan Paudel"],
      mentors: ["Dr. Emily Chen", "AI Research Lead"],
      guide: "The Agents branch focuses on building intelligent AI systems that discover, generate, and refine FAQs using advanced LLM techniques.",
      bestPractices: [
        "Ensure models can be run efficiently in both development and production",
        "Document model inputs, outputs, and parameters thoroughly",
        "Include evaluation metrics with all model improvements",
        "Consider ethical implications of AI agent behaviors"
      ],
      pullRequestTemplate: `## Description
What does this PR do?

## AI Component
Which agent component does this modify?

## Evaluation
What metrics show this improves over the current implementation?`,
      meetingTimes: "Wednesdays at 9am PT / 12pm ET / 6pm CET"
    },
    snowflake: {
      icon: <Star className="w-6 h-6" />,
      title: "Enterprise Data Integration",
      description: "Contribute to secure, scalable enterprise data integrations with Snowflake",
      areas: [
        {
          title: "Security & Compliance",
          description: "Implement data masking, role-based access, and audit trails",
          skills: ["Snowflake Security", "RBAC", "Data Governance", "SQL"]
        },
        {
          title: "Query Generation",
          description: "Improve natural language to SQL query generation accuracy",
          skills: ["NLP", "SQL", "Query Optimization", "Snowflake Functions"]
        },
        {
          title: "Performance & Scaling",
          description: "Optimize query performance and implement caching strategies",
          skills: ["Database Optimization", "Caching", "Snowflake Performance", "Monitoring"]
        }
      ],
      quickStart: [
        "Set up Snowflake trial account for testing",
        "Configure connection with sample enterprise datasets",
        "Review SQL generation patterns in /snowflake/ directory",
        "Test security features with different user roles"
      ],
      maintainers: ["Jayaram", "Sumana"],
      mentors: ["Daniel", "Enterprise Data Architect"],
      guide: "The Snowflake branch provides enterprise-grade data integrations, focusing on security, performance, and reliability for production deployments.",
      bestPractices: [
        "Follow strict security practices for all data access",
        "Write optimized queries that scale with data volume",
        "Test with representative enterprise datasets",
        "Document all data models and transformations"
      ],
      pullRequestTemplate: `## Description
What does this PR do?

## Data Impact
How does this change affect data models or access patterns?

## Security Review
Has this been reviewed for security implications?`,
      meetingTimes: "Thursdays at 10am PT / 1pm ET / 7pm CET"
    }
  };

  // Get content for the selected branch, with fallback for unknown branches
  const getBranchContent = (branch: string) => {
    if (content[branch as keyof typeof content]) {
      return content[branch as keyof typeof content];
    }
    
    // Fallback for unknown branches
    return {
      icon: <Code className="w-6 h-6" />,
      title: `Contribute to ${branch}`,
      description: `Help improve and enhance the ${branch} branch`,
      areas: [
        {
          title: "Feature Development",
          description: "Build new features and improvements",
          skills: ["JavaScript", "TypeScript", "React", "Testing"]
        },
        {
          title: "Bug Fixes",
          description: "Identify and fix issues in the codebase",
          skills: ["Debugging", "Problem Solving", "Code Review"]
        },
        {
          title: "Documentation",
          description: "Improve documentation and guides",
          skills: ["Technical Writing", "Markdown", "User Experience"]
        }
      ],
      quickStart: [
        `Fork the repository and checkout the ${branch} branch`,
        "Review the codebase and understand the project structure",
        "Pick an open issue or create a new feature request",
        "Submit a PR with clear descriptions and tests"
      ],
      maintainers: ["Core Team"],
      mentors: ["Senior Developers"],
      guide: `The ${branch} branch is where active development happens. Your contributions should follow the project's coding standards and best practices.`,
      bestPractices: [
        "Write clear, readable code with proper documentation",
        "Include tests for new features and bug fixes",
        "Follow the project's coding style and conventions",
        "Create small, focused PRs with clear purposes"
      ],
      pullRequestTemplate: `## Description
What does this PR do?

## Changes
What changes were made?

## Testing
How has this been tested?`,
      meetingTimes: "Weekly team meetings"
    };
  };

  const currentContent = getBranchContent(selectedBranch);

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
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
          {currentContent.description}
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            onClick={() => window.open(branchInfo.githubUrl, '_blank')}
            className={`${selectedBranch === 'dev' ? 'bg-blue-600 hover:bg-blue-700' : selectedBranch === 'agents' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
          >
            <Github className="w-4 h-4 mr-2" />
            View {branchInfo.name} on GitHub
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open(`${branchInfo.githubUrl}/issues`, '_blank')}
          >
            <GitPullRequest className="w-4 h-4 mr-2" />
            Browse Issues
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {currentContent.areas.map((area, idx) => (
          <Card key={idx} className="glass-panel">
            <CardHeader>
              <CardTitle className={`${branchInfo.color} text-lg`}>
                {area.title}
              </CardTitle>
              <CardDescription>
                {area.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Required Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {area.skills.map((skill, skillIdx) => (
                    <span 
                      key={skillIdx}
                      className={`px-2 py-1 text-xs rounded-full ${selectedBranch === 'dev' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : selectedBranch === 'agents' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300'}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${branchInfo.color}`}>
            <BookOpen className="w-6 h-6" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Get started contributing to the {branchInfo.name} in 4 easy steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {currentContent.quickStart.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${selectedBranch === 'dev' ? 'bg-blue-500' : selectedBranch === 'agents' ? 'bg-emerald-500' : 'bg-cyan-500'}`}>
                  {idx + 1}
                </div>
                <span className="text-slate-600 dark:text-slate-300 pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${branchInfo.color}`}>
              <Users className="w-6 h-6" />
              Branch Team
            </CardTitle>
            <CardDescription>
              Meet the people maintaining and mentoring this branch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Maintainers:</h4>
              <div className="flex items-center gap-2">
                {currentContent.maintainers.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <div className={`w-2 h-2 rounded-full ${selectedBranch === 'dev' ? 'bg-blue-500' : selectedBranch === 'agents' ? 'bg-emerald-500' : 'bg-cyan-500'}`}></div>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Mentors:</h4>
              <div className="flex items-center gap-2">
                {currentContent.mentors.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <div className={`w-2 h-2 rounded-full ${selectedBranch === 'dev' ? 'bg-blue-500' : selectedBranch === 'agents' ? 'bg-emerald-500' : 'bg-cyan-500'}`}></div>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Team Meetings:</h4>
              <p className="text-slate-600 dark:text-slate-300">{currentContent.meetingTimes}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${branchInfo.color}`}>
              <GitPullRequest className="w-6 h-6" />
              Pull Request Guide
            </CardTitle>
            <CardDescription>
              How to submit your changes to this branch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300 text-sm italic border-l-2 border-primary/50 pl-3 py-1">
              {currentContent.guide}
            </p>
            
            <div>
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">PR Template:</h4>
              <pre className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-mono overflow-auto whitespace-pre-wrap">
                {currentContent.pullRequestTemplate}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel mt-6">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${branchInfo.color}`}>
            <Code className="w-6 h-6" />
            Best Practices
          </CardTitle>
          <CardDescription>
            Guidelines to follow when contributing to this branch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 list-disc list-inside">
            {currentContent.bestPractices.map((practice, idx) => (
              <li key={idx} className="text-slate-600 dark:text-slate-300">{practice}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="glass-panel bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 mt-8">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Contribute?</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
            Join our community of developers building the future of intelligent FAQ systems. 
            Every contribution, no matter how small, makes a difference.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              onClick={() => window.open('https://github.com/hyperledger-labs/aifaq/discussions', '_blank')}
              variant="outline"
            >
              <Users className="w-4 h-4 mr-2" />
              Join Discussions
            </Button>
            <Button 
              onClick={() => window.open(`${branchInfo.githubUrl}/wiki`, '_blank')}
              variant="outline"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Read Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
