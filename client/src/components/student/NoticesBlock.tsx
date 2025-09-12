import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Users, Award, Clock, AlertTriangle, Info, MessageCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPreviewText } from "@/lib/htmlUtils";
import { RichContent } from "@/components/ui/rich-content";

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
  primaryColor?: string;
  limit?: number;
}

export const NoticesBlock = ({ studentId, primaryColor = "#3b82f6", limit = 3 }: NoticesBlockProps) => {
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Buscar avisos recentes para o estudante
  const { data: notices, isLoading } = useQuery({
    queryKey: [`/api/students/${studentId}/notices/recent`, { limit }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/students/${studentId}/notices/recent?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar avisos');
      }
      return response.json();
    },
    enabled: !!studentId,
  });

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsDialogOpen(true);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'MEDIUM':
        return <MessageCircle className="w-4 h-4 text-yellow-500" />;
      case 'LOW':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
      case 'MEDIUM':
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800";
      case 'LOW':
        return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800";
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800";
    }
  };

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'HIGH':
        return "destructive";
      case 'MEDIUM':
        return "default";
      case 'LOW':
        return "secondary";
      default:
        return "outline";
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'HIGH': return 'Urgente';
      case 'MEDIUM': return 'Importante';
      case 'LOW': return 'Informativo';
      default: return 'Aviso';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch {
      return 'Recente';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: primaryColor }} />
            Avisos & Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!notices || !Array.isArray(notices) || notices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: primaryColor }} />
            Avisos & Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Bell className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhum aviso recente disponível.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: primaryColor }} />
            Avisos & Eventos
          </div>
          {notices.length >= limit && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/notices" data-testid="link-all-notices">Ver todos</Link>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notices.map((notice: Notice) => (
          <div 
            key={notice.id} 
            className={`${getLevelColor(notice.level)} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}
            onClick={() => handleNoticeClick(notice)}
            data-testid={`notice-card-${notice.id}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                {getLevelIcon(notice.level)}
                <h4 className="font-medium text-sm line-clamp-1">{notice.title}</h4>
              </div>
              <Badge variant={getBadgeVariant(notice.level)} className="text-xs ml-2 shrink-0">
                {getLevelText(notice.level)}
              </Badge>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3 sm:line-clamp-2">
              {createPreviewText(notice.content, 150)}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="truncate">{formatDate(notice.publishAt)}</span>
              {notice.eventAt && (
                <div className="flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3" />
                  <span className="truncate">Evento: {new Date(notice.eventAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
            </div>

            {!notice.readAt && (
              <div className="mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-2"></div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Novo</span>
              </div>
            )}

            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Clique para ver detalhes
            </div>
          </div>
        ))}
      </CardContent>

      {/* Dialog para exibir aviso completo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="notice-popup">
          <DialogHeader className="pt-2 pr-8">
            <div className="flex items-center gap-2 mb-2">
              {selectedNotice && getLevelIcon(selectedNotice.level)}
              <DialogTitle className="text-lg font-semibold">
                {selectedNotice?.title}
              </DialogTitle>
              {selectedNotice && (
                <Badge variant={getBadgeVariant(selectedNotice.level)} className="text-xs">
                  {getLevelText(selectedNotice.level)}
                </Badge>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="break-words">Publicado {selectedNotice && formatDate(selectedNotice.publishAt)}</span>
              {selectedNotice?.eventAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="break-words">Evento: {new Date(selectedNotice.eventAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
            </div>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="mt-4 px-1">
              <RichContent 
                content={selectedNotice?.content || ''}
                className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed break-words"
              />

              {selectedNotice?.eventAt && (
                <div className="mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-medium text-sm sm:text-base text-blue-900 dark:text-blue-100">Informações do Evento</h4>
                  </div>
                  <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200 break-words">
                    <strong>Data:</strong> {new Date(selectedNotice.eventAt).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </Card>
  );
};