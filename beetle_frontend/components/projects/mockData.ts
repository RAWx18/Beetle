
import { ProjectWithStage } from './types';

export const enhancedProjects: ProjectWithStage[] = [
  { 
    id: '1', 
    title: 'AI Research Database', 
    description: 'A collection of papers and notes on artificial intelligence and machine learning.',
    status: 'active',
    stage: 'inProgress',
    reviewCount: 0,
    reviewScore: 0
  },
  { 
    id: '2', 
    title: 'Knowledge Management System', 
    description: 'A comprehensive system for organizing and retrieving information.',
    status: 'active',
    stage: 'planning',
    reviewCount: 0,
    reviewScore: 0
  },
  { 
    id: '3', 
    title: 'Digital Garden', 
    description: 'A collection of interconnected notes and thoughts on various topics.',
    status: 'completed',
    stage: 'completed',
    reviewCount: 5,
    reviewScore: 4.8
  },
  { 
    id: '4', 
    title: 'Neural Link Explorer', 
    description: 'A tool for visualizing connections between concepts in a knowledge base.',
    status: 'active',
    stage: 'review',
    reviewCount: 3,
    reviewScore: 4.2
  },
];
