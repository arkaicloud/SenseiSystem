import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BELT_HEX } from "@/components/ui/belt";
import { usePaginated } from "@/hooks/usePaginated";
import { Pagination } from "@/components/ui/StudentPagination";
import { PageSizeSelect } from "@/components/ui/PageSizeSelect";
import { ResultsInfo } from "@/components/ui/ResultsInfo";
import StudentEditDialog from "@/components/students/StudentEditDialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical, Eye, Edit2, Ban, CheckCircle, Undo, Search,
  Download, Plus, Users, Trash2, Loader2
} from "lucide-react";

interface Student {
  id: number;
  userId: number;
  beltLevel: string;
  stripes: number;
  isScholarship?: boolean;
  couponCode?: string;
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

const STATUS_TABS = [
  { value: "all",      label: "Todos" },
  { value: "active",   label: "Ativos" },
  { value: "inactive", label: "Bloqueados" },
  { value: "pending",  label: "Pendentes" },
];

function AvatarInitials({ name, beltLevel }: { name: string; beltLevel: string }) {
  const parts = name.trim().split(" ");
  const initials = (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
  const hex = BELT_HEX[beltLevel];
  const useBelt = hex && beltLevel !== "white";
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={useBelt ? { background: hex, color: "#fff" } : { background: "#E2E8F0", color: "#475569" }}
    >
      {initials.toUpperCase()}
    </div>
  );
}

function StatusBadge({ active, status }: { active: boolean; status: string }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Pendente
      </span>
    );
  }
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Ativo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/20">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Bloqueado
    </span>
  );
}

function BeltDisplay({ beltLevel, stripes }: { beltLevel: string; stripes: number }) {
  const hex = BELT_HEX[beltLevel];
  const names: Record<string, string> = {
    white: "Branca", blue: "Azul", purple: "Roxa", brown: "Marrom",
    black: "Preta", coral: "Coral",
    grey: "Cinza", yellow: "Amarela", orange: "Laranja", green: "Verde",
  };
  const label = names[beltLevel] ?? beltLevel;
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-4 h-4 rounded-sm border border-border flex-shrink-0"
        style={{ backgroundColor: hex || "#e2e8f0" }}
      />
      <span className="text-sm text-secondary-foreground">
        {label}{stripes > 0 ? ` · ${stripes}G` : ""}
      </span>
    </div>
  );
}

