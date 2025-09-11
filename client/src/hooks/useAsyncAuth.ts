import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAsyncLoading } from "./useRouteLoading";
import { useAsyncNavigation } from "./useAsyncNavigation";
import { apiRequest } from "@/lib/queryClient";

export function useAsyncAuth() {
  const { withLoading } = useAsyncLoading();
  const { navigateWithLoading } = useAsyncNavigation();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/login', credentials);
      if (!response.ok) {
        throw new Error('Login failed');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Invalidar cache e prefetch dados do dashboard
      queryClient.setQueryData(['/api/user'], data.user);
      await queryClient.invalidateQueries();
      
      // Navegar para dashboard com loading suave
      await navigateWithLoading("/dashboard", "Preparando seu painel...");
    },
  });

  const loginWithLoading = async (credentials: { email: string; password: string }) => {
    await withLoading(
      () => loginMutation.mutateAsync(credentials),
      "Autenticando..."
    );
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/logout', {});
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return response.json();
    },
    onSuccess: async () => {
      // Limpar cache
      queryClient.clear();
      
      // Navegar para login
      await navigateWithLoading("/login", "Desconectando...");
    },
  });

  const logoutWithLoading = async () => {
    await withLoading(
      () => logoutMutation.mutateAsync(),
      "Desconectando..."
    );
  };

  return {
    loginWithLoading,
    logoutWithLoading,
    isLoginLoading: loginMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
  };
}