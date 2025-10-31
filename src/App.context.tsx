import type { Dispatch, ReactNode, SetStateAction } from "react";

import React, { createContext, useContext, useMemo, useState } from "react";
import { Language } from "./App.const";

interface AppContextProps {
  language: Language;
  setLanguage: Dispatch<SetStateAction<Language>>;
  selectedLayerIds: Set<string>;
  setSelectedLayerIds: Dispatch<SetStateAction<Set<string>>>;
  // Convenience methods
  selectLayer: (layerId: string) => void;
  deselectLayer: (layerId: string) => void;
  clearSelection: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState(Language.EN);
  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(
    new Set()
  );

  const selectLayer = (layerId: string) => {
    setSelectedLayerIds((prev) => new Set(prev).add(layerId));
  };

  const deselectLayer = (layerId: string) => {
    setSelectedLayerIds((prev) => {
      const next = new Set(prev);
      next.delete(layerId);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedLayerIds(new Set());
  };

  const value = useMemo(() => {
    return {
      language,
      setLanguage,
      selectedLayerIds,
      setSelectedLayerIds,
      selectLayer,
      deselectLayer,
      clearSelection,
    };
  }, [language, setLanguage, selectedLayerIds]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};
