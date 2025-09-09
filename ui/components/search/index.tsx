"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chat, ChatMessage } from '@/types/chat';
import { generateId, createNewChat as createNewChatUtil } from '@/utils/chatUtils';
import { useBranch } from '@/contexts/BranchContext';
import { useRepository } from '@/contexts/RepositoryContext';
import { aiService } from '@/lib/ai-service';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { cn } from '@/lib/utils';

export const Search: React.FC = () => {
  const { selectedBranch, getBranchInfo } = useBranch();
  const { repository } = useRepository();
  const branchInfo = getBranchInfo();
  const projectName = repository?.name || 'Project';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Initialize with a sample chat on first render
  useEffect(() => {
    if (chats.length === 0) {
      const newChat = createNewChatUtil();
      setChats([newChat]);
      setActiveChat(newChat);
    }
  }, []);

  // Create a new chat
  const createNewChat = () => {
    const newChat = createNewChatUtil();
    setChats([newChat, ...chats]);
    setActiveChat(newChat);
  };

  // Delete a chat
  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    // If we deleted the active chat, set the first available chat as active
    if (activeChat && activeChat.id === chatId) {
      setActiveChat(updatedChats.length > 0 ? updatedChats[0] : null);
    }
    
    // If no chats left, create a new one
    if (updatedChats.length === 0) {
      createNewChat();
    }
  };

  // Edit chat title
  const startEditingTitle = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setIsEditingTitle(chatId);
      setEditTitle(chat.title);
    }
  };

  const saveTitle = (chatId: string) => {
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, title: editTitle || 'Untitled Chat' };
      }
      return chat;
    });
    setChats(updatedChats);
    setIsEditingTitle(null);
  };

  // Generate AI response using multi-agent system
  const generateAIResponse = async (userQuery: string): Promise<string> => {
    try {
      const response = await aiService.chat({
        message: userQuery,
        repository_id: repository?.full_name || 'default',
        branch: selectedBranch || 'main'
      });
      
      if (response.success && response.answer) {
        return response.answer;
      } else {
        return `I encountered an error while processing your request: ${response.error}. Please try again or contact support if the issue persists.`;
      }
      
    } catch (error) {
      console.error('Chat API error:', error);
      return `I'm having trouble connecting to my knowledge base right now. Please check your internet connection and try again. If the problem persists, you may need to import some data first.`;
    }
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && activeChat) {
      // Create user message
      const userMessage: ChatMessage = {
        id: generateId(),
        type: 'user',
        content: searchQuery,
        timestamp: new Date()
      };
      
      // Update chat with new message
      const updatedChats = chats.map(chat => {
        if (chat.id === activeChat.id) {
          // If this is the first message, update the chat title
          let updatedTitle = chat.title;
          if (chat.messages.length === 0) {
            updatedTitle = searchQuery.length > 25 
              ? `${searchQuery.substring(0, 22)}...` 
              : searchQuery;
          }
          
          return {
            ...chat,
            title: updatedTitle,
            messages: [...chat.messages, userMessage],
            updatedAt: new Date()
          };
        }
        return chat;
      });
      
      setChats(updatedChats);
      setSearchQuery('');
      
      // Find the updated active chat
      const updatedActiveChat = updatedChats.find(chat => chat.id === activeChat.id);
      if (updatedActiveChat) {
        setActiveChat(updatedActiveChat);
        
        // Add AI response after a short delay
        setTimeout(async () => {
          try {
            const aiResponse = await generateAIResponse(userMessage.content);
            
            const aiMessage: ChatMessage = {
              id: generateId(),
              type: 'assistant',
              content: aiResponse,
              timestamp: new Date()
            };
            
            const updatedChatsWithAi = updatedChats.map(chat => {
              if (chat.id === activeChat.id) {
                return {
                  ...chat,
                  messages: [...chat.messages, aiMessage],
                  updatedAt: new Date()
                };
              }
              return chat;
            });
            
            setChats(updatedChatsWithAi);
            const updatedActiveChatWithAi = updatedChatsWithAi.find(chat => chat.id === activeChat.id);
            if (updatedActiveChatWithAi) {
              setActiveChat(updatedActiveChatWithAi);
            }
          } catch (error) {
            console.error('Error generating AI response:', error);
            
            const errorMessage: ChatMessage = {
              id: generateId(),
              type: 'assistant',
              content: 'I encountered an error while processing your request. Please try again.',
              timestamp: new Date()
            };
            
            const updatedChatsWithError = updatedChats.map(chat => {
              if (chat.id === activeChat.id) {
                return {
                  ...chat,
                  messages: [...chat.messages, errorMessage],
                  updatedAt: new Date()
                };
              }
              return chat;
            });
            
            setChats(updatedChatsWithError);
            const updatedActiveChatWithError = updatedChatsWithError.find(chat => chat.id === activeChat.id);
            if (updatedActiveChatWithError) {
              setActiveChat(updatedActiveChatWithError);
            }
          }
        }, 800);
      }
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="w-full h-[calc(100vh-120px)] flex">
      {/* Sidebar with chat history */}
      <ChatSidebar 
        chats={chats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        createNewChat={createNewChat}
        deleteChat={deleteChat}
        showSidebar={showSidebar}
        isEditingTitle={isEditingTitle}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        startEditingTitle={startEditingTitle}
        saveTitle={saveTitle}
      />
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header with toggle and branch info */}
        <div className="border-b py-2 px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="mr-2"
            >
              {showSidebar ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </Button>
            <h2 className="font-medium">
              {activeChat?.title || 'Universal Search'}
            </h2>
          </div>
          <div className="text-sm text-muted-foreground">
            Searching in {projectName} ({selectedBranch})
          </div>
        </div>
        
        {/* Chat messages area */}
        <ChatMessages activeChat={activeChat} />
        
        {/* Input area */}
        <ChatInput 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSubmit={handleSubmit}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
        />
      </div>
    </div>
  );
};

export default Search;
