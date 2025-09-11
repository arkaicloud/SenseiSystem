
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
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

export default function CommunicationsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
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
    mutationFn: async (noticeData: any) => {
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
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        content: '',
        level: 'MEDIUM',
        audience: 'ALL',
        eventAt: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

    createNoticeMutation.mutate({
      ...formData,
      eventAt: formData.eventAt || null
    });
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
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Digite o título do comunicado..."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Digite o conteúdo do comunicado..."
                  rows={5}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Prioridade</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
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
                  <Select value={formData.audience} onValueChange={(value) => setFormData({ ...formData, audience: value })}>
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
                <Label htmlFor="eventAt">Data do Evento (Opcional)</Label>
                <Input
                  id="eventAt"
                  type="date"
                  value={formData.eventAt}
                  onChange={(e) => setFormData({ ...formData, eventAt: e.target.value })}
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
            <Card key={notice.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getLevelIcon(notice.level)}
                    <div>
                      <CardTitle className="text-lg">{notice.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={notice.level === 'HIGH' ? 'destructive' : notice.level === 'MEDIUM' ? 'default' : 'secondary'}>
                          {getLevelText(notice.level)}
                        </Badge>
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {getAudienceText(notice.audience)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {notice.content}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    Criado {formatDistanceToNow(new Date(notice.createdAt), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                  
                  {notice.eventAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Evento: {new Date(notice.eventAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
