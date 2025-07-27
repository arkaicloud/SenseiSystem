import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeltWithLabel } from "@/components/ui/belt";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

const PendingUsers: React.FC = () => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);

  // Fetch pending users
  const { data: pendingUsersData, isLoading: pendingLoading } = useQuery({
    queryKey: ['/api/users/pending'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch payment plans for student approval
  const { data: plansData } = useQuery({
    queryKey: ['/api/payment-plans'],
  });

  // Approve user mutation
  const { mutate: approveUser, isPending: isApproving } = useMutation({
    mutationFn: async (data: { userId: number; planId?: number }) => {
      const res = await apiRequest('POST', `/api/users/${data.userId}/approve`, {
        planId: data.planId
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário aprovado com sucesso",
      });
      setIsApprovalDialogOpen(false);
      setSelectedUser(null);
      setSelectedPlan("");
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao aprovar usuário: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Reject user mutation
  const { mutate: rejectUser, isPending: isRejecting } = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('DELETE', `/api/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Registro de usuário rejeitado",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao rejeitar usuário: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (user: User) => {
    setSelectedUser(user);
    setIsApprovalDialogOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedUser) return;

    const approvalData: { userId: number; planId?: number } = {
      userId: selectedUser.id
    };

    // If student, require payment plan
    if (selectedUser.role === 'student' && selectedPlan) {
      approvalData.planId = parseInt(selectedPlan);
    }

    approveUser(approvalData);
  };

  const handleReject = (userId: number) => {
    if (confirm("Are you sure you want to reject this registration? This action cannot be undone.")) {
      rejectUser(userId);
    }
  };

  const pendingUsers = pendingUsersData?.users || [];
  const plans = plansData?.plans || [];

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-primary">Aprovações Pendentes</h1>
          <p className="text-gray-600 dark:text-gray-300">Revise e aprove novos registros de usuários</p>
        </div>
        <Badge variant="secondary" className="mt-2 md:mt-0">
          {pendingUsers.length} pendentes
        </Badge>
      </div>

      {pendingLoading ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-300">Carregando usuários pendentes...</div>
      ) : pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Nenhum registro pendente no momento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingUsers.map((user: User) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <Badge 
                    variant={user.role === 'student' ? 'default' : 'secondary'}
                  >
                    {user.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Email:</span> {user.email}
                  </div>
                  <div>
                    <span className="font-medium">Usuário:</span> {user.username}
                  </div>
                  {user.phone && (
                    <div>
                      <span className="font-medium">Telefone:</span> {user.phone}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Data de Registro:</span>{" "}
                    {new Date(user.joinDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* Show belt level for students */}
                {user.role === 'student' && (
                  <div className="pt-2">
                    <Label className="text-sm font-medium">Graduação Solicitada:</Label>
                    <div className="mt-1">
                      <BeltWithLabel level="white" />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => handleApprove(user)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => handleReject(user.id)}
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                    disabled={isRejecting}
                  >
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Registro de Usuário</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Aprovar registro para <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
                  {selectedUser.role === 'student' && (
                    <>
                      <br />
                      <strong className="text-red-600">A atribuição de plano de pagamento é obrigatória para aprovação de aluno.</strong>
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedUser?.role === 'student' && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="payment-plan">Plano de Pagamento *</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} - R$ {(plan.price / 100).toFixed(2)}/{plan.billingCycle === 'monthly' ? 'mês' : plan.billingCycle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmApproval}
              disabled={
                isApproving || 
                (selectedUser?.role === 'student' && !selectedPlan)
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? "Aprovando..." : "Confirmar Aprovação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingUsers;