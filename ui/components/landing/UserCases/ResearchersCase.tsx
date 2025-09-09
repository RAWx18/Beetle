
import { Brain } from 'lucide-react';
import { UserCase } from '../UseCasesTypes';

interface ResearchersProps {
  data: UserCase;
}

const ResearchersCase = ({ data }: ResearchersProps) => {
  return (
    <div className="flex flex-col items-center justify-center my-12">
      <div className="relative max-w-md mx-auto bg-white/20 backdrop-blur-sm p-6 rounded-lg shadow-sm">
        <Brain className="max-w-full h-auto w-64 mx-auto text-white/90" />
        <div className="absolute right-12 top-12 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-medium shadow-sm flex items-center">
          <span className="size-3 bg-red-300 rounded-full mr-2"></span>
          Cognitive Functions
        </div>
      </div>
    </div>
  );
};

export default ResearchersCase;
