
import { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserCase } from '../UseCasesTypes';
import { Book } from '../UseCasesTypes';

interface EveryoneProps {
  data: UserCase;
  books: Book[];
}

const EveryoneCase = ({ data, books }: EveryoneProps) => {
  const [activeBookIndex, setActiveBookIndex] = useState(0);
  
  const nextBook = () => {
    setActiveBookIndex(prev => (prev + 1) % books.length);
  };
  
  const prevBook = () => {
    setActiveBookIndex(prev => (prev - 1 + books.length) % books.length);
  };
  
  return (
    <div className="flex justify-center my-12">
      <div className="flex flex-col items-center max-w-3xl">
        <div className="flex items-center gap-6 mb-8">
          <Button variant="ghost" className="rounded-full h-12 w-12 p-0 bg-white/20 backdrop-blur-sm hover:bg-white/30" onClick={prevBook}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div className="relative">
            {/* Book display */}
            <div className={`h-[300px] w-[200px] ${books[activeBookIndex].coverColor} text-white rounded-md shadow-lg flex flex-col relative overflow-hidden`}>
              {/* Book spine effect */}
              <div className="absolute left-0 top-0 h-full w-[10px] bg-black/20"></div>
              
              {/* Book content */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <BookOpen className="h-10 w-10 mb-4 opacity-80" />
                  <h4 className="text-xl font-bold leading-tight mb-2">{books[activeBookIndex].title}</h4>
                  <p className="text-sm opacity-90">by {books[activeBookIndex].author}</p>
                </div>
                
                <div className="mt-8">
                  <p className="text-xs opacity-70">#readlater #inspiration</p>
                </div>
              </div>
            </div>
            
            {/* Book shadow/reflection effect */}
            <div className={`h-[20px] w-[180px] mx-auto mt-[-5px] rounded-full bg-black/20 blur-md`}></div>
          </div>
          
          <Button variant="ghost" className="rounded-full h-12 w-12 p-0 bg-white/20 backdrop-blur-sm hover:bg-white/30" onClick={nextBook}>
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EveryoneCase;
