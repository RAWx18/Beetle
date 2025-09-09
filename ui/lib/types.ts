
export interface NeuralNodeData {
  id: string;
  title: string;
  type: 'note' | 'link' | 'file' | 'image' | 'project';
  content?: string;
  connections: string[];
  size?: number;
  x?: number;
  y?: number;
  color?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed';
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  description?: string;
  links?: {
    title: string;
    url: string;
  }[];
  projects?: Project[];
}

export interface ImportSource {
  id: string;
  name: string;
  type: 'csv' | 'api' | 'url' | 'file' | 'text' | 'branch' | 'control-panel';
  icon: string;
  description: string;
}
