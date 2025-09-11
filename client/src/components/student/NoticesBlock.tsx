
<old_str>import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Users, Award, Clock } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "event" | "announcement" | "promotion" | "class";
}

interface SchoolNoticesProps {
  notices: Notice[];
  primaryColor: string;
  isLoading?: boolean;
}

export const SchoolNotices = ({ notices, primaryColor, isLoading }: SchoolNoticesProps) => {
  const getNoticeIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Users className="w-4 h-4" />;
      case "promotion":
        return <Award className="w-4 h-4" />;
      case "class":
        return <Clock className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNoticeColor = (type: string) => {
    switch (type) {
      case "event":
        return "bg-blue-50 border-blue-200";
      case "promotion":
        return "bg-yellow-50 border-yellow-200";
      case "class":
        return "bg-green-50 border-green-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "event":
        return "bg-blue-600 text-white";
      case "promotion":
        return "bg-yellow-600 text-white";
      case "class":
        return "bg-green-600 text-white";
      default:
        return "bg-blue-600 text-white";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: primaryColor }} />
            Avisos e Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando avisos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dados estáticos para demonstração se não houver notices
  const defaultNotices: Notice[] = [
    {
      id: "1",
      title: "Seminário de Jiu-Jitsu com Mestre João",
      description: "Grande seminário técnico no próximo sábado. Inscrições abertas até quinta-feira. Não percam esta oportunidade única!",
      date: "Sáb, 10/08",
      type: "event"
    },
    {
      id: "2",
      title: "Graduação de Faixas - Agosto",
      description: "A cerimônia de graduação será realizada no dia 25. Os alunos aprovados receberão comunicado individual.",
      date: "Dom, 25/08",
      type: "promotion"
    },
    {
      id: "3",
      title: "Horário especial - Quinta-feira",
      description: "Aula das 19h será antecipada para 18h30 devido ao evento na academia vizinha.",
      date: "Qui, 08/08",
      type: "class"
    }
  ];

  const displayNotices = notices.length > 0 ? notices : defaultNotices;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" style={{ color: primaryColor }} />
          Avisos e Eventos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayNotices.map((notice) => (
          <div key={notice.id} className={`${getNoticeColor(notice.type)} border rounded-lg p-4`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getNoticeIcon(notice.type)}
                  <h4 className="font-medium text-gray-900">{notice.title}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {notice.description}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${getBadgeColor(notice.type)}`}>
                {notice.date}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};</old_str>
<new_str>import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Users, Award, Clock, AlertTriangle, Info, MessageCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NoticesBlockProps {
  studentId: number;
  primaryColor?: string;
  limit?: number;
}

export const NoticesBlock = ({ studentId, primaryColor = "#3b82f6", limit = 3 }: NoticesBlockProps) => {
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
              <a href="/student/notices">Ver todos</a>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notices.map((notice: any) => (
          <div key={notice.id} className={`${getLevelColor(notice.level)} border rounded-lg p-4`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                {getLevelIcon(notice.level)}
                <h4 className="font-medium text-sm line-clamp-1">{notice.title}</h4>
              </div>
              <Badge variant={getBadgeVariant(notice.level)} className="text-xs ml-2 shrink-0">
                {getLevelText(notice.level)}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {notice.content}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{formatDate(notice.publishAt)}</span>
              {notice.eventAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Evento: {new Date(notice.eventAt).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
            
            {!notice.readAt && (
              <div className="mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-2"></div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Novo</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};</old_str>
