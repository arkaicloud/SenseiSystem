import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeltWithLabel } from "@/components/ui/belt";
import PaymentForm from "@/components/payments/PaymentForm";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyBRL, formatDateShort } from "@/lib/utils";

const Payments: React.FC = () => {
  const { toast } = useToast();
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch payments data
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/student-payments'],
    refetchInterval: false,
  });

  // Fetch students for the form
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
    refetchInterval: false,
  });

  // Fetch payment plans for the form
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/payment-plans'],
    refetchInterval: false,
  });

  // Add payment mutation
  const { mutate: addPayment, isPending: isAddingPayment } = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/student-payments', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Pagamento cadastrado com sucesso",
      });
      setIsAddPaymentOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/student-payments'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao cadastrar pagamento: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update payment mutation
  const { mutate: updatePayment, isPending: isUpdatingPayment } = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PUT', `/api/student-payments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso",
      });
      setSelectedPayment(null);
      queryClient.invalidateQueries({ queryKey: ['/api/student-payments'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar pagamento: ${error}`,
        variant: "destructive",
      });
    },
  });

  const payments = paymentsData?.payments || [];
  const students = studentsData?.students || [];
  const plans = plansData?.plans || [];

  // Filter payments by search query
  const filteredPayments = payments.filter((payment: any) => {
    const studentName = `${payment.student.user.firstName} ${payment.student.user.lastName}`.toLowerCase();
    const planName = payment.plan.name.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return studentName.includes(query) || planName.includes(query);
  });

  const handleAddPayment = (data: any) => {
    // Certifique-se de que os valores estão nos formatos corretos antes de enviar
    const formattedData = {
      ...data,
      // Garante que studentId e planId são números
      studentId: Number(data.studentId),
      planId: Number(data.planId),
      // Garante que amount é um número (inteiro)
      amount: Math.round(data.amount), 
      // Garante que as datas são objetos Date
      dueDate: new Date(data.dueDate),
      paidDate: data.paidDate ? new Date(data.paidDate) : null
    };
    
    addPayment(formattedData);
  };

  const handleUpdatePayment = (data: any) => {
    if (selectedPayment) {
      // Formata os dados da mesma forma que no método de adição
      const formattedData = {
        ...data,
        studentId: Number(data.studentId),
        planId: Number(data.planId),
        amount: Math.round(data.amount),
        dueDate: new Date(data.dueDate),
        paidDate: data.paidDate ? new Date(data.paidDate) : null
      };
      
      updatePayment({ id: selectedPayment.id, data: formattedData });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-status-success';
      case 'pending': return 'bg-yellow-100 text-status-warning';
      case 'overdue': return 'bg-red-100 text-status-danger';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">Payments</h1>
          <p className="text-gray-600">Manage student payments and plans</p>
        </div>
        <div className="mt-4 md:mt-0 flex">
          <div className="relative mr-2">
            <input
              type="text"
              placeholder="Search payments..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <span className="material-icons text-sm">search</span>
            </div>
          </div>
          <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary-dark text-white font-medium">
                <span className="material-icons mr-1 text-sm">add</span>
                New Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogTitle>Add New Payment</DialogTitle>
              <PaymentForm 
                students={students.map((student: any) => ({
                  id: student.id,
                  name: `${student.user.firstName} ${student.user.lastName}`
                }))}
                plans={plans}
                onSubmit={handleAddPayment}
                isLoading={isAddingPayment}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Payments</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {paymentsLoading ? (
                <div className="text-center py-8">Loading payments...</div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? "No payments found matching your search" : "No payments found"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.map((payment: any) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="font-medium text-sm">
                                  {payment.student.user.firstName.charAt(0)}
                                  {payment.student.user.lastName.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {payment.student.user.firstName} {payment.student.user.lastName}
                                </div>
                                <BeltWithLabel level={payment.student.beltLevel} size="sm" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{payment.plan.name}</div>
                            <div className="text-xs text-gray-500">{payment.plan.frequency}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrencyBRL(payment.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateShort(new Date(payment.dueDate))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.paidDate ? formatDateShort(new Date(payment.paidDate)) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-secondary hover:text-secondary-dark"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="paid">
              <div className="text-center py-8 text-gray-500">
                Filter feature coming soon
              </div>
            </TabsContent>
            
            <TabsContent value="pending">
              <div className="text-center py-8 text-gray-500">
                Filter feature coming soon
              </div>
            </TabsContent>
            
            <TabsContent value="overdue">
              <div className="text-center py-8 text-gray-500">
                Filter feature coming soon
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Payment Dialog */}
      {selectedPayment && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedPayment(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogTitle>Edit Payment</DialogTitle>
            <PaymentForm 
              students={students.map((student: any) => ({
                id: student.id,
                name: `${student.user.firstName} ${student.user.lastName}`
              }))}
              plans={plans}
              defaultValues={{
                studentId: selectedPayment.studentId,
                planId: selectedPayment.planId,
                status: selectedPayment.status,
                dueDate: new Date(selectedPayment.dueDate),
                paidDate: selectedPayment.paidDate ? new Date(selectedPayment.paidDate) : null,
                amount: selectedPayment.amount,
                notes: selectedPayment.notes || '',
              }}
              onSubmit={handleUpdatePayment}
              isLoading={isUpdatingPayment}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Payments;
