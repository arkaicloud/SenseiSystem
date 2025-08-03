import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BeltWithLabel } from "@/components/ui/belt";
import StudentForm from "@/components/students/StudentForm";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Students: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch students data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/students'],
    refetchInterval: false,
  });

  // Add student mutation
  const { mutate: addStudent, isPending: isAddingStudent } = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/students', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Aluno cadastrado com sucesso",
      });
      setIsAddStudentOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao cadastrar aluno: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update student mutation
  const { mutate: updateStudent, isPending: isUpdatingStudent } = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PUT', `/api/students/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Aluno atualizado com sucesso",
      });
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar aluno: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Toggle student status mutation (block/unblock)
  const { mutate: toggleStudentStatus, isPending: isTogglingStatus } = useMutation({
    mutationFn: async ({ studentId, userId, newStatus }: { studentId: number, userId: number, newStatus: boolean }) => {
      // Update user status first
      await apiRequest('PUT', `/api/users/${userId}`, { active: newStatus });
      // Then update student record
      const res = await apiRequest('PUT', `/api/students/${studentId}`, { active: newStatus });
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Sucesso",
        description: variables.newStatus ? "Aluno liberado com sucesso" : "Aluno bloqueado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao alterar status do aluno: ${error}`,
        variant: "destructive",
      });
    },
  });

  const students = (data as any)?.students || [];

  const filteredStudents = students.filter((student: any) => {
    const name = `${student.user.firstName} ${student.user.lastName}`.toLowerCase();
    const email = student.user.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const handleAddStudent = (data: any) => {
    addStudent(data);
  };

  const handleUpdateStudent = (data: any) => {
    if (selectedStudent) {
      const studentData = {
        beltLevel: data.beltLevel,
        stripes: data.stripes,
        notes: data.notes,
      };

      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
      };

      // Update student data
      updateStudent({ id: selectedStudent.id, data: studentData });

      // Update user data
      apiRequest('PUT', `/api/users/${selectedStudent.user.id}`, userData)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/students'] });
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: `Failed to update user data: ${error}`,
            variant: "destructive",
          });
        });
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">Alunos</h1>
          <p className="text-gray-600">Gerencie os alunos da escola</p>
        </div>
        <div className="mt-4 md:mt-0 flex">
          <div className="relative mr-2">
            <Input
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <span className="material-icons text-sm">search</span>
            </div>
          </div>
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary-dark text-white font-medium">
                <span className="material-icons mr-1 text-sm">add</span>
                + Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogTitle>Adicionar Novo Aluno</DialogTitle>
              <StudentForm onSubmit={handleAddStudent} isLoading={isAddingStudent} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos os Alunos</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="inactive">Inativos</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="text-center py-8">Carregando alunos...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "Nenhum aluno encontrado para sua busca" : "Nenhum aluno encontrado"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome do Aluno</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Faixa / Graduação</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Endereço</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Última Atividade</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Plano</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Situação $</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Responsável</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student: any, index: number) => (
                      <tr 
                        key={student.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-600">
                            #STU{String(student.id).padStart(3, '0')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium mr-3">
                              {student.user.firstName.charAt(0)}{student.user.lastName.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {student.user.firstName} {student.user.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-900">
                            <BeltWithLabel level={student.beltLevel} size="sm" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {student.user.street || 'Não informado'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="material-icons text-xs mr-1">access_time</span>
                            <span title={`Última atividade: ${new Date(student.user.joinDate).toLocaleDateString('pt-BR')}`}>
                              {(() => {
                                const joinDate = new Date(student.user.joinDate);
                                const now = new Date();
                                const diffMs = now.getTime() - joinDate.getTime();
                                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                
                                if (diffMinutes < 60) {
                                  return diffMinutes < 5 ? 'Agora mesmo' : `${diffMinutes} minutos atrás`;
                                } else if (diffHours < 24) {
                                  return diffHours === 1 ? '1 hora atrás' : `${diffHours} horas atrás`;
                                } else if (diffDays === 1) {
                                  return 'Ontem';
                                } else {
                                  return joinDate.toLocaleDateString('pt-BR');
                                }
                              })()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">Individual</div>
                            <div className="text-gray-500">R$ 120,00 - PIX</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            Math.random() > 0.3 
                              ? 'bg-green-100 text-green-800'
                              : Math.random() > 0.5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              Math.random() > 0.3 ? 'bg-green-400' : Math.random() > 0.5 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}></div>
                            {Math.random() > 0.3 ? 'Em dia' : Math.random() > 0.5 ? 'Pendente' : 'Atrasado'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600">
                            {student.user.phone || 'Não informado'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.user.active 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              student.user.active ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                            {student.user.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Ver perfil completo"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(student);
                              }}
                            >
                              <span className="material-icons text-blue-500 text-sm">visibility</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Editar aluno"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(student);
                              }}
                            >
                              <span className="material-icons text-gray-500 text-sm">edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-8 w-8 p-0 ${isTogglingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={student.user.active ? "Bloquear aluno" : "Liberar aluno"}
                              disabled={isTogglingStatus}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStudentStatus({
                                  studentId: student.id,
                                  userId: student.user.id,
                                  newStatus: !student.user.active
                                });
                              }}
                            >
                              {student.user.active ? (
                                <span className="material-icons text-red-500 text-sm">block</span>
                              ) : (
                                <span className="material-icons text-green-500 text-sm">check_circle</span>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Mais ações"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Menu de ações
                              }}
                            >
                              <span className="material-icons text-gray-400 text-sm">more_vert</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Paginação */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-600">
                    Mostrando {filteredStudents.length} de {filteredStudents.length} resultados
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      <span className="material-icons text-sm">chevron_left</span>
                    </Button>
                    <Button variant="outline" size="sm" className="bg-primary text-white">
                      1
                    </Button>
                    <Button variant="outline" size="sm">
                      2
                    </Button>
                    <Button variant="outline" size="sm">
                      3
                    </Button>
                    <Button variant="outline" size="sm">
                      4
                    </Button>
                    <Button variant="outline" size="sm">
                      5
                    </Button>
                    <Button variant="outline" size="sm">
                      <span className="material-icons text-sm">chevron_right</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            <div className="text-center py-8 text-gray-500">
              Funcionalidade de filtro em breve
            </div>
          </TabsContent>

          <TabsContent value="inactive">
            <div className="text-center py-8 text-gray-500">
              Funcionalidade de filtro em breve
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {/* Edit Student Dialog */}
      {selectedStudent && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogTitle>Editar Aluno</DialogTitle>
            <StudentForm 
              defaultValues={{
                firstName: selectedStudent.user.firstName,
                lastName: selectedStudent.user.lastName,
                email: selectedStudent.user.email,
                username: selectedStudent.user.username,
                beltLevel: selectedStudent.beltLevel,
                stripes: selectedStudent.stripes,
                emergencyContact: selectedStudent.user.emergencyContact || '',
                notes: selectedStudent.notes || '',
                phone: selectedStudent.user.phone || '',
              }}
              onSubmit={handleUpdateStudent}
              isLoading={isUpdatingStudent}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Students;