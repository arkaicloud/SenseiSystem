import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | null;

interface ClassWithBooking {
  id: number;
  dateISO: string;
  bookingStatus: BookingStatus;
  attendanceConfirmed?: boolean;
}

export function useBookingMutations(studentId: number) {
  const { toast } = useToast();

  const confirmMutation = useMutation({
    mutationFn: async ({ classId, dateISO }: { classId: number; dateISO: string }) => {
      return apiRequest(`/api/students/${studentId}/classes/${classId}/${dateISO}/confirm`, "POST");
    },
    onMutate: async ({ classId, dateISO }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/classes/today'] });
      await queryClient.cancelQueries({ queryKey: ['/api/students', studentId, 'classes/week'] });

      // Snapshot the previous values
      const previousTodayClasses = queryClient.getQueryData(['/api/classes/today']);
      const previousWeekData = queryClient.getQueryData(['/api/students', studentId, 'classes/week']);

      // Optimistically update both caches
      queryClient.setQueryData(['/api/classes/today'], (old: any) => {
        if (!old?.classes) return old;
        return {
          ...old,
          classes: old.classes.map((cls: ClassWithBooking) => 
            cls.id === classId && cls.dateISO === dateISO
              ? { ...cls, bookingStatus: 'CONFIRMED', attendanceConfirmed: true }
              : cls
          )
        };
      });

      queryClient.setQueryData(['/api/students', studentId, 'classes/week'], (old: any) => {
        if (!old?.weekData) return old;
        return {
          ...old,
          weekData: old.weekData.map((day: any) => ({
            ...day,
            classes: day.classes.map((cls: ClassWithBooking) =>
              cls.id === classId && day.date === dateISO
                ? { ...cls, bookingStatus: 'CONFIRMED', attendanceConfirmed: true }
                : cls
            )
          }))
        };
      });

      return { previousTodayClasses, previousWeekData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTodayClasses) {
        queryClient.setQueryData(['/api/classes/today'], context.previousTodayClasses);
      }
      if (context?.previousWeekData) {
        queryClient.setQueryData(['/api/students', studentId, 'classes/week'], context.previousWeekData);
      }
      
      toast({
        title: "Erro",
        description: "Falha ao confirmar presença. Tente novamente.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Presença confirmada!",
      });
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/classes/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'classes/week'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ classId, dateISO }: { classId: number; dateISO: string }) => {
      return apiRequest(`/api/students/${studentId}/classes/${classId}/${dateISO}/cancel`, "POST");
    },
    onMutate: async ({ classId, dateISO }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/classes/today'] });
      await queryClient.cancelQueries({ queryKey: ['/api/students', studentId, 'classes/week'] });

      // Snapshot the previous values
      const previousTodayClasses = queryClient.getQueryData(['/api/classes/today']);
      const previousWeekData = queryClient.getQueryData(['/api/students', studentId, 'classes/week']);

      // Optimistically update both caches
      queryClient.setQueryData(['/api/classes/today'], (old: any) => {
        if (!old?.classes) return old;
        return {
          ...old,
          classes: old.classes.map((cls: ClassWithBooking) => 
            cls.id === classId && cls.dateISO === dateISO
              ? { ...cls, bookingStatus: 'CANCELLED', attendanceConfirmed: false }
              : cls
          )
        };
      });

      queryClient.setQueryData(['/api/students', studentId, 'classes/week'], (old: any) => {
        if (!old?.weekData) return old;
        return {
          ...old,
          weekData: old.weekData.map((day: any) => ({
            ...day,
            classes: day.classes.map((cls: ClassWithBooking) =>
              cls.id === classId && day.date === dateISO
                ? { ...cls, bookingStatus: 'CANCELLED', attendanceConfirmed: false }
                : cls
            )
          }))
        };
      });

      return { previousTodayClasses, previousWeekData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTodayClasses) {
        queryClient.setQueryData(['/api/classes/today'], context.previousTodayClasses);
      }
      if (context?.previousWeekData) {
        queryClient.setQueryData(['/api/students', studentId, 'classes/week'], context.previousWeekData);
      }
      
      toast({
        title: "Erro",
        description: "Falha ao cancelar presença. Tente novamente.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Presença cancelada!",
      });
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/classes/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'classes/week'] });
    },
  });

  return {
    confirmMutation,
    cancelMutation,
    isLoading: confirmMutation.isPending || cancelMutation.isPending,
  };
}