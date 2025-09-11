import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { MARTIAL_QUOTES } from "@/constants/quotes";

export function useBootLoader() {
  const [isBooting, setIsBooting] = useState(true);
  const [progress, setProgress] = useState(0);
  const [quote, setQuote] = useState<string | undefined>(undefined);
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // idempotente para StrictMode
    started.current = true;

    performance.mark("showOverlay");

    (async () => {
      try {
        // Se vem do login, não mostrar loading (evitar loading duplo)
        const fromLogin = localStorage.getItem('fromLogin');
        if (fromLogin) {
          localStorage.removeItem('fromLogin');
          setIsBooting(false);
          return;
        }

        setProgress(10);
        
        // Aguardar autenticação resolver
        while (isLoading && !started.current) {
          await new Promise(r => setTimeout(r, 100));
        }
        
        setProgress(35);
        
        // Se não está autenticado, não precisa fazer prefetch
        if (!user) {
          setIsBooting(false);
          return;
        }
        
        // Prefetch de DADOS usados pelo Dashboard
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['/api/user'],
            queryFn: () => fetch('/api/user').then(res => {
              if (!res.ok) throw new Error('Failed to fetch user');
              return res.json();
            }),
            staleTime: 60_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['/api/dashboard/metrics'],
            queryFn: () => fetch('/api/dashboard/metrics').then(res => {
              if (!res.ok) throw new Error('Failed to fetch metrics');
              return res.json();
            }),
            staleTime: 30_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['/api/school-config'],
            queryFn: () => fetch('/api/school-config').then(res => {
              if (!res.ok) throw new Error('Failed to fetch school config');
              return res.json();
            }),
            staleTime: 60_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['/api/financial-stats'],
            queryFn: () => fetch('/api/financial-stats').then(res => {
              if (!res.ok) throw new Error('Failed to fetch financial stats');
              return res.json();
            }),
            staleTime: 30_000,
          }),
        ]);
        
        setProgress(65);

        // **Pré-carregar o CHUNK do Dashboard**
        await import("@/pages/dashboard/index");
        setProgress(85);

        // delay mínimo para evitar flash
        await new Promise(r => setTimeout(r, 600));
        setProgress(100);
        
      } catch (error) {
        console.error('Erro no boot loader:', error);
        // Mesmo com erro, continuar para não travar na loading screen
      } finally {
        setQuote(MARTIAL_QUOTES[Math.floor(Math.random() * MARTIAL_QUOTES.length)]);
        setIsBooting(false);
        requestAnimationFrame(() => performance.mark("hideOverlay"));
      }
    })();

    // Timeout de segurança para evitar loading infinito
    const timeout = setTimeout(() => {
      console.warn('Boot loader timeout - forçando conclusão');
      setIsBooting(false);
    }, 10000);

    return () => { 
      clearTimeout(timeout);
    };
  }, [user, isLoading, queryClient]);

  return { isBooting, progress, quote };
}