import React from 'react';
import { FeatureIcon } from './FeatureIcon';
import { cn } from '@/lib/utils';
import { Brain, FileUp, Puzzle, Share, Users, Layers, ArrowRight, FileText, Database, Search } from 'lucide-react';

interface CustomIllustrationProps {
  featureIndex: number;
  className?: string;
}

export const CustomIllustration: React.FC<CustomIllustrationProps> = ({ 
  featureIndex,
  className 
}) => {
  const bgColors = [
    'from-primary/20 to-secondary/20',    // Add Cells
    'from-accent/20 to-primary/20',     // Plug & Play
    'from-muted/20 to-primary/20',    // Spatial Thinking
    'from-secondary/20 to-accent/20',    // Contextual
    'from-primary/20 to-accent/20',   // Intelligence
    'from-muted/20 to-secondary/20',     // Clip
    'from-primary/20 to-muted/20',    // Agnostic
    'from-accent/20 to-secondary/20',  // Search
    'from-secondary/20 to-muted/20',   // Private
    'from-accent/20 to-muted/20',      // Recognition
    'from-primary/20 to-accent/20',      // Share
    'from-secondary/20 to-primary/20',   // D/L mode
  ];

  const titles = [
    "Add Cells",
    "Plug & Play",
    "Spatial Thinking",
    "Contextual",
    "Intelligence",
    "Clip",
    "Agnostic",
    "Search",
    "Private",
    "Recognition",
    "Share",
    "D/L mode"
  ];

  const descriptions = [
    "Seamlessly import data (CSV, HTML, AI scraping, or clipping) or create new entries effortlessly.",
    "Fully customizable with an open-source framework that adapts to your workflow.",
    "Visualize ideas with brain cells, lists, galleries, tables, maps, or timelines.",
    "Say goodbye to folders—create sub-brains tailored to specific projects or tasks.",
    "AI-powered insights that extract what they mention from every pinned topic.",
    "Collect data from any source or device directly into your second brain.",
    "Clip any type of content with built-in extraction tools.",
    "Find what you're looking for with intelligent, precision-focused search capabilities.",
    "Keep all your work secure in a private, controlled space.",
    "Identify and extract text from images, videos, and more.",
    "Share thoughts and ideas to collaborate seamlessly.",
    "Toggle between dark and simplified interface with custom color modes for focus."
  ];

  const bgColor = bgColors[featureIndex % bgColors.length];
  const title = titles[featureIndex % titles.length];
  const description = descriptions[featureIndex % descriptions.length];

  // Create feature-specific diagrams
  const renderDiagram = (index: number) => {
    switch (index) {
      case 0: // Add Cells
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute left-10 top-1/3 flex flex-col items-center">
              <FileText className="text-primary w-12 h-12 mb-2" />
              <span className="text-xs">Documents</span>
            </div>
            <div className="absolute left-10 bottom-1/3 flex flex-col items-center">
              <Database className="text-primary w-12 h-12 mb-2" />
              <span className="text-xs">Data</span>
            </div>
            <div className="absolute right-10 top-1/3 flex flex-col items-center">
              <FileUp className="text-primary w-12 h-12 mb-2" />
              <span className="text-xs">Imports</span>
            </div>
            <ArrowRight className="absolute left-28 top-1/2 transform -translate-y-1/2 text-primary w-8 h-8" />
            <div className="neural-node w-20 h-20 flex items-center justify-center">
              <Brain className="text-primary w-10 h-10" />
            </div>
            <div className="absolute right-24 bottom-10 text-xs bg-primary/10 p-2 rounded">Import data from various sources</div>
          </div>
        );
      case 1: // Plug & Play
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <div className="glass-panel p-3 rounded-md mb-2">
                  <Puzzle className="text-primary w-8 h-8" />
                </div>
                <span className="text-xs">Extensions</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="glass-panel p-3 rounded-md mb-2">
                  <Layers className="text-primary w-8 h-8" />
                </div>
                <span className="text-xs">Templates</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="glass-panel p-3 rounded-md mb-2">
                  <Puzzle className="text-primary w-8 h-8" />
                </div>
                <span className="text-xs">Plugins</span>
              </div>
            </div>
            <div className="absolute top-10 right-10 text-xs bg-primary/10 p-2 rounded">Customize with plugins</div>
          </div>
        );
      case 3: // Contextual
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="neural-node w-24 h-24 flex items-center justify-center mb-4">
              <Brain className="text-primary w-12 h-12" />
            </div>
            <div className="absolute top-10 left-10 neural-node w-16 h-16 flex items-center justify-center">
              <span className="text-xs">Work</span>
            </div>
            <div className="absolute bottom-10 left-20 neural-node w-16 h-16 flex items-center justify-center">
              <span className="text-xs">Study</span>
            </div>
            <div className="absolute top-20 right-10 neural-node w-16 h-16 flex items-center justify-center">
              <span className="text-xs">Personal</span>
            </div>
            <div className="absolute bottom-20 right-20 neural-node w-16 h-16 flex items-center justify-center">
              <span className="text-xs">Projects</span>
            </div>
            <div className="absolute rounded-full border-2 border-primary/30 w-48 h-48 animate-pulse-slow opacity-40"></div>
          </div>
        );
      case 4: // Intelligence
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="neural-node w-24 h-24 flex items-center justify-center">
                  <Brain className="text-primary w-12 h-12" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500/30 flex items-center justify-center">
                  <span className="text-amber-600 text-xs">AI</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="glass-panel p-2 rounded text-xs text-center">Analyze</div>
                <div className="glass-panel p-2 rounded text-xs text-center">Connect</div>
                <div className="glass-panel p-2 rounded text-xs text-center">Suggest</div>
              </div>
            </div>
            <div className="absolute top-10 right-10 text-xs bg-primary/10 p-2 rounded">AI insights</div>
          </div>
        );
      case 7: // Search
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="glass-panel rounded-full px-4 py-2 w-3/4 flex items-center mb-6">
              <Search className="text-primary w-5 h-5 mr-2" />
              <div className="h-5 w-full bg-primary/10 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-3/4">
              <div className="glass-panel p-3 rounded-md h-10"></div>
              <div className="glass-panel p-3 rounded-md h-10"></div>
              <div className="glass-panel p-3 rounded-md h-10"></div>
              <div className="glass-panel p-3 rounded-md h-10"></div>
            </div>
            <div className="absolute bottom-10 right-10 text-xs bg-primary/10 p-2 rounded">Smart search results</div>
          </div>
        );
      case 10: // Share
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="neural-node w-20 h-20 flex items-center justify-center">
              <Brain className="text-primary w-10 h-10" />
            </div>
            <Share className="absolute right-20 top-1/3 text-primary w-10 h-10" />
            <div className="absolute right-16 bottom-1/3 flex space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="text-primary w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="text-primary w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="text-primary w-4 h-4" />
              </div>
            </div>
            <div className="absolute top-10 left-10 text-xs bg-primary/10 p-2 rounded">Share knowledge</div>
          </div>
        );
      default:
        // Default diagram with dynamic layout based on feature index
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="neural-node w-24 h-24 flex items-center justify-center">
              <FeatureIcon index={featureIndex} size={40} />
            </div>
            <div className="absolute top-[20%] left-[15%] neural-node w-12 h-12 flex items-center justify-center animate-pulse-slow">
              <FeatureIcon index={featureIndex} size={20} />
            </div>
            <div className="absolute bottom-[20%] right-[15%] neural-node w-12 h-12 flex items-center justify-center animate-pulse-slow delay-300">
              <FeatureIcon index={featureIndex} size={20} />
            </div>
            <div className="absolute top-[60%] right-[25%] neural-node w-10 h-10 flex items-center justify-center animate-pulse-slow delay-500">
              <FeatureIcon index={featureIndex} size={16} />
            </div>
            <div className="absolute bottom-[30%] left-[25%] neural-node w-10 h-10 flex items-center justify-center animate-pulse-slow delay-700">
              <FeatureIcon index={featureIndex} size={16} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "w-full rounded-xl overflow-hidden shadow-xl bg-card/30 backdrop-blur-sm border border-border/50",
      className
    )}>
      <div className={cn(
        "relative h-64 w-full bg-gradient-to-br p-8",
        bgColor
      )}>
        {/* Background neural network nodes */}
        <div className="absolute inset-0 w-full h-full overflow-hidden opacity-40">
          <div className="absolute top-[20%] left-[15%] w-8 h-8 rounded-full bg-primary/30 animate-pulse-slow"></div>
          <div className="absolute top-[60%] left-[25%] w-6 h-6 rounded-full bg-primary/20 animate-pulse-slow delay-300"></div>
          <div className="absolute top-[30%] left-[60%] w-10 h-10 rounded-full bg-primary/30 animate-pulse-slow delay-700"></div>
          <div className="absolute top-[70%] right-[20%] w-8 h-8 rounded-full bg-primary/20 animate-pulse-slow delay-500"></div>
          <div className="absolute top-[40%] right-[30%] w-6 h-6 rounded-full bg-primary/30 animate-pulse-slow delay-200"></div>
          <div className="absolute top-[20%] right-[10%] w-4 h-4 rounded-full bg-primary/20 animate-pulse-slow delay-600"></div>
        </div>

        {/* Diagram specific to each feature */}
        <div className="relative z-10 h-full">
          {renderDiagram(featureIndex)}
        </div>
      </div>

      {/* Title and description */}
      <div className="p-4 bg-card/50 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-2 text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
