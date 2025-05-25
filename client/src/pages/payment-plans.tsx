import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PaymentPlanForm from "@/components/payments/PaymentPlanForm";
import { useTranslation } from "react-i18next";

const PaymentPlans: React.FC = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch payment plans
  const { data, isLoading } = useQuery({
    queryKey: ['/api/payment-plans'],
    refetchInterval: false,
  });

  // Add payment plan mutation
  const { mutate: addPlan, isPending: isAddingPlan } = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/payment-plans', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('plan_added_successfully'),
      });
      setIsAddPlanOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/payment-plans'] });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: `${t('failed_to_add_plan')}: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update payment plan mutation
  const { mutate: updatePlan, isPending: isUpdatingPlan } = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PUT', `/api/payment-plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('plan_updated_successfully'),
      });
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ['/api/payment-plans'] });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: `${t('failed_to_update_plan')}: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete payment plan mutation
  const { mutate: deletePlan, isPending: isDeletingPlan } = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/payment-plans/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('plan_deleted_successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-plans'] });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: `${t('failed_to_delete_plan')}: ${error}`,
        variant: "destructive",
      });
    },
  });

  const plans = data?.plans || [];

  // Filter plans by search query
  const filteredPlans = plans.filter((plan: any) => {
    const planName = plan.name.toLowerCase();
    const planDescription = (plan.description || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return planName.includes(query) || planDescription.includes(query);
  });

  const handleAddPlan = (data: any) => {
    addPlan(data);
  };

  const handleUpdatePlan = (data: any) => {
    if (selectedPlan) {
      updatePlan({ id: selectedPlan.id, data });
    }
  };

  const handleDeletePlan = (id: number) => {
    if (confirm(t('confirm_delete_plan'))) {
      deletePlan(id);
    }
  };

  // Format amount to currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(amount);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">{t('payment_plans')}</h1>
          <p className="text-gray-600">{t('manage_payment_plans')}</p>
        </div>
        <div className="mt-4 md:mt-0 flex">
          <div className="relative mr-2">
            <input
              type="text"
              placeholder={t('search_plans')}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <span className="material-icons text-sm">search</span>
            </div>
          </div>
          <Dialog open={isAddPlanOpen} onOpenChange={setIsAddPlanOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary-dark text-white font-medium">
                <span className="material-icons mr-1 text-sm">add</span>
                {t('new_plan')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogTitle>{t('add_new_plan')}</DialogTitle>
              <PaymentPlanForm 
                onSubmit={handleAddPlan}
                isLoading={isAddingPlan}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('payment_plans')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('loading_plans')}</div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? t('no_plans_matching_search') : t('no_plans_found')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('name')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('amount')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('frequency')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('description')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPlans.map((plan: any) => (
                    <tr key={plan.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(plan.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{t(plan.frequency)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{plan.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedPlan(plan)}
                          className="text-primary hover:text-primary-dark mr-3"
                        >
                          <span className="material-icons text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isDeletingPlan}
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Plan Dialog */}
      {selectedPlan && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedPlan(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogTitle>{t('edit_plan')}</DialogTitle>
            <PaymentPlanForm 
              defaultValues={{
                name: selectedPlan.name,
                amount: selectedPlan.amount,
                frequency: selectedPlan.frequency,
                description: selectedPlan.description || '',
              }}
              onSubmit={handleUpdatePlan}
              isLoading={isUpdatingPlan}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PaymentPlans;