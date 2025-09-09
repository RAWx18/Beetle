import { useBranch } from '@/contexts/BranchContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code } from 'lucide-react';

export const CommitGuidelines = () => {
  const { selectedBranch, getBranchInfo } = useBranch();
  const branchInfo = getBranchInfo();

  const commitTypes = [
    { type: 'feat', description: 'A new feature' },
    { type: 'fix', description: 'A bug fix' },
    { type: 'docs', description: 'Documentation only changes' },
    { type: 'style', description: 'Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)' },
    { type: 'refactor', description: 'A code change that neither fixes a bug nor adds a feature' },
    { type: 'perf', description: 'A code change that improves performance' },
    { type: 'test', description: 'Adding missing tests or correcting existing tests' },
    { type: 'build', description: 'Changes that affect the build system or external dependencies' },
    { type: 'ci', description: 'Changes to our CI configuration files and scripts' },
    { type: 'chore', description: 'Other changes that don\'t modify src or test files' },
    { type: 'revert', description: 'Reverts a previous commit' }
  ];

  const branchExamples: Record<string, string[]> = {
    dev: [
      'feat(integration): add data connector between agent and snowflake modules',
      'fix(api): correct type definitions in shared interfaces',
      'docs(readme): update integration guide with new examples',
    ],
    agents: [
      'feat(agent): implement new knowledge retrieval agent',
      'fix(rag): resolve token limit issues in context window',
      'perf(embedding): optimize vector lookup for faster retrieval',
    ],
    snowflake: [
      'feat(query): add support for parameterized queries',
      'fix(security): address SQL injection vulnerability in input parser',
      'perf(cache): implement caching layer for frequent queries',
    ]
  };

  return (
    <Card className="glass-panel mt-8">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${branchInfo.color}`}>
          <Code className="w-6 h-6" />
          Commit Guidelines
        </CardTitle>
        <CardDescription>
          Follow these patterns when committing your changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="format">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>
          
          <TabsContent value="format" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Commit Message Format</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                We follow the Conventional Commits specification for our commit messages:
              </p>
              <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-sm font-mono">
                {'<type>(<scope>): <description>\n\n<body>\n\n<footer>'}
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Commit Structure</h3>
              <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
                <li><strong>type</strong>: What kind of change this commit is making (see Types tab)</li>
                <li><strong>scope</strong>: What part of the codebase this change affects</li>
                <li><strong>description</strong>: A short summary of the change</li>
                <li><strong>body</strong> (optional): A more detailed explanation of the change</li>
                <li><strong>footer</strong> (optional): Information about breaking changes or issue references</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="types">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-2">Commit Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {commitTypes.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <code className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-sm font-mono mb-1">
                      {item.type}
                    </code>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="examples">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-2">Examples for {branchInfo.name}</h3>
              <div className="space-y-3">
                {(branchExamples[selectedBranch] || branchExamples['dev']).map((example: string, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-sm">
                    {example}
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                <h3 className="text-lg font-semibold mb-2">Complete Example</h3>
                <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md text-sm font-mono whitespace-pre-wrap">
                  {`feat(${selectedBranch === 'dev' ? 'integration' : selectedBranch === 'agents' ? 'agent' : 'query'}): add support for new feature

This implements the new feature that allows users to...

The implementation includes:
- Feature detail 1
- Feature detail 2
- Feature detail 3

Closes #123`}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
