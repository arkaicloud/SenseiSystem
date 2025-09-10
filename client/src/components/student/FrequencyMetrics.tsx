import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award,
  Activity
} from "lucide-react";
import { useBeltLevels } from "@/hooks/useBeltLevels";

interface FrequencyMetricsProps {
  studentId: number;
  primaryColor?: string;
}

export const FrequencyMetrics = ({ studentId, primaryColor = "#B85C38" }: FrequencyMetricsProps) => {
  const { getBeltName, getBeltColor } = useBeltLevels();

  // Buscar dados de frequência do mês atual
  const { data: attendanceData, isLoading: isAttendanceLoading } = useQuery({
    queryKey: [`/api/student/attendance-current-month`],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/student/attendance-current-month');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados de frequência');
      }
      
      return response.json();
    },
  });

  // Buscar perfil do aluno para informações da faixa
  const { data: studentProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['/api/student/profile'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/student/profile');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar perfil do aluno');
      }
      
      return response.json();
    },
  });

  if (isAttendanceLoading || isProfileLoading) {
    return (
      <Card data-testid="card-frequency-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Frequência & Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const attendedClasses = attendanceData?.attendanceCount || 0;
  const totalClasses = attendanceData?.totalClasses || 1;
  const progressPct = Math.round((attendedClasses / totalClasses) * 100);
  
  const beltName = getBeltName(studentProfile?.beltLevel || 'white');
  const beltColor = getBeltColor(studentProfile?.beltLevel || 'white');
  
  // Calcular data de início na academia
  const enrollmentDate = studentProfile?.enrollmentDate 
    ? new Date(studentProfile.enrollmentDate) 
    : new Date();
  
  const monthsSinceEnrollment = Math.floor(
    (Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Determinar nível de engajamento
  const getEngagementLevel = (percentage: number) => {
    if (percentage >= 80) return { label: "Excelente", color: "bg-green-500", variant: "default" as const };
    if (percentage >= 60) return { label: "Bom", color: "bg-blue-500", variant: "secondary" as const };
    if (percentage >= 40) return { label: "Regular", color: "bg-yellow-500", variant: "outline" as const };
    return { label: "Baixo", color: "bg-red-500", variant: "destructive" as const };
  };

  const engagement = getEngagementLevel(progressPct);

  return (
    <Card data-testid="card-frequency-metrics">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Frequência & Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas do mês */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Frequência este mês</span>
            <Badge variant={engagement.variant}>
              {engagement.label}
            </Badge>
          </div>
          
          <div className="mb-2">
            <Progress 
              value={progressPct} 
              className="h-3"
              style={{
                background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor}80 100%)`
              }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{attendedClasses} de {totalClasses} aulas</span>
            </div>
            <span className="font-medium">{progressPct}%</span>
          </div>
        </div>

        {/* Informações da faixa atual */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: beltColor }}
            />
            <span className="font-medium">{beltName}</span>
            {studentProfile?.stripes > 0 && (
              <Badge variant="outline" className="text-xs">
                {studentProfile.stripes} {studentProfile.stripes === 1 ? 'listra' : 'listras'}
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <Award className="h-3 w-3" />
              <span>
                Na academia há {monthsSinceEnrollment === 0 ? 'menos de 1 mês' : 
                `${monthsSinceEnrollment} ${monthsSinceEnrollment === 1 ? 'mês' : 'meses'}`}
              </span>
            </div>
            {studentProfile?.lastPromotionDate && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>
                  Última graduação: {new Date(studentProfile.lastPromotionDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Metas e objetivos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: primaryColor }}>
              {attendedClasses}
            </div>
            <div className="text-xs text-muted-foreground">
              Aulas este mês
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {Math.max(0, totalClasses - attendedClasses)}
            </div>
            <div className="text-xs text-muted-foreground">
              Ainda disponíveis
            </div>
          </div>
        </div>

        {/* Dica motivacional baseada na frequência */}
        {progressPct < 60 && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Dica: Tente manter uma frequência de 60% ou mais!
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};