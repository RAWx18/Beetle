
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ProjectWithStage } from './types';

interface ProjectEditorProps {
  project: ProjectWithStage;
  onSave: () => void;
  onCancel: () => void;
  onChange: (updatedProject: ProjectWithStage) => void;
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({ 
  project, 
  onSave, 
  onCancel, 
  onChange 
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Project</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectTitle">Project Title</Label>
          <Input 
            id="projectTitle" 
            value={project.title}
            onChange={(e) => onChange({...project, title: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectDescription">Description</Label>
          <Input 
            id="projectDescription" 
            value={project.description}
            onChange={(e) => onChange({...project, description: e.target.value})}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectEditor;
