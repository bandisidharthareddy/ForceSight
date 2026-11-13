'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PerformanceContextType {
  isEcoMode: boolean;
  toggleEcoMode: () => void;
  isLowEndDevice: boolean;
  targetFps: number;
}

const PerformanceContext = createContext<PerformanceContextType>({
  isEcoMode: false,
  toggleEcoMode: () => {},
  isLowEndDevice: false,
  targetFps: 60,
});

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [isEcoMode, setIsEcoMode] = useState<boolean>(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState<boolean>(false);

  useEffect(() => {
    // Keep Eco mode off by default so full smooth 60fps experience is delivered out of the box
    const saved = localStorage.getItem('forcesight_eco_mode');
    if (saved !== null) {
      setIsEcoMode(saved === 'true');
    }
  }, []);

  const toggleEcoMode = () => {
    setIsEcoMode((prev) => {
      const next = !prev;
      localStorage.setItem('forcesight_eco_mode', String(next));
      return next;
    });
  };

  return (
    <PerformanceContext.Provider
      value={{
        isEcoMode,
        toggleEcoMode,
        isLowEndDevice,
        targetFps: isEcoMode ? 30 : 60,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  return useContext(PerformanceContext);
}
