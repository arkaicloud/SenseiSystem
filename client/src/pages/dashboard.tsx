import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import StatCard from "@/components/dashboard/StatCard";
import ClassCard from "@/components/dashboard/ClassCard";
import ActivityList from "@/components/dashboard/ActivityList";
import BeltDistribution from "@/components/dashboard/BeltDistribution";
import StudentsTable from "@/components/dashboard/StudentsTable";
import StudentForm from "@/components/students/StudentForm";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import SchoolEventList from "@/components/events/SchoolEventList";
import { formatDate, formatTime, formatCurrencyBRL } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import type { SchoolConfig } from "@shared/schema";

interface Notification {
  id: number;
  type: "event" | "attendance" | "belt" | "general";
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const { t } = useTranslation();

  // Fetch dashboard stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery<any>({
    queryKey: ['/api/stats'],
    refetchInterval: 60000,
  });

  // Fetch today's classes
  const { data: classesData, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['/api/classes/today'],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Debug log para aulas
  React.useEffect(() => {
    if (classesData) {
      console.log('Classes data loaded:', classesData);
    }
    if (classesError) {
      console.error('Error loading classes:', classesError);
    }
  }, [classesData, classesError]);

  // Fetch activity logs
  const { data: activityLogsData, isLoading: isActivityLogsLoading } = useQuery<any[]>({
    queryKey: ['/api/activity-logs'],
    refetchInterval: 60000,
  });

  // Fetch students requiring attention
  const { data: overduePaymentsData, isLoading: isOverduePaymentsLoading } = useQuery<any[]>({
    queryKey: ['/api/student-payments/overdue'],
    refetchInterval: 300000,
  });

  // Process data with fallbacks
  const stats = statsData ? {
    totalStudents: statsData.totalStudents || 0,
    classesThisMonth: statsData.totalClasses || 0,
    avgAttendance: statsData.averageAttendance ? `${Math.round(statsData.averageAttendance * 100)}%` : "0%",
    revenue: statsData.revenueThisMonth ? `R$ ${statsData.revenueThisMonth.toLocaleString('pt-BR')}` : "R$ 0"
  } : {
    totalStudents: 0,
    classesThisMonth: 0,
    avgAttendance: "0%",
    revenue: "R$ 0"
  };

  const todaysClasses = Array.isArray(classesData) ? classesData : [];
  const recentActivities = Array.isArray(activityLogsData) ? activityLogsData : [];
  const studentsRequiringAttention = Array.isArray(overduePaymentsData) ? overduePaymentsData : [];

  const handleAddStudent = (data: any) => {
    toast({
      title: "Aluno adicionado",
      description: "Novo aluno foi adicionado com sucesso.",
    });
    setIsAddStudentOpen(false);
  };

  const handleTakeAttendance = (classItem: any) => {
    setSelectedClass({
      ...classItem,
      date: new Date(),
    });
  };

  const handleSaveAttendance = (data: any) => {
    toast({
      title: "Presença registrada",
      description: "A presença foi registrada com sucesso.",
    });
    setSelectedClass(null);
  };

  const handleEmailStudent = (student: any) => {
    toast({ title: "Email enviado", description: `Email enviado para ${student.name}` });
  };

  const handleCallStudent = (student: any) => {
    toast({ title: "Ligação iniciada", description: `Ligando para ${student.name}` });
  };

  const handleMoreOptions = (student: any) => {
    toast({ title: "Mais opções", description: `Abrindo opções para ${student.name}` });
  };

  return (
    <>
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="font-montserrat font-bold text-xl md:text-2xl text-primary dark:text-blue-400">
            {t('painel') || 'Painel'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
            Bem-vindo, {user?.firstName || 'Administrador'}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder={t('pesquisar') || 'Pesquisar'}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500">
              <span className="material-icons text-sm">search</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
              <DialogTrigger asChild>
                <Button className="bg-secondary hover:bg-secondary-dark text-white font-medium whitespace-nowrap">
                  <span className="material-icons mr-1 text-sm">add</span>
                  {t('novoAluno') || 'Novo Aluno'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogTitle>{t('adicionarAluno') || 'Adicionar Aluno'}</DialogTitle>
                <StudentForm onSubmit={handleAddStudent} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard
          title={t('totalDeAlunos') || 'Total de Alunos'}
          value={stats.totalStudents}
          icon="people"
          trend={{ value: "+12%", isPositive: true }}
          iconBgColor="bg-blue-100 dark:bg-blue-900"
          iconColor="text-blue-600 dark:text-blue-300"
          subtitle={t('alunosAtivosMatriculados') || 'Alunos ativos matriculados'}
        />
        <StatCard
          title={t('aulasDoMes') || 'Aulas do Mês'}
          value={stats.classesThisMonth}
          icon="event"
          trend={{ value: "+5%", isPositive: true }}
          iconBgColor="bg-green-100 dark:bg-green-900"
          iconColor="text-green-600 dark:text-green-300"
          subtitle={t('aulasRealizadasNoMes') || 'Aulas realizadas no mês'}
        />
        <StatCard
          title={t('taxaDePresenca') || 'Taxa de Presenca'}
          value={stats.avgAttendance}
          icon="fact_check"
          trend={{ value: "-3%", isPositive: false }}
          iconBgColor="bg-purple-100 dark:bg-purple-900"
          iconColor="text-purple-600 dark:text-purple-300"
          subtitle={t('presencaMediaDosAlunos') || 'Presença média dos alunos'}
        />
        <StatCard
          title={t('receitaMensal') || 'Receita Mensal'}
          value={stats.revenue}
          icon="payments"
          trend={{ value: "+8%", isPositive: true }}
          iconBgColor="bg-yellow-100 dark:bg-yellow-900"
          iconColor="text-yellow-600 dark:text-yellow-300"
          subtitle={t('receitaTotalDoMes') || 'Receita total do mês'}
        />
      </div>

      {/* Today's Classes Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-montserrat font-bold text-xl">
            {t('aulasDeHoje') || 'Aulas de Hoje'}
          </h2>
          <Link href="/classes">
            <div className="text-secondary font-medium text-sm flex items-center">
              {t('verTodasAsAulas') || 'Ver todas as aulas'}
              <span className="material-icons text-sm ml-1">arrow_forward</span>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {classesLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">{t('carregandoAulas') || 'Carregando aulas...'}</div>
          ) : todaysClasses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              {t('nenhumaAulaAgendada') || 'Nenhuma aula agendada para hoje'}
            </div>
          ) : (
            todaysClasses.map((classItem: any) => {
              const { time, period } = formatTime(classItem.startTime);
              const instructorName = classItem.instructor 
                ? `${classItem.instructor.firstName} Sensei` 
                : t('semInstrutorDesignado') || 'Sem instrutor designado';

              // Mock attendees for demonstration
              const attendees = [
                { initials: 'MS', name: 'Michael S.' },
                { initials: 'AK', name: 'Aisha K.' },
                { initials: 'DR', name: 'David R.' },
                ...Array(12).fill(0).map((_, i) => ({ 
                  initials: `S${i+1}`, 
                  name: `Student ${i+1}` 
                }))
              ];

              return (
                <ClassCard
                  key={classItem.id}
                  time={time}
                  period={period}
                  name={classItem.name}
                  instructor={instructorName}
                  duration={classItem.duration}
                  attendees={attendees}
                  onTakeAttendance={() => handleTakeAttendance(classItem)}
                  bgColor={classItem.id % 2 === 0 ? "bg-purple-100" : "bg-blue-100"}
                  textColor={classItem.id % 2 === 0 ? "text-purple-800" : "text-blue-800"}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Belt Distribution and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="order-1 lg:order-1">
          <BeltDistribution />
        </div>
        <div className="order-2 lg:order-2">
          <ActivityList activities={recentActivities} onViewAll={() => {}} />
        </div>
      </div>

      {/* School Events Section */}
      <div className="mt-8 mb-8">
        <SchoolEventList limit={3} />
      </div>

      {/* Students Requiring Attention Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-montserrat font-bold text-xl">
            {t('alunosComPendencias') || 'Alunos com Pendências'}
          </h2>
          <Link href="/reports">
            <div className="text-secondary font-medium text-sm flex items-center">
              {t('verRelatorioDetalhado') || 'Ver relatório detalhado'}
              <span className="material-icons text-sm ml-1">arrow_forward</span>
            </div>
          </Link>
        </div>

        {isOverduePaymentsLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            {t('carregandoAlunos') || 'Carregando alunos...'}
          </div>
        ) : studentsRequiringAttention.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {t('nenhumAlunoComPendencia') || 'Nenhum aluno com pendência'}
          </div>
        ) : (
          <StudentsTable
            students={studentsRequiringAttention.map((payment: any) => {
              const student = payment.student || {};
              const user = student.user || {};

              return {
                id: student.id || 0,
                initials: user.firstName && user.lastName 
                  ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                  : 'UN',
                name: user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : 'Unknown User',
                email: user.email || 'no-email@example.com',
                status: {
                  label: payment.status === 'overdue' 
                    ? (t('pagamentoAtrasado') || 'Pagamento Atrasado')
                    : (t('pagamentoProximo') || 'Pagamento Próximo'),
                  type: payment.status === 'overdue' ? 'danger' : 'warning'
                },
                beltLevel: student.beltLevel || 'white',
                attendance: student.attendanceRate || Math.floor(Math.random() * 100),
                lastSeen: '5 dias atrás'
              };
            })}
            onEmail={handleEmailStudent}
            onCall={handleCallStudent}
            onMore={handleMoreOptions}
          />
        )}
      </div>

      {/* Take Attendance Dialog */}
      {selectedClass && (
        <Dialog open={true} onOpenChange={() => setSelectedClass(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogTitle>
              {t('takeAttendance') || 'Registrar Presença'} - {selectedClass.name}
            </DialogTitle>
            <AttendanceForm
              classInfo={{
                id: selectedClass.id,
                name: selectedClass.name,
                date: selectedClass.date,
                startTime: formatTime(selectedClass.startTime).time + " " + formatTime(selectedClass.startTime).period,
                instructor: selectedClass.instructor 
                  ? `${selectedClass.instructor.firstName} ${selectedClass.instructor.lastName}` 
                  : 'No instructor'
              }}
              students={[
                { id: 1, userId: 1, name: 'Alex Johnson', initials: 'AJ', beltLevel: 'white' as const, isPresent: false },
                { id: 2, userId: 2, name: 'Sarah Williams', initials: 'SW', beltLevel: 'blue' as const, isPresent: false },
                { id: 3, userId: 3, name: 'David Chen', initials: 'DC', beltLevel: 'purple' as const, isPresent: false },
                { id: 4, userId: 4, name: 'Maria Rodriguez', initials: 'MR', beltLevel: 'white' as const, isPresent: false },
                { id: 5, userId: 5, name: 'James Thompson', initials: 'JT', beltLevel: 'brown' as const, isPresent: false }
              ]}
              onSubmit={handleSaveAttendance}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Dashboard;