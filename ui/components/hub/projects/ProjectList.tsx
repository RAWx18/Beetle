
import { Repository } from '@/lib/github-api';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  projects: Repository[];
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {projects.map((project) => (
      <ProjectCard key={project.id} repo={project} />
    ))}
  </div>
);
