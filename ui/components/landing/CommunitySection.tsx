import { Users, Sparkles, GitBranch, MessageSquare } from 'lucide-react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { Button } from '@/components/ui/button';
interface CommunitySectionProps {
  show: boolean;
}
export const CommunitySection = ({
  show
}: CommunitySectionProps) => {
  const communityMembers = [{
    name: "Alex Thompson",
    role: "Data Scientist",
    avatar: `https://source.unsplash.com/random/100x100?face-1`,
    contribution: "Knowledge Graph Algorithms"
  }, {
    name: "Mira Chen",
    role: "Professor",
    avatar: `https://source.unsplash.com/random/100x100?face-2`,
    contribution: "Educational Templates"
  }, {
    name: "Jason Wright",
    role: "Product Designer",
    avatar: `https://source.unsplash.com/random/100x100?face-3`,
    contribution: "UI Components"
  }, {
    name: "Sophia Kim",
    role: "Researcher",
    avatar: `https://source.unsplash.com/random/100x100?face-4`,
    contribution: "Citation System"
  }, {
    name: "Marcus Jones",
    role: "Student",
    avatar: `https://source.unsplash.com/random/100x100?face-5`,
    contribution: "Study Guides"
  }];
  const forums = [{
    title: "Research Methodology Templates",
    replies: 42,
    views: 1256,
    category: "Templates"
  }, {
    title: "Best practices for literature notes",
    replies: 36,
    views: 982,
    category: "Workflows"
  }, {
    title: "Automated tagging strategies",
    replies: 28,
    views: 874,
    category: "Automation"
  }];
  return <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <div className="mt-24 mb-16">
        
        
        
        
        
      </div>
    </AnimatedTransition>;
};