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
import { formatDate, formatTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const { t } = useTranslation();

  // Fetch dashboard stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 60000, // Atualiza a cada minuto
  });

  // Fetch today's classes
  const { data: classesData, isLoading: isClassesLoading } = useQuery({
    queryKey: ['/api/classes/today'],
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });

  // Fetch activity logs
  const { data: activityLogsData, isLoading: isActivityLogsLoading } = useQuery({
    queryKey: ['/api/activity-logs'],
    refetchInterval: 60000, // Atualiza a cada minuto
  });

  // Fetch students requiring attention
  const { data: overduePaymentsData, isLoading: isOverduePaymentsLoading } = useQuery({
    queryKey: ['/api/student-payments/overdue'],
    refetchInterval: 300000, // Atualiza a cada 5 minutos
  });

  // Processar dados estatísticos do servidor ou usar fallback se não disponíveis
  const stats = statsData?.stats ? {
    totalStudents: statsData.stats.totalStudents || 0,
    classesThisMonth: statsData.stats.totalClasses || 0,
    avgAttendance: statsData.stats.averageAttendance ? `${Math.round(statsData.stats.averageAttendance * 100)}%` : "0%",
    revenue: statsData.stats.revenueThisMonth ? `R$ ${statsData.stats.revenueThisMonth.toLocaleString('pt-BR')}` : "R$ 0"
  } : {
    totalStudents: 0,
    classesThisMonth: 0,
    avgAttendance: "0%",
    revenue: "R$ 0"
  };

  const todaysClasses = classesData?.classes || [];
  const recentActivities = activityLogsData?.logs || [];
  const studentsRequiringAttention = overduePaymentsData?.payments || [];

  // Mock data for belt distribution until we implement the actual endpoint
  const beltDistribution = [
    { level: 'white', count: 32, percentage: 37 },
    { level: 'blue', count: 25, percentage: 29 },
    { level: 'purple', count: 16, percentage: 18 },
    { level: 'brown', count: 9, percentage: 10 },
    { level: 'black', count: 5, percentage: 6 }
  ];

  const upcomingTests = [
    { from: 'white', to: 'blue', date: 'Nov 15, 2023' },
    { from: 'blue', to: 'purple', date: 'Dec 05, 2023' },
    { from: 'purple', to: 'brown', date: 'Jan 10, 2024' }
  ];

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
      description: "A presença na aula foi registrada com sucesso.",
    });
    setSelectedClass(null);
  };

  const handleEmailStudent = (student: any) => {
    toast({
      title: "E-mail enviado",
      description: `Enviando e-mail para ${student.name}`,
    });
  };

  const handleCallStudent = (student: any) => {
    toast({
      title: "Ligação iniciada",
      description: `Ligando para ${student.name}`,
    });
  };

  const handleMoreOptions = (student: any) => {
    toast({
      title: "Mais opções",
      description: `Opções para ${student.name}`,
    });
  };

  return (
    <>
      {/* Dashboard header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">{t('dashboard')}</h1>
          <p className="text-gray-600">{t('welcomeMessage', { name: 'John' })}</p>
        </div>
        <div className="mt-4 md:mt-0 flex">
          <div className="relative mr-2">
            <input
              type="text"
              placeholder={t('search')}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <span className="material-icons text-sm">search</span>
            </div>
          </div>
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary-dark text-white font-medium">
                <span className="material-icons mr-1 text-sm">add</span>
                {t('newStudent')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogTitle>{t('addStudent')}</DialogTitle>
              <StudentForm onSubmit={handleAddStudent} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title={t('totalAlunos')}
          value={stats.totalStudents}
          icon="people"
          trend={{ value: "12%", isPositive: true }}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-500"
          subtitle={t('vs_last_month')}
        />
        <StatCard
          title={t('aulasMes')}
          value={stats.classesThisMonth}
          icon="event"
          trend={{ value: "5%", isPositive: true }}
          iconBgColor="bg-green-100"
          iconColor="text-green-500"
          subtitle={t('vs_last_month')}
        />
        <StatCard
          title={t('avgPresenca')}
          value={stats.avgAttendance}
          icon="fact_check"
          trend={{ value: "3%", isPositive: false }}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-500"
          subtitle={t('vs_last_month')}
        />
        <StatCard
          title={t('receita')}
          value={stats.revenue}
          icon="payments"
          trend={{ value: "8%", isPositive: true }}
          iconBgColor="bg-accent-light"
          iconColor="text-accent-dark"
          subtitle={t('vs_last_month')}
        />
      </div>

      {/* Seção de aulas do dia */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-montserrat font-bold text-xl">{t('aulasHoje')}</h2>
          <Link href="/classes">
            <a className="text-secondary font-medium text-sm flex items-center">
              {t('verTodas')}
              <span className="material-icons text-sm ml-1">arrow_forward</span>
            </a>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium">{t('proximasAulas')}</h3>
            <span className="text-xs text-gray-500">{formatDate(new Date())}</span>
          </div>

          <div className="divide-y divide-gray-200">
            {isClassesLoading ? (
              <div className="p-8 text-center">{t('loading')}</div>
            ) : todaysClasses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t('semAulasAgendadas')}</div>
            ) : (
              todaysClasses.map((classItem: any) => {
                const { time, period } = formatTime(classItem.startTime);
                const instructorName = classItem.instructor 
                  ? `${classItem.instructor.firstName} Sensei` 
                  : t('semInstrutorDesignado');

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
      </div>

      {/* Layout de duas colunas para Atividades Recentes e Distribuição de Faixas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Atividades Recentes */}
        <div className="lg:col-span-2">
          <ActivityList
            activities={
              isActivityLogsLoading
                ? []
                : recentActivities.slice(0, 5).map((activity: any) => {
                    let iconBgColor = "bg-blue-100";
                    let iconColor = "text-blue-500";
                    let icon = "info";

                    // Adaptado para texto em português
                    if (activity.activity.includes("novo aluno") || activity.activity.includes("new student")) {
                      icon = "person_add";
                    } else if (activity.activity.includes("presença") || activity.activity.includes("attendance")) {
                      icon = "fact_check";
                      iconBgColor = "bg-green-100";
                      iconColor = "text-green-500";
                    } else if (activity.activity.includes("promovido") || activity.activity.includes("promoted")) {
                      icon = "upgrade";
                      iconBgColor = "bg-purple-100";
                      iconColor = "text-purple-500";
                    } else if (activity.activity.includes("pagamento") || activity.activity.includes("payment")) {
                      icon = "payments";
                      iconBgColor = "bg-accent-light";
                      iconColor = "text-accent-dark";
                    } else if (activity.activity.includes("atrasado") || activity.activity.includes("overdue")) {
                      icon = "warning";
                      iconBgColor = "bg-secondary-light";
                      iconColor = "text-white";
                    }

                    return {
                      id: activity.id,
                      icon,
                      iconBgColor,
                      iconColor,
                      content: <p dangerouslySetInnerHTML={{ __html: activity.activity }} />,
                      timestamp: new Date(activity.timestamp).toLocaleString('pt-BR')
                    };
                  })
            }
            onViewAll={() => window.location.href = "/reports"}
          />
        </div>

        {/* Distribuição de Faixas */}
        <div>
          <BeltDistribution
            distribution={beltDistribution}
            upcomingTests={upcomingTests}
          />
        </div>
      </div>

      {/* Seção de Alunos com Pagamentos Pendentes */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-montserrat font-bold text-xl">{t('alunosComPendencias')}</h2>
          <Link href="/reports">
            <a className="text-secondary font-medium text-sm flex items-center">
              {t('verRelatorioDetalhado')}
              <span className="material-icons text-sm ml-1">arrow_forward</span>
            </a>
          </Link>
        </div>

        {isOverduePaymentsLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">{t('carregandoAlunos')}</div>
        ) : studentsRequiringAttention.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {t('nenhumAlunoComPendencia')}
          </div>
        ) : (
          <StudentsTable
            students={studentsRequiringAttention.map((payment: any) => {
              const student = payment.student;
              const user = student.user;

              return {
                id: student.id,
                initials: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                status: {
                  label: payment.status === 'overdue' ? t('pagamentoAtrasado') : t('pagamentoProximo'),
                  type: payment.status === 'overdue' ? 'danger' : 'warning'
                },
                beltLevel: student.beltLevel,
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
            <DialogTitle>{t('takeAttendance')} - {selectedClass.name}</DialogTitle>
            <AttendanceForm
              classInfo={{
                id: selectedClass.id,
                name: selectedClass.name,
                date: selectedClass.date,
                startTime: formatTime(selectedClass.startTime).time + " " + formatTime(selectedClass.startTime).period,
                instructor: selectedClass.instructor ? `${selectedClass.instructor.firstName} ${selectedClass.instructor.lastName}` : 'No instructor'
              }}
              students={[
                { id: 1, userId: 1, name: 'Alex Johnson', initials: 'AJ', beltLevel: 'white' },
                { id: 2, userId: 2, name: 'Sarah Williams', initials: 'SW', beltLevel: 'blue' },
                { id: 3, userId: 3, name: 'David Chen', initials: 'DC', beltLevel: 'purple' },
                { id: 4, userId: 4, name: 'Maria Rodriguez', initials: 'MR', beltLevel: 'white' },
                { id: 5, userId: 5, name: 'James Thompson', initials: 'JT', beltLevel: 'brown' }
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