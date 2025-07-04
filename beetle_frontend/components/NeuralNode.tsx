import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { NeuralNodeData } from '@/lib/types';
import AnimatedTransition from './AnimatedTransition';

interface NeuralNodeProps {
  node: NeuralNodeData;
  onClick: (id: string) => void;
  isActive: boolean;
  index: number;
}

export const NeuralNode: React.FC<NeuralNodeProps> = ({ 
  node, 
  onClick, 
  isActive,
  index 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const size = node.size || Math.floor(Math.random() * 30) + 40; // Random size between 40-70px
  
  const typeColors = {
    note: 'from-primary/40 to-secondary/40',
    link: 'from-accent/40 to-primary/40',
    file: 'from-muted/40 to-primary/40',
    image: 'from-secondary/40 to-accent/40',
    project: 'from-primary/40 to-accent/40',
  };
  
  const nodeColor = node.color || typeColors[node.type];
  
  return (
    <AnimatedTransition 
      show={true} 
      animation="scale"
      duration={300 + index * 50}
      className="absolute"
      style={{ 
        left: node.x || `${Math.random() * 80 + 10}%`, 
        top: node.y || `${Math.random() * 80 + 10}%`,
        zIndex: isActive ? 10 : 1
      }}
    >
      <div
        className={cn(
          "neural-node relative cursor-pointer transition-all duration-300 flex items-center justify-center",
          "bg-gradient-to-br",
          nodeColor,
          isActive && "accent-glow scale-110",
          isHovered && "scale-105"
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: isActive ? 'scale(1.1)' : isHovered ? 'scale(1.05)' : 'scale(1)',
          animation: `float ${Math.floor(Math.random() * 4) + 2}s infinite ease-in-out`,
        }}
        onClick={() => onClick(node.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {(isHovered || isActive) && (
          <AnimatedTransition 
            show={true} 
            animation="fade"
            className="absolute -bottom-10 whitespace-nowrap bg-background/90 text-foreground px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-border/50"
          >
            {node.title}
          </AnimatedTransition>
        )}
      </div>
    </AnimatedTransition>
  );
};

export default NeuralNode;
