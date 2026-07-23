import React, { createContext, useContext, useEffect, useState } from "react";

interface GhostModeContextType {
  isGhostMode: boolean;
  toggle: () => void;
}

const GhostModeContext = createContext<GhostModeContextType | undefined>(undefined);

export const GhostModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGhostMode, setIsGhostMode] = useState(() => {
    return localStorage.getItem("esquilo:ghost_mode") === "true";
  });

  const toggle = () => {
    const next = !isGhostMode;
    setIsGhostMode(next);
    localStorage.setItem("esquilo:ghost_mode", String(next));
  };

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "esquilo:ghost_mode") {
        setIsGhostMode(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <GhostModeContext.Provider value={{ isGhostMode, toggle }}>
      {children}
    </GhostModeContext.Provider>
  );
};

export const useGhostMode = () => {
  const context = useContext(GhostModeContext);
  if (context === undefined) {
    throw new Error("useGhostMode must be used within a GhostModeProvider");
  }
  return context;
};