const Students: React.FC = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<any | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const { data, isFetching, page, pageSize, setParam, status, q } =
    usePaginated<Student>({ key: "students", endpoint: "/api/students" });

  useEffect(() => { setSearchInput(q); }, [q]);

  const { mutate: toggleStudentStatus, isPending: isTogglingStatus } = useMutation({
    mutationFn: async ({ userId, newStatus }: { studentId: number; userId: number; newStatus: boolean }) => {
      const res = await apiRequest("PUT", `/api/users/${userId}`, { active: newStatus });
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Sucesso",
        description: variables.newStatus ? "Aluno liberado com sucesso" : "Aluno bloqueado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      toast({ title: "Erro", description: `Falha ao alterar status: ${error}`, variant: "destructive" });
    },
  });

  const { mutate: revertApprovalMutation } = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PUT", `/api/users/${userId}`, { status: "pending", active: false });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Aluno revertido para pendente" });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const res = await apiRequest("DELETE", `/api/students/${studentId}`);
      const result = await res.json().catch(() => ({
        message: "Não foi possível excluir o aluno.",
      }));
      if (!res.ok) {
        throw new Error(result.message || "Não foi possível excluir o aluno.");
      }
      return result;
    },
    onSuccess: (result) => {
      setStudentToDelete(null);
      toast({
        title: "Aluno excluído",
        description: result.message || "O cadastro foi excluído definitivamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      toast({
        title: "Exclusão não permitida",
        description:
          error.message ||
          "O aluno possui movimentações e deve ser apenas inativado.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") setParam("q", searchInput);
  };

  const openEdit = (student: Student) => {
    setLocation(`/students/${student.id}/edit`);
  };

  return (
    <>
      <div className="space-y-5">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground dark:text-foreground">Alunos</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-secondary-foreground border-border hover:bg-background"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary-light text-primary-foreground"
              onClick={() => setLocation("/onboarding")}
              data-testid="button-new-student"
            >
              <Plus className="h-4 w-4" />
              Novo Aluno
            </Button>
          </div>
        </div>

        {/* ── Tab filters ────────────────────────────────────────── */}
        <div className="border-b border-border dark:border-border">
          <nav className="-mb-px flex gap-0">
            {STATUS_TABS.map((tab) => {
              const active = status === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setParam("status", tab.value)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? "border-primary text-accent-foreground"
                      : "border-transparent text-muted-foreground hover:text-secondary-foreground hover:border-border"
                  }`}
                >
                  {tab.label}
                  {active && data?.total != null && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-accent text-accent-foreground">
                      {data.total}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Table card ─────────────────────────────────────────── */}
        <div className="bg-card dark:bg-card rounded-xl border border-border dark:border-border shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 w-64 h-9 text-sm border-border bg-background dark:bg-background dark:border-border focus-visible:ring-primary"
                placeholder="Buscar aluno..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearch}
                data-testid="input-search-student"
              />
            </div>
            <PageSizeSelect value={pageSize} onChange={(n) => setParam("pageSize", n)} />
          </div>

          {/* Table */}
          {isFetching && (
            <div className="text-center py-12 text-muted-foreground text-sm">Carregando alunos...</div>
          )}

          {!isFetching && (!data?.items || data.items.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum aluno encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros ou busca</p>
            </div>
          )}

          {!isFetching && data?.items && data.items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm [&_td]:whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border dark:border-border bg-background dark:bg-background">
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" className="rounded border-border" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Nome do Aluno
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Faixa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Telefone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Matrícula
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-border">
                  {data.items.map((student) => {
                    const fullName = `${student.user.firstName} ${student.user.lastName}`;
                    const dateStr = student.user.joinDate || student.user.createdAt;
                    const displayDate = dateStr
                      ? new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
                      : "—";

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-background dark:hover:bg-muted/50 transition-colors group"
                        data-testid={`row-student-${student.id}`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input type="checkbox" className="rounded border-border" />
                        </td>

                        {/* Nome */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <AvatarInitials name={fullName} beltLevel={student.beltLevel} />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-foreground dark:text-foreground leading-tight">
                                  {fullName}
                                </p>
                                {student.isScholarship && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[10px] font-semibold text-success dark:text-emerald-300 border border-success/20 dark:border-emerald-800">
                                    🎓 Bolsista
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{student.user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Faixa */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <BeltDisplay beltLevel={student.beltLevel} stripes={student.stripes} />
                        </td>

                        {/* Telefone */}
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          {student.user.phone || "—"}
                        </td>

                        {/* Data */}
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          {displayDate}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge active={student.user.active} status={student.user.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                data-testid={`button-actions-${student.id}`}
                              >
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openEdit(student)}>
                                <Eye className="mr-2 h-4 w-4 text-accent-foreground" />
                                Ver perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(student)}>
                                <Edit2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                Editar dados
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isTogglingStatus}
                                onClick={() =>
                                  toggleStudentStatus({
                                    studentId: student.id,
                                    userId: student.user.id,
                                    newStatus: !student.user.active,
                                  })
                                }
                              >
                                {student.user.active ? (
                                  <>
                                    <Ban className="mr-2 h-4 w-4 text-danger" />
                                    Bloquear aluno
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    Liberar aluno
                                  </>
                                )}
                              </DropdownMenuItem>
                              {student.user.active && (
                                <DropdownMenuItem onClick={() => revertApprovalMutation(student.user.id)}>
                                  <Undo className="mr-2 h-4 w-4 text-muted-foreground" />
                                  Reverter para pendente
                                </DropdownMenuItem>
                              )}
                              {currentUser?.role === "admin" && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-danger"
                                  onClick={() => setStudentToDelete(student)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir definitivamente
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination inside card */}
          {data && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border dark:border-border bg-background dark:bg-background">
              <ResultsInfo page={data.page} pageSize={data.pageSize} total={data.total} />
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onPage={(p: number) => setParam("page", p)}
              />
            </div>
          )}
        </div>
      </div>

      {studentToEdit && (
        <StudentEditDialog
          studentId={studentToEdit.id}
          open={isEditStudentOpen}
          onOpenChange={(open) => {
            setIsEditStudentOpen(open);
            if (!open) setStudentToEdit(null);
          }}
        />
      )}

      <AlertDialog
        open={!!studentToDelete}
        onOpenChange={(open) => {
          if (!open && !deleteStudentMutation.isPending) {
            setStudentToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação só será concluída se{" "}
              <strong>
                {studentToDelete
                  ? `${studentToDelete.user.firstName} ${studentToDelete.user.lastName}`
                  : "o aluno"}
              </strong>{" "}
              não tiver pagamentos, presenças, aulas, documentos ou outros
              vínculos. Se houver qualquer movimentação, nada será apagado e o
              aluno deverá ser inativado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStudentMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteStudentMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (studentToDelete) {
                  deleteStudentMutation.mutate(studentToDelete.id);
                }
              }}
            >
              {deleteStudentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sim, excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Students;
