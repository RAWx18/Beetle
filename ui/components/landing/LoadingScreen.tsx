
import { Brain } from 'lucide-react';

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <div className="animate-spin-slow w-16 h-16 text-primary">
        <Brain size={64} className="drop-shadow-lg" />
      </div>
      <p className="mt-4 text-muted-foreground animate-pulse">Loading your second brain...</p>
    </div>
  );
};
