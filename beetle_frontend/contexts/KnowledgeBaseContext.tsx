import React, { createContext, useContext, useState, ReactNode } from 'react';

interface KnowledgeBase {
  pullRequests: any[];
  issues: any[];
  activities: any[];
  botLogs: any[];
  files: Array<{ path: string; content: string }>;
  [key: string]: any; 
}

interface KnowledgeBaseContextType {
  knowledgeBase: KnowledgeBase;
  updateKnowledgeBase: (data: Partial<KnowledgeBase>) => void;
  isKnowledgeBaseReady: boolean;
}

const KnowledgeBaseContext = createContext<KnowledgeBaseContextType | undefined>(undefined);

export const KnowledgeBaseProvider = ({ children }: { children: ReactNode }) => {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase>({
    pullRequests: [],
    issues: [],
    activities: [],
    botLogs: [],
    files: [],
  });

  const updateKnowledgeBase = (data: Partial<KnowledgeBase>) => {
    setKnowledgeBase(prev => ({
        ...prev,
        ...data,
        pullRequests: [...(prev.pullRequests || []), ...(data.pullRequests || [])],
        issues: [...(prev.issues || []), ...(data.issues || [])],
        activities: [...(prev.activities || []), ...(data.activities || [])],
        botLogs: [...(prev.botLogs || []), ...(data.botLogs || [])],
        files: [...(prev.files || []), ...(data.files || [])],
    }));
  };

  const isKnowledgeBaseReady = 
    knowledgeBase.pullRequests.length > 0 ||
    knowledgeBase.issues.length > 0 ||
    knowledgeBase.activities.length > 0 ||
    knowledgeBase.botLogs.length > 0 ||
    knowledgeBase.files.length > 0;

  return (
    <KnowledgeBaseContext.Provider value={{ knowledgeBase, updateKnowledgeBase, isKnowledgeBaseReady }}>
      {children}
    </KnowledgeBaseContext.Provider>
  );
};

export const useKnowledgeBase = () => {
  const context = useContext(KnowledgeBaseContext);
  if (context === undefined) {
    throw new Error('useKnowledgeBase must be used within a KnowledgeBaseProvider');
  }
  return context;
}; 