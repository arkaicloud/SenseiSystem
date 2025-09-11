import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin } from "lucide-react";
import { SchoolEvent } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SchoolEventListProps {
  limit?: number;
  showTitle?: boolean;
}

export default function SchoolEventList({ limit, showTitle = true }: SchoolEventListProps) {
  const { data, isLoading, error } = useQuery<{ events: SchoolEvent[] }>({
    queryKey: ['/api/school-events'],
    queryFn: async () => {
      const res = await fetch('/api/school-events?activeOnly=true');
      if (!res.ok) {
        throw new Error('Falha ao carregar eventos');
      }
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showTitle && <h2 className="text-2xl font-bold">Eventos da Escola</h2>}
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="mb-4">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50">
        <CardHeader>
          <CardTitle>Erro ao carregar eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Não foi possível carregar os eventos da escola. Tente novamente mais tarde.</p>
        </CardContent>
      </Card>
    );
  }

  const events = data?.events || [];
  const displayEvents = limit ? events.slice(0, limit) : events;

  if (displayEvents.length === 0) {
    return (
      <div>
        {showTitle && <h2 className="text-2xl font-bold mb-4">Eventos da Escola</h2>}
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Não há eventos programados no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {showTitle && <h2 className="text-2xl font-bold mb-4">Eventos da Escola</h2>}
      <div className="space-y-4">
        {displayEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            {event.imageUrl && (
              <div className="w-full h-40 overflow-hidden">
                <img 
                  src={event.imageUrl} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle>{event.title}</CardTitle>
                <Badge variant="outline">
                  {format(new Date(event.eventDate), 'PPP', { locale: ptBR })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{event.description}</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(event.eventDate), 'PPP', { locale: ptBR })}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{format(new Date(event.eventDate), 'HH:mm')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}