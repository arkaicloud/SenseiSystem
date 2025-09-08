import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export function useBootLoader() {
  const [isBooting, setIsBooting] = useState(true);
  const [progress, setProgress] = useState(0);
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    let canceled = false;

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
        while (isLoading && !canceled) {
          await new Promise(r => setTimeout(r, 100));
        }
        
        if (canceled) return;
        setProgress(30);
        
        // Se não está autenticado, não precisa fazer prefetch
        if (!user) {
          setIsBooting(false);
          return;
        }
        
        setProgress(40);
        
        // Prefetch mais rápido das queries essenciais
        const prefetchPromises = [
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
        ];

        // Executar prefetch com progresso em tempo real
        await Promise.all(prefetchPromises.map(async (promise, index) => {
          await promise;
          if (!canceled) {
            setProgress(40 + (index + 1) * 15); // 40, 55, 70, 85
          }
        }));
        
        if (canceled) return;
        
        // Aguardar um momento para o React processar os dados
        await new Promise(r => setTimeout(r, 50));
        setProgress(100);
        
      } catch (error) {
        console.error('Erro no boot loader:', error);
        // Mesmo com erro, continuar para não travar na loading screen
      } finally {
        if (!canceled) {
          setIsBooting(false);
        }
      }
    })();

    // Timeout de segurança para evitar loading infinito
    const timeout = setTimeout(() => {
      if (!canceled) {
        console.warn('Boot loader timeout - forçando conclusão');
        setIsBooting(false);
      }
    }, 10000);

    return () => { 
      canceled = true;
      clearTimeout(timeout);
    };
  }, [user, isLoading, queryClient]);

  return { isBooting, progress };
}