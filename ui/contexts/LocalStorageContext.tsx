"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

interface GitmeshData {
  [key: string]: any;
}

interface LocalStorageContextType {
  getItem: (key: string) => any;
  setItem: (key: string, value: any) => void;
  removeItem: (key: string) => void;
}

const LocalStorageContext = createContext<LocalStorageContextType | undefined>(undefined);

const GTMESH_DATA_KEY = 'gitmesh_data';

export const LocalStorageProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<GitmeshData>({});

  useEffect(() => {
    const storedData = localStorage.getItem(GTMESH_DATA_KEY);
    if (storedData) {
      setData(JSON.parse(storedData));
    }
  }, []);

  const setItem = useCallback((key: string, value: any) => {
    setData(prevData => {
      const newData = { ...prevData, [key]: value };
      localStorage.setItem(GTMESH_DATA_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  const getItem = useCallback((key: string) => {
    const storedData = localStorage.getItem(GTMESH_DATA_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      return parsedData[key];
    }
    return undefined;
  }, []);

  const removeItem = useCallback((key: string) => {
    setData(prevData => {
      const newData = { ...prevData };
      delete newData[key];
      localStorage.setItem(GTMESH_DATA_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  const value = useMemo(() => ({ getItem, setItem, removeItem }), [getItem, setItem, removeItem]);

  return (
    <LocalStorageContext.Provider value={value}>
      {children}
    </LocalStorageContext.Provider>
  );
};

export const useLocalStorage = (): LocalStorageContextType => {
  const context = useContext(LocalStorageContext);
  if (context === undefined) {
    throw new Error('useLocalStorage must be used within a LocalStorageProvider');
  }
  return context;
};
