import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { Layout } from '@/components/layout/layout';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { ClassSession } from '@/types';
import { Link } from 'wouter';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AddClassModal from '@/components/modals/add-class-modal';
import { useToast } from '@/hooks/use-toast';

export default function ClassesPage() {
  const { t, locale } = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  
  // Get classes
  const { data: classes, isLoading } = useQuery<ClassSession[]>({
    queryKey: ['/api/classes'],
  });
  
  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: (data: any) => api.classes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      toast({
        title: t('class.addClass'),
        description: 'Class created successfully',
      });
      setIsAddClassModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create class: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Handle check-in for student
  const handleCheckin = (classId: number) => {
    if (!user?.student?.id) {
      toast({
        title: 'Error',
        description: 'You must be a student to check in',
        variant: 'destructive',
      });
      return;
    }
    
    api.classes.checkin(classId, user.student.id)
      .then(() => {
        toast({
          title: 'Success',
          description: 'Checked in to class successfully',
        });
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: `Failed to check in: ${error}`,
          variant: 'destructive',
        });
      });
  };
  
  // Filter classes by search term
  const filteredClasses = classes
    ? classes.filter(classSession =>
        classSession.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
  
  // Sort classes by date (newest first)
  const sortedClasses = [...(filteredClasses || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Check if user has permission to add/edit classes
  const canManageClasses = user && ['admin', 'manager', 'instructor'].includes(user.role);
  
  // Handle adding a new class
  const handleAddClass = (data: any) => {
    createClassMutation.mutate(data);
  };
  
  return (
    <Layout title={t('common.classes')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <CardTitle>{t('common.classes')}</CardTitle>
            <div className="flex space-x-2">
              <Input
                className="w-full sm:w-auto bg-gray-700 border-gray-600 text-white"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {canManageClasses && (
                <Button onClick={() => setIsAddClassModalOpen(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  {t('class.addClass')}
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">{t('class.title')}</TableHead>
                    <TableHead className="text-gray-400">{t('class.date')}</TableHead>
                    <TableHead className="text-gray-400">{t('class.startTime')}</TableHead>
                    <TableHead className="text-gray-400">{t('class.beltLevel')}</TableHead>
                    <TableHead className="text-gray-400">{t('class.capacity')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        {t('common.loading')}
                      </TableCell>
                    </TableRow>
                  ) : sortedClasses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-400">
                        No classes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedClasses.map((classSession) => (
                      <TableRow key={classSession.id} className="border-gray-700">
                        <TableCell className="font-medium">{classSession.title}</TableCell>
                        <TableCell>{formatDate(classSession.date, locale)}</TableCell>
                        <TableCell>{formatTime(classSession.startTime)} - {formatTime(classSession.endTime)}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-white text-black">
                            {classSession.beltLevel || t('class.allLevels')}
                          </span>
                        </TableCell>
                        <TableCell>{classSession.capacity}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/classes/${classSession.id}`}>
                              <Button variant="outline" size="sm">
                                <i className="fas fa-eye mr-1"></i> {t('common.view')}
                              </Button>
                            </Link>
                            
                            {user?.role === 'student' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleCheckin(classSession.id)}
                              >
                                <i className="fas fa-check-circle mr-1"></i> {t('class.checkin')}
                              </Button>
                            )}
                            
                            {canManageClasses && (
                              <Link href={`/classes/${classSession.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <i className="fas fa-edit mr-1"></i> {t('common.edit')}
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Add Class Modal */}
      <AddClassModal 
        isOpen={isAddClassModalOpen} 
        onClose={() => setIsAddClassModalOpen(false)}
        onSubmit={handleAddClass}
      />
    </Layout>
  );
}
