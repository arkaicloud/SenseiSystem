import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BeltWithLabel } from "@/components/ui/belt";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import StudentAttendanceSummary from "@/components/attendance/StudentAttendanceSummary";
import QuickAttendanceConfirm from "@/components/attendance/QuickAttendanceConfirm";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTime, formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

const Attendance: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [classFilter, setClassFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");

  // Fetch classes for the day
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes/today'],
    refetchInterval: false,
  });

  // Fetch attendance data
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['/api/attendance'],
    refetchInterval: false,
  });

  // Submit attendance mutation
  const { mutate: submitAttendance, isPending: isSubmittingAttendance } = useMutation({
    mutationFn: async (data: any) => {
      // Transform the data to match the API format
      const attendanceRecords = data.students
        .filter((student: any) => student.isPresent)
        .map((student: any) => ({
          studentId: student.id,
          classId: data.classId,
          date: new Date(),
          status: 'present',
          checkedInBy: 1, // Assuming current user ID is 1 for demo
        }));

      // Submit each attendance record
      const promises = attendanceRecords.map((record: any) =>
        apiRequest('POST', '/api/attendance', record)
      );

      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      });
      setSelectedClass(null);
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to record attendance: ${error}`,
        variant: "destructive",
      });
    },
  });

  const todaysClasses = classesData?.classes || [];
  const attendanceRecords = attendanceData?.attendances || [];

  // Filter attendance records by date
  const filteredAttendance = attendanceRecords.filter((record: any) => {
    if (!selectedDate) return true;

    const recordDate = new Date(record.date);
    return (
      recordDate.getDate() === selectedDate.getDate() &&
      recordDate.getMonth() === selectedDate.getMonth() &&
      recordDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Group attendance by class and apply filters
  const groupedAttendanceByClass = Object.entries(
    filteredAttendance.reduce((acc: any, record: any) => {
      const classId = record.class.id;
      if (!acc[classId]) {
        acc[classId] = {
          class: record.class,
          students: []
        };
      }
      acc[classId].students.push(record.student);
      return acc;
    }, {})
  ).filter(([_, data]: [string, any]) => {
    const className = data.class.name.toLowerCase();
    return className.includes(classFilter.toLowerCase());
  }).map(([classId, data]: [string, any]) => ({
    classId,
    ...data,
    students: data.students.filter((student: any) => {
      const studentName = `${student.user.firstName} ${student.user.lastName}`.toLowerCase();
      return studentName.includes(studentFilter.toLowerCase());
    })
  })).filter(data => data.students.length > 0 || !studentFilter);

  // Group attendance by student for the student tab
  const groupedAttendanceByStudent = filteredAttendance.reduce((acc: any, record: any) => {
    const studentId = record.student.id;
    const studentName = `${record.student.user.firstName} ${record.student.user.lastName}`.toLowerCase();
    
    if (!studentName.includes(studentFilter.toLowerCase())) return acc;
    
    if (!acc[studentId]) {
      acc[studentId] = {
        student: record.student,
        classes: []
      };
    }
    acc[studentId].classes.push(record.class);
    return acc;
  }, {});

  const handleTakeAttendance = (classItem: any) => {
    setSelectedClass({
      ...classItem,
      date: selectedDate || new Date(),
    });
  };

  const handleSubmitAttendance = (data: any) => {
    submitAttendance(data);
  };

  // Buscar dados do estudante pelo userId
  const { data: studentData } = useQuery({
    queryKey: ['/api/students/by-user', user?.id],
    enabled: !!user && user.role === 'student',
  });

  // Verificar se o usuário é um aluno
  const isStudent = user?.role === 'student';
  const isAdminOrInstructor = user?.role === 'admin' || user?.role === 'instructor';

  // Renderizar interface diferente para alunos vs. professores/administradores
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="font-montserrat font-bold text-xl md:text-2xl text-primary">{t('attendance')}</h1>
          <p className="text-gray-600">{isStudent ? t('yourAttendance') : t('trackAttendance')}</p>
        </div>
      </div>

      {/* Painel do Aluno */}
      {isStudent && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            {/* Resumo de presença do aluno */}
            {/* Usar userId diretamente em vez de studentId */}
            {user && (
              <StudentAttendanceSummary studentId={user.id} />
            )}
          </div>

          <div>
            {/* Confirmação rápida de presença */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">{t('confirmar_presenca')}</CardTitle>
              </CardHeader>
              <CardContent>
                {user && (
                  <QuickAttendanceConfirm userId={user.id} />
                )}
              </CardContent>
            </Card>

            {/* Calendário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('calendar')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border w-full"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Painel do Professor/Admin */}
      {isAdminOrInstructor && (
        <div className="space-y-6">
          {/* Layout em linha para desktop, empilhado para mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendário e Aulas do Dia - Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Calendário */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">{t('selectDate')}</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full"
                    classNames={{
                      months: "flex w-full",
                      month: "w-full",
                      table: "w-full border-collapse",
                      head_row: "flex w-full",
                      head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex-1",
                      row: "flex w-full mt-2",
                      cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
                      day: "h-8 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </CardContent>
              </Card>

              {/* Aulas do Dia */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">{t('todaysClasses')}</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {classesLoading ? (
                    <div className="text-center py-4 text-sm">{t('loading')}</div>
                  ) : todaysClasses.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">{t('noClassesScheduled')}</div>
                  ) : (
                    <div className="space-y-3">
                      {todaysClasses.map((classItem: any) => {
                        const { time, period } = formatTime(classItem.startTime);
                        return (
                          <div 
                            key={classItem.id}
                            className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleTakeAttendance(classItem)}
                          >
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-sm truncate">{classItem.name}</h3>
                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{time} {period}</span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">
                                {classItem.instructor 
                                  ? `${classItem.instructor.firstName} Sensei` 
                                  : t('noInstructorAssigned')}
                              </p>
                              <Button 
                                className="w-full bg-secondary hover:bg-secondary-dark text-white text-xs py-1 h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTakeAttendance(classItem);
                                }}
                              >
                                {t('takeAttendance')}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Área Principal de Presença */}
            <div className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedDate 
                      ? `${t('attendance')} - ${formatDate(selectedDate)}` 
                      : t('attendance')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="byClass">
                    <TabsList className="mb-4">
                      <TabsTrigger value="byClass">{t('byClass')}</TabsTrigger>
                      <TabsTrigger value="byStudent">{t('byStudent')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="byClass" className="space-y-4">
                      {/* Filtros */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <Input
                            placeholder={`${t('search')} aulas...`}
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder={`${t('search')} alunos...`}
                            value={studentFilter}
                            onChange={(e) => setStudentFilter(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {attendanceLoading ? (
                        <div className="text-center py-8">{t('loading')}</div>
                      ) : groupedAttendanceByClass.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {filteredAttendance.length === 0 ? t('noAttendanceRecords') : 'Nenhum resultado encontrado para os filtros aplicados'}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {groupedAttendanceByClass.map((data: any) => (
                            <div key={data.classId} className="border rounded-lg p-4">
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <h3 className="font-medium text-lg">{data.class.name}</h3>
                                  <p className="text-sm text-gray-600">
                                    {data.class.instructor 
                                      ? `${data.class.instructor.firstName} Sensei` 
                                      : 'No instructor assigned'}
                                    {' • '}
                                    {formatTime(data.class.startTime).time} 
                                    {formatTime(data.class.startTime).period}
                                  </p>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {data.students.length} {data.students.length !== 1 ? t('studentsPresent') : t('studentPresent')}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {data.students.map((student: any) => (
                                  <div key={student.id} className="flex items-center p-2 border rounded">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                                      <span className="font-medium text-xs">
                                        {student.user.firstName.charAt(0)}
                                        {student.user.lastName.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium truncate">
                                        {student.user.firstName} {student.user.lastName}
                                      </p>
                                      <BeltWithLabel level={student.beltLevel} size="sm" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="byStudent" className="space-y-4">
                      {/* Filtro de estudante */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <Input
                            placeholder={`${t('search')} alunos...`}
                            value={studentFilter}
                            onChange={(e) => setStudentFilter(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {attendanceLoading ? (
                        <div className="text-center py-8">{t('loading')}</div>
                      ) : Object.keys(groupedAttendanceByStudent).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          {filteredAttendance.length === 0 ? t('noAttendanceRecords') : 'Nenhum resultado encontrado para os filtros aplicados'}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(groupedAttendanceByStudent).map(([studentId, data]: [string, any]) => (
                            <div key={studentId} className="border rounded-lg p-4">
                              <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                                  <span className="font-medium">
                                    {data.student.user.firstName.charAt(0)}
                                    {data.student.user.lastName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-medium text-lg">
                                    {data.student.user.firstName} {data.student.user.lastName}
                                  </h3>
                                  <div className="flex items-center space-x-2">
                                    <BeltWithLabel level={data.student.beltLevel} size="sm" />
                                    <span className="text-sm text-gray-600">
                                      {data.classes.length} {data.classes.length !== 1 ? 'aulas frequentadas' : 'aula frequentada'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {data.classes.map((classItem: any) => (
                                  <div key={classItem.id} className="flex items-center p-2 border rounded">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{classItem.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatTime(classItem.startTime).time} 
                                        {formatTime(classItem.startTime).period}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}


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
              onSubmit={handleSubmitAttendance}
              isLoading={isSubmittingAttendance}
              placeholder={t('search') + ' alunos...'}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Attendance;