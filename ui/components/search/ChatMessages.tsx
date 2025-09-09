import React from 'react';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Chat, ChatMessage } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

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
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Custom styling for different markdown elements
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-medium mb-1">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-medium mb-1">{children}</h4>,
                    p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-2">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      if (isInline) {
                        return <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>;
                      }
                      return <code className={className}>{children}</code>;
                    },
                    pre: ({ children }) => (
                      <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-2">
                        {children}
                      </pre>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-2">
                        <table className="min-w-full border border-border">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-border px-3 py-2 text-left font-medium bg-muted">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-border px-3 py-2">
                        {children}
                      </td>
                    ),
                    a: ({ children, href }) => (
                      <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    hr: () => <hr className="border-border my-4" />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
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
