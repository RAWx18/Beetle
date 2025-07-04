
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chat } from '@/types/chat';
import { PlusCircle, Edit3, Trash2, SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupChatsByDate } from '@/utils/chatUtils';

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  setActiveChat: (chat: Chat) => void;
  createNewChat: () => void;
  deleteChat: (chatId: string, e: React.MouseEvent) => void;
  showSidebar: boolean;
  isEditingTitle: string | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  startEditingTitle: (chatId: string, e: React.MouseEvent) => void;
  saveTitle: (chatId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  activeChat,
  setActiveChat,
  createNewChat,
  deleteChat,
  showSidebar,
  isEditingTitle,
  editTitle,
  setEditTitle,
  startEditingTitle,
  saveTitle
}) => {
  return (
    <div className={cn(
      "h-full bg-muted/30 border-r transition-all duration-300",
      showSidebar ? "w-64" : "w-0 overflow-hidden"
    )}>
      <div className="h-full flex flex-col">
        <div className="p-3">
          <Button 
            onClick={createNewChat}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <PlusCircle size={16} />
            New Chat
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {groupChatsByDate(chats).map(([dateGroup, dateChats]) => (
            <div key={dateGroup} className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground px-2">{dateGroup}</h3>
              
              {dateChats.map(chat => (
                <div 
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={cn(
                    "p-2 rounded-lg flex items-center gap-2 cursor-pointer group",
                    activeChat?.id === chat.id 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <SearchIcon size={16} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {isEditingTitle === chat.id ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveTitle(chat.id);
                        }}
                      >
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          onBlur={() => saveTitle(chat.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 py-0 text-sm"
                        />
                      </form>
                    ) : (
                      <p className="text-sm truncate">{chat.title}</p>
                    )}
                  </div>
                  <div className={cn(
                    "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    activeChat?.id === chat.id ? "opacity-100" : ""
                  )}>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7" 
                      onClick={(e) => startEditingTitle(chat.id, e)}
                    >
                      <Edit3 size={14} />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7" 
                      onClick={(e) => deleteChat(chat.id, e)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
