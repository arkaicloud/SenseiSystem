import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLoading } from "./LoadingContext";

export function useRouteLoading() {
  const [location] = useLocation();
  const { setBusy, setLoadingText } = useLoading();

  useEffect(() => {
    // Apenas mostrar loading brevemente para transições visuais suaves
    // O overlay principal deve ser controlado via useAsyncNavigation para prefetch
    setBusy(true);
    setLoadingText("Preparando sua página...");

    // Delay mais curto para reduzir flicker
    const timer = setTimeout(() => {
      setBusy(false);
    }, 100);

    return () => {
      clearTimeout(timer);
      setBusy(false);
    };
  }, [location, setBusy, setLoadingText]);
}

// Hook para controle manual de loading durante operações específicas
export function useAsyncLoading() {
  const { setBusy, setLoadingText } = useLoading();

  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    loadingText: string = "Processando..."
  ): Promise<T> => {
    setBusy(true);
    setLoadingText(loadingText);
    
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setBusy(false);
    }
  };

  return { withLoading, setBusy, setLoadingText };
}