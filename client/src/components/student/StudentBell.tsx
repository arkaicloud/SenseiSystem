import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: number;
  title: string;
  content: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  publishAt: string;
  eventAt?: string;
  readAt?: string;
  notificationId?: number;
}

interface StudentBellProps {
  studentId: number;
}

export const StudentBell = ({ studentId }: StudentBellProps) => {
  const queryClient = useQueryClient();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Query para buscar notificações
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: [`/api/students/${studentId}/notifications`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/students/${studentId}/notifications?limit=10`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar notificações');
      }
      
      return response.json();
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Mutation para marcar como lido
  const markAsReadMutation = useMutation({
    mutationFn: async (noticeId: number) => {
      const response = await apiRequest('PATCH', `/api/students/${studentId}/notifications/${noticeId}/read`);
      
      if (!response.ok) {
        throw new Error('Erro ao marcar como lida');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/notifications`] });
    },
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
    
    // Marcar como lida se ainda não foi lida
    if (!notification.readAt) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'Urgente';
      case 'MEDIUM':
        return 'Normal';
      case 'LOW':
        return 'Informativo';
      default:
        return 'Normal';
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 text-xs"
                data-testid="badge-unread-count"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notificações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground" data-testid="text-no-notifications">
              Nenhuma notificação
            </div>
          ) : (
            notifications.slice(0, 5).map((notification: Notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-item-${notification.id}`}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={`w-2 h-2 rounded-full ${getLevelColor(notification.level)}`} />
                  <span className="font-medium text-sm truncate flex-1">
                    {notification.title}
                  </span>
                  {!notification.readAt && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.publishAt), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </DropdownMenuItem>
            ))
          )}
          
          {notifications.length > 5 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center justify-center">
                Ver todas as notificações
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal para exibir notificação completa */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${selectedNotification ? getLevelColor(selectedNotification.level) : ''}`} />
              <DialogTitle>{selectedNotification?.title}</DialogTitle>
              <Badge variant="outline">
                {selectedNotification ? getLevelText(selectedNotification.level) : ''}
              </Badge>
            </div>
            {selectedNotification?.eventAt && (
              <DialogDescription>
                Evento: {new Date(selectedNotification.eventAt).toLocaleDateString('pt-BR')}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="mt-4">
            <div className="whitespace-pre-wrap text-sm">
              {selectedNotification?.content}
            </div>
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground">
            Publicado {selectedNotification ? formatDistanceToNow(new Date(selectedNotification.publishAt), { 
              addSuffix: true, 
              locale: ptBR 
            }) : ''}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};