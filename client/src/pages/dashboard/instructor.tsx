import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, CheckSquare, TrendingUp, Clock, BarChart3, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function parsePermissions(raw?: string | null): Record<string, boolean> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export default function InstructorDashboard() {
  const { user } = useAuth();
  const permissions = parsePermissions((user as any)?.permissions);
  const canSeeFinancials = permissions.canSeeFinancials === true;

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const todayNum = new Date().getDay(); // 0=Sun ... 6=Sat

  const { data: classesData } = useQuery<{ classes: any[] }>({
    queryKey: ['/api/classes'],
  });

  const { data: studentsData } = useQuery<any>({
    queryKey: ['/api/students'],
  });

  const { data: attendanceData } = useQuery<any>({
    queryKey: ['/api/attendance', format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await fetch(`/api/attendance?date=${format(new Date(), 'yyyy-MM-dd')}`, { credentials: 'include' });
      if (!res.ok) return { records: [] };
      return res.json();
    },
  });

  const { data: paymentsData } = useQuery<any>({
    queryKey: ['/api/payments'],
    enabled: canSeeFinancials,
  });

  const allClasses = classesData?.classes ?? [];
  const todayClasses = allClasses.filter((c: any) => c.dayOfWeek === todayNum && c.isActive);
  const allStudents = studentsData?.students ?? studentsData ?? [];
  const activeStudents = Array.isArray(allStudents)
    ? allStudents.filter((s: any) => s.status === 'active' || s.active)
    : [];

  // Overdue payments count (only if permission granted)
  const payments = paymentsData?.payments ?? [];
  const overdueCount = canSeeFinancials
    ? payments.filter((p: any) => p.status === 'overdue' || p.status === 'OVERDUE').length
    : 0;

  const firstNameDisplay = user?.firstName ?? 'Professor';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {firstNameDisplay} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1 capitalize">{today}</p>
      </div>

      {/* Metrics row */}
      <div className={`grid gap-4 ${canSeeFinancials ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alunos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeStudents.length}</p>
            <p className="text-xs text-muted-foreground mt-1">matriculados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aulas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todayClasses.length}</p>
            <p className="text-xs text-muted-foreground mt-1">agendadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Turmas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{allClasses.filter((c: any) => c.isActive).length}</p>
            <p className="text-xs text-muted-foreground mt-1">ativas</p>
          </CardContent>
        </Card>

        {canSeeFinancials && (
          <Card className={overdueCount > 0 ? 'border-red-200 bg-red-50/30' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inadimplentes</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${overdueCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${overdueCount > 0 ? 'text-red-600' : ''}`}>{overdueCount}</p>
              <p className="text-xs text-muted-foreground mt-1">pagamentos vencidos</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Today's Classes */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" /> Aulas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {todayClasses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhuma aula agendada para hoje
            </div>
          ) : (
            <div className="divide-y">
              {todayClasses.map((cls: any) => (
                <div key={cls.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cls.startTime} · {cls.duration ?? 60} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" /> {cls.maxStudents ?? '—'} vagas
                    </Badge>
                    <Badge className="text-xs bg-blue-100 text-blue-800">
                      {cls.classType === 'infantil' ? 'Infantil'
                        : cls.classType === 'feminino' ? 'Feminino'
                        : cls.classType === 'masculino' ? 'Masculino'
                        : 'Misto'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Active Classes */}
      {allClasses.filter((c: any) => c.isActive).length > 0 && (
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" /> Todas as Turmas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {(['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']).map((dayName, dayIdx) => {
                const dayClasses = allClasses.filter((c: any) => c.dayOfWeek === dayIdx && c.isActive);
                if (dayClasses.length === 0) return null;
                return (
                  <div key={dayIdx} className="px-6 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{dayName}</p>
                    <div className="space-y-1">
                      {dayClasses.map((cls: any) => (
                        <div key={cls.id} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{cls.name}</span>
                          <span className="text-muted-foreground">{cls.startTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial data — only if permission granted */}
      {canSeeFinancials && payments.length > 0 && (
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" /> Financeiro Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {payments.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <span>{p.studentName || p.description || '—'}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount / 100 || p.value || 0)}
                    </span>
                    <Badge className={
                      p.status === 'paid' || p.status === 'RECEIVED'
                        ? 'bg-green-100 text-green-800'
                        : p.status === 'overdue' || p.status === 'OVERDUE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-100 text-orange-800'
                    }>
                      {p.status === 'paid' || p.status === 'RECEIVED' ? 'Pago'
                        : p.status === 'overdue' || p.status === 'OVERDUE' ? 'Vencido'
                        : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
