import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BeltWithLabel } from "@/components/ui/belt";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTime, formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const Attendance: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedClass, setSelectedClass] = useState<any | null>(null);

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

  const handleTakeAttendance = (classItem: any) => {
    setSelectedClass({
      ...classItem,
      date: selectedDate || new Date(),
    });
  };

  const handleSubmitAttendance = (data: any) => {
    submitAttendance(data);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">{t('attendance')}</h1>
          <p className="text-gray-600">{t('trackAttendance')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('selectDate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t('todaysClasses')}</CardTitle>
            </CardHeader>
            <CardContent>
              {classesLoading ? (
                <div className="text-center py-4">{t('loading')}</div>
              ) : todaysClasses.length === 0 ? (
                <div className="text-center py-4 text-gray-500">{t('noClassesScheduled')}</div>
              ) : (
                <div className="space-y-4">
                  {todaysClasses.map((classItem: any) => {
                    const { time, period } = formatTime(classItem.startTime);
                    return (
                      <div 
                        key={classItem.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleTakeAttendance(classItem)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{classItem.name}</h3>
                          <span className="text-sm text-gray-500">{time} {period}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {classItem.instructor 
                            ? `${classItem.instructor.firstName} Sensei` 
                            : t('noInstructorAssigned')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {classItem.duration} {t('minutes')}
                          {classItem.maxCapacity ? ` • ${t('max')} ${classItem.maxCapacity} ${t('students')}` : ''}
                        </p>
                        <Button 
                          className="mt-3 w-full bg-secondary hover:bg-secondary-dark text-white"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTakeAttendance(classItem);
                          }}
                        >
                          {t('takeAttendance')}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
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

                <TabsContent value="byClass">
                  {attendanceLoading ? (
                    <div className="text-center py-8">{t('loading')}</div>
                  ) : filteredAttendance.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {t('noAttendanceRecords')}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Group attendance by class */}
                      {Object.entries(
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
                      ).map(([classId, data]: [string, any]) => (
                        <div key={classId} className="border rounded-lg p-4">
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

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {data.students.map((student: any) => (
                              <div key={student.id} className="flex items-center p-2 border rounded">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                  <span className="font-medium text-xs">
                                    {student.user.firstName.charAt(0)}
                                    {student.user.lastName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
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

                <TabsContent value="byStudent">
                  <div className="text-center py-8 text-gray-500">
                    Student view coming soon
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Take Attendance Dialog */}
      {selectedClass && (
        <Dialog open={true} onOpenChange={() => setSelectedClass(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogTitle>Take Attendance - {selectedClass.name}</DialogTitle>
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
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Attendance;