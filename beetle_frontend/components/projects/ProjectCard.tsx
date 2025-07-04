
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { ProjectWithStage } from './types';
import { Edit, Star, Users } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectWithStage;
  onDragStart: (project: ProjectWithStage) => void;
  onEdit: (project: ProjectWithStage) => void;
  onMoveNext: (projectId: string) => void;
  stage: ProjectWithStage['stage'];
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onDragStart, 
  onEdit, 
  onMoveNext,
  stage 
}) => {
  return (
    <Card 
      key={project.id} 
      className="border transition-all hover:shadow-md cursor-pointer"
      draggable
      onDragStart={() => onDragStart(project)}
      onClick={() => onEdit(project)}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{project.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-2">
        <p className="text-sm text-muted-foreground">
          {project.description}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-2 flex items-center justify-between">
        {stage === 'review' && (
          <div className="flex items-center gap-1">
            <Users size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{project.reviewCount} reviews</span>
          </div>
        )}
        
        {stage === 'completed' && project.reviewScore! > 0 && (
          <div className="flex items-center gap-1">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-xs text-muted-foreground">{project.reviewScore?.toFixed(1)}</span>
          </div>
        )}
        
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project);
            }}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 transition-colors"
          >
            <Edit size={12} />
            Edit
          </button>
          
          {stage !== 'completed' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMoveNext(project.id);
              }}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {stage === 'planning' ? 'Start' : stage === 'inProgress' ? 'Submit for Review' : 'Complete'}
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
