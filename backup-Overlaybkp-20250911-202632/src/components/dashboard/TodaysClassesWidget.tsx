import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, Users } from "lucide-react";
import ClassAttendanceCounter from "@/components/attendance/ClassAttendanceCounter";

const TodaysClassesWidget: React.FC = () => {
  // Buscar aulas do dia
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['/api/classes/today'],
    refetchInterval: 60000, // Atualiza a cada minuto
  });

  const todaysClasses = classesData?.classes || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Aulas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (todaysClasses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Aulas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma aula programada para hoje</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Aulas de Hoje ({todaysClasses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {todaysClasses.map((classItem: any) => (
            <ClassAttendanceCounter
              key={classItem.id}
              classData={classItem}
              showActions={true}
              onManageAttendance={(classId) => {
                // Aqui podemos adicionar navegação para gerenciar presença
                console.log('Gerenciar presença para aula:', classId);
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysClassesWidget;