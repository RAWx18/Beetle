
import React from 'react';
import { SearchIcon, SendIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  searchQuery,
  setSearchQuery,
  handleSubmit,
  isFocused,
  setIsFocused
}) => {
  return (
    <div className="p-4 border-t">
      <form 
        onSubmit={handleSubmit}
        className="relative"
      >
        <div className={cn(
          "w-full glass-panel flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
          isFocused ? "ring-2 ring-primary/30" : ""
        )}>
          <SearchIcon 
            size={20} 
            className={cn(
              "text-muted-foreground transition-all duration-300",
              isFocused ? "text-primary" : ""
            )} 
          />
          <input
            type="text"
            placeholder="Ask your second brain anything..."
            className="w-full bg-transparent border-none outline-none focus:outline-none text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <Button 
            type="submit"
            size="icon"
            variant="ghost"
            className={cn(
              "text-muted-foreground transition-all duration-300",
              searchQuery.trim() ? "opacity-100" : "opacity-50",
              isFocused && searchQuery.trim() ? "text-primary" : ""
            )}
            disabled={!searchQuery.trim()}
          >
            <SendIcon size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
