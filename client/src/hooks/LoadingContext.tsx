import { createContext, useContext, useState, ReactNode } from "react";

interface LoadingContextType {
  busy: boolean;
  setBusy: (value: boolean) => void;
  loadingText: string;
  setLoadingText: (text: string) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  busy: false,
  setBusy: () => {},
  loadingText: "Carregando...",
  setLoadingText: () => {},
});

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [busy, setBusy] = useState(false);
  const [loadingText, setLoadingText] = useState("Carregando...");

  return (
    <LoadingContext.Provider value={{ busy, setBusy, loadingText, setLoadingText }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);