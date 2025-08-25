import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogIn } from "lucide-react";

interface CpfExistsDialogProps {
  open: boolean;
  onClose: () => void;
  onGoToLogin: () => void;
  studentName?: string;
  isActive?: boolean;
}

export function CpfExistsDialog({ 
  open, 
  onClose, 
  onGoToLogin, 
  studentName,
  isActive = true
}: CpfExistsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            CPF já cadastrado
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              {studentName 
                ? `O CPF informado já está cadastrado para o aluno: ${studentName}`
                : "O CPF informado já está cadastrado no sistema"
              }
            </p>
            {isActive ? (
              <p className="text-green-600 font-medium">
                ✓ Cadastro ativo - Você pode fazer login diretamente
              </p>
            ) : (
              <p className="text-orange-600 font-medium">
                ⚠️ Cadastro pendente de aprovação
              </p>
            )}
            <p>
              Se você já possui uma conta, clique em "Ir para Login". 
              Caso contrário, entre em contato conosco para esclarecimentos.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <AlertDialogAction asChild>
            <Button onClick={onGoToLogin} className="gap-2">
              <LogIn className="h-4 w-4" />
              Ir para Login
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}