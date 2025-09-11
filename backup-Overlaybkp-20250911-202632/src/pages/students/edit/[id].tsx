import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/layout';
import { queryClient } from '@/lib/queryClient';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertStudentSchema, Student } from '@shared/schema';
import { useRoute, useLocation } from 'wouter';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function EditStudentPage() {
  const { t } = useTranslations();
  const { toast } = useToast();
  const [_, params] = useRoute('/students/edit/:id');
  const [__, navigate] = useLocation();
  const studentId = params ? parseInt(params.id) : null;
  
  if (!studentId) {
    navigate('/students');
    return null;
  }
  
  // Get student data
  const { data: student, isLoading } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
  });
  
  // Extend the schema with custom validation
  const formSchema = insertStudentSchema.extend({
    name: z.string().min(1, { message: t('student.nameRequired') }),
    email: z.string().email({ message: t('student.invalidEmail') }).optional(),
    cpf: z.string().min(1, { message: t('student.cpfRequired') }),
    modality: z.enum(['Adulto', 'Feminino', 'Kids'], { 
      errorMap: () => ({ message: t('student.modalityRequired') }) 
    }),
  });
  
  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      cpf: '',
      modality: 'Adulto',
      street: '',
      city: '',
      state: '',
      zip: '',
      currentBelt: 'white',
      currentGrade: 0,
      isActive: true,
      userId: 0
    }
  });
  
  // Student update mutation
  const updateStudentMutation = useMutation({
    mutationFn: (data: any) => api.students.update(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: t('common.success'),
        description: t('student.updateSuccess'),
      });
      navigate(`/students/${studentId}`);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: `${t('student.updateError')}: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Load student data into form when available
  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        email: student.email || '',
        cpf: student.cpf,
        modality: student.modality || 'Adulto',
        street: student.street || '',
        city: student.city || '',
        state: student.state || '',
        zip: student.zip || '',
        currentBelt: student.currentBelt,
        currentGrade: student.currentGrade,
        isActive: student.isActive,
        userId: student.userId
      });
    }
  }, [student, form]);
  
  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    updateStudentMutation.mutate(data);
  };
  
  if (isLoading || !student) {
    return (
      <Layout title={t('student.editStudent')}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-center py-12">
          <p className="text-white">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={t('student.editStudent')}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">{t('student.editStudent')}</h1>
          <Button variant="outline" onClick={() => navigate(`/students/${studentId}`)}>
            {t('common.cancel')}
          </Button>
        </div>
        
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle>{t('student.studentInfo')}</CardTitle>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student.fullName')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John Doe" 
                            {...field} 
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student.email')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="student@example.com" 
                            {...field} 
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student.cpf')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-00" 
                            {...field} 
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="modality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student.modality')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || 'Adulto'}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                              <SelectValue placeholder={t('student.selectModality')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-700 text-white">
                            <SelectItem value="Adulto">{t('student.adulto')}</SelectItem>
                            <SelectItem value="Feminino">{t('student.feminino')}</SelectItem>
                            <SelectItem value="Kids">{t('student.kids')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student.street')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123 Main St" 
                            {...field} 
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student.city')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="São Paulo" 
                            {...field} 
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student.state')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                              <SelectValue placeholder={t('student.selectState')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-700 text-white">
                            <SelectItem value="SP">SP</SelectItem>
                            <SelectItem value="RJ">RJ</SelectItem>
                            <SelectItem value="MG">MG</SelectItem>
                            <SelectItem value="RS">RS</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student.zip')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="00000-000" 
                            {...field} 
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currentBelt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student.belt')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value || 'white'}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                              <SelectValue placeholder={t('student.selectBelt')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-700 text-white">
                            <SelectItem value="white">{t('student.whiteBelt')}</SelectItem>
                            <SelectItem value="blue">{t('student.blueBelt')}</SelectItem>
                            <SelectItem value="purple">{t('student.purpleBelt')}</SelectItem>
                            <SelectItem value="brown">{t('student.brownBelt')}</SelectItem>
                            <SelectItem value="black">{t('student.blackBelt')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currentGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('student.grade')}</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString() || '0'}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                              <SelectValue placeholder={t('student.selectGrade')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-700 text-white">
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateStudentMutation.isPending}>
                    {updateStudentMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}