import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeltWithLabel } from "@/components/ui/belt";
import CustomAvatar, { AvatarData } from "@/components/students/CustomAvatar";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const Profile: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    emergencyContact: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: [`/api/users/${user?.id || 0}`],
    enabled: !!user?.id,
    refetchInterval: false,
  });
  
  // Fetch student data if user is a student
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: [`/api/students/by-user/${user?.id || 0}`],
    enabled: !!user?.id && user?.role === 'student',
    refetchInterval: false,
  });

  // Update avatar mutation
  const { mutate: updateAvatar, isPending: isUpdatingAvatar } = useMutation({
    mutationFn: async (data: AvatarData) => {
      const res = await apiRequest('PUT', `/api/students/avatar/${studentData?.student?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Avatar atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/students/by-user/${user?.id || 0}`] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar avatar: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  const handleAvatarUpdate = (data: AvatarData) => {
    if (studentData?.student?.id) {
      updateAvatar(data);
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o avatar. Verifique se você está cadastrado como aluno.",
        variant: "destructive",
      });
    }
  };

  // Update user mutation
  const { mutate: updateUser, isPending: isUpdating } = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', `/api/users/${userId}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Populate form data when user data is loaded
  React.useEffect(() => {
    if (userData?.user) {
      setFormData({
        firstName: userData.user.firstName,
        lastName: userData.user.lastName,
        email: userData.user.email,
        phone: userData.user.phone || "",
        emergencyContact: userData.user.emergencyContact || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [userData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if passwords match for password change
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data for update
    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      emergencyContact: formData.emergencyContact,
    };
    
    // Only include password if changing it
    if (formData.newPassword) {
      (updateData as any).password = formData.newPassword;
    }
    
    updateUser(updateData);
  };

  const user = userData?.user;
  const isStudent = user?.role === 'student';

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">Profile</h1>
          <p className="text-gray-600">Manage your personal information</p>
        </div>
        {!isEditing && (
          <Button
            className="mt-4 md:mt-0 bg-secondary hover:bg-secondary-dark text-white"
            onClick={() => setIsEditing(true)}
          >
            <span className="material-icons mr-1 text-sm">edit</span>
            Edit Profile
          </Button>
        )}
      </div>

      {userLoading ? (
        <div className="text-center py-8">Loading profile...</div>
      ) : !user ? (
        <div className="text-center py-8 text-gray-500">User not found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  {isStudent ? (
                    <div className="mb-4">
                      <CustomAvatar 
                        firstName={user.firstName}
                        lastName={user.lastName}
                        avatarStyle={userData?.student?.avatarStyle || "initials"}
                        avatarColor={userData?.student?.avatarColor || "blue"}
                        avatarImage={userData?.student?.avatarImage || ""}
                        size="lg"
                        onSave={handleAvatarUpdate}
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white mb-4">
                      <span className="font-bold text-2xl">
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <h2 className="text-xl font-bold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-500">{user.email}</p>
                  <div className="mt-2 bg-primary-light text-white text-sm px-3 py-1 rounded-full">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </div>
                  
                  {isStudent && (
                    <div className="mt-4 w-full">
                      <div className="border-t pt-4 text-center">
                        <p className="text-sm text-gray-500 mb-2">Belt Level</p>
                        <div className="flex justify-center">
                          <BeltWithLabel level="blue" size="lg" />
                        </div>
                        <p className="mt-2 text-sm font-medium">
                          Blue Belt • 2 Stripes
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last Promotion: 3 months ago
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 w-full">
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Account Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Username</span>
                          <span className="text-sm font-medium">{user.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Join Date</span>
                          <span className="text-sm font-medium">
                            {new Date(user.joinDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Status</span>
                          <span className="text-sm font-medium text-status-success">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Personal Details</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    {isStudent && <TabsTrigger value="membership">Membership</TabsTrigger>}
                  </TabsList>
                  
                  <TabsContent value="details">
                    {isEditing ? (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            <Input
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name
                            </label>
                            <Input
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Optional"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Emergency Contact
                          </label>
                          <Input
                            name="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={handleInputChange}
                            placeholder="Name: XXX-XXX-XXXX"
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-secondary hover:bg-secondary-dark text-white"
                            disabled={isUpdating}
                          >
                            {isUpdating ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">First Name</p>
                            <p className="font-medium">{user.firstName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Last Name</p>
                            <p className="font-medium">{user.lastName}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-medium">{user.phone || "Not provided"}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Emergency Contact</p>
                          <p className="font-medium">{user.emergencyContact || "Not provided"}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="security">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <Input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          placeholder="Enter your current password"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <Input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          placeholder="Enter your new password"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <Input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm your new password"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="submit"
                          className="bg-secondary hover:bg-secondary-dark text-white"
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                  
                  {isStudent && (
                    <TabsContent value="membership">
                      <div className="space-y-6">
                        <div className="bg-accent/10 border border-accent rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium text-lg">Current Plan</h3>
                            <span className="bg-status-success text-white text-xs px-2 py-1 rounded-full">
                              Active
                            </span>
                          </div>
                          <p className="text-2xl font-bold">Standard Membership</p>
                          <p className="text-sm text-gray-600">Unlimited classes</p>
                          <div className="mt-4 flex justify-between items-center">
                            <p className="font-medium">$129/month</p>
                            <p className="text-sm text-gray-500">Next payment: Oct 15, 2023</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-lg mb-3">Payment History</h3>
                          <div className="border rounded-lg divide-y">
                            <div className="p-3 flex justify-between items-center">
                              <div>
                                <p className="font-medium">Standard Membership</p>
                                <p className="text-sm text-gray-500">Sep 15, 2023</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">$129.00</p>
                                <p className="text-xs text-status-success">Paid</p>
                              </div>
                            </div>
                            <div className="p-3 flex justify-between items-center">
                              <div>
                                <p className="font-medium">Standard Membership</p>
                                <p className="text-sm text-gray-500">Aug 15, 2023</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">$129.00</p>
                                <p className="text-xs text-status-success">Paid</p>
                              </div>
                            </div>
                            <div className="p-3 flex justify-between items-center">
                              <div>
                                <p className="font-medium">Standard Membership</p>
                                <p className="text-sm text-gray-500">Jul 15, 2023</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">$129.00</p>
                                <p className="text-xs text-status-success">Paid</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
