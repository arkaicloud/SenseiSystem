import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, Calendar } from "lucide-react";
import { useState } from "react";

interface ClassSession {
  id: number;
  name: string;
  startTime: string;
  endTime?: string;
  instructorName?: string;
  location?: string;
  attendanceConfirmed: boolean;
}

interface TodayClassesProps {
  classes: ClassSession[];
  onCheckIn: (classId: number) => void;
  primaryColor: string;
  isLoading?: boolean;
}

export const TodayClasses = ({ classes, onCheckIn, primaryColor, isLoading }: TodayClassesProps) => {
  const [checkedInClasses, setCheckedInClasses] = useState<Set<number>>(
    new Set(classes.filter(c => c.attendanceConfirmed).map(c => c.id))
  );

  const handleCheckIn = (classId: number) => {
    setCheckedInClasses(prev => new Set([...prev, classId]));
    onCheckIn(classId);
  };

  const isCheckedIn = (classId: number) => checkedInClasses.has(classId) || classes.find(c => c.id === classId)?.attendanceConfirmed;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
            Aulas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando aulas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
            Aulas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Nenhuma aula agendada para hoje</p>
            <p className="text-sm">Aproveite para descansar e se preparar para as próximas aulas!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
          Aulas de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {classes.map((classSession) => (
          <div key={classSession.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{classSession.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {classSession.location || 'Tatame 1'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{classSession.startTime} - {classSession.endTime || '20:30'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Professor {classSession.instructorName || 'Marcus'}</span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                {isCheckedIn(classSession.id) ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Confirmado</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleCheckIn(classSession.id)}
                    className="text-white font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Confirmar Presença
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};