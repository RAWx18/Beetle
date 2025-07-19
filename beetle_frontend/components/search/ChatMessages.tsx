import React from 'react';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Chat, ChatMessage } from '@/types/chat';

interface ChatMessagesProps {
  activeChat: Chat | null;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ activeChat }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <AnimatedTransition
        show={(activeChat?.messages?.length ?? 0) === 0}
        animation="fade"
        className="h-full flex items-center justify-center"
      >
        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-xl font-medium">Chat with Beetle</h3>
          <p className="text-muted-foreground">
            Ask questions to search across your branches, documents, and knowledge base.
          </p>
        </div>
      </AnimatedTransition>
      
      <AnimatedTransition
        show={(activeChat?.messages?.length ?? 0) > 0}
        animation="fade"
        className="space-y-4"
      >
        {activeChat?.messages?.map((message: ChatMessage) => (
          <div 
            key={message.id}
            className={cn(
              "flex gap-3 p-4 rounded-lg",
              message.type === 'user' 
                ? "bg-primary/10 ml-auto max-w-[80%]" 
                : "bg-muted/10 mr-auto max-w-[80%]"
            )}
          >
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              message.type === 'user' ? "bg-primary/20" : "bg-secondary/20"
            )}>
              {message.type === 'user' ? (
                <User size={16} className="text-primary" />
              ) : (
                <Bot size={16} className="text-secondary" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm">{message.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
      </AnimatedTransition>
    </div>
  );
};

export default ChatMessages;
