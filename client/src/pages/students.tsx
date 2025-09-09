import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { BeltWithLabel } from "@/components/ui/belt";
import StudentEditDialog from "@/components/students/StudentEditDialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import BeltFilter from '@/components/ui/BeltFilter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit2, Ban, CheckCircle, Undo } from "lucide-react";

const Students: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<any | null>(null);

  // Componente de Ações para Mobile e Desktop
  const StudentActions = ({ student, isMobile = false }: { student: any, isMobile?: boolean }) => {
    if (isMobile) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setStudentToEdit(student);
                setIsEditStudentOpen(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setStudentToEdit(student);
                setIsEditStudentOpen(true);
              }}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Editar dados
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                toggleStudentStatus({
                  studentId: student.id,
                  userId: student.user.id,
                  newStatus: !student.user.active
                });
              }}
              disabled={isTogglingStatus}
            >
              {student.user.active ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Bloquear aluno
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Liberar aluno
                </>
              )}
            </DropdownMenuItem>
            {student.user.active && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  revertApprovalMutation.mutate(student.user.id);
                }}
                disabled={revertApprovalMutation.isPending}
              >
                <Undo className="mr-2 h-4 w-4" />
                Reverter para pendente
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Versão Desktop (atual)
    return (
      <div className="flex items-center space-x-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          title="Ver perfil completo"
          onClick={(e) => {
            e.stopPropagation();
            setStudentToEdit(student);
            setIsEditStudentOpen(true);
          }}
        >
          <span className="material-icons text-blue-500 text-sm">visibility</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          title="Editar dados do aluno"
          onClick={(e) => {
            e.stopPropagation();
            setStudentToEdit(student);
            setIsEditStudentOpen(true);
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
        {student.user.active && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Reverter para pendente"
            onClick={(e) => {
              e.stopPropagation();
              revertApprovalMutation.mutate(student.user.id);
            }}
            disabled={revertApprovalMutation.isPending}
          >
            <span className="material-icons text-orange-500 text-sm">undo</span>
          </Button>
        )}
      </div>
    );
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [beltFilter, setBeltFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    mutationFn: async ({ userId, newStatus }: { studentId: number, userId: number, newStatus: boolean }) => {
      // Only update user status - this will cascade to student
      const res = await apiRequest('PUT', `/api/users/${userId}`, { active: newStatus });
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

  // Mutation para reverter aprovação
  const revertApprovalMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}/revert-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reason: 'Reversão solicitada pelo administrador' 
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao reverter aprovação');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Aprovação revertida",
        description: "Aluno retornado ao status pendente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const students = (data as any)?.students || [];


  const getFilteredStudents = (tabFilter: string) => {
    let filteredStudents = students.filter((student: any) => {
      const name = `${student.user.firstName} ${student.user.lastName}`.toLowerCase();
      const email = student.user.email.toLowerCase();
      const query = searchTerm.toLowerCase();

      // Filtro de busca por nome/email
      const matchesSearch = !query || name.includes(query) || email.includes(query);

      // Filtro de status baseado na aba
      let matchesStatus = true;
      if (tabFilter === "active") {
        matchesStatus = student.user.active;
      } else if (tabFilter === "inactive") {
        matchesStatus = !student.user.active;
      }

      // Filtro de faixa
      const matchesBelt = beltFilter === "all" || student.beltLevel === beltFilter;

      // Remover filtro financeiro
      const matchesFinancial = true;

      return matchesSearch && matchesStatus && matchesBelt && matchesFinancial;
    });

    // Ordenação
    filteredStudents.sort((a: any, b: any) => {
      let valueA, valueB;

      switch (sortBy) {
        case "name":
          valueA = `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
          valueB = `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
          break;
        case "belt":
          const beltOrder = { white: 1, blue: 2, purple: 3, brown: 4, black: 5 };
          valueA = beltOrder[a.beltLevel as keyof typeof beltOrder] || 0;
          valueB = beltOrder[b.beltLevel as keyof typeof beltOrder] || 0;
          break;
        case "status":
          valueA = a.user.active ? 1 : 0;
          valueB = b.user.active ? 1 : 0;
          break;
        default:
          valueA = a.id;
          valueB = b.id;
      }

      if (sortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    return filteredStudents;
  };

  const filteredStudents = getFilteredStudents(activeTab);


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
          <Button 
            className="bg-secondary hover:bg-secondary-dark text-white font-medium"
            onClick={() => setLocation('/onboarding')}
          >
            <span className="material-icons mr-1 text-sm">add</span>
            + Novo Aluno
          </Button>
        </div>
      </div>
      {/* Filtros e Ordenação */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <BeltFilter 
            value={beltFilter}
            onValueChange={setBeltFilter}
            placeholder="Filtrar por faixa"
            className="w-full sm:w-[160px]"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="belt">Faixa</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="w-full sm:w-auto"
          >
            {sortOrder === "asc" ? "↑ Crescente" : "↓ Decrescente"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos os Alunos ({students.length})</TabsTrigger>
            <TabsTrigger value="active">Ativos ({students.filter((s: any) => s.user.active).length})</TabsTrigger>
            <TabsTrigger value="inactive">Inativos ({students.filter((s: any) => !s.user.active).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="text-center py-8">Carregando alunos...</div>
            ) : getFilteredStudents("all").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "Nenhum aluno encontrado para sua busca" : "Nenhum aluno encontrado"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {isMobile && <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 w-12"></th>}
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome do Aluno</th>
                      {!isMobile && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Faixa / Graduação</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Telefone</th>
                        </>
                      )}
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      {!isMobile && <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredStudents("all").map((student: any) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50" onClick={isMobile ? () => { setStudentToEdit(student); setIsEditStudentOpen(true); } : undefined}>
                        {isMobile && (
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <StudentActions student={student} isMobile={true} />
                          </td>
                        )}
                        <td className="py-3 px-4 text-sm text-gray-900">{student.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-700">
                                  {student.user.firstName?.charAt(0)}{student.user.lastName?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.user.firstName} {student.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{student.user.email}</div>
                            </div>
                          </div>
                        </td>
                        {!isMobile && (
                          <>
                            <td className="py-3 px-4">
                              <BeltWithLabel belt={student.beltLevel} stripes={student.stripes} />
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {student.user.email}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {student.user.phone || 'Não informado'}
                            </td>
                          </>
                        )}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            student.user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              student.user.active ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                            {student.user.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        {!isMobile ? (
                          <td className="py-3 px-4 text-right">
                            <StudentActions student={student} isMobile={false} />
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {isLoading ? (
              <div className="text-center py-8">Carregando alunos...</div>
            ) : getFilteredStudents("active").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum aluno ativo encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {isMobile && <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 w-12"></th>}
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome do Aluno</th>
                      {!isMobile && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Faixa / Graduação</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Telefone</th>
                        </>
                      )}
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      {!isMobile && <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredStudents("active").map((student: any) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{student.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-700">
                                  {student.user.firstName?.charAt(0)}{student.user.lastName?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.user.firstName} {student.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{student.user.email}</div>
                            </div>
                          </div>
                        </td>
                        {!isMobile && (
                          <>
                            <td className="py-3 px-4">
                              <BeltWithLabel belt={student.beltLevel} stripes={student.stripes} />
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {student.user.email}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {student.user.phone || 'Não informado'}
                            </td>
                          </>
                        )}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            student.user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              student.user.active ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                            {student.user.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        {!isMobile ? (
                          <td className="py-3 px-4 text-right">
                            <StudentActions student={student} isMobile={false} />
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="inactive">
            {isLoading ? (
              <div className="text-center py-8">Carregando alunos...</div>
            ) : getFilteredStudents("inactive").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum aluno inativo encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      {isMobile && <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 w-12"></th>}
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome do Aluno</th>
                      {!isMobile && (
                        <>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Faixa / Graduação</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Telefone</th>
                        </>
                      )}
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      {!isMobile && <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredStudents("inactive").map((student: any) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50" onClick={isMobile ? () => { setStudentToEdit(student); setIsEditStudentOpen(true); } : undefined}>
                        {isMobile && (
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <StudentActions student={student} isMobile={true} />
                          </td>
                        )}
                        <td className="py-3 px-4 text-sm text-gray-900">{student.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-700">
                                  {student.user.firstName?.charAt(0)}{student.user.lastName?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.user.firstName} {student.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{student.user.email}</div>
                            </div>
                          </div>
                        </td>
                        {!isMobile && (
                          <>
                            <td className="py-3 px-4">
                              <BeltWithLabel belt={student.beltLevel} stripes={student.stripes} />
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {student.user.email}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {student.user.phone || 'Não informado'}
                            </td>
                          </>
                        )}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            student.user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              student.user.active ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                            {student.user.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        {!isMobile ? (
                          <td className="py-3 px-4 text-right">
                            <StudentActions student={student} isMobile={false} />
                          </td>
                        ) : null}
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

      {/* Edit Student Dialog - New Complete Interface */}
      {studentToEdit && (
        <StudentEditDialog
          studentId={studentToEdit.id}
          open={isEditStudentOpen}
          onOpenChange={(open) => {
            setIsEditStudentOpen(open);
            if (!open) {
              setStudentToEdit(null);
            }
          }}
        />
      )}
    </>
  );
};

export default Students;