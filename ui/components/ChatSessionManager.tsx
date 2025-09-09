"use client";

import React, { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Clock,
  FileText,
  MoreVertical,
  Search,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatSessionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatSessionManager: React.FC<ChatSessionManagerProps> = ({ isOpen, onClose }) => {
  const { 
    state, 
    createSession, 
    deleteSession, 
    setActiveSession, 
    updateSession,
    getActiveSession
  } = useChat();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);

  const activeSession = getActiveSession();

  // Filter sessions based on search query
  const filteredSessions = state.sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSession = () => {
    const sessionId = createSession('New Chat');
    setActiveSession(sessionId);
    toast.success('New chat session created');
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (state.sessions.length <= 1) {
      toast.error('Cannot delete the last session');
      return;
    }

    deleteSession(sessionId);
    toast.success('Session deleted');
  };

  const handleEditSession = (session: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editTitle.trim()) {
      updateSession(sessionId, { title: editTitle.trim() });
      toast.success('Session title updated');
    }
    setEditingSessionId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditTitle('');
  };

  const handleExportHistory = (sessionId?: string) => {
    // Placeholder for export functionality
    toast.info('Export functionality will be implemented in Phase 2');
  };

  const handleClearHistory = (sessionId?: string) => {
    // Placeholder for clear functionality
    toast.info('Clear functionality will be implemented in Phase 2');
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) {
      return 'Unknown';
    }
    
    const now = new Date();
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getSessionPreview = (session: any) => {
    const lastMessage = session.messages[session.messages.length - 1];
    if (lastMessage) {
      return lastMessage.content.length > 50 
        ? lastMessage.content.substring(0, 50) + '...' 
        : lastMessage.content;
    }
    return 'No messages yet';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Chat Sessions</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateSession}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              New Session
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No sessions found' : 'No chat sessions yet'}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                  activeSession?.id === session.id && "bg-primary/10 border-primary"
                )}
                onClick={() => {
                  setActiveSession(session.id);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Session Title */}
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={16} className="text-primary flex-shrink-0" />
                      {editingSessionId === session.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-6 text-sm"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit(session.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveEdit(session.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-6 w-6 p-0"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="font-medium text-sm truncate">
                          {session.title}
                        </h3>
                      )}
                    </div>

                    {/* Session Preview */}
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {getSessionPreview(session)}
                    </p>

                    {/* Session Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatDate(session.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        <span>{session.messages.length} messages</span>
                      </div>
                      {session.selectedFiles.length > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText size={12} />
                          <span>{session.selectedFiles.length} files</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2">
                    {editingSessionId !== session.id && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleEditSession(session, e)}
                          className="h-6 w-6 p-0 hover:bg-muted"
                          title="Edit session title"
                        >
                          <Edit3 size={12} />
                        </Button>
                        {/* Phase 6: Session-specific actions */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExportHistory(session.id)}
                          className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
                          title="Export session history"
                        >
                          <Download size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleClearHistory(session.id)}
                          className="h-6 w-6 p-0 hover:bg-orange-100 hover:text-orange-600"
                          title="Clear session history"
                        >
                          <Trash2 size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          title="Delete session"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Active Session Badge */}
                {activeSession?.id === session.id && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Active
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              {/* Phase 6: Chat History Management */}
              <button
                onClick={() => handleExportHistory()}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
                title="Export all chat history"
              >
                Export All
              </button>
              <button
                onClick={() => handleClearHistory()}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
                title="Clear all chat history"
              >
                Clear All
              </button>
              <span>Total: {state.sessions.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
