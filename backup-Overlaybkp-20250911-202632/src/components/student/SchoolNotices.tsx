import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
};