'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface WindowState {
  id: string;
  title: string;
  appType: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  appProps?: any;
}

interface WindowManagerContextType {
  windows: WindowState[];
  maxZIndex: number;
  openWindow: (window: Omit<WindowState, 'zIndex' | 'isMinimized' | 'isMaximized'>) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within WindowManagerProvider');
  }
  return context;
};

interface WindowManagerProviderProps {
  children: ReactNode;
}

export const WindowManagerProvider: React.FC<WindowManagerProviderProps> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(100);

  const openWindow = useCallback((window: Omit<WindowState, 'zIndex' | 'isMinimized' | 'isMaximized'>) => {
    // Check if window with same id already exists
    setWindows((prev) => {
      const exists = prev.find((w) => w.id === window.id);
      if (exists) {
        // Bring existing window to front
        const newZIndex = maxZIndex + 1;
        setMaxZIndex(newZIndex);
        return prev.map((w) =>
          w.id === window.id
            ? { ...w, isMinimized: false, zIndex: newZIndex }
            : w
        );
      }

      // Create new window
      const newZIndex = maxZIndex + 1;
      setMaxZIndex(newZIndex);
      return [
        ...prev,
        {
          ...window,
          zIndex: newZIndex,
          isMinimized: false,
          isMaximized: false,
        },
      ];
    });
  }, [maxZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: true } : w))
    );
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: false, isMinimized: false } : w))
    );
  }, []);

  const bringToFront = useCallback((id: string) => {
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: newZIndex } : w))
    );
  }, [maxZIndex]);

  const updateWindowPosition = useCallback((id: string, position: { x: number; y: number }) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position } : w))
    );
  }, []);

  const updateWindowSize = useCallback((id: string, size: { width: number; height: number }) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size } : w))
    );
  }, []);

  return (
    <WindowManagerContext.Provider
      value={{
        windows,
        maxZIndex,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        bringToFront,
        updateWindowPosition,
        updateWindowSize,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
};
