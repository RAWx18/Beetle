import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UserCase } from '../UseCasesTypes';
interface MarketersProps {
  data: UserCase;
}
const MarketersCase = ({
  data
}: MarketersProps) => {
  return <div className="max-w-3xl mx-auto my-12">
      <p className="text-lg mb-8 text-slate-50">{data.description}</p>
      <div className="bg-yellow-200 text-black p-6 rounded mb-8 max-w-md mx-auto">
        <p className="text-4xl italic font-light">"{data.quote}"</p>
      </div>
      <div className="flex justify-end">
        <Button className="rounded-full bg-white text-black hover:bg-white/90">
          <Plus className="mr-2 h-4 w-4" />
          {data.ctaText}
        </Button>
      </div>
    </div>;
};
export default MarketersCase;