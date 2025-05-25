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
        title: "Success",
        description: "Class added successfully",
      });
      setIsAddClassOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add class: ${error}`,
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
        title: "Success",
        description: "Class updated successfully",
      });
      setSelectedClass(null);
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update class: ${error}`,
        variant: "destructive",
      });
    },
  });

  const classes = classesData?.classes || [];
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

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">Classes</h1>
          <p className="text-gray-600">Manage your class schedule</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary-dark text-white font-medium">
                <span className="material-icons mr-1 text-sm">add</span>
                New Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogTitle>Add New Class</DialogTitle>
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
          <CardTitle>Class Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schedule">
            <TabsList className="mb-4">
              <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedule">
              {classesLoading ? (
                <div className="text-center py-8">Loading classes...</div>
              ) : classes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No classes found</div>
              ) : (
                <div className="space-y-6">
                  {/* Create a section for each day of the week */}
                  {[0, 1, 2, 3, 4, 5, 6].map(day => (
                    <div key={day} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 p-3 font-medium">
                        {getDayName(day)}
                      </div>
                      
                      {!classesByDay[day] || classesByDay[day].length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No classes scheduled
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {classesByDay[day].map((classItem: any) => {
                            const { time, period } = formatTime(classItem.startTime);
                            return (
                              <div 
                                key={classItem.id} 
                                className="p-4 hover:bg-gray-50 cursor-pointer"
                                onClick={() => setSelectedClass(classItem)}
                              >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                  <div className="flex items-start">
                                    <div className="bg-blue-100 text-blue-800 p-2 rounded-lg mr-3 flex flex-col items-center justify-center min-w-[60px] text-center">
                                      <span className="text-sm font-medium">{time}</span>
                                      <span className="text-xs">{period}</span>
                                    </div>
                                    <div>
                                      <h3 className="font-medium">{classItem.name}</h3>
                                      <p className="text-sm text-gray-600">
                                        {classItem.instructor 
                                          ? `${classItem.instructor.firstName} Sensei` 
                                          : 'No instructor assigned'}
                                        {' • '}
                                        {classItem.duration} min
                                      </p>
                                      {classItem.description && (
                                        <p className="text-sm text-gray-500 mt-1">
                                          {classItem.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-3 md:mt-0 flex items-center">
                                    {classItem.maxCapacity && (
                                      <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-1 mr-3">
                                        Max: {classItem.maxCapacity}
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
                                      Edit
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
                <div className="text-center py-8">Loading classes...</div>
              ) : classes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No classes found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Day
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Instructor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {classes.map((classItem: any) => {
                        const { time, period } = formatTime(classItem.startTime);
                        return (
                          <tr key={classItem.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                              {classItem.description && (
                                <div className="text-sm text-gray-500">{classItem.description}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{getDayName(classItem.dayOfWeek)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{time} {period}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{classItem.duration} min</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {classItem.instructor 
                                  ? `${classItem.instructor.firstName} ${classItem.instructor.lastName}` 
                                  : 'Not assigned'}
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
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Class Dialog */}
      {selectedClass && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedClass(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogTitle>Edit Class</DialogTitle>
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
              isLoading={isUpdatingClass}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Classes;
