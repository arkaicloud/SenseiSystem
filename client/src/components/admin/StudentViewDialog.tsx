import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Eye, GraduationCap, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface StudentOption {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface StudentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentViewDialog({
  open,
  onOpenChange,
}: StudentViewDialogProps) {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data, isLoading, isError } = useQuery<{ students: StudentOption[] }>({
    queryKey: ["/api/admin/student-view/options"],
    enabled: open,
  });

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return data?.students ?? [];

    return (data?.students ?? []).filter(student => {
      const fullName = `${student.firstName} ${student.lastName}`.toLocaleLowerCase("pt-BR");
      return fullName.includes(term) || student.email.toLocaleLowerCase("pt-BR").includes(term);
    });
  }, [data?.students, search]);

  const startStudentView = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch("/api/admin/student-view/start", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Não foi possível abrir a visão do aluno.");
      }
      return result;
    },
    onSuccess: async () => {
      queryClient.clear();
      window.location.assign("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao visualizar aluno",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!startStudentView.isPending) {
          onOpenChange(nextOpen);
          if (!nextOpen) setSearch("");
        }
      }}
    >
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Visualizar como aluno
          </DialogTitle>
          <DialogDescription>
            Escolha um aluno para conferir exatamente a experiência dele. Seu acesso de Super Admin será preservado.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando alunos...
              </div>
            )}

            {isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Não foi possível carregar os alunos. Feche a janela e tente novamente.
              </div>
            )}

            {!isLoading && !isError && filteredStudents.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nenhum aluno ativo encontrado.
              </div>
            )}

            {filteredStudents.map(student => (
              <div
                key={student.id}
                className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 gap-2"
                  onClick={() => startStudentView.mutate(student.id)}
                  disabled={startStudentView.isPending}
                >
                  {startStudentView.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Visualizar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}