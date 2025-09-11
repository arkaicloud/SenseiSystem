import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAsyncLoading } from "./useRouteLoading";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAsyncOperations() {
  const { withLoading } = useAsyncLoading();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Operação genérica para confirmar presença
  const confirmAttendance = async (classId: number) => {
    await withLoading(
      async () => {
        const response = await apiRequest('POST', `/api/classes/${classId}/confirm`, {});
        if (!response.ok) {
          throw new Error('Failed to confirm attendance');
        }
        
        // Invalidar queries relacionadas
        await queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
        
        toast({
          title: "Presença confirmada",
          description: "Sua presença na aula foi confirmada com sucesso.",
        });
        
        return response.json();
      },
      "Confirmando presença..."
    );
  };

  // Operação genérica para cancelar presença
  const cancelAttendance = async (classId: number) => {
    await withLoading(
      async () => {
        const response = await apiRequest('POST', `/api/classes/${classId}/cancel`, {});
        if (!response.ok) {
          throw new Error('Failed to cancel attendance');
        }
        
        // Invalidar queries relacionadas
        await queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
        
        toast({
          title: "Presença cancelada",
          description: "Sua presença na aula foi cancelada.",
        });
        
        return response.json();
      },
      "Cancelando presença..."
    );
  };

  // Operação para salvar configurações
  const saveSettings = async (settings: any) => {
    await withLoading(
      async () => {
        const response = await apiRequest('PUT', '/api/settings', settings);
        if (!response.ok) {
          throw new Error('Failed to save settings');
        }
        
        await queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
        
        toast({
          title: "Configurações salvas",
          description: "Suas configurações foram atualizadas com sucesso.",
        });
        
        return response.json();
      },
      "Salvando configurações..."
    );
  };

  return {
    confirmAttendance,
    cancelAttendance,
    saveSettings,
  };
}