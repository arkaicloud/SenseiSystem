import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, UserCheck } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { Class } from "@shared/schema";

interface ClassAttendanceCounterProps {
  classData: Class;
  onManageAttendance?: (classId: number) => void;
  showActions?: boolean;
}

const ClassAttendanceCounter: React.FC<ClassAttendanceCounterProps> = ({
  classData,
  onManageAttendance,
  showActions = false
}) => {
  // Buscar presenças confirmadas para esta aula hoje
  const { data: attendanceCount, isLoading } = useQuery({
    queryKey: ['/api/attendance/count', classData.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance/count/${classData.id}?date=${today}`);
      if (!res.ok) return { count: 0 };
      return await res.json();
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const currentCount = attendanceCount?.count || 0;
  const maxCapacity = classData.maxCapacity || 20;
  const capacityPercentage = (currentCount / maxCapacity) * 100;

  // Determinar cor do badge baseado na capacidade
  const getBadgeVariant = () => {
    if (capacityPercentage >= 90) return "destructive";
    if (capacityPercentage >= 70) return "outline";
    return "secondary";
  };

  const { time, period } = formatTime(classData.startTime);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{classData.name}</CardTitle>
          <Badge variant={getBadgeVariant()} className="font-mono">
            {isLoading ? "..." : `${currentCount}/${maxCapacity}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Capacidade: {maxCapacity}</span>
          </div>
        </div>

        {/* Barra de progresso da capacidade */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              capacityPercentage >= 90
                ? "bg-red-500"
                : capacityPercentage >= 70
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {currentCount === 0 
              ? "Nenhum aluno confirmado"
              : `${currentCount} aluno${currentCount !== 1 ? 's' : ''} confirmado${currentCount !== 1 ? 's' : ''}`
            }
          </span>
          <span className={`font-medium ${
            capacityPercentage >= 90 ? "text-red-600" : 
            capacityPercentage >= 70 ? "text-yellow-600" : "text-green-600"
          }`}>
            {(100 - capacityPercentage).toFixed(0)}% disponível
          </span>
        </div>

        {showActions && onManageAttendance && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageAttendance(classData.id)}
              className="w-full"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Gerenciar Presença
            </Button>
          </div>
        )}

        {classData.description && (
          <p className="text-sm text-gray-600 mt-2">
            {classData.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassAttendanceCounter;