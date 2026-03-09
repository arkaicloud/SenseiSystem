import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PaymentPlanForm from "@/components/payments/PaymentPlanForm";
import { centsToBRL } from "@shared/money";
import { Plus, Search, Pencil, Trash2, CreditCard } from "lucide-react";

const FREQUENCY_LABELS: Record<string, string> = {
  weekly:     "Semanal",
  biweekly:   "Quinzenal",
  monthly:    "Mensal",
  quarterly:  "Trimestral",
  semiannual: "Semestral",
  annual:     "Anual",
};

const PaymentPlans: React.FC = () => {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/payment-plans"],
    refetchInterval: false,
  });

  const { mutate: addPlan, isPending: isAdding } = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/payment-plans", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plano criado com sucesso!" });
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/payment-plans"] });
    },
    onError: () => {
      toast({ title: "Erro ao criar plano", variant: "destructive" });
    },
  });

  const { mutate: updatePlan, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/payment-plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plano atualizado com sucesso!" });
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ["/api/payment-plans"] });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar plano", variant: "destructive" });
    },
  });

  const { mutate: deletePlan, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/payment-plans/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plano excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-plans"] });
    },
    onError: () => {
      toast({ title: "Erro ao excluir plano", variant: "destructive" });
    },
  });

  const plans = (data as any)?.plans || [];
  const filteredPlans = plans.filter((plan: any) => {
    const q = searchQuery.toLowerCase();
    return plan.name.toLowerCase().includes(q) || (plan.description || "").toLowerCase().includes(q);
  });

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.")) {
      deletePlan(id);
    }
  };

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos de Pagamento</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie os planos disponíveis para os alunos</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar plano..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-48"
            />
          </div>

          {/* Novo plano */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Novo plano
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Criar novo plano</DialogTitle>
              </DialogHeader>
              <PaymentPlanForm
                onSubmit={addPlan}
                onCancel={() => setIsAddOpen(false)}
                isLoading={isAdding}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Content ── */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              Carregando planos...
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? `Nenhum plano encontrado para "${searchQuery}"` : "Nenhum plano cadastrado ainda."}
              </p>
              {!searchQuery && (
                <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)} className="gap-2 mt-1">
                  <Plus className="w-4 h-4" />
                  Criar primeiro plano
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frequência</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Descrição</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPlans.map((plan: any) => (
                    <tr key={plan.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-foreground">{plan.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-foreground">{centsToBRL(plan.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="text-xs">
                          {FREQUENCY_LABELS[plan.frequency] || plan.frequency}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground max-w-xs truncate block">
                          {plan.description || <span className="text-muted-foreground/40 italic">—</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-8 text-xs"
                            onClick={() => setSelectedPlan(plan)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive hover:border-destructive/50"
                            onClick={() => handleDelete(plan.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Dialog ── */}
      {selectedPlan && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedPlan(null)}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Editar plano</DialogTitle>
            </DialogHeader>
            <PaymentPlanForm
              defaultValues={{
                name: selectedPlan.name,
                amount: selectedPlan.amount,
                frequency: selectedPlan.frequency,
                description: selectedPlan.description || "",
              }}
              onSubmit={(data) => updatePlan({ id: selectedPlan.id, data })}
              onCancel={() => setSelectedPlan(null)}
              isLoading={isUpdating}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PaymentPlans;
