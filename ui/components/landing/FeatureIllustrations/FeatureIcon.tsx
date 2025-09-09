
import React from 'react';
import { 
  Plus, Puzzle, BrainCircuit, Brain, 
  Sparkles, Paperclip, Monitor, Search, 
  Lock, ScanSearch, Share, Sun 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureIconProps {
  index: number;
  size?: number;
  className?: string;
}

export const FeatureIcon: React.FC<FeatureIconProps> = ({ 
  index, 
  size = 64,
  className 
}) => {
  const icons = [
    <Plus key="plus" size={size} strokeWidth={1.5} />,             // Add Cells
    <Puzzle key="puzzle" size={size} strokeWidth={1.5} />,           // Plug & Play
    <BrainCircuit key="brain-circuit" size={size} strokeWidth={1.5} />,     // Spatial Thinking
    <Brain key="brain" size={size} strokeWidth={1.5} />,            // Contextual
    <Sparkles key="sparkles" size={size} strokeWidth={1.5} />,         // Intelligence
    <Paperclip key="paperclip" size={size} strokeWidth={1.5} />,        // Clip
    <Monitor key="monitor" size={size} strokeWidth={1.5} />,          // Agnostic
    <Search key="search" size={size} strokeWidth={1.5} />,           // Search
    <Lock key="lock" size={size} strokeWidth={1.5} />,             // Private
    <ScanSearch key="scansearch" size={size} strokeWidth={1.5} />,       // Recognition
    <Share key="share" size={size} strokeWidth={1.5} />,            // Share
    <Sun key="sun" size={size} strokeWidth={1.5} />               // D/L mode
  ];

  return (
    <div className={cn("text-primary", className)}>
      {icons[index % icons.length]}
    </div>
  );
};
