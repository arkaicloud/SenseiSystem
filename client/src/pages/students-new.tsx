import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { BeltWithLabel } from "@/components/ui/belt";
import StudentForm from "@/components/students/StudentForm";

const Students: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [beltFilter, setBeltFilter] = useState("all");
  const [financialFilter, setFinancialFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const { data, isLoading } = useQuery({
    queryKey: ['/api/students'],
  });

  const { mutate: addStudent, isPending: isAddingStudent } = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsAddStudentOpen(false);
      toast({
        title: "Sucesso",
        description: "Aluno adicionado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar aluno",
        variant: "destructive",
      });
    },
  });

  const { mutate: updateStudent } = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setSelectedStudent(null);
      toast({
        title: "Sucesso",
        description: "Aluno atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar aluno",
        variant: "destructive",
      });
    },
  });

  const { mutate: toggleStudentStatus, isPending: isTogglingStatus } = useMutation({
    mutationFn: ({ studentId, userId, newStatus }: { studentId: number; userId: number; newStatus: boolean }) => {
      return apiRequest('PUT', `/api/users/${userId}`, { active: newStatus });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Sucesso",
        description: variables.newStatus ? "Aluno liberado com sucesso" : "Aluno bloqueado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status do aluno",
        variant: "destructive",
      });
    },
  });

  const students = (data as any)?.students || [];

  // Função para obter status financeiro consistente baseado no ID do aluno
  const getFinancialStatus = (studentId: number) => {
    const seed = studentId % 3;
    if (seed === 0) return "upToDate";
    if (seed === 1) return "pending";
    return "overdue";
  };

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
      
      // Filtro financeiro consistente
      const financialStatus = getFinancialStatus(student.id);
      const matchesFinancial = financialFilter === "all" || financialStatus === financialFilter;
      
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
        case "financial":
          const statusOrder = { upToDate: 1, pending: 2, overdue: 3 };
          valueA = statusOrder[getFinancialStatus(a.id) as keyof typeof statusOrder];
          valueB = statusOrder[getFinancialStatus(b.id) as keyof typeof statusOrder];
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

  const renderFinancialStatus = (studentId: number) => {
    const status = getFinancialStatus(studentId);
    const statusConfig = {
      upToDate: { bg: 'bg-green-100 text-green-800', dot: 'bg-green-400', text: 'Em dia' },
      pending: { bg: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400', text: 'Pendente' },
      overdue: { bg: 'bg-red-100 text-red-800', dot: 'bg-red-400', text: 'Atrasado' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg}`}>
        <div className={`w-1.5 h-1.5 rounded-full mr-1 ${config.dot}`}></div>
        {config.text}
      </span>
    );
  };

  const renderStudentRow = (student: any) => (
    <tr key={student.id} className="border-b hover:bg-gray-50">
      <td className="py-3 px-2 sm:px-4 text-sm text-gray-900">{student.id}</td>
      <td className="py-3 px-2 sm:px-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8">
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">
                {student.user.firstName?.charAt(0)}{student.user.lastName?.charAt(0)}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {student.user.firstName} {student.user.lastName}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 truncate">{student.user.email}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-2 sm:px-4">
        <BeltWithLabel beltLevel={student.beltLevel} stripes={student.stripes} />
      </td>
      <td className="py-3 px-2 sm:px-4 text-sm text-gray-500 hidden md:table-cell">
        <div>Rua A, 123</div>
        <div className="text-xs text-gray-400">São Paulo, SP</div>
      </td>
      <td className="py-3 px-2 sm:px-4 text-sm text-gray-500 hidden lg:table-cell">
        {(() => {
          const joinDate = new Date(student.user.createdAt || Date.now() - (student.id * 24 * 60 * 60 * 1000));
          const now = new Date();
          const diffMs = now.getTime() - joinDate.getTime();
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          
          if (diffMinutes < 60) {
            return diffMinutes < 5 ? 'Agora mesmo' : `${diffMinutes} min atrás`;
          } else if (diffHours < 24) {
            return diffHours === 1 ? '1h atrás' : `${diffHours}h atrás`;
          } else if (diffDays === 1) {
            return 'Ontem';
          } else {
            return joinDate.toLocaleDateString('pt-BR');
          }
        })()}
      </td>
      <td className="py-3 px-2 sm:px-4 text-sm text-gray-500 hidden sm:table-cell">Mensal - R$ 150</td>
      <td className="py-3 px-2 sm:px-4">
        {renderFinancialStatus(student.id)}
      </td>
      <td className="py-3 px-2 sm:px-4 hidden xl:table-cell">
        <div className="text-sm text-gray-600">
          {student.user.firstName} {student.user.lastName}
        </div>
      </td>
      <td className="py-3 px-2 sm:px-4">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          student.user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
            student.user.active ? 'bg-green-400' : 'bg-red-400'
          }`}></div>
          {student.user.active ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td className="py-3 px-2 sm:px-4 text-right">
        <div className="flex items-center justify-end space-x-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 sm:h-8 sm:w-8 p-0"
            title="Ver perfil completo"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStudent(student);
            }}
          >
            <span className="material-icons text-blue-500 text-xs sm:text-sm">visibility</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 sm:h-8 sm:w-8 p-0"
            title="Editar aluno"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStudent(student);
            }}
          >
            <span className="material-icons text-gray-500 text-xs sm:text-sm">edit</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`h-6 w-6 sm:h-8 sm:w-8 p-0 ${isTogglingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <span className="material-icons text-red-500 text-xs sm:text-sm">block</span>
            ) : (
              <span className="material-icons text-green-500 text-xs sm:text-sm">check_circle</span>
            )}
          </Button>
        </div>
      </td>
    </tr>
  );

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
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
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

      {/* Filtros e Ordenação */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Select value={beltFilter} onValueChange={setBeltFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Filtrar por faixa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as faixas</SelectItem>
              <SelectItem value="white">Faixa Branca</SelectItem>
              <SelectItem value="blue">Faixa Azul</SelectItem>
              <SelectItem value="purple">Faixa Roxa</SelectItem>
              <SelectItem value="brown">Faixa Marrom</SelectItem>
              <SelectItem value="black">Faixa Preta</SelectItem>
            </SelectContent>
          </Select>
          <Select value={financialFilter} onValueChange={setFinancialFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Situação financeira" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas situações</SelectItem>
              <SelectItem value="upToDate">Em dia</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="overdue">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="belt">Faixa</SelectItem>
              <SelectItem value="financial">Situação $</SelectItem>
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

      <div className="bg-white rounded-lg shadow p-2 sm:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos ({students.length})</TabsTrigger>
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
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">ID</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Nome do Aluno</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Faixa</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden md:table-cell">Endereço</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden lg:table-cell">Última Atividade</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden sm:table-cell">Plano</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Situação $</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden xl:table-cell">Responsável</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredStudents("all").map(renderStudentRow)}
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
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">ID</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Nome do Aluno</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Faixa</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden md:table-cell">Endereço</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden lg:table-cell">Última Atividade</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden sm:table-cell">Plano</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Situação $</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden xl:table-cell">Responsável</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredStudents("active").map(renderStudentRow)}
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
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">ID</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Nome do Aluno</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Faixa</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden md:table-cell">Endereço</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden lg:table-cell">Última Atividade</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden sm:table-cell">Plano</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Situação $</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500 hidden xl:table-cell">Responsável</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredStudents("inactive").map(renderStudentRow)}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de detalhes do estudante */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogTitle>
            {selectedStudent ? "Editar Aluno" : "Detalhes do Aluno"}
          </DialogTitle>
          {selectedStudent && (
            <StudentForm
              student={selectedStudent}
              onSubmit={handleUpdateStudent}
              isLoading={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Students;