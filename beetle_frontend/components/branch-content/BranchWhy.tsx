import { useBranch } from '@/contexts/BranchContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Zap, Users, Database, GitBranch, Star, Link2, BookOpen, MessageCircle, Code } from 'lucide-react';
import { useRepository } from '@/contexts/RepositoryContext';

const branchContent = {
  dev: {
    color: 'text-blue-600',
    gradient: 'from-blue-600 via-blue-500 to-cyan-500',
    hero: {
      title: 'Why AIFAQ Dev Branch?',
      desc: 'The integration hub where multi-agent AI and enterprise data come together. Dev is the umbrella branch for aligning, testing, and launching new features.'
    },
    features: [
      {
        icon: <GitBranch className="w-6 h-6 text-blue-600" />, title: 'Integration Layer',
        desc: 'Brings together multi-agent logic and Snowflake integrations for unified, production-ready releases.'
      },
      {
        icon: <Zap className="w-6 h-6 text-blue-500" />, title: 'Core Conversational Logic',
        desc: 'Centralizes and tests the main chat and orchestration logic for the whole project.'
      },
      {
        icon: <Database className="w-6 h-6 text-cyan-500" />, title: 'Data Integration',
        desc: 'Ensures seamless data flow between LLMs and enterprise sources like Snowflake.'
      },
      {
        icon: <BookOpen className="w-6 h-6 text-blue-400" />, title: 'Open Contribution Flow',
        desc: 'Features are developed in specialized branches, tested in dev, and promoted to main after validation.'
      },
    ],
    architecture: [
      { label: 'Agents Branch', color: 'bg-emerald-600' },
      { label: '+', color: '' },
      { label: 'Snowflake Branch', color: 'bg-cyan-500' },
      { label: '→', color: '' },
      { label: 'Dev Integration', color: 'bg-blue-700' },
    ],
    comparison: [
      { feature: 'Integration Hub', aifaq: 'Yes', traditional: 'No' },
      { feature: 'Multi-Branch Testing', aifaq: 'Yes', traditional: 'No' },
      { feature: 'Production-Ready', aifaq: 'Yes', traditional: 'Sometimes' },
      { feature: 'Open Contribution Flow', aifaq: 'Yes', traditional: 'No' },
    ],
    testimonial: {
      quote: 'The dev branch is where innovation meets stability. It ensures every feature is robust before reaching production.',
      author: 'Gianluca',
      role: 'Dev Branch Maintainer',
      color: 'text-blue-600'
    },
    faqs: [
      { q: 'What is the dev branch?', a: 'It is the mainline integration layer for AIFAQ, merging features from agents and snowflake.' },
      { q: 'How do I contribute?', a: 'Contribute to specialized branches first, then features are merged and tested in dev.' },
      { q: 'Where can I find docs?', a: 'See the branch wikis and CONTRIBUTING.md for full guidance.' },
    ]
  },
  agents: {
    color: 'text-emerald-600',
    gradient: 'from-emerald-600 via-emerald-500 to-blue-400',
    hero: {
      title: 'Why AIFAQ Agents Branch?',
      desc: 'The home of modular, multi-agent AI for intelligent FAQ discovery. Build, test, and refine specialized LLM agents in a privacy-first, open-source environment.'
    },
    features: [
      {
        icon: <Zap className="w-6 h-6 text-emerald-600" />, title: 'Multi-Agent Architecture',
        desc: 'Specialized agents for ingestion, retrieval, ranking, and generation.'
      },
      {
        icon: <Users className="w-6 h-6 text-emerald-500" />, title: 'Community-Driven',
        desc: 'Open to contributors, with weekly syncs and transparent development.'
      },
      {
        icon: <Shield className="w-6 h-6 text-emerald-400" />, title: 'Privacy-First',
        desc: 'Uses open-source LLMs and privacy-preserving techniques.'
      },
      {
        icon: <BookOpen className="w-6 h-6 text-emerald-400" />, title: 'Extensible Pipeline',
        desc: 'Easily add new agents or improve existing ones for smarter FAQ answers.'
      },
    ],
    architecture: [
      { label: 'User Query', color: 'bg-emerald-600' },
      { label: '→', color: '' },
      { label: 'Agent Orchestrator', color: 'bg-blue-600' },
      { label: '→', color: '' },
      { label: 'LLM Agents', color: 'bg-emerald-500' },
      { label: '→', color: '' },
      { label: 'Answer', color: 'bg-emerald-700' },
    ],
    comparison: [
      { feature: 'Multi-Agent LLM', aifaq: 'Yes', traditional: 'No' },
      { feature: 'Privacy by Design', aifaq: 'Yes', traditional: 'No' },
      { feature: 'Open Source', aifaq: 'Yes', traditional: 'Rare' },
      { feature: 'Community Driven', aifaq: 'Yes', traditional: 'No' },
    ],
    testimonial: {
      quote: 'AIFAQ Agents is where the future of conversational AI is built—open, modular, and privacy-first.',
      author: 'Ryan',
      role: 'Agents Branch Maintainer',
      color: 'text-emerald-600'
    },
    faqs: [
      { q: 'What is the agents branch?', a: 'It is where all multi-agent LLM logic is developed and tested.' },
      { q: 'How do I join?', a: 'Check the README, join weekly syncs, and start contributing!' },
      { q: 'What tech is used?', a: 'Python, LangChain, Mistral/Mixtral, FAISS/Chroma, and more.' },
    ]
  },
  snowflake: {
    color: 'text-cyan-600',
    gradient: 'from-cyan-600 via-blue-400 to-emerald-400',
    hero: {
      title: 'Why AIFAQ Snowflake Branch?',
      desc: 'Enterprise-grade data integration for secure, real-time insights. Connect Snowflake with LLMs using RAG pipelines and robust access controls.'
    },
    features: [
      {
        icon: <Database className="w-6 h-6 text-cyan-600" />, title: 'Enterprise Data Integration',
        desc: 'Connects securely to Snowflake with role-based authentication.'
      },
      {
        icon: <Shield className="w-6 h-6 text-cyan-500" />, title: 'Security & Compliance',
        desc: 'Implements data masking, audit trails, and access controls.'
      },
      {
        icon: <Zap className="w-6 h-6 text-cyan-400" />, title: 'Dynamic Query Generation',
        desc: 'Translates natural language to optimized SQL queries.'
      },
      {
        icon: <BookOpen className="w-6 h-6 text-cyan-400" />, title: 'Summarization & Monitoring',
        desc: 'LLM-powered summarization and monitoring dashboards for enterprise analytics.'
      },
    ],
    architecture: [
      { label: 'User Query', color: 'bg-cyan-600' },
      { label: '→', color: '' },
      { label: 'Snowflake Connector', color: 'bg-cyan-500' },
      { label: '→', color: '' },
      { label: 'Query Generator', color: 'bg-blue-600' },
      { label: '→', color: '' },
      { label: 'LLM Summarizer', color: 'bg-cyan-400' },
      { label: '→', color: '' },
      { label: 'Answer', color: 'bg-cyan-700' },
    ],
    comparison: [
      { feature: 'Enterprise Integration', aifaq: 'Yes', traditional: 'No' },
      { feature: 'Data Masking', aifaq: 'Yes', traditional: 'No' },
      { feature: 'Audit & Logging', aifaq: 'Yes', traditional: 'No' },
      { feature: 'Real-time Analytics', aifaq: 'Yes', traditional: 'No' },
    ],
    testimonial: {
      quote: 'AIFAQ Snowflake brings secure, scalable AI to enterprise data—without sacrificing privacy or compliance.',
      author: 'Jayaram',
      role: 'Snowflake Branch Maintainer',
      color: 'text-cyan-600'
    },
    faqs: [
      { q: 'What is the snowflake branch?', a: 'It is where all enterprise data integration and security features are built.' },
      { q: 'How do I contribute?', a: 'See the README, join the Slack, and help build the future of enterprise AI.' },
      { q: 'What makes it secure?', a: 'Role-based access, data masking, audit trails, and more.' },
    ]
  }
};

export const BranchWhy = () => {
  const { selectedBranch } = useBranch();
  const { repository } = useRepository();
  const projectName = repository?.name || 'Project';
  
  // Get content for the selected branch, with fallback for unknown branches
  const getBranchContent = (branch: string) => {
    if (branchContent[branch as keyof typeof branchContent]) {
      return branchContent[branch as keyof typeof branchContent];
    }
    
    // Fallback for unknown branches
    return {
      color: 'text-gray-600',
      gradient: 'from-gray-600 via-gray-500 to-gray-400',
      hero: {
        title: `Why ${projectName} ${branch} Branch?`,
        desc: `The ${branch} branch focuses on specific features and improvements for ${projectName}.`
      },
      features: [
        {
          icon: <GitBranch className="w-6 h-6 text-gray-600" />, 
          title: 'Branch Development',
          desc: `Active development and feature work on the ${branch} branch.`
        },
        {
          icon: <Code className="w-6 h-6 text-gray-500" />, 
          title: 'Code Quality',
          desc: 'Maintains high code quality and follows best practices.'
        },
        {
          icon: <Users className="w-6 h-6 text-gray-400" />, 
          title: 'Collaboration',
          desc: 'Team collaboration and code review processes.'
        },
        {
          icon: <BookOpen className="w-6 h-6 text-gray-400" />, 
          title: 'Documentation',
          desc: 'Comprehensive documentation and guides.'
        },
      ],
      architecture: [
        { label: 'Development', color: 'bg-gray-600' },
        { label: '→', color: '' },
        { label: 'Testing', color: 'bg-gray-500' },
        { label: '→', color: '' },
        { label: 'Production', color: 'bg-gray-700' },
      ],
      comparison: [
        { feature: 'Active Development', aifaq: 'Yes', traditional: 'Yes' },
        { feature: 'Code Review', aifaq: 'Yes', traditional: 'Sometimes' },
        { feature: 'Testing', aifaq: 'Yes', traditional: 'Yes' },
        { feature: 'Documentation', aifaq: 'Yes', traditional: 'Sometimes' },
      ],
      testimonial: {
        quote: `${projectName} ${branch} branch represents our commitment to quality and innovation.`,
        author: 'Team',
        role: 'Developers',
        color: 'text-gray-600'
      },
      faqs: [
        { q: `What is the ${branch} branch?`, a: `It is where active development and feature work happens for ${projectName}.` },
        { q: 'How do I contribute?', a: 'Check the README, follow the contribution guidelines, and submit PRs!' },
        { q: 'What tech is used?', a: 'Various technologies depending on the project requirements.' },
      ]
    };
  };
  
  const content = getBranchContent(selectedBranch);

  // Helper to replace 'AIFAQ' with projectName in strings
  const replaceProjectName = (str: string) => str.replace(/AIFAQ/g, projectName);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className={`text-4xl md:text-6xl font-bold bg-gradient-to-r ${content.gradient} bg-clip-text text-transparent mb-4`}>{replaceProjectName(content.hero.title)}</h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{replaceProjectName(content.hero.desc)}</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {content.features.map((f: any, i: number) => (
          <Card key={i} className="glass-panel">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">{f.icon}<CardTitle className={content.color}>{f.title}</CardTitle></div>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">{f.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Architecture Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className={`text-2xl font-bold text-center mb-4 ${content.color}`}>Architecture (Simplified)</h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {content.architecture.map((item: any, idx: number) =>
            item.label === '→' || item.label === '+' ? (
              <span key={idx} className="text-2xl font-bold text-muted-foreground">{item.label}</span>
            ) : (
              <span key={idx} className={`px-4 py-2 rounded-full font-semibold text-white ${item.color}`}>{item.label}</span>
            )
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-3xl mx-auto">
        <h2 className={`text-2xl font-bold text-center mb-4 ${content.color}`}>{projectName} vs. Traditional</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-muted-foreground/20 rounded-lg">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-2 text-left">Feature</th>
                <th className={`px-4 py-2 text-left ${content.color}`}>{projectName}</th>
                <th className="px-4 py-2 text-left text-muted-foreground">Traditional</th>
              </tr>
            </thead>
            <tbody>
              {content.comparison.map((row: any, i: number) => (
                <tr key={i} className="border-t border-muted-foreground/10">
                  <td className="px-4 py-2 font-medium">{row.feature}</td>
                  <td className={`px-4 py-2 font-semibold ${content.color}`}>{row.aifaq}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.traditional}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Testimonial/Quote */}
      <div className="max-w-2xl mx-auto text-center py-8">
        <div className={`inline-block bg-primary/10 border-l-4 px-6 py-4 rounded-lg ${content.color} border-current`}>
          <p className="text-lg italic mb-2">“{replaceProjectName(content.testimonial.quote)}”</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="font-semibold">{content.testimonial.author}</span>
            <span className="text-muted-foreground">{content.testimonial.role}</span>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-2xl mx-auto">
        <h2 className={`text-2xl font-bold text-center mb-4 ${content.color}`}>Frequently Asked Questions</h2>
        <Accordion type="single" collapsible>
          {content.faqs.map((faq: any, i: number) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{replaceProjectName(faq.q)}</AccordionTrigger>
              <AccordionContent>{replaceProjectName(faq.a)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
