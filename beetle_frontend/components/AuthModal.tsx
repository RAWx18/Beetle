import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Github, Loader2, PlayCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { login, loginDemo, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
      // The login function will redirect to GitHub OAuth
      // No need to close modal here as user will be redirected
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = () => {
    loginDemo();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Github className="w-5 h-5" />
            Login to Beetle
          </DialogTitle>
          <DialogDescription>
            Connect your GitHub account or try the demo to access Beetle's branch-level intelligence features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Access your repositories and branches
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Get intelligent insights and analytics
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Collaborate with branch-level intelligence
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <strong>Note:</strong> Beetle will only access your public repositories and basic profile information. 
            Your private data remains secure and is not stored on our servers.
          </div>
        </div>
        
        <DialogFooter className="flex flex-col gap-2">
          <Button 
            onClick={handleLogin} 
            disabled={isLoggingIn || loading}
            className="w-full bg-black hover:bg-gray-800 text-white"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting to GitHub...
              </>
            ) : (
              <>
                <Github className="w-4 h-4 mr-2" />
                Continue with GitHub
              </>
            )}
          </Button>
          
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleDemoLogin}
            className="w-full"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Try Demo Mode
          </Button>
          
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
