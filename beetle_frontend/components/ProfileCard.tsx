
import React from 'react';
import { UserProfile } from '@/lib/types';
import { ExternalLink, Mail, Plus } from 'lucide-react';

const sampleProfile: UserProfile = {
  name: 'Alex Johnson',
  email: 'alex@example.com',
  description: 'AI researcher and knowledge management enthusiast. Building a digital second brain to enhance creativity and productivity.',
  links: [
    { title: 'Personal Website', url: 'https://example.com' },
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'Twitter', url: 'https://twitter.com' },
  ],
  projects: [
    { 
      id: '1', 
      title: 'AI Research Database', 
      description: 'A collection of papers and notes on artificial intelligence and machine learning.',
      status: 'active'
    },
    { 
      id: '2', 
      title: 'Knowledge Management System', 
      description: 'A comprehensive system for organizing and retrieving information.',
      status: 'active'
    },
    { 
      id: '3', 
      title: 'Digital Garden', 
      description: 'A collection of interconnected notes and thoughts on various topics.',
      status: 'completed'
    },
  ]
};

export const ProfileCard: React.FC = () => {
  const profile = sampleProfile;
  
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="glass-panel rounded-xl p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
          <span className="text-4xl font-light">{profile.name.charAt(0)}</span>
        </div>
        
        <h2 className="text-2xl font-semibold mt-4">{profile.name}</h2>
        
        <div className="flex items-center justify-center mt-2">
          <Mail size={16} className="text-muted-foreground mr-2" />
          <span className="text-muted-foreground">{profile.email}</span>
        </div>
        
        <p className="mt-4 text-muted-foreground max-w-md mx-auto">
          {profile.description}
        </p>
        
        <div className="flex justify-center gap-3 mt-6">
          {profile.links?.map((link, index) => (
            <a 
              key={index} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary-foreground text-sm font-medium hover:bg-secondary/20 transition-colors"
            >
              {link.title}
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
      </div>
      
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Active Projects</h3>
          <button className="inline-flex items-center gap-1 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Plus size={16} />
          </button>
        </div>
        
        <div className="space-y-4">
          {profile.projects?.filter(p => p.status === 'active').map(project => (
            <div key={project.id} className="p-4 rounded-lg bg-background/50 hover:bg-background transition-colors cursor-pointer">
              <h4 className="font-medium">{project.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {project.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-lg font-medium mb-4">Completed Projects</h3>
        
        <div className="space-y-4">
          {profile.projects?.filter(p => p.status === 'completed').map(project => (
            <div key={project.id} className="p-4 rounded-lg bg-background/50">
              <h4 className="font-medium">{project.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {project.description}
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-500">
                Completed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
