
import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Bold, 
  Italic, 
  Underline, 
  Image, 
  Smile, 
  Palette,
  Send,
  Edit,
  Trash2,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Info,
  MessageCircle,
  Users
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
} from "@/components/ui/alert-dialog";

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

const Communications: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    content: '',
    level: 'MEDIUM',
    audience: 'ALL',
    eventAt: ''
  });

  const contentRef = useRef<HTMLDivElement>(null);

  // Buscar avisos da API
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
        description: "Comunicado criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
      resetForm();
      setIsCreateOpen(false);
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
        description: "Comunicado atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
      resetForm();
      setIsEditMode(false);
      setIsCreateOpen(false);
      setSelectedNotice(null);
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
        description: "Comunicado removido com sucesso.",
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

  const handleFormatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const handleColorChange = (color: string) => {
    handleFormatText('foreColor', color);
  };

  const handleBackgroundColor = (color: string) => {
    handleFormatText('hiliteColor', color);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = `<img src="${e.target?.result}" style="max-width: 100%; height: auto;" />`;
        document.execCommand('insertHTML', false, img);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertEmoji = (emoji: string) => {
    document.execCommand('insertHTML', false, emoji);
    contentRef.current?.focus();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      level: 'MEDIUM',
      audience: 'ALL',
      eventAt: ''
    });
    if (contentRef.current) {
      contentRef.current.innerHTML = '';
    }
    setSelectedNotice(null);
    setIsEditMode(false);
  };

  const handleInputChange = (field: keyof NoticeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const content = contentRef.current?.innerHTML || '';
    if (!formData.title.trim() || !content.trim()) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      content,
      eventAt: formData.eventAt || undefined
    };

    if (isEditMode && selectedNotice) {
      editNoticeMutation.mutate({
        id: selectedNotice.id,
        data: submitData
      });
    } else {
      createNoticeMutation.mutate(submitData);
    }
  };

  const handleEdit = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsEditMode(true);
    setFormData({
      title: notice.title,
      content: notice.content,
      level: notice.level,
      audience: notice.audience,
      eventAt: notice.eventAt ? new Date(notice.eventAt).toISOString().slice(0, 16) : ''
    });
    
    // Set content in the editor
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.innerHTML = notice.content;
      }
    }, 100);
    
    setIsCreateOpen(true);
  };

  const handleDelete = (notice: Notice) => {
    deleteNoticeMutation.mutate(notice.id);
  };

  const handleNewNotice = () => {
    resetForm();
    setSelectedNotice(null);
    setIsEditMode(false);
    setIsCreateOpen(true);
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
      case 'HIGH': return 'Alta';
      case 'MEDIUM': return 'Média';
      case 'LOW': return 'Baixa';
      default: return 'Normal';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-2xl font-bold">Comunicados e Eventos</h1>
        </div>

        <Button onClick={handleNewNotice} className="bg-secondary hover:bg-secondary-dark">
          <Plus className="w-4 h-4 mr-2" />
          Novo Comunicado
        </Button>
      </div>

      {/* Dialog para criar/editar */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {isEditMode ? 'Editar Comunicado' : 'Criar Novo Comunicado'}
          </DialogTitle>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Digite o título..."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Público Alvo</Label>
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
              
              <div className="space-y-2">
                <Label>Data e Hora do Evento (Opcional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.eventAt}
                  onChange={(e) => handleInputChange('eventAt', e.target.value)}
                />
              </div>
            </div>

            {/* Editor Rico */}
            <div className="space-y-2">
              <Label>Conteúdo</Label>
              
              {/* Barra de Ferramentas */}
              <div className="border rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleFormatText('bold')}
                  className="p-2"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleFormatText('italic')}
                  className="p-2"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleFormatText('underline')}
                  className="p-2"
                >
                  <Underline className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="p-2"
                  >
                    <Palette className="w-4 h-4" />
                  </Button>
                  <input
                    type="color"
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-8 h-8 border rounded cursor-pointer"
                  />
                </div>
                
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleBackgroundColor('#ffff00')}
                  className="p-2 bg-yellow-200"
                >
                  Destacar
                </Button>
                
                <div className="flex items-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="p-2"
                  >
                    <Image className="w-4 h-4" />
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                
                <div className="flex gap-1">
                  {['😀', '😎', '💪', '🥋', '🏆', '👏', '🔥', '⚡'].map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => insertEmoji(emoji)}
                      className="p-1 text-lg"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Área de Texto Rica */}
              <div
                ref={contentRef}
                contentEditable
                className="min-h-[200px] p-4 border border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                style={{ whiteSpace: 'pre-wrap' }}
                data-placeholder="Digite o conteúdo do comunicado..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-secondary hover:bg-secondary-dark"
                disabled={createNoticeMutation.isPending || editNoticeMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {createNoticeMutation.isPending || editNoticeMutation.isPending 
                  ? 'Salvando...' 
                  : (isEditMode ? 'Atualizar' : 'Publicar')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
              <Button onClick={handleNewNotice}>
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

                    <div 
                      className="text-gray-600 dark:text-gray-300 mb-4 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: notice.content }}
                    />

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                      <span>
                        Criado em {formatDate(notice.createdAt)}
                      </span>

                      {notice.eventAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Evento: {formatDate(notice.eventAt)}</span>
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
};

export default Communications;
