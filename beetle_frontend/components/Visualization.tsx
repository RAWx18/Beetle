"use client";

import React, { useState, useEffect, useRef } from 'react';
import NeuralNode from './NeuralNode';
import { NeuralNodeData } from '@/lib/types';
import AnimatedTransition from './AnimatedTransition';

// Sample data for demonstration
const sampleNodes: NeuralNodeData[] = [
  { id: '1', title: 'Artificial Intelligence', type: 'note', connections: ['2', '3', '5'] },
  { id: '2', title: 'Machine Learning', type: 'note', connections: ['1', '3', '4'] },
  { id: '3', title: 'Neural Networks', type: 'note', connections: ['1', '2', '5'] },
  { id: '4', title: 'Deep Learning Paper', type: 'file', connections: ['2', '6'] },
  { id: '5', title: 'AI Research', type: 'project', connections: ['1', '3'] },
  { id: '6', title: 'Data Visualization', type: 'link', connections: ['4', '7'] },
  { id: '7', title: 'Network Diagram', type: 'image', connections: ['6'] },
  { id: '8', title: 'Programming', type: 'note', connections: ['9', '10'] },
  { id: '9', title: 'Python', type: 'note', connections: ['8', '2'] },
  { id: '10', title: 'JavaScript', type: 'note', connections: ['8', '11'] },
  { id: '11', title: 'Web Development', type: 'project', connections: ['10'] },
  { id: '12', title: 'Design', type: 'note', connections: ['13', '14'] },
  { id: '13', title: 'UI/UX', type: 'link', connections: ['12'] },
  { id: '14', title: 'Typography', type: 'image', connections: ['12'] },
];

export const Visualization: React.FC = () => {
  const [nodes, setNodes] = useState<NeuralNodeData[]>(sampleNodes);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Add random positions to nodes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const nodesWithPositions = nodes.map(node => ({
      ...node,
      x: node.x || Math.random() * (width - 100) + 50,
      y: node.y || Math.random() * (height - 100) + 50,
    }));
    
    setNodes(nodesWithPositions);
  }, []);
  
  useEffect(() => {
    if (activeNode) {
      setTimeout(() => {
        setShowConnections(true);
      }, 400);
    } else {
      setShowConnections(false);
    }
  }, [activeNode]);
  
  const handleNodeClick = (id: string) => {
    setActiveNode(prevActive => prevActive === id ? null : id);
  };
  
  const getActiveNodeConnections = () => {
    if (!activeNode) return [];
    
    const active = nodes.find(node => node.id === activeNode);
    if (!active) return [];
    
    return active.connections.map(connId => {
      return {
        from: nodes.find(n => n.id === activeNode),
        to: nodes.find(n => n.id === connId)
      };
    }).filter(conn => conn.from && conn.to) as {
      from: NeuralNodeData;
      to: NeuralNodeData;
    }[];
  };
  
  const connections = getActiveNodeConnections();
  
  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {/* Neural connections */}
      {showConnections && connections.map((conn, index) => {
        if (!conn.from || !conn.to) return null;
        
        const fromX = conn.from.x || 0;
        const fromY = conn.from.y || 0;
        const toX = conn.to.x || 0;
        const toY = conn.to.y || 0;
        
        // Calculate line properties
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        return (
          <AnimatedTransition
            key={`conn-${conn.from.id}-${conn.to.id}`}
            show={true}
            animation="fade"
            duration={200 + index * 50}
            className="absolute neural-connection"
            style={{
              left: fromX,
              top: fromY,
              width: length,
              height: 2,
              transformOrigin: '0 0',
              transform: `rotate(${angle}deg)`,
              zIndex: 0,
            }}
          />
        );
      })}
      
      {/* Neural nodes */}
      {nodes.map((node, index) => (
        <NeuralNode
          key={node.id}
          node={node}
          onClick={handleNodeClick}
          isActive={activeNode === node.id}
          index={index}
        />
      ))}
      
      {/* Detail panel for selected node */}
      <AnimatedTransition
        show={!!activeNode}
        animation="slide-up"
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md glass-panel rounded-xl p-6"
      >
        {activeNode && (
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-balance">
              {nodes.find(n => n.id === activeNode)?.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {nodes.find(n => n.id === activeNode)?.content || 
               "This is a brief description of this neural node. It contains information that can be expanded and explored further."}
            </p>
            <div className="flex gap-2 pt-2">
              <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                {nodes.find(n => n.id === activeNode)?.type}
              </span>
              <span className="text-xs font-medium bg-secondary/10 text-secondary px-3 py-1 rounded-full">
                {connections.length} connections
              </span>
            </div>
          </div>
        )}
      </AnimatedTransition>
    </div>
  );
};

export default Visualization;
