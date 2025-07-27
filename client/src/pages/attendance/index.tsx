import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { Layout } from '@/components/layout/layout';
import { formatDate, formatTime } from '@/lib/utils';
import { ClassSession, Student } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import BeltIcon from '@/components/ui/belt-icon';

// Sample attendance data for display
const sampleAttendance = [
  {
    id: 1,
    student: {
      id: 1,
      name: 'Carlos Mendes',
      currentBelt: 'white',
      currentGrade: 2
    },
    classSession: {
      id: 1,
      title: 'Fundamentals',
      date: new Date().toISOString(),
      startTime: '18:00',
      endTime: '19:30'
    },
    timestamp: new Date().toISOString(),
    status: 'present'
  },
  {
    id: 2,
    student: {
      id: 2,
      name: 'Fernanda Costa',
      currentBelt: 'blue',
      currentGrade: 1
    },
    classSession: {
      id: 1,
      title: 'Fundamentals',
      date: new Date().toISOString(),
      startTime: '18:00',
      endTime: '19:30'
    },
    timestamp: new Date().toISOString(),
    status: 'present'
  },
  {
    id: 3,
    student: {
      id: 3,
      name: 'Eduardo Santos',
      currentBelt: 'purple',
      currentGrade: 0
    },
    classSession: {
      id: 1,
      title: 'Fundamentals',
      date: new Date().toISOString(),
      startTime: '18:00',
      endTime: '19:30'
    },
    timestamp: null,
    status: 'absent'
  }
];

export default function AttendancePage() {
  const { t, locale } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('daily');
  
  // Get classes
  const { data: classes, isLoading: isClassesLoading } = useQuery<ClassSession[]>({
    queryKey: ['/api/classes'],
  });
  
  // Get students
  const { data: students, isLoading: isStudentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });
  
  // Filter attendance by search term
  const filteredAttendance = sampleAttendance.filter(record =>
    record.student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter by class
  const filteredByClass = selectedClass === 'all'
    ? filteredAttendance
    : filteredAttendance.filter(record => record.classSession.id.toString() === selectedClass);
  
  return (
    <Layout title={t('common.attendance')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <Tabs defaultValue="daily" onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <TabsList className="mb-4 md:mb-0 bg-gray-900">
              <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
              <TabsTrigger value="student">Student Attendance</TabsTrigger>
              <TabsTrigger value="class">Class Attendance</TabsTrigger>
            </TabsList>
            
            <div className="flex space-x-2">
              <Input
                className="w-full md:w-auto bg-gray-700 border-gray-600 text-white"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <TabsContent value="daily">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700 text-white md:col-span-1">
                <CardHeader>
                  <CardTitle>Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="border-gray-700 rounded-md"
                  />
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Class
                    </label>
                    <Select
                      value={selectedClass}
                      onValueChange={setSelectedClass}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 text-white">
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes?.map(cls => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.title} ({formatTime(cls.startTime)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700 text-white md:col-span-3">
                <CardHeader>
                  <CardTitle>
                    Attendance for {selectedDate ? formatDate(selectedDate, locale) : 'Today'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-400">{t('student.fullName')}</TableHead>
                          <TableHead className="text-gray-400">{t('student.belt')}</TableHead>
                          <TableHead className="text-gray-400">{t('class.title')}</TableHead>
                          <TableHead className="text-gray-400">Time</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredByClass.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-gray-400">
                              No attendance records found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredByClass.map((record) => (
                            <TableRow key={record.id} className="border-gray-700">
                              <TableCell className="font-medium">{record.student.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <BeltIcon belt={record.student.currentBelt} className="mr-2" />
                                  <span>{t(`student.${record.student.currentBelt}Belt`)}</span>
                                </div>
                              </TableCell>
                              <TableCell>{record.classSession.title}</TableCell>
                              <TableCell>
                                {record.timestamp 
                                  ? formatTime(record.timestamp.split('T')[1].substring(0, 5)) 
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                                  {record.status === 'present' ? 'Present' : 'Absent'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" size="sm">
                                    {record.status === 'present' ? 'Mark Absent' : 'Mark Present'}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="student">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Student Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Select Student
                  </label>
                  <Select>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      {students?.map(student => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-center py-12 text-gray-400">
                  Select a student to view their attendance history
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="class">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Class Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Select Class
                  </label>
                  <Select>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-white">
                      {classes?.map(cls => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.title} - {formatDate(cls.date, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-center py-12 text-gray-400">
                  Select a class to view attendance details
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
