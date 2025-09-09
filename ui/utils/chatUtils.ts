
import { Chat, ChatMessage } from "@/types/chat";

// Generate a random ID for chats and messages
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15);
};

// Format date for display
export const formatDate = (date: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return 'Today';
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

// Group chats by date
export const groupChatsByDate = (chats: Chat[]) => {
  const grouped: Record<string, Chat[]> = {};
  
  chats.forEach(chat => {
    const dateKey = formatDate(new Date(chat.createdAt));
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(chat);
  });
  
  return Object.entries(grouped);
};

// Create a new chat
export const createNewChat = (): Chat => {
  return {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
};
