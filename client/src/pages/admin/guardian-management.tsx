import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Users, Link2, Link2Off, Search, RefreshCw, UserCheck, Plus } from "lucide-react";

interface GuardianUser {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
}

interface StudentWithGuardian {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  beltLevel: string;
  guardianId: number | null;
  guardianName: string | null;
  guardianEmail: string | null;
}

export default function GuardianManagementPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; student: StudentWithGuardian | null }>({
    open: false,
    student: null,
  });
  const [selectedGuardianId, setSelectedGuardianId] = useState<string>("");

  const { data: studentsData, isLoading: isLoadingStudents } = useQuery<{ students: StudentWithGuardian[] }>({
    queryKey: ["/api/admin/students-with-guardians"],
  });

  const { data: guardiansData } = useQuery<{ users: GuardianUser[] }>({
    queryKey: ["/api/admin/guardian-users"],
  });

  const linkMutation = useMutation({
    mutationFn: async ({ studentId, guardianUserId }: { studentId: number; guardianUserId: number }) => {
      const res = await apiRequest("POST", "/api/guardian/link", { studentId, guardianUserId });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Vínculo criado!", description: "Aluno vinculado ao responsável com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students-with-guardians"] });
      setLinkDialog({ open: false, student: null });
      setSelectedGuardianId("");
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const syncByCpfMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/guardian/sync-by-cpf", {});
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Sincronização concluída!", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students-with-guardians"] });
    },
    onError: (e: any) => {
      toast({ title: "Erro na sincronização", description: e.message, variant: "destructive" });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const res = await apiRequest("DELETE", `/api/guardian/unlink/${studentId}`, undefined);
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Vínculo removido", description: "Responsável desvinculado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students-with-guardians"] });
    },
    onError: (e: any) => {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    },
  });

  const students = studentsData?.students ?? [];
  const guardians = guardiansData?.users ?? [];

  const filtered = students.filter((s) => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    const gName = (s.guardianName ?? "").toLowerCase();
    return name.includes(search.toLowerCase()) || gName.includes(search.toLowerCase());
  });

  const withGuardian = filtered.filter((s) => s.guardianId);
  const withoutGuardian = filtered.filter((s) => !s.guardianId);

  function openLinkDialog(student: StudentWithGuardian) {
    setLinkDialog({ open: true, student });
    setSelectedGuardianId(student.guardianId ? String(student.guardianId) : "");
  }

  function handleConfirmLink() {
    if (!linkDialog.student || !selectedGuardianId) return;
    linkMutation.mutate({
      studentId: linkDialog.student.id,
      guardianUserId: parseInt(selectedGuardianId),
    });
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2B54FF]" />
            Planos Família
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Vincule alunos a responsáveis para gerenciamento de planos família.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncByCpfMutation.mutate()}
          disabled={syncByCpfMutation.isPending}
          className="shrink-0 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncByCpfMutation.isPending ? "animate-spin" : ""}`} />
          Sincronizar por CPF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500 mb-1">Total de alunos</p>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500 mb-1">Com responsável</p>
            <p className="text-2xl font-bold text-[#2B54FF]">{students.filter(s => s.guardianId).length}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500 mb-1">Sem responsável</p>
            <p className="text-2xl font-bold text-gray-400">{students.filter(s => !s.guardianId).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por aluno ou responsável..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-guardian-search"
        />
      </div>

      {isLoadingStudents ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* With guardian */}
          {withGuardian.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Vinculados ({withGuardian.length})
              </h2>
              <div className="space-y-2">
                {withGuardian.map((s) => (
                  <Card key={s.id} className="border-l-4" style={{ borderLeftColor: "#2B54FF" }}>
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Link2 className="w-3 h-3 text-[#2B54FF]" />
                          {s.guardianName} · {s.guardianEmail}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openLinkDialog(s)}
                          data-testid={`button-edit-link-${s.id}`}
                        >
                          Alterar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => unlinkMutation.mutate(s.id)}
                          disabled={unlinkMutation.isPending}
                          data-testid={`button-unlink-${s.id}`}
                        >
                          <Link2Off className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Without guardian */}
          {withoutGuardian.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-4">
                Sem responsável ({withoutGuardian.length})
              </h2>
              <div className="space-y-2">
                {withoutGuardian.map((s) => (
                  <Card key={s.id} className="border-l-4 border-l-gray-200">
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {s.firstName} {s.lastName}
                        </p>
                        <Badge variant="outline" className="text-xs mt-0.5 text-gray-400">
                          Individual
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-3 flex items-center gap-1 text-[#2B54FF] border-[#2B54FF]"
                        onClick={() => openLinkDialog(s)}
                        data-testid={`button-link-${s.id}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Vincular
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Nenhum aluno encontrado.</p>
            </div>
          )}
        </>
      )}

      {/* Link dialog */}
      <Dialog open={linkDialog.open} onOpenChange={(v) => !v && setLinkDialog({ open: false, student: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Responsável</DialogTitle>
            <DialogDescription>
              Escolha o responsável para{" "}
              <strong>{linkDialog.student?.firstName} {linkDialog.student?.lastName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Responsável</label>
            <Select value={selectedGuardianId} onValueChange={setSelectedGuardianId}>
              <SelectTrigger data-testid="select-guardian">
                <SelectValue placeholder="Selecione o responsável..." />
              </SelectTrigger>
              <SelectContent>
                {guardians.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.firstName} {g.lastName}
                    {g.role === "guardian" && (
                      <span className="ml-2 text-xs text-[#2B54FF]">(Responsável)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog({ open: false, student: null })}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmLink}
              disabled={!selectedGuardianId || linkMutation.isPending}
              data-testid="button-confirm-link"
            >
              {linkMutation.isPending ? "Salvando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
