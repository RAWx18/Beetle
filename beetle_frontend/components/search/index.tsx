"use client";

import React, { useState, useEffect } from 'react';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chat, ChatMessage } from '@/types/chat';
import { generateId, createNewChat as createNewChatUtil } from '@/utils/chatUtils';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { cn } from '@/lib/utils';

export const Search: React.FC = () => {
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

  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
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
        setTimeout(() => {
          const aiMessage: ChatMessage = {
            id: generateId(),
            type: 'assistant',
            content: `Based on your search for "${userMessage.content}", I found several relevant notes in your second brain. Would you like me to summarize the key insights?`,
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
        {/* Header with toggle */}
        <div className="border-b py-2 px-4 flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="mr-2"
          >
            <SearchIcon size={18} />
          </Button>
          <h2 className="font-medium">
            {activeChat?.title || 'Universal Search'}
          </h2>
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
