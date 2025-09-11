import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp } from "lucide-react";

interface MonthlyAttendanceProps {
  attendedClasses: number;
  totalClasses: number;
  currentMonth: string;
  primaryColor: string;
  isLoading?: boolean;
}

export const MonthlyAttendance = ({ 
  attendedClasses, 
  totalClasses, 
  currentMonth,
  primaryColor,
  isLoading
}: MonthlyAttendanceProps) => {
  const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
  
  const getMotivationalMessage = (percentage: number) => {
    if (percentage >= 90) return "Excelente frequência! Continue assim! 🏆";
    if (percentage >= 70) return "Boa frequência! Você está no caminho certo! 💪";
    if (percentage >= 50) return "Continue se esforçando, cada aula conta! 📈";
    return "Que tal aumentar sua frequência? Venha treinar mais! 🥋";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
            Frequência em {currentMonth}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando frequência...</p>
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
          Frequência em {currentMonth}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold mb-1" style={{ color: primaryColor }}>
            {attendedClasses}
          </div>
          <p className="text-sm text-muted-foreground">
            aulas participadas de {totalClasses} disponíveis
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span className="font-medium">{Math.round(attendancePercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${attendancePercentage}%`,
                backgroundColor: primaryColor 
              }}
            ></div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
          <p className="text-sm text-muted-foreground">
            {getMotivationalMessage(attendancePercentage)}
          </p>
        </div>

        {attendancePercentage < 50 && totalClasses > 0 && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Faltam {Math.ceil(totalClasses * 0.5) - attendedClasses} aulas para atingir 50% de frequência
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};