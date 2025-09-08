import { useEffect, useState } from "react";
import { prefetchDashboard } from "@/services/prefetch";
import { useAuth } from "@/hooks/use-auth";

export function useBootLoader() {
  const [isBooting, setIsBooting] = useState(true);
  const [progress, setProgress] = useState(0);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    let canceled = false;
    let startTime = Date.now();

    (async () => {
      try {
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
        
        // Fazer prefetch dos dados essenciais
        await prefetchDashboard({ 
          onStep: (p) => {
            if (!canceled) {
              setProgress(prev => Math.max(prev, p));
            }
          }
        });
        
        if (canceled) return;
        
        // Remover duração mínima para transição mais rápida quando vindo do login
        // const elapsed = Date.now() - startTime;
        // const minDuration = 600;
        
        // if (elapsed < minDuration) {
        //   await new Promise(r => setTimeout(r, minDuration - elapsed));
        // }
        
        setProgress(100);
        
        // Pequeno delay reduzido para transição mais rápida
        await new Promise(r => setTimeout(r, 50));
        
      } catch (error) {
        console.error('Erro no boot loader:', error);
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
  }, [user, isLoading]);

  return { isBooting, progress };
}