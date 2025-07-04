
import React, { useState } from 'react';
import { ProjectWithStage, ProjectStage } from './projects/types';
import { enhancedProjects } from './projects/mockData';
import ProjectStageColumn from './projects/ProjectStageColumn';
import ProjectEditor from './projects/ProjectEditor';

const ProjectRoadmap: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithStage[]>(enhancedProjects);
  const [editingProject, setEditingProject] = useState<ProjectWithStage | null>(null);
  const [draggedProject, setDraggedProject] = useState<ProjectWithStage | null>(null);
  
  const addNewProject = () => {
    const newProject: ProjectWithStage = {
      id: Date.now().toString(),
      title: 'New Project',
      description: 'Click to edit project details',
      status: 'active',
      stage: 'planning',
      reviewCount: 0,
      reviewScore: 0
    };
    
    setProjects([...projects, newProject]);
  };
  
  const moveToNextStage = (projectId: string) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        const stageOrder: ProjectStage[] = ['planning', 'inProgress', 'review', 'completed'];
        const currentIndex = stageOrder.indexOf(project.stage!);
        
        if (currentIndex < stageOrder.length - 1) {
          return { ...project, stage: stageOrder[currentIndex + 1] };
        }
      }
      return project;
    }));
  };
  
  const handleDragStart = (project: ProjectWithStage) => {
    setDraggedProject(project);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (targetStage: ProjectStage) => {
    if (draggedProject && draggedProject.stage !== targetStage) {
      setProjects(projects.map(project => 
        project.id === draggedProject.id 
          ? { ...project, stage: targetStage } 
          : project
      ));
      setDraggedProject(null);
    }
  };
  
  const startEditingProject = (project: ProjectWithStage) => {
    setEditingProject({...project});
  };
  
  const saveProjectChanges = () => {
    if (editingProject) {
      setProjects(projects.map(project => 
        project.id === editingProject.id ? editingProject : project
      ));
      setEditingProject(null);
    }
  };
  
  const cancelEditingProject = () => {
    setEditingProject(null);
  };
  
  const updateEditingProject = (updatedProject: ProjectWithStage) => {
    setEditingProject(updatedProject);
  };
  
  if (editingProject) {
    return (
      <ProjectEditor
        project={editingProject}
        onSave={saveProjectChanges}
        onCancel={cancelEditingProject}
        onChange={updateEditingProject}
      />
    );
  }
  
  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-4 gap-4">
        {(['planning', 'inProgress', 'review', 'completed'] as ProjectStage[]).map(stage => (
          <ProjectStageColumn
            key={stage}
            stage={stage}
            projects={projects}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEdit={startEditingProject}
            onMoveNext={moveToNextStage}
            onAddNew={stage === 'planning' ? addNewProject : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectRoadmap;
