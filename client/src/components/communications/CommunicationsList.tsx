import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, Clock } from "lucide-react";

interface Communication {
  id: number;
  title: string;
  content: string;
  type: 'announcement' | 'event';
  priority: 'low' | 'medium' | 'high';
  targetAudience: 'all' | 'students' | 'instructors';
  publishDate: Date;
  eventDate?: Date;
  imageUrl?: string;
  createdBy: string;
  isPublished: boolean;
}

interface CommunicationsListProps {
  limit?: number;
  userRole?: 'student' | 'instructor' | 'admin';
}

const CommunicationsList: React.FC<CommunicationsListProps> = ({ 
  limit = 3, 
  userRole = 'student' 
}) => {
  // Mock data - em produção viria da API
  const mockCommunications: Communication[] = [
    {
      id: 1,
      title: "Campeonato Interno de Jiu-Jitsu",
      content: "<p><strong>Grande evento!</strong> 🥋 Nosso campeonato interno acontecerá no próximo mês. <em>Inscrições abertas!</em></p>",
      type: 'event',
      priority: 'high',
      targetAudience: 'all',
      publishDate: new Date('2024-01-20'),
      eventDate: new Date('2024-02-15'),
      imageUrl: '',
      createdBy: 'Arkaia Admin',
      isPublished: true
    },
    {
      id: 2,
      title: "Mudança no Horário das Aulas",
      content: "<p>Informamos que a partir da próxima semana teremos <span style='background-color: yellow;'>alterações nos horários</span> das aulas noturnas.</p>",
      type: 'announcement',
      priority: 'medium',
      targetAudience: 'all',
      publishDate: new Date('2024-01-18'),
      createdBy: 'Arkaia Admin',
      isPublished: true
    },
    {
      id: 3,
      title: "Workshop de Defesa Pessoal",
      content: "<p>Venha participar do nosso workshop especial de defesa pessoal! 💪 Vagas limitadas.</p>",
      type: 'event',
      priority: 'medium',
      targetAudience: 'students',
      publishDate: new Date('2024-01-15'),
      eventDate: new Date('2024-01-25'),
      createdBy: 'Professor Silva',
      isPublished: true
    }
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Normal';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'event' ? <Calendar className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />;
  };

  // Filtrar comunicados relevantes para o usuário
  const filteredCommunications = mockCommunications
    .filter(comm => {
      if (!comm.isPublished) return false;

      if (comm.targetAudience === 'all') return true;
      if (userRole === 'student' && comm.targetAudience === 'students') return true;
      if (userRole === 'instructor' && comm.targetAudience === 'instructors') return true;
      if (userRole === 'admin') return true;

      return false;
    })
    .slice(0, limit);

  const stripHtml = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  if (filteredCommunications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comunicados e Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Nenhum comunicado disponível no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comunicados e Eventos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredCommunications.map((comm) => (
          <div key={comm.id} className="border-l-4 border-secondary pl-4 py-2">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getTypeIcon(comm.type)}
                <h4 className="font-medium text-sm">{comm.title}</h4>
                {comm.priority !== 'low' && (
                  <Badge className={`${getPriorityColor(comm.priority)} text-xs`}>
                    {getPriorityLabel(comm.priority)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatDate(comm.publishDate)}</span>
              </div>
            </div>

            <div className="text-sm text-gray-700 mb-2">
              {stripHtml(comm.content).substring(0, 100)}
              {stripHtml(comm.content).length > 100 && '...'}
            </div>

            {comm.eventDate && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Calendar className="w-3 h-3" />
                <span>Evento: {formatDateTime(comm.eventDate)}</span>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-1">
              Por: {comm.createdBy}
            </div>
          </div>
        ))}

        {filteredCommunications.length >= limit && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">
              {filteredCommunications.length >= limit && '+ mais comunicados disponíveis'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunicationsList;