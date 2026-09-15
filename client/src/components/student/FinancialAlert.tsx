import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FinancialSummary {
  isFinancialResponsible: boolean;
  isFinanciallyBlocked: boolean;
  hasOverdue: boolean;
  overdueCount: number;
}

export function FinancialAlert() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const canCheckFinancials = !!user && ["student", "guardian"].includes(user.role);
  const { data } = useQuery<FinancialSummary>({
    queryKey: ["/api/student/financial"],
    enabled: canCheckFinancials,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!user || !data || (!data.hasOverdue && !data.isFinanciallyBlocked)) return;
    const key = `financial-alert-${user.id}-${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "shown");
    setOpen(true);
  }, [data, user]);

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center">
            {data.isFinanciallyBlocked ? "Regularização necessária" : "Existe uma parcela em atraso"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {data.isFinanciallyBlocked
              ? "O check-in nas aulas está temporariamente indisponível. Regularize as parcelas pendentes e fale com a academia para liberar o acesso."
              : `Encontramos ${data.overdueCount} ${data.overdueCount === 1 ? "parcela vencida" : "parcelas vencidas"} no plano familiar.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          {data.isFinancialResponsible && (
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/payments">
                <CreditCard className="mr-2 h-4 w-4" />
                Ver e pagar
              </Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}