import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAsyncLoading } from "./useRouteLoading";

export function useAsyncNavigation() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { withLoading } = useAsyncLoading();

  const navigateWithLoading = async (path: string, loadingText?: string) => {
    await withLoading(
      async () => {
        // Prefetch dados críticos baseados na rota
        if (path === "/dashboard" || path === "/") {
          await Promise.all([
            queryClient.prefetchQuery({ queryKey: ['/api/user'] }),
            queryClient.prefetchQuery({ queryKey: ['/api/school-config'] }),
            queryClient.prefetchQuery({ queryKey: ['/api/classes/today'] }),
          ]);
        } else if (path.includes("/students")) {
          await queryClient.prefetchQuery({ queryKey: ['/api/students'] });
        } else if (path.includes("/classes")) {
          await queryClient.prefetchQuery({ queryKey: ['/api/classes'] });
        }

        // Navegar após prefetch
        setLocation(path);
        
        // Pequeno delay para garantir que a nova rota carregou
        await new Promise(resolve => setTimeout(resolve, 100));
      },
      loadingText || "Navegando..."
    );
  };

  return { navigateWithLoading };
}