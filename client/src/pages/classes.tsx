import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClassForm from "@/components/classes/ClassForm";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTime, getDayName } from "@/lib/utils";

const Classes: React.FC = () => {
  const { toast } = useToast();
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);

  // Fetch classes data
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
    refetchInterval: false,
  });

  const { data: archivedClassesData, isLoading: archivedClassesLoading } = useQuery({
    queryKey: ['/api/classes-archived'],
    refetchInterval: false,
  });

  // Fetch instructors for the form
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    refetchInterval: false,
  });

  // Add class mutation
  const { mutate: addClass, isPending: isAddingClass } = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/classes', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Aula cadastrada com sucesso",
      });
      setIsAddClassOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao cadastrar aula: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update class mutation
  const { mutate: updateClass, isPending: isUpdatingClass } = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PUT', `/api/classes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Aula atualizada com sucesso",
      });
      setSelectedClass(null);
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar aula: ${error}`,
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteClass, isPending: isDeletingClass } = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/classes/${id}`);
      return res.json();
    },
    onSuccess: (data) => {
      const wasArchived = data.action === "archived";
      toast({
        title: wasArchived ? "Aula arquivada" : "Aula excluída",
        description: wasArchived
          ? "Como havia movimentações, o histórico foi preservado e a aula saiu da programação."
          : "Como não havia movimentações, a aula foi excluída definitivamente.",
      });
      setSelectedClass(null);
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes-archived'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir aula: ${error}`,
        variant: "destructive",
      });
    },
  });

  const { mutate: restoreClass, isPending: isRestoringClass } = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/classes/${id}/restore`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Aula restaurada",
        description: "A aula voltou para a programação semanal.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes-archived'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao restaurar aula: ${error}`,
        variant: "destructive",
      });
    },
  });

  const classes = classesData?.classes || [];
  const archivedClasses = archivedClassesData?.classes || [];
  const instructors = usersData?.users
    ? usersData.users
        .filter((user: any) => user.role === 'instructor' || user.role === 'admin')
        .map((user: any) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`
        }))
    : [];

  // Group classes by day
  const classesByDay = classes.reduce((acc: any, classItem: any) => {
    const day = classItem.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(classItem);
    return acc;
  }, {});

  // Sort each day's classes by start time
  Object.keys(classesByDay).forEach(day => {
    classesByDay[day].sort((a: any, b: any) => {
      return a.startTime.localeCompare(b.startTime);
    });
  });

  const handleAddClass = (data: any) => {
    addClass(data);
  };

  const handleUpdateClass = (data: any) => {
    if (selectedClass) {
      updateClass({ id: selectedClass.id, data });
    }
  };

  const handleDeleteClass = () => {
    if (!selectedClass || isDeletingClass) return;

    const confirmed = window.confirm(
      `Remover a aula "${selectedClass.name}" da programação?\n\nSe houver inscrições ou presenças, ela será arquivada para preservar o histórico. Se não houver movimentações, será excluída definitivamente.`
    );
    if (confirmed) {
      deleteClass(selectedClass.id);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">Aulas</h1>
          <p className="text-secondary-foreground">Gerencie a programação das aulas</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-light text-primary-foreground font-medium">
                <span className="material-icons mr-1 text-sm">add</span>
                Nova Aula
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden p-4 sm:max-h-[90dvh] sm:p-6 md:max-w-[720px]">
              <DialogTitle className="shrink-0 pr-8">Adicionar Nova Aula</DialogTitle>
              <ClassForm 
                instructors={instructors} 
                onSubmit={handleAddClass} 
                isLoading={isAddingClass}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Programação de Aulas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schedule">
            <TabsList className="mb-4">
              <TabsTrigger value="schedule">Programação Semanal</TabsTrigger>
              <TabsTrigger value="list">Visualização em Lista</TabsTrigger>
              <TabsTrigger value="archived">Arquivadas ({archivedClasses.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule">
              {classesLoading ? (
                <div className="text-center py-8">Loading classes...</div>
              ) : classes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No classes found</div>
              ) : (
                <div className="space-y-6">
                  {/* Create a section for each day of the week */}
                  {[0, 1, 2, 3, 4, 5, 6].map(day => (
                    <div key={day} className="border border-border dark:border-border rounded-lg overflow-hidden">
                      <div className="bg-muted dark:bg-muted p-3 font-medium text-foreground dark:text-foreground">
                        {getDayName(day)}
                      </div>

                      {!classesByDay[day] || classesByDay[day].length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground dark:text-muted-foreground">
                          Nenhuma aula agendada
                        </div>
                      ) : (
                        <div className="divide-y divide-border dark:divide-border">
                          {classesByDay[day].map((classItem: any) => {
                            const { time, period } = formatTime(classItem.startTime);
                            return (
                              <div 
                                key={classItem.id} 
                                className="p-4 hover:bg-background dark:hover:bg-muted/50 cursor-pointer"
                                onClick={() => setSelectedClass(classItem)}
                              >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                  <div className="flex items-start">
                                    <div className="bg-accent dark:bg-accent/40 text-accent-foreground dark:text-accent-foreground p-2 rounded-lg mr-3 flex flex-col items-center justify-center min-w-[60px] text-center">
                                      <span className="text-sm font-medium">{time}</span>
                                      <span className="text-xs">{period}</span>
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-foreground dark:text-foreground">{classItem.name}</h3>
                                      <p className="text-sm text-secondary-foreground dark:text-muted-foreground">
                                        {classItem.instructor 
                                          ? `${classItem.instructor.firstName} Sensei` 
                                          : 'Nenhum instrutor atribuído'}
                                        {' • '}
                                        {classItem.duration} min
                                      </p>
                                      {classItem.description && (
                                        <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                                          {classItem.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-3 md:mt-0 flex items-center">
                                    {classItem.maxCapacity && (
                                      <span className="text-xs text-muted-foreground dark:text-muted-foreground bg-muted dark:bg-muted rounded-full px-2 py-1 mr-3">
                                        Máx: {classItem.maxCapacity}
                                      </span>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedClass(classItem);
                                      }}
                                    >
                                      Editar
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="list">
              {classesLoading ? (
                <div className="text-center py-8">Carregando aulas...</div>
              ) : classes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhuma aula encontrada</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border dark:divide-border">
                    <thead className="bg-background dark:bg-muted">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                          Nome da Aula
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                          Dia
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                          Horário
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                          Duração
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                          Instrutor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card dark:bg-card divide-y divide-border dark:divide-border">
                      {classes.map((classItem: any) => {
                        const { time, period } = formatTime(classItem.startTime);
                        return (
                          <tr key={classItem.id} className="hover:bg-background dark:hover:bg-muted">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-foreground dark:text-foreground">{classItem.name}</div>
                              {classItem.description && (
                                <div className="text-sm text-muted-foreground dark:text-muted-foreground">{classItem.description}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground dark:text-foreground">{getDayName(classItem.dayOfWeek)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground dark:text-foreground">{time} {period}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground dark:text-foreground">{classItem.duration} min</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground dark:text-foreground">
                                {classItem.instructor 
                                  ? `${classItem.instructor.firstName} ${classItem.instructor.lastName}` 
                                  : 'Não atribuído'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-secondary hover:text-secondary-dark"
                                onClick={() => setSelectedClass(classItem)}
                              >
                                Edit
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="archived">
              {archivedClassesLoading ? (
                <div className="text-center py-8">Carregando aulas arquivadas...</div>
              ) : archivedClasses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhuma aula arquivada</div>
              ) : (
                <div className="space-y-3">
                  {archivedClasses.map((classItem: any) => {
                    const { time, period } = formatTime(classItem.startTime);
                    return (
                      <div
                        key={classItem.id}
                        className="flex flex-col gap-3 rounded-lg border border-border p-4 dark:border-border sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="font-medium text-foreground dark:text-foreground">{classItem.name}</div>
                          <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                            {getDayName(classItem.dayOfWeek)} • {time} {period}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => restoreClass(classItem.id)}
                          disabled={isRestoringClass}
                        >
                          {isRestoringClass ? "Restaurando..." : "Restaurar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Class Dialog */}
      {selectedClass && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedClass(null)}>
          <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden p-4 sm:max-h-[90dvh] sm:p-6 md:max-w-[720px]">
            <DialogTitle className="shrink-0 pr-8">Editar Aula</DialogTitle>
            <ClassForm 
              instructors={instructors}
              defaultValues={{
                name: selectedClass.name,
                description: selectedClass.description || '',
                instructorId: selectedClass.instructorId,
                dayOfWeek: selectedClass.dayOfWeek,
                startTime: selectedClass.startTime,
                duration: selectedClass.duration,
                maxCapacity: selectedClass.maxCapacity,
              }}
              onSubmit={handleUpdateClass}
               onDelete={handleDeleteClass}
              isLoading={isUpdatingClass}
               isDeleting={isDeletingClass}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Classes;