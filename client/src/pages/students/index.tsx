import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { Layout } from '@/components/layout/layout';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Student } from '@/types';
import { Link, useLocation } from 'wouter';
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
import StudentEditDialog from '@/components/students/StudentEditDialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, Edit2, Mail, MoreVertical, Search, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function StudentsPage() {
  const { t, locale } = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLocation] = useLocation();
  
  // Student edit dialog state
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogReadOnly, setEditDialogReadOnly] = useState(false);
  
  // Get students (API returns paginated { items, total, ... })
  const { data: studentsData, isLoading } = useQuery<any>({
    queryKey: ['/api/students'],
  });
  const students: Student[] = studentsData?.items || [];
  
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
  
  const resendEmailMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest("POST", `/api/users/${userId}/resend-email`),
    onSuccess: (_, userId) => {
      toast({
        title: "E-mail reenviado",
        description: "As credenciais de acesso foram enviadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao reenviar e-mail",
        description: error?.message || "Não foi possível enviar o e-mail.",
        variant: "destructive",
      });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: (data: any) => api.students.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: t('student.addStudent'),
        description: 'Student created successfully',
      });
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
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-gray-100">{t('common.students')}</h1>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                className="pl-8 w-full sm:w-56 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                placeholder="Nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {canManageStudents && (
              <Button onClick={() => setLocation('/onboarding')} size="sm" className="flex-shrink-0">
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t('student.addStudent')}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile card list (hidden on md+) */}
        <div className="md:hidden space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Carregando...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhum aluno encontrado</div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center gap-3"
              >
                {/* Belt stripe */}
                <div className="flex-shrink-0">
                  <BeltIcon belt={student.currentBelt} className="w-8 h-8" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{student.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {t(`student.${student.currentBelt}Belt`)}
                    {student.currentGrade > 0 && ` · ${student.currentGrade}°`}
                    {' · '}
                    {formatDate(student.joinDate, locale)}
                  </p>
                </div>

                {/* Status pill */}
                <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                  student.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                  {student.isActive ? 'Ativo' : 'Inativo'}
                </span>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-gray-400">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-700 border-gray-600 text-white">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => openViewDialog(student.id, student.name)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> Ver Perfil
                    </DropdownMenuItem>
                    {canManageStudents && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => openEditDialogForEdit(student.id, student.name)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                    )}
                    {(student as any).userId && canManageStudents && (
                      <DropdownMenuItem
                        className="cursor-pointer text-blue-400"
                        onClick={() => resendEmailMutation.mutate((student as any).userId)}
                        disabled={resendEmailMutation.isPending}
                      >
                        <Mail className="w-4 h-4 mr-2" /> Reenviar E-mail
                      </DropdownMenuItem>
                    )}
                    {canManageStudents && (
                      student.isActive ? (
                        <DropdownMenuItem
                          className="cursor-pointer text-red-400"
                          onClick={() => deactivateStudentMutation.mutate(student.id)}
                        >
                          {t('student.deactivate')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="cursor-pointer text-green-400"
                          onClick={() => activateStudentMutation.mutate(student.id)}
                        >
                          {t('student.activate')}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>

        {/* Desktop table (hidden on mobile) */}
        <Card className="hidden md:block bg-gray-800 border-gray-700 text-white">
          <CardContent className="p-0">
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
                      <TableCell colSpan={5} className="text-center py-4">{t('common.loading')}</TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-400">Nenhum aluno encontrado</TableCell>
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
                            student.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                          }`}>
                            {student.isActive ? t('student.active') : t('student.inactive')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openViewDialog(student.id, student.name)}>
                              <Eye className="h-4 w-4 mr-1" />{t('common.view')}
                            </Button>
                            {canManageStudents && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => openEditDialogForEdit(student.id, student.name)}>
                                  <Edit2 className="h-4 w-4 mr-1" />{t('common.edit')}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-gray-700 border-gray-600 text-white">
                                    {(student as any).userId && (
                                      <DropdownMenuItem
                                        className="cursor-pointer text-blue-400"
                                        onClick={() => resendEmailMutation.mutate((student as any).userId)}
                                        disabled={resendEmailMutation.isPending}
                                      >
                                        <Mail className="w-4 h-4 mr-2" /> Reenviar E-mail
                                      </DropdownMenuItem>
                                    )}
                                    {student.isActive ? (
                                      <DropdownMenuItem className="cursor-pointer text-red-400" onClick={() => deactivateStudentMutation.mutate(student.id)}>
                                        {t('student.deactivate')}
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem className="cursor-pointer text-green-400" onClick={() => activateStudentMutation.mutate(student.id)}>
                                        {t('student.activate')}
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
