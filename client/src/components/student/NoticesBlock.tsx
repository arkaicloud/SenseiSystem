import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, Calendar, AlertTriangle, Info, MessageCircle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Notice {
  id: number;
  title: string;
  content: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  publishAt: string;
  eventAt?: string;
  readAt?: string;
}

interface NoticesBlockProps {
  studentId: number;
}

export const NoticesBlock = ({ studentId }: NoticesBlockProps) => {
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: notices, isLoading } = useQuery({
    queryKey: [`/api/students/${studentId}/notices/recent`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/students/${studentId}/notices/recent?limit=4`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar avisos');
      }
      
      return response.json();
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
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

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card data-testid="card-notices-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Avisos & Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="card-notices">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Avisos & Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!notices || notices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-notices">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum aviso recente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.slice(0, 4).map((notice: Notice) => (
                <div
                  key={notice.id}
                  className={`border-l-4 p-3 rounded-r cursor-pointer transition-colors hover:bg-opacity-70 ${getLevelColor(notice.level)}`}
                  onClick={() => handleNoticeClick(notice)}
                  data-testid={`notice-card-${notice.id}`}
                >
                  <div className="flex items-start gap-3">
                    {getLevelIcon(notice.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{notice.title}</h4>
                        {!notice.readAt && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {notice.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {notice.eventAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(notice.eventAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(notice.publishAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {notices.length > 4 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  data-testid="button-view-all-notices"
                >
                  Ver todos os avisos
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para exibir aviso completo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {selectedNotice && getLevelIcon(selectedNotice.level)}
              <DialogTitle>{selectedNotice?.title}</DialogTitle>
            </div>
            {selectedNotice?.eventAt && (
              <DialogDescription>
                Evento: {new Date(selectedNotice.eventAt).toLocaleDateString('pt-BR')}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="mt-4">
            <div className="whitespace-pre-wrap text-sm">
              {selectedNotice?.content}
            </div>
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground">
            Publicado {selectedNotice ? formatDistanceToNow(new Date(selectedNotice.publishAt), { 
              addSuffix: true, 
              locale: ptBR 
            }) : ''}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};