import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | null;

interface ClassWithBooking {
  id: number;
  dateISO: string;
  bookingStatus: BookingStatus;
  attendanceConfirmed?: boolean;
}

interface BookingMutationData {
  classId: number;
  dateISO: string;
}

export function useBookingMutations(studentId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const confirmMutation = useMutation({
    mutationFn: async ({ classId, dateISO }: BookingMutationData) => {
      const response = await apiRequest('POST', `/api/students/${studentId}/classes/${classId}/${dateISO}/confirm`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao confirmar presença');
      }

      return response.json();
    },
    onMutate: async ({ classId, dateISO }: BookingMutationData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/classes/today'] });
      await queryClient.cancelQueries({ queryKey: ['/api/students', studentId, 'classes/week'] });
      await queryClient.cancelQueries({ queryKey: ['/api/attendance/by-student'] });

      // Snapshot the previous values
      const previousTodayClasses = queryClient.getQueryData<any>(['/api/classes/today']);
      const previousWeekData = queryClient.getQueryData<any>(['/api/students', studentId, 'classes/week']);
      const previousStudentAttendance = queryClient.getQueryData<any>(['/api/attendance/by-student']);

      // Optimistically update caches
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

      // Assuming the student attendance data also needs an update for the specific class
      queryClient.setQueryData(['/api/attendance/by-student'], (old: any) => {
        if (!old?.attendance) return old;
        return {
          ...old,
          attendance: old.attendance.map((item: any) =>
            item.classId === classId && item.dateISO === dateISO
              ? { ...item, bookingStatus: 'CONFIRMED', attendanceConfirmed: true }
              : item
          )
        };
      });

      return { previousTodayClasses, previousWeekData, previousStudentAttendance };
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousTodayClasses) {
        queryClient.setQueryData(['/api/classes/today'], context.previousTodayClasses);
      }
      if (context?.previousWeekData) {
        queryClient.setQueryData(['/api/students', studentId, 'classes/week'], context.previousWeekData);
      }
      if (context?.previousStudentAttendance) {
        queryClient.setQueryData(['/api/attendance/by-student'], context.previousStudentAttendance);
      }

      toast({
        title: "Erro ao confirmar presença",
        description: error.message || "Ocorreu um erro ao confirmar sua presença. Tente novamente.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Presença confirmada!",
        description: "Sua presença foi confirmada com sucesso.",
      });
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/classes/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'classes/week'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/by-student'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ classId, dateISO }: BookingMutationData) => {
      const response = await apiRequest('POST', `/api/students/${studentId}/classes/${classId}/${dateISO}/cancel`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cancelar presença');
      }

      return response.json();
    },
    onMutate: async ({ classId, dateISO }: BookingMutationData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/classes/today'] });
      await queryClient.cancelQueries({ queryKey: ['/api/students', studentId, 'classes/week'] });
      await queryClient.cancelQueries({ queryKey: ['/api/attendance/by-student'] });

      // Snapshot the previous values
      const previousTodayClasses = queryClient.getQueryData<any>(['/api/classes/today']);
      const previousWeekData = queryClient.getQueryData<any>(['/api/students', studentId, 'classes/week']);
      const previousStudentAttendance = queryClient.getQueryData<any>(['/api/attendance/by-student']);

      // Optimistically update caches
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

      // Assuming the student attendance data also needs an update for the specific class
      queryClient.setQueryData(['/api/attendance/by-student'], (old: any) => {
        if (!old?.attendance) return old;
        return {
          ...old,
          attendance: old.attendance.map((item: any) =>
            item.classId === classId && item.dateISO === dateISO
              ? { ...item, bookingStatus: 'CANCELLED', attendanceConfirmed: false }
              : item
          )
        };
      });

      return { previousTodayClasses, previousWeekData, previousStudentAttendance };
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousTodayClasses) {
        queryClient.setQueryData(['/api/classes/today'], context.previousTodayClasses);
      }
      if (context?.previousWeekData) {
        queryClient.setQueryData(['/api/students', studentId, 'classes/week'], context.previousWeekData);
      }
      if (context?.previousStudentAttendance) {
        queryClient.setQueryData(['/api/attendance/by-student'], context.previousStudentAttendance);
      }

      toast({
        title: "Erro ao cancelar presença",
        description: error.message || "Ocorreu um erro ao cancelar sua presença. Tente novamente.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Presença cancelada",
        description: "Sua presença foi cancelada com sucesso.",
      });
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/classes/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'classes/week'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/by-student'] });
    },
  });

  return {
    confirmMutation,
    cancelMutation,
    isLoading: confirmMutation.isPending || cancelMutation.isPending,
  };
}