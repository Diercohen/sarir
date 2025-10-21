import type { Dispatch, ReactNode, SetStateAction } from "react";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { Language } from "./App.const";

interface AppContextProps {
  language: Language;
  setLanguage: Dispatch<SetStateAction<Language>>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState(Language.EN);
  const value = useMemo(() => {
    return {
      language,
      setLanguage,
    };
  }, [language, setLanguage]);
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
