import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Users, Plus, Edit, KeyRound, ShieldCheck, Eye, EyeOff,
  GraduationCap, BookOpen, BarChart3, CheckCircle2, XCircle,
  PowerOff, Power
} from "lucide-react";
import { getInitials } from "@/lib/utils";

interface StaffPermissions {
  canSeeFinancials?: boolean;
  canManageStudents?: boolean;
  canManageClasses?: boolean;
}

interface StaffUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: 'admin' | 'instructor';
  active: boolean;
  status: string;
  permissions?: string | null;
}

function parsePermissions(raw?: string | null): StaffPermissions {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  instructor: 'Professor',
};

const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  instructor: 'bg-accent text-accent-foreground',
};

const PERMISSION_LABELS: { key: keyof StaffPermissions; label: string; description: string; icon: React.ComponentType<any> }[] = [
  { key: 'canSeeFinancials', label: 'Ver dados financeiros', description: 'Acessa painel financeiro e cobranças ASAAS', icon: BarChart3 },
  { key: 'canManageStudents', label: 'Gerenciar alunos', description: 'Editar, aprovar e gerenciar alunos', icon: GraduationCap },
  { key: 'canManageClasses', label: 'Gerenciar aulas', description: 'Criar e editar horários e turmas', icon: BookOpen },
];

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [toggleUser, setToggleUser] = useState<StaffUser | null>(null);
  const [resetUser, setResetUser] = useState<StaffUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', role: 'instructor' as 'admin' | 'instructor',
    permissions: { canSeeFinancials: false, canManageStudents: true, canManageClasses: true } as StaffPermissions,
  });

  const { data, isLoading } = useQuery<{ staff: StaffUser[] }>({
    queryKey: ['/api/admin/staff'],
  });

  const staff = data?.staff ?? [];

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiRequest('POST', '/api/admin/staff', body);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erro ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff'] });
      toast({ title: 'Usuário criado!', description: `${form.firstName} adicionado à equipe com sucesso.` });
      setCreateOpen(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: 'Erro ao criar', description: e.message || 'Erro ao criar usuário', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const res = await apiRequest('PUT', `/api/admin/staff/${id}`, body);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erro ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff'] });
      toast({ title: 'Atualizado!', description: 'Dados do usuário atualizados.' });
      setEditUser(null);
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message || 'Erro ao atualizar', variant: 'destructive' }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await apiRequest('PUT', `/api/admin/staff/${id}`, { active });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erro ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff'] });
      toast({
        title: vars.active ? 'Usuário ativado!' : 'Usuário inativado!',
        description: vars.active ? 'Acesso liberado com sucesso.' : 'Acesso bloqueado. O usuário não conseguirá mais entrar.',
      });
      setToggleUser(null);
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message || 'Erro ao alterar status', variant: 'destructive' }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      const res = await apiRequest('POST', `/api/admin/staff/${id}/reset-password`, { newPassword });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erro ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Senha redefinida!', description: 'O usuário precisará usar a nova senha no próximo login.' });
      setResetUser(null);
      setNewPassword('');
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message || 'Erro ao redefinir senha', variant: 'destructive' }),
  });

  const resetForm = () => {
    setForm({
      firstName: '', lastName: '', email: '', phone: '', password: '', role: 'instructor',
      permissions: { canSeeFinancials: false, canManageStudents: true, canManageClasses: true },
    });
    setShowPassword(false);
  };

  const openEdit = (u: StaffUser) => {
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone || '',
      password: '',
      role: u.role,
      permissions: parsePermissions(u.permissions),
    });
    setEditUser(u);
  };

  const handleCreate = () => {
    if (!form.firstName || !form.email || !form.password) return;
    createMutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      role: form.role,
      permissions: form.permissions,
    });
  };

  const handleUpdate = () => {
    if (!editUser) return;
    updateMutation.mutate({
      id: editUser.id,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      role: form.role,
      permissions: form.permissions,
    });
  };

  const togglePermission = (key: keyof StaffPermissions) => {
    setForm(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" /> Gestão de Usuários
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie professores e administradores e suas permissões de acesso
          </p>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true); }} data-testid="button-new-staff">
          <Plus className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Equipe ({staff.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum usuário na equipe</div>
          ) : (
            <div className="divide-y">
              {staff.map(u => {
                const perms = parsePermissions(u.permissions);
                const initials = getInitials(u.firstName, u.lastName);
                const isSelf = u.id === currentUser?.id;
                return (
                  <div key={u.id} className={`flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors ${!u.active ? 'opacity-60' : ''}`} data-testid={`row-staff-${u.id}`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm ${u.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{u.firstName} {u.lastName}</span>
                          {isSelf && <Badge variant="outline" className="text-xs">você</Badge>}
                          <Badge className={`text-xs ${ROLE_COLOR[u.role] || ''}`}>{ROLE_LABEL[u.role] || u.role}</Badge>
                          {!u.active && <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">Inativo</Badge>}
                        </div>
                        <span className="text-sm text-muted-foreground">{u.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Permission pills */}
                      <div className="hidden md:flex items-center gap-1">
                        {PERMISSION_LABELS.map(({ key, label }) => (
                          <span
                            key={key}
                            title={label}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                              perms[key]
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-background border-border text-muted-foreground'
                            }`}
                          >
                            {perms[key] ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {key === 'canSeeFinancials' ? 'Financeiro' : key === 'canManageStudents' ? 'Alunos' : 'Aulas'}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(u)} data-testid={`button-edit-${u.id}`} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setResetUser(u); setNewPassword(''); }} data-testid={`button-reset-${u.id}`} title="Redefinir senha">
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={u.active ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                            onClick={() => setToggleUser(u)}
                            data-testid={`button-toggle-${u.id}`}
                            title={u.active ? 'Inativar usuário' : 'Ativar usuário'}
                          >
                            {u.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={v => { if (!v) { setCreateOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Usuário da Equipe</DialogTitle>
          </DialogHeader>
          <StaffForm form={form} setForm={setForm} showPassword={showPassword} setShowPassword={setShowPassword} togglePermission={togglePermission} isCreate />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-confirm-create">
              {createMutation.isPending ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={v => { if (!v) setEditUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <StaffForm form={form} setForm={setForm} showPassword={showPassword} setShowPassword={setShowPassword} togglePermission={togglePermission} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-confirm-edit">
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={v => { if (!v) { setResetUser(null); setNewPassword(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Definindo nova senha para <strong>{resetUser?.firstName} {resetUser?.lastName}</strong>. O usuário precisará trocar na próximo acesso.
            </p>
            <div className="space-y-1">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  data-testid="input-new-password"
                />
                <Button size="sm" variant="ghost" className="absolute right-1 top-1 h-7 w-7 p-0" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetUser(null); setNewPassword(''); }}>Cancelar</Button>
            <Button
              onClick={() => resetUser && resetPasswordMutation.mutate({ id: resetUser.id, newPassword })}
              disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
              data-testid="button-confirm-reset"
            >
              {resetPasswordMutation.isPending ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Active Alert */}
      <AlertDialog open={!!toggleUser} onOpenChange={v => { if (!v) setToggleUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleUser?.active ? 'Inativar Usuário' : 'Ativar Usuário'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleUser?.active
                ? <>Tem certeza que deseja inativar <strong>{toggleUser?.firstName} {toggleUser?.lastName}</strong>? O usuário não conseguirá mais acessar o sistema, mas seu histórico e vínculos com aulas serão mantidos.</>
                : <>Deseja reativar <strong>{toggleUser?.firstName} {toggleUser?.lastName}</strong>? O usuário voltará a ter acesso ao sistema.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={toggleUser?.active
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-green-600 text-white hover:bg-green-700'
              }
              onClick={() => toggleUser && toggleActiveMutation.mutate({ id: toggleUser.id, active: !toggleUser.active })}
              data-testid="button-confirm-toggle"
            >
              {toggleActiveMutation.isPending
                ? (toggleUser?.active ? 'Inativando...' : 'Ativando...')
                : (toggleUser?.active ? 'Inativar' : 'Ativar')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StaffForm({
  form, setForm, showPassword, setShowPassword, togglePermission, isCreate = false
}: {
  form: any; setForm: any; showPassword: boolean; setShowPassword: any; togglePermission: any; isCreate?: boolean;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Nome *</Label>
          <Input placeholder="Nome" value={form.firstName} onChange={e => setForm((p: any) => ({ ...p, firstName: e.target.value }))} data-testid="input-first-name" />
        </div>
        <div className="space-y-1">
          <Label>Sobrenome</Label>
          <Input placeholder="Sobrenome" value={form.lastName} onChange={e => setForm((p: any) => ({ ...p, lastName: e.target.value }))} data-testid="input-last-name" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Email *</Label>
        <Input type="email" placeholder="email@academia.com" value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} data-testid="input-email" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Telefone</Label>
          <Input placeholder="(11) 9 9999-9999" value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} data-testid="input-phone" />
        </div>
        <div className="space-y-1">
          <Label>Função *</Label>
          <Select value={form.role} onValueChange={v => setForm((p: any) => ({ ...p, role: v }))}>
            <SelectTrigger data-testid="select-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instructor">Professor</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isCreate && (
        <div className="space-y-1">
          <Label>Senha *</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm((p: any) => ({ ...p, password: e.target.value }))}
              data-testid="input-password"
            />
            <Button size="sm" variant="ghost" className="absolute right-1 top-1 h-7 w-7 p-0" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      )}

      {/* Permissions — only for instructors */}
      {form.role === 'instructor' && (
        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
          <p className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Permissões do Professor
          </p>
          {PERMISSION_LABELS.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                checked={!!form.permissions[key]}
                onCheckedChange={() => togglePermission(key)}
                data-testid={`switch-${key}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
