import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPreviewText } from "@/lib/htmlUtils";
import {
  Plus,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Info,
  MessageCircle,
  Users,
  Edit,
  Trash2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Notice {
  id: number;
  title: string;
  content: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  audience: 'ALL' | 'STUDENTS' | 'INSTRUCTORS';
  publishAt: string;
  eventAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface NoticeFormData {
  title: string;
  content: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  audience: 'ALL' | 'STUDENTS' | 'INSTRUCTORS';
  eventAt?: string;
}

export default function CommunicationsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    content: '',
    level: 'MEDIUM',
    audience: 'ALL',
    eventAt: ''
  });

  // Buscar avisos
  const { data: notices, isLoading } = useQuery({
    queryKey: ['/api/notices'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/notices');
      if (!response.ok) throw new Error('Erro ao buscar avisos');
      return response.json();
    },
  });

  // Criar aviso
  const createNoticeMutation = useMutation({
    mutationFn: async (noticeData: NoticeFormData) => {
      const response = await apiRequest('POST', '/api/notices', noticeData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar aviso');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Aviso criado e enviado para os alunos com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Editar aviso
  const editNoticeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: NoticeFormData }) => {
      const response = await apiRequest('PUT', `/api/notices/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao editar aviso');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Aviso atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
      resetForm();
      setIsEditDialogOpen(false);
      setEditingNotice(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deletar aviso
  const deleteNoticeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/notices/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao deletar aviso');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Aviso removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      level: 'MEDIUM',
      audience: 'ALL',
      eventAt: ''
    });
  };

  const handleInputChange = (field: keyof NoticeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (editingNotice) {
      editNoticeMutation.mutate({
        id: editingNotice.id,
        data: {
          ...formData,
          eventAt: formData.eventAt || undefined
        }
      });
    } else {
      createNoticeMutation.mutate({
        ...formData,
        eventAt: formData.eventAt || undefined
      });
    }
  };

  // Helper function to format date for datetime-local input without timezone conversion
  const formatForDatetimeLocal = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      level: notice.level,
      audience: notice.audience,
      eventAt: notice.eventAt ? formatForDatetimeLocal(notice.eventAt) : ''
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (notice: Notice) => {
    deleteNoticeMutation.mutate(notice.id);
  };

  const handleNewNotice = () => {
    resetForm();
    setEditingNotice(null);
    setIsCreateDialogOpen(true);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM':
        return <MessageCircle className="h-4 w-4 text-yellow-500" />;
      case 'LOW':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'HIGH': return 'Urgente';
      case 'MEDIUM': return 'Importante';
      case 'LOW': return 'Informativo';
      default: return 'Geral';
    }
  };

  const getAudienceText = (audience: string) => {
    switch (audience) {
      case 'ALL': return 'Todos';
      case 'STUDENTS': return 'Alunos';
      case 'INSTRUCTORS': return 'Instrutores';
      default: return 'Todos';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'border-red-500';
      case 'MEDIUM': return 'border-yellow-500';
      case 'LOW': return 'border-blue-500';
      default: return 'border-gray-500';
    }
  };

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Comunicados</h1>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Comunicados</h1>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Comunicado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Comunicado</DialogTitle>
              <DialogDescription>
                Crie um aviso que será enviado para os alunos selecionados.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Digite o título do comunicado..."
                  required
                  data-testid="input-title-create"
                />
              </div>

              <div>
                <Label htmlFor="content">Conteúdo</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange('content', value)}
                  placeholder="Digite o conteúdo do comunicado..."
                  className="min-h-[300px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Prioridade</Label>
                  <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Informativo</SelectItem>
                      <SelectItem value="MEDIUM">Importante</SelectItem>
                      <SelectItem value="HIGH">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="audience">Destinatários</Label>
                  <Select value={formData.audience} onValueChange={(value) => handleInputChange('audience', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="STUDENTS">Apenas Alunos</SelectItem>
                      <SelectItem value="INSTRUCTORS">Apenas Instrutores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="eventAt">Data e Horário do Evento (Opcional)</Label>
                <Input
                  id="eventAt"
                  type="datetime-local"
                  value={formData.eventAt}
                  onChange={(e) => handleInputChange('eventAt', e.target.value)}
                  data-testid="input-event-datetime"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createNoticeMutation.isPending}>
                  {createNoticeMutation.isPending ? 'Enviando...' : 'Enviar Comunicado'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Comunicado</DialogTitle>
              <DialogDescription>
                Edite as informações do comunicado selecionado.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Digite o título do comunicado..."
                  required
                  data-testid="input-title-edit"
                />
              </div>

              <div>
                <Label htmlFor="content">Conteúdo</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange('content', value)}
                  placeholder="Digite o conteúdo do comunicado..."
                  className="min-h-[300px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Prioridade</Label>
                  <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Informativo</SelectItem>
                      <SelectItem value="MEDIUM">Importante</SelectItem>
                      <SelectItem value="HIGH">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="audience">Destinatários</Label>
                  <Select value={formData.audience} onValueChange={(value) => handleInputChange('audience', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="STUDENTS">Apenas Alunos</SelectItem>
                      <SelectItem value="INSTRUCTORS">Apenas Instrutores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="eventAt">Data e Horário do Evento (Opcional)</Label>
                <Input
                  id="eventAt"
                  type="datetime-local"
                  value={formData.eventAt}
                  onChange={(e) => handleInputChange('eventAt', e.target.value)}
                  data-testid="input-event-datetime"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); setEditingNotice(null); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editNoticeMutation.isPending}>
                  {editNoticeMutation.isPending ? 'Atualizando...' : 'Salvar Alterações'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Comunicados */}
      <div className="grid gap-4">
        {!notices || notices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhum comunicado enviado
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Comece criando seu primeiro comunicado para os alunos.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Comunicado
              </Button>
            </CardContent>
          </Card>
        ) : (
          notices.map((notice: Notice) => (
            <Card key={notice.id} className={`border-l-4 ${getLevelColor(notice.level)}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {getLevelIcon(notice.level)}
                      <div>
                        <CardTitle className="text-lg">{notice.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getBadgeVariant(notice.level)}>
                            {getLevelText(notice.level)}
                          </Badge>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {getAudienceText(notice.audience)}
                          </Badge>
                          {!notice.isActive && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {createPreviewText(notice.content, 200)}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                      <span>
                        Criado {formatDistanceToNow(new Date(notice.createdAt), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>

                      {notice.eventAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Evento: {new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).format(new Date(notice.eventAt))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(notice)}
                      disabled={deleteNoticeMutation.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={deleteNoticeMutation.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover este comunicado? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(notice)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}