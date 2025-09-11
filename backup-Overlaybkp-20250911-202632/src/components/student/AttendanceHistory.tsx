import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  BookOpen,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AttendanceHistoryProps {
  studentId: number;
}

interface AttendanceData {
  attendances: Array<{
    id: number;
    date: string;
    status: 'present' | 'absent' | 'late';
    class: {
      id: number;
      name: string;
      startTime: string;
      instructorId: number | null;
    } | null;
  }>;
  stats: {
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
  };
  period: {
    month: number;
    year: number;
  } | null;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ studentId }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Generate month/year options
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  const queryParams = selectedMonth && selectedYear 
    ? `?month=${selectedMonth}&year=${selectedYear}` 
    : '';

  const { data: attendanceData, isLoading } = useQuery<AttendanceData>({
    queryKey: [`/api/student/attendance-history/${studentId}${queryParams}`],
    retry: false,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Presente';
      case 'absent':
        return 'Ausente';
      case 'late':
        return 'Atrasado';
      default:
        return 'Indefinido';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSelectedMonth('');
    setSelectedYear('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Histórico de Presenças
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">Carregando histórico...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Histórico de Presenças
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Mês</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[120px]">
              <label className="text-sm font-medium mb-2 block">Ano</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(selectedMonth || selectedYear) && (
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {attendanceData && attendanceData.stats.totalClasses > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas
              {attendanceData.period && (
                <span className="text-sm font-normal text-gray-500">
                  - {months[attendanceData.period.month - 1]?.label} {attendanceData.period.year}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {attendanceData.stats.totalClasses}
                </div>
                <div className="text-sm text-blue-600">Total de Aulas</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {attendanceData.stats.presentCount}
                </div>
                <div className="text-sm text-green-600">Presentes</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {attendanceData.stats.absentCount}
                </div>
                <div className="text-sm text-red-600">Ausências</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {attendanceData.stats.attendanceRate}%
                </div>
                <div className="text-sm text-purple-600">Taxa de Presença</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance List */}
      {attendanceData && attendanceData.attendances.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aulas Participadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceData.attendances.map((attendance) => (
                <div key={attendance.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(attendance.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          📅 {format(new Date(attendance.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        <Badge className={getStatusBadgeColor(attendance.status)}>
                          {getStatusText(attendance.status)}
                        </Badge>
                      </div>
                      
                      {attendance.class && (
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-1 mb-1">
                            <BookOpen className="h-3 w-3" />
                            {attendance.class.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {attendance.class.startTime}
                            {attendance.class.instructorId && (
                              <>
                                <span className="mx-1">•</span>
                                <User className="h-3 w-3" />
                                Prof. ID: {attendance.class.instructorId}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {attendanceData.stats.totalClasses > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-blue-800 font-medium">
                  {attendanceData.period 
                    ? `Você participou de ${attendanceData.stats.presentCount} aulas em ${months[attendanceData.period.month - 1]?.label}`
                    : `Você participou de ${attendanceData.stats.presentCount} aulas no total`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center p-8">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma presença registrada</h3>
            <p className="text-gray-600">
              {selectedMonth || selectedYear 
                ? 'Não há registros de presença para o período selecionado.'
                : 'Ainda não há registros de presença para este aluno.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceHistory;