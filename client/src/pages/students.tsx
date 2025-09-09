import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeltWithLabel } from "@/components/ui/belt";
import { usePaginated } from "@/hooks/usePaginated";
import { Pagination } from "@/components/ui/Pagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { TabsFilter } from "@/components/ui/TabsFilter";
import { ResultsInfo } from "@/components/ui/ResultsInfo";
import StudentEditDialog from "@/components/students/StudentEditDialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit2, Ban, CheckCircle, Undo, Search } from "lucide-react";

interface Student {
  id: number;
  userId: number;
  beltLevel: string;
  stripes: number;
  medicalObservations?: string;
  notes?: string;
  attendanceRate?: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    active: boolean;
    status: string;
    createdAt: string;
    joinDate?: string;
  };
}

const Students: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<any | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Use the paginated hook
  const { data, isFetching, page, pageSize, setParam, status, q } =
    usePaginated<Student>({
      key: "students",
      endpoint: "/api/students",
    });

  // Check mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync search input with query parameter
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Toggle student status mutation (block/unblock)
  const { mutate: toggleStudentStatus, isPending: isTogglingStatus } = useMutation({
    mutationFn: async ({ userId, newStatus }: { studentId: number, userId: number, newStatus: boolean }) => {
      const res = await apiRequest('PUT', `/api/users/${userId}`, { active: newStatus });
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Sucesso",
        description: variables.newStatus ? "Aluno liberado com sucesso" : "Aluno bloqueado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao alterar status do aluno: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Revert approval mutation
  const { mutate: revertApprovalMutation } = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('PUT', `/api/users/${userId}`, { 
        status: 'pending',
        active: false 
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Aluno revertido para pendente com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  // Handle search
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setParam("q", searchInput);
    }
  };

  // Student Actions Component
  const StudentActions = ({ student, isMobile = false }: { student: Student, isMobile?: boolean }) => {
    if (isMobile) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                setStudentToEdit(student);
                setIsEditStudentOpen(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setStudentToEdit(student);
                setIsEditStudentOpen(true);
              }}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Editar dados
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toggleStudentStatus({
                studentId: student.id,
                userId: student.user.id,
                newStatus: !student.user.active
              })}
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
                onClick={() => revertApprovalMutation(student.user.id)}
              >
                <Undo className="mr-2 h-4 w-4" />
                Reverter para pendente
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Desktop version
    return (
      <div className="flex items-center space-x-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          title="Ver perfil completo"
          onClick={() => {
            setStudentToEdit(student);
            setIsEditStudentOpen(true);
          }}
        >
          <Eye className="h-4 w-4 text-blue-500" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          title="Editar dados do aluno"
          onClick={() => {
            setStudentToEdit(student);
            setIsEditStudentOpen(true);
          }}
        >
          <Edit2 className="h-4 w-4 text-gray-500" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`h-8 w-8 p-0 ${isTogglingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={student.user.active ? "Bloquear aluno" : "Liberar aluno"}
          disabled={isTogglingStatus}
          onClick={() => toggleStudentStatus({
            studentId: student.id,
            userId: student.user.id,
            newStatus: !student.user.active
          })}
        >
          {student.user.active ? (
            <Ban className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </Button>
        {student.user.active && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Reverter para pendente"
            onClick={() => revertApprovalMutation(student.user.id)}
          >
            <Undo className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-montserrat font-bold text-2xl text-primary">Alunos</h1>
            <p className="text-gray-600">Gerencie os alunos da escola</p>
          </div>
          <Button 
            className="mt-4 md:mt-0 bg-secondary hover:bg-secondary-dark text-white font-medium"
            onClick={() => setLocation('/onboarding')}
          >
            + Novo Aluno
          </Button>
        </div>

        {/* Filtros superiores */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsFilter
            value={status}
            onChange={(v) => setParam("status", v)}
            items={[
              { value: "all", label: "Todas" },
              { value: "active", label: "Ativos" },
              { value: "pending", label: "Pendentes" },
              { value: "inactive", label: "Inativos" },
            ]}
          />
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10 w-56"
                placeholder="Buscar por nome/email"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
            <PageSizeSelect 
              value={pageSize} 
              onChange={(n) => setParam("pageSize", n)} 
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto rounded-xl border bg-white">
          {isFetching && (
            <div className="text-center py-8 text-gray-500">
              Carregando alunos...
            </div>
          )}
          
          {!isFetching && (!data?.items || data.items.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              Nenhum aluno encontrado
            </div>
          )}

          {!isFetching && data?.items && data.items.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="[&>th]:px-3 [&>th]:py-3 text-left">
                  {isMobile && <th className="w-12"></th>}
                  <th>ID</th>
                  <th>Aluno</th>
                  {!isMobile && (
                    <>
                      <th>Faixa</th>
                      <th>Email</th>
                      <th>Telefone</th>
                    </>
                  )}
                  <th>Status</th>
                  {!isMobile && <th className="text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="[&>tr>td]:px-3 [&>tr>td]:py-3">
                {data.items.map((student) => (
                  <tr 
                    key={student.id} 
                    className="border-t hover:bg-gray-50"
                    onClick={isMobile ? () => { setStudentToEdit(student); setIsEditStudentOpen(true); } : undefined}
                  >
                    {isMobile && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <StudentActions student={student} isMobile={true} />
                      </td>
                    )}
                    <td className="text-gray-900 font-medium">{student.id}</td>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {student.user.firstName?.charAt(0)}{student.user.lastName?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {student.user.firstName} {student.user.lastName}
                          </div>
                          {isMobile && (
                            <div className="text-sm text-gray-500">{student.user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {!isMobile && (
                      <>
                        <td>
                          <BeltWithLabel level={student.beltLevel as any} stripes={student.stripes} />
                        </td>
                        <td className="text-gray-500">{student.user.email}</td>
                        <td className="text-gray-500">{student.user.phone || 'Não informado'}</td>
                      </>
                    )}
                    <td>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        student.user.active ? 'bg-green-100 text-green-800' : 
                        (!student.user.active && student.user.status === 'pending') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          student.user.active ? 'bg-green-400' : 
                          (!student.user.active && student.user.status === 'pending') ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`}></div>
                        {student.user.active ? 'Ativo' : 
                         (!student.user.active && student.user.status === 'pending') ? 'Pendente' : 'Inativo'}
                      </span>
                    </td>
                    {!isMobile && (
                      <td className="text-right">
                        <StudentActions student={student} isMobile={false} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer da paginação */}
        {data && (
          <div className="flex items-center justify-between">
            <ResultsInfo 
              page={data.page} 
              pageSize={data.pageSize} 
              total={data.total} 
            />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onPage={(p: number) => setParam("page", p)}
            />
          </div>
        )}
      </div>

      {/* Edit Student Dialog */}
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