
import React from 'react';
import { ProjectWithStage, ProjectStage } from './types';
import { CheckCircle2, Clock, Flag, MessageSquare, Plus } from 'lucide-react';
import ProjectCard from './ProjectCard';

interface ProjectStageColumnProps {
  stage: ProjectStage;
  projects: ProjectWithStage[];
  onDragStart: (project: ProjectWithStage) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (stage: ProjectStage) => void;
  onEdit: (project: ProjectWithStage) => void;
  onMoveNext: (projectId: string) => void;
  onAddNew?: () => void;
}

const ProjectStageColumn: React.FC<ProjectStageColumnProps> = ({
  stage,
  projects,
  onDragStart,
  onDragOver,
  onDrop,
  onEdit,
  onMoveNext,
  onAddNew
}) => {
  const renderStageIcon = (stage: ProjectStage) => {
    switch (stage) {
      case 'planning':
        return <Flag className="h-5 w-5 text-blue-500" />;
      case 'inProgress':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'review':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };
  
  const renderStageLabel = (stage: ProjectStage) => {
    switch (stage) {
      case 'planning':
        return 'Planning';
      case 'inProgress':
        return 'In Progress';
      case 'review':
        return 'Under Review';
      case 'completed':
        return 'Completed';
      default:
        return '';
    }
  };
  
  const renderStageColor = (stage: ProjectStage) => {
    switch (stage) {
      case 'planning':
        return 'bg-blue-500/10 text-blue-500 border-blue-200';
      case 'inProgress':
        return 'bg-amber-500/10 text-amber-500 border-amber-200';
      case 'review':
        return 'bg-purple-500/10 text-purple-500 border-purple-200';
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-200';
    }
  };

  const stageProjects = projects.filter(project => project.stage === stage);

  return (
    <div 
      className="space-y-4"
      onDragOver={onDragOver}
      onDrop={() => onDrop(stage)}
    >
      <div className={`flex items-center justify-between p-3 rounded-lg ${renderStageColor(stage)} border`}>
        <div className="flex items-center gap-2">
          {renderStageIcon(stage)}
          <h3 className="font-medium">{renderStageLabel(stage)}</h3>
        </div>
        
        {stage === 'planning' && onAddNew && (
          <button 
            onClick={onAddNew}
            className="p-1 rounded-full hover:bg-background/80"
          >
            <Plus size={18} />
          </button>
        )}
      </div>
      
      <div className="space-y-3 min-h-[200px]">
        {stageProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onDragStart={onDragStart}
            onEdit={onEdit}
            onMoveNext={onMoveNext}
            stage={stage}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectStageColumn;
