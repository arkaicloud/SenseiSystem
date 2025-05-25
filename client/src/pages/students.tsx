import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BeltWithLabel } from "@/components/ui/belt";
import StudentForm from "@/components/students/StudentForm";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const Students: React.FC = () => {
  const { toast } = useToast();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Fetch students data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/students'],
    refetchInterval: false,
  });

  // Add student mutation
  const { mutate: addStudent, isPending: isAddingStudent } = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/auth/register', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student added successfully",
      });
      setIsAddStudentOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add student: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update student mutation
  const { mutate: updateStudent, isPending: isUpdatingStudent } = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PUT', `/api/students/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update student: ${error}`,
        variant: "destructive",
      });
    },
  });

  const students = data?.students || [];

  const filteredStudents = students.filter((student: any) => {
    const name = `${student.user.firstName} ${student.user.lastName}`.toLowerCase();
    const email = student.user.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const handleAddStudent = (data: any) => {
    addStudent(data);
  };

  const handleUpdateStudent = (data: any) => {
    if (selectedStudent) {
      const studentData = {
        beltLevel: data.beltLevel,
        stripes: data.stripes,
        notes: data.notes,
      };
      
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
      };
      
      // Update student data
      updateStudent({ id: selectedStudent.id, data: studentData });
      
      // Update user data
      apiRequest('PUT', `/api/users/${selectedStudent.user.id}`, userData)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/students'] });
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: `Failed to update user data: ${error}`,
            variant: "destructive",
          });
        });
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">Students</h1>
          <p className="text-gray-600">Manage your students</p>
        </div>
        <div className="mt-4 md:mt-0 flex">
          <div className="relative mr-2">
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <span className="material-icons text-sm">search</span>
            </div>
          </div>
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary-dark text-white font-medium">
                <span className="material-icons mr-1 text-sm">add</span>
                New Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogTitle>Add New Student</DialogTitle>
              <StudentForm onSubmit={handleAddStudent} isLoading={isAddingStudent} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Students</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {isLoading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "No students found matching your search" : "No students found"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student: any) => (
                  <Card 
                    key={student.id} 
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <CardContent className="p-0">
                      <div className="p-4 flex items-start">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white mr-4">
                          <span className="font-bold">
                            {student.user.firstName.charAt(0)}
                            {student.user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium">{student.user.firstName} {student.user.lastName}</h3>
                          <p className="text-sm text-gray-500">{student.user.email}</p>
                          <div className="mt-2 flex items-center">
                            <BeltWithLabel level={student.beltLevel} size="sm" />
                            {student.stripes > 0 && (
                              <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-1">
                                {student.stripes} stripe{student.stripes !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-100 p-3 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Joined: {new Date(student.user.joinDate).toLocaleDateString()}
                        </span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${student.user.email}`;
                            }}
                          >
                            <span className="material-icons text-secondary text-sm">mail</span>
                          </Button>
                          {student.user.phone && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `tel:${student.user.phone}`;
                              }}
                            >
                              <span className="material-icons text-primary text-sm">phone</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active">
            <div className="text-center py-8 text-gray-500">
              Filter feature coming soon
            </div>
          </TabsContent>
          
          <TabsContent value="inactive">
            <div className="text-center py-8 text-gray-500">
              Filter feature coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Student Dialog */}
      {selectedStudent && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogTitle>Edit Student</DialogTitle>
            <StudentForm 
              defaultValues={{
                firstName: selectedStudent.user.firstName,
                lastName: selectedStudent.user.lastName,
                email: selectedStudent.user.email,
                username: selectedStudent.user.username,
                beltLevel: selectedStudent.beltLevel,
                stripes: selectedStudent.stripes,
                emergencyContact: selectedStudent.user.emergencyContact || '',
                notes: selectedStudent.notes || '',
                phone: selectedStudent.user.phone || '',
              }}
              onSubmit={handleUpdateStudent}
              isLoading={isUpdatingStudent}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Students;
