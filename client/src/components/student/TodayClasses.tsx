import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle, Calendar, XCircle, Loader2 } from "lucide-react";
import { useBookingMutations, type BookingStatus } from "@/hooks/useBookingMutations";

interface ClassSession {
  id: number;
  name: string;
  startTime: string;
  endTime?: string;
  instructorName?: string;
  location?: string;
  attendanceConfirmed: boolean;
  bookingStatus?: BookingStatus;
  dateISO?: string;
}

interface TodayClassesProps {
  classes: ClassSession[];
  studentId: number;
  primaryColor: string;
  isLoading?: boolean;
}

export const TodayClasses = ({ classes, studentId, primaryColor, isLoading }: TodayClassesProps) => {
  const { confirmMutation, cancelMutation, isLoading: isMutating } = useBookingMutations(studentId);

  const handleConfirm = (classSession: ClassSession) => {
    const dateISO = classSession.dateISO || new Date().toISOString().split('T')[0];
    confirmMutation.mutate({
      classId: classSession.id,
      dateISO: dateISO
    });
  };

  const handleCancel = (classSession: ClassSession) => {
    const dateISO = classSession.dateISO || new Date().toISOString().split('T')[0];
    cancelMutation.mutate({
      classId: classSession.id,
      dateISO: dateISO
    });
  };

  const isConfirmed = (classSession: ClassSession) => {
    // Priorizar bookingStatus se disponível, senão usar attendanceConfirmed
    if (classSession.bookingStatus !== undefined) {
      return classSession.bookingStatus === 'CONFIRMED';
    }
    return classSession.attendanceConfirmed;
  };

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
          <div
            key={classSession.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            data-testid={`class-card-${classSession.id}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold" data-testid={`text-class-name-${classSession.id}`}>
                    {classSession.name}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {classSession.location || 'Tatame 1'}
                  </Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:flex-shrink-0">
                {isConfirmed(classSession) ? (
                  <>
                    <div className="flex items-center justify-center gap-2 text-green-600 py-2 px-3 bg-green-50 rounded-md sm:bg-transparent sm:p-0">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Confirmado</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(classSession)}
                      disabled={isMutating}
                      className="w-full sm:w-auto text-red-500 border-red-200 hover:text-red-700 hover:bg-red-50"
                      data-testid={`button-cancel-${classSession.id}`}
                    >
                      {isMutating ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConfirm(classSession)}
                    disabled={isMutating}
                    className="w-full sm:w-auto text-white font-medium"
                    style={{ backgroundColor: primaryColor }}
                    data-testid={`button-confirm-${classSession.id}`}
                  >
                    {isMutating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
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