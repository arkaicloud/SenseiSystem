import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/use-translations';
import { Layout } from '@/components/layout/layout';
import { useAuth } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plan } from '@/types';
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { insertPlanSchema } from '@shared/schema';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function PlansPage() {
  const { t, locale } = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  
  // Get plans
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
  });
  
  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (data: any) => api.plans.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      toast({
        title: t('plan.addPlan'),
        description: 'Plan created successfully',
      });
      setIsAddPlanModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create plan: ${error}`,
        variant: 'destructive',
      });
    }
  });
  
  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => api.plans.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      toast({
        title: 'Success',
        description: 'Plan deleted successfully',
      });
      setPlanToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete plan: ${error}`,
        variant: 'destructive',
      });
      setPlanToDelete(null);
    }
  });
  
  // Form setup
  const formSchema = insertPlanSchema.extend({
    name: z.string().min(1, { message: t('plan.nameRequired') }),
    price: z.string().min(1, { message: t('plan.priceRequired') }),
    expirationDate: z.string().optional(),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: '',
      expirationDate: undefined
    }
  });
  
  // Filter plans by search term
  const filteredPlans = plans
    ? plans.filter(plan =>
        plan.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
  
  // Handle adding a new plan
  const handleAddPlan = (data: z.infer<typeof formSchema>) => {
    createPlanMutation.mutate(data);
    form.reset();
  };
  
  // Check if user has admin permission
  const isAdmin = user && user.role === 'admin';
  
  return (
    <Layout title={t('common.plans')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <CardTitle>{t('common.plans')}</CardTitle>
            <div className="flex space-x-2">
              <Input
                className="w-full sm:w-auto bg-gray-700 border-gray-600 text-white"
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {isAdmin && (
                <Button onClick={() => setIsAddPlanModalOpen(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  {t('plan.addPlan')}
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">{t('plan.name')}</TableHead>
                    <TableHead className="text-gray-400">{t('plan.price')}</TableHead>
                    <TableHead className="text-gray-400">{t('plan.expirationDate')}</TableHead>
                    {isAdmin && (
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-4">
                        {t('common.loading')}
                      </TableCell>
                    </TableRow>
                  ) : filteredPlans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-4 text-gray-400">
                        No plans found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlans.map((plan) => (
                      <TableRow key={plan.id} className="border-gray-700">
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>{formatCurrency(plan.price, locale)}</TableCell>
                        <TableCell>
                          {plan.expirationDate 
                            ? formatDate(plan.expirationDate, locale) 
                            : 'No expiration'}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" size="sm">
                                <i className="fas fa-edit mr-1"></i> {t('common.edit')}
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => setPlanToDelete(plan.id)}
                              >
                                <i className="fas fa-trash mr-1"></i> {t('common.delete')}
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Add Plan Modal */}
      <Dialog open={isAddPlanModalOpen} onOpenChange={setIsAddPlanModalOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{t('plan.addPlan')}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('plan.planInfo')}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddPlan)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('plan.name')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Premium Plan" 
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('plan.price')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        placeholder="199.99" 
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
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('plan.expirationDate')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value || ''}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddPlanModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit">
                  {createPlanMutation.isPending ? t('common.loading') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={planToDelete !== null} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete the plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => planToDelete && deletePlanMutation.mutate(planToDelete)}
            >
              {deletePlanMutation.isPending ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
