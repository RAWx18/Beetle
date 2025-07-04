import { UserCase } from '../UseCasesTypes';

interface DevelopersProps {
  data: UserCase;
}

const DevelopersCase = ({ data }: DevelopersProps) => {
  return (
    <div className="max-w-3xl mx-auto my-12">
      <div className="bg-background text-foreground rounded-lg p-4 mt-4">
        <div className="flex items-center border-b border-border pb-3 mb-3">
          <div className="text-muted-foreground italic flex-1">Search my mind...</div>
          <div className="text-muted-foreground">⌘K</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted rounded p-3">
            <div className="flex items-center mb-2">
              <div className="size-4 rounded-full bg-primary mr-2"></div>
              <span className="text-sm text-foreground">GitHub</span>
            </div>
            <p className="text-xs text-muted-foreground">Tailwind Labs</p>
          </div>
          <div className="bg-muted rounded p-3">
            <p className="bg-border text-xs text-foreground inline-block px-1 rounded mb-1">$5999</p>
            <div className="h-12 bg-gradient-to-b from-primary/30 to-primary/60 rounded"></div>
          </div>
          <div className="bg-muted rounded p-3">
            <div className="size-10 rounded bg-gradient-to-r from-accent via-primary to-secondary"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevelopersCase;
