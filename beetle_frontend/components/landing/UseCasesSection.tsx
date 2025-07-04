import { useState } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { cn } from '@/lib/utils';
import { UserType } from './UseCasesTypes';
import { userCasesData, booksData } from './UserCasesData';

// Import individual case components
import MarketersCase from './UserCases/MarketersCase';
import DesignersCase from './UserCases/DesignersCase';
import WritersCase from './UserCases/WritersCase';
import ResearchersCase from './UserCases/ResearchersCase';
import DevelopersCase from './UserCases/DevelopersCase';
import EveryoneCase from './UserCases/EveryoneCase';
interface UseCasesSectionProps {
  show: boolean;
}
const UseCasesSection = ({
  show
}: UseCasesSectionProps) => {
  const [activeUserType, setActiveUserType] = useState<UserType>('Marketers');
  const currentCase = userCasesData[activeUserType];
  return <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <div className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 mb-16">
          <h2 className="text-3xl text-center mb-12 tracking-tight text-blue-700 font-bold md:text-7xl">
            For visual minds of all kinds.
          </h2>
          
          <div className="flex justify-center space-x-8 mb-10">
            {Object.keys(userCasesData).map(type => <button key={type} className={cn("relative pb-1", activeUserType === type ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground transition-colors")} onClick={() => setActiveUserType(type as UserType)}>
                {type}
                {activeUserType === type && <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
              </button>)}
          </div>
          
          <div className={cn("rounded-xl overflow-hidden transition-all duration-500", currentCase.background)}>
            <div className="p-10 md:p-16 bg-blue-600">
              <div className="text-center mb-4">
                <p className="uppercase tracking-wide text-sm font-medium mb-6 text-white">Made for {activeUserType}</p>
                <h3 className="text-4xl md:text-5xl font-medium mb-2 text-white">
                  {currentCase.title} 
                  <span className="block italic font-light">{currentCase.subtitle}</span>
                </h3>
              </div>
              
              {/* Render the appropriate component based on activeUserType */}
              {activeUserType === 'Marketers' && <MarketersCase data={currentCase} />}
              {activeUserType === 'Designers' && <DesignersCase data={currentCase} />}
              {activeUserType === 'Writers' && <WritersCase data={currentCase} />}
              {activeUserType === 'Researchers' && <ResearchersCase data={currentCase} />}
              {activeUserType === 'Developers' && <DevelopersCase data={currentCase} />}
              {activeUserType === 'Everyone' && <EveryoneCase data={currentCase} books={booksData} />}
            </div>
          </div>
        </div>
      </div>
    </AnimatedTransition>;
};
export default UseCasesSection;