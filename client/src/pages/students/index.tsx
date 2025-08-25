import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { Layout } from '@/components/layout/layout';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Student } from '@/types';
import { Link } from 'wouter';
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import BeltIcon from '@/components/ui/belt-icon';
import AddStudentModal from '@/components/modals/add-student-modal';
import StudentEditDialog from '@/components/students/StudentEditDialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, Edit2 } from 'lucide-react';

export default function StudentsPage() {
  const { t, locale } = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  
  // Student edit dialog state
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogReadOnly, setEditDialogReadOnly] = useState(false);
  
  // Get students
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });
  
  // Student mutations
  const activateStudentMutation = useMutation({
    mutationFn: (id: number) => api.students.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: 'Success',
        description: 'Student activated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to activate student: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  const deactivateStudentMutation = useMutation({
    mutationFn: (id: number) => api.students.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: 'Success',
        description: 'Student deactivated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to deactivate student: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  const createStudentMutation = useMutation({
    mutationFn: (data: any) => api.students.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: t('student.addStudent'),
        description: 'Student created successfully',
      });
      setIsAddStudentModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create student: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Filter students by search term
  const filteredStudents = students
    ? students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.cpf.includes(searchTerm)
      )
    : [];
  
  // Handle adding a new student
  const handleAddStudent = (data: any) => {
    createStudentMutation.mutate(data);
  };
  
  // Check if user has permission to add/edit students
  const canManageStudents = user && ['admin', 'manager'].includes(user.role);

  // Functions to open student edit dialog
  function openEditDialog(studentId: number, studentName: string, readOnly = false) {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
    setEditDialogReadOnly(readOnly);
    setEditDialogOpen(true);
  }

  function openViewDialog(studentId: number, studentName: string) {
    openEditDialog(studentId, studentName, true);
  }

  function openEditDialogForEdit(studentId: number, studentName: string) {
    openEditDialog(studentId, studentName, false);
  }
  
  return (
    <Layout title={t('common.students')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <CardTitle>{t('common.students')}</CardTitle>
            <div className="flex space-x-2">
              <Input
                className="w-full sm:w-auto bg-gray-700 border-gray-600 text-white"
                placeholder="Search by name or CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {canManageStudents && (
                <Button onClick={() => setIsAddStudentModalOpen(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  {t('student.addStudent')}
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">{t('student.fullName')}</TableHead>
                    <TableHead className="text-gray-400">{t('student.belt')}</TableHead>
                    <TableHead className="text-gray-400">{t('student.joinDate')}</TableHead>
                    <TableHead className="text-gray-400">{t('student.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {t('common.loading')}
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-400">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow 
                        key={student.id} 
                        className="border-gray-700 cursor-pointer hover:bg-gray-700/50"
                        onDoubleClick={() => canManageStudents && openEditDialogForEdit(student.id, student.name)}
                      >
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <BeltIcon belt={student.currentBelt} className="mr-2" />
                            <span>
                              {t(`student.${student.currentBelt}Belt`)}
                              {student.currentGrade > 0 && ` (${student.currentGrade}°)`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(student.joinDate, locale)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            student.isActive 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-red-900 text-red-300'
                          }`}>
                            {student.isActive ? t('student.active') : t('student.inactive')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {/* View Button (Eye icon) */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openViewDialog(student.id, student.name)}
                              data-testid={`button-view-student-${student.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {t('common.view')}
                            </Button>

                            {canManageStudents && (
                              <>
                                {/* Edit Button */}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openEditDialogForEdit(student.id, student.name)}
                                  data-testid={`button-edit-student-${student.id}`}
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  {t('common.edit')}
                                </Button>

                                {/* Actions dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <i className="fas fa-ellipsis-v"></i>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-gray-700 border-gray-600 text-white">
                                    {student.isActive ? (
                                      <DropdownMenuItem 
                                        className="cursor-pointer text-red-400"
                                        onClick={() => deactivateStudentMutation.mutate(student.id)}
                                      >
                                        <i className="fas fa-user-minus mr-2"></i> {t('student.deactivate')}
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem 
                                        className="cursor-pointer text-green-400"
                                        onClick={() => activateStudentMutation.mutate(student.id)}
                                      >
                                        <i className="fas fa-user-plus mr-2"></i> {t('student.activate')}
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
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
      
      {/* Add Student Modal */}
      <AddStudentModal 
        isOpen={isAddStudentModalOpen} 
        onClose={() => setIsAddStudentModalOpen(false)}
        onSubmit={handleAddStudent}
      />

      {/* Student Edit Dialog */}
      {selectedStudentId && (
        <StudentEditDialog
          studentId={selectedStudentId}
          studentName={selectedStudentName}
          open={editDialogOpen}
          readOnly={editDialogReadOnly}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </Layout>
  );
}
