import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Bell, 
  Calendar, 
  AlertTriangle, 
  Info, 
  MessageCircle, 
  Search,
  Filter,
  CheckCircle,
  Clock,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface Notice {
  id: number;
  title: string;
  content: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  publishAt: string;
  eventAt?: string;
  readAt?: string;
}

export default function StudentNoticesPage() {
  const { user } = useAuth();
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  // Buscar perfil do estudante
  const { data: studentProfile } = useQuery({
    queryKey: ['/api/student/profile'],
    enabled: user?.role === 'student',
  });

  // Buscar avisos do estudante
  const { data: notices, isLoading } = useQuery({
    queryKey: [`/api/students/${studentProfile?.id}/notices`],
    queryFn: async () => {
      if (!studentProfile?.id) return { notices: [] };
      const response = await apiRequest('GET', `/api/students/${studentProfile.id}/notices`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar avisos');
      }
      
      return response.json();
    },
    enabled: !!studentProfile?.id,
  });

  // Marcar aviso como lido
  const markAsReadMutation = useMutation({
    mutationFn: async (noticeId: number) => {
      const response = await apiRequest('POST', `/api/students/${studentProfile?.id}/notices/${noticeId}/read`);
      if (!response.ok) {
        throw new Error('Erro ao marcar como lido');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentProfile?.id}/notices`] });
    },
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM':
        return <MessageCircle className="h-4 w-4 text-yellow-500" />;
      case 'LOW':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950';
      case 'MEDIUM':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'LOW':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'Urgente';
      case 'MEDIUM':
        return 'Importante';
      case 'LOW':
        return 'Informativo';
      default:
        return 'Geral';
    }
  };

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsDialogOpen(true);
    
    // Marcar como lido se ainda não foi lido
    if (!notice.readAt) {
      markAsReadMutation.mutate(notice.id);
    }
  };

  // Filtrar avisos
  const filteredNotices = notices?.notices?.filter((notice: Notice) => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || notice.level === levelFilter;
    return matchesSearch && matchesLevel;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Avisos e Comunicados</h1>
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
    <>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Avisos e Comunicados</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar avisos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            
            {/* Filter */}
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="HIGH">Urgente</SelectItem>
                <SelectItem value="MEDIUM">Importante</SelectItem>
                <SelectItem value="LOW">Informativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notices List */}
        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {searchTerm || levelFilter !== "all" ? "Nenhum aviso encontrado" : "Nenhum aviso disponível"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || levelFilter !== "all" 
                    ? "Tente ajustar os filtros de pesquisa." 
                    : "Você será notificado quando houver novos comunicados da escola."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotices.map((notice: Notice) => (
              <Card 
                key={notice.id} 
                className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${getLevelColor(notice.level)} ${
                  !notice.readAt ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                }`}
                onClick={() => handleNoticeClick(notice)}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getLevelIcon(notice.level)}
                        <h3 className={`font-semibold text-lg ${!notice.readAt ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notice.title}
                        </h3>
                        <Badge variant={notice.level === 'HIGH' ? 'destructive' : notice.level === 'MEDIUM' ? 'default' : 'secondary'}>
                          {getLevelText(notice.level)}
                        </Badge>
                        {!notice.readAt && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Novo
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notice.content.substring(0, 150)}
                        {notice.content.length > 150 && '...'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(new Date(notice.publishAt), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                        {notice.eventAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Evento: {new Date(notice.eventAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        {notice.readAt && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Lido</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Notice Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              {selectedNotice && getLevelIcon(selectedNotice.level)}
              <DialogTitle className="text-xl">{selectedNotice?.title}</DialogTitle>
              {selectedNotice && (
                <Badge variant={selectedNotice.level === 'HIGH' ? 'destructive' : selectedNotice.level === 'MEDIUM' ? 'default' : 'secondary'}>
                  {getLevelText(selectedNotice.level)}
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          <DialogDescription asChild>
            <div className="space-y-4">
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: selectedNotice?.content || '' }}
              />
              
              {selectedNotice?.eventAt && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Data do Evento:</span>
                  </div>
                  <p className="mt-1 text-blue-600 dark:text-blue-400">
                    {new Date(selectedNotice.eventAt).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground border-t pt-3">
                Publicado {selectedNotice ? formatDistanceToNow(new Date(selectedNotice.publishAt), { 
                  addSuffix: true, 
                  locale: ptBR 
                }) : ''}
                {selectedNotice?.readAt && (
                  <span className="ml-4 text-green-600">
                    • Lido {formatDistanceToNow(new Date(selectedNotice.readAt), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                )}
              </div>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}