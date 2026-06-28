import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2, ReceiptText, Search } from "lucide-react";
import { format } from "date-fns";

interface StudentWithUser {
  id: number;
  userId: number;
  user: { firstName: string; lastName: string; email: string };
}

interface ManualReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "cash", label: "Dinheiro" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "bank_transfer", label: "Transferência Bancária" },
  { value: "boleto", label: "Boleto" },
];

export default function ManualReceiptDialog({ open, onOpenChange }: ManualReceiptDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [description, setDescription] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: studentsData, isLoading: loadingStudents } = useQuery<StudentWithUser[]>({
    queryKey: ["/api/students"],
    enabled: open,
    select: (data: any) => {
      const raw = Array.isArray(data) ? data : data?.students || [];
      return raw as StudentWithUser[];
    },
  });

  const students = studentsData || [];

  const filteredStudents = studentSearch
    ? students.filter((s) => {
        const name = `${s.user?.firstName ?? ""} ${s.user?.lastName ?? ""}`.toLowerCase();
        return name.includes(studentSearch.toLowerCase()) || s.user?.email?.toLowerCase().includes(studentSearch.toLowerCase());
      })
    : students;

  const selectedStudent = students.find((s) => String(s.id) === studentId);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/financial/manual-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId: Number(studentId),
          amount: parseFloat(amount.replace(",", ".")),
          paymentDate,
          paymentMethod,
          description: description || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao registrar recebimento");
      }
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/student-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/payments"] });
      toast({ title: "Recebimento registrado!", description: "Lançamento manual salvo com sucesso." });
      setTimeout(() => {
        handleClose();
      }, 1800);
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setStudentId("");
    setAmount("");
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMethod("");
    setDescription("");
    setStudentSearch("");
    setSuccess(false);
    onOpenChange(false);
  };

  const isValid = studentId && amount && parseFloat(amount.replace(",", ".")) > 0 && paymentDate && paymentMethod;

  const formatAmountDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    const num = parseInt(digits, 10) / 100;
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) { setAmount(""); return; }
    const num = (parseInt(raw, 10) / 100).toFixed(2);
    setAmount(num);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-green-600" />
            Lançamento Manual de Recebimento
          </DialogTitle>
          <DialogDescription>
            Registre um pagamento recebido manualmente fora do sistema ASAAS.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-base font-semibold text-green-700">Recebimento registrado!</p>
            <p className="text-sm text-muted-foreground text-center">
              O lançamento foi salvo com sucesso.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Student selector */}
            <div className="space-y-2">
              <Label htmlFor="student-search">Aluno <span className="text-red-500">*</span></Label>
              {selectedStudent ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-md border bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">
                      {selectedStudent.user?.firstName} {selectedStudent.user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedStudent.user?.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setStudentId(""); setStudentSearch(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Trocar
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="student-search"
                      placeholder="Buscar aluno por nome ou e-mail..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {studentSearch && (
                    <div className="border rounded-md shadow-sm max-h-44 overflow-y-auto bg-background">
                      {loadingStudents ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : filteredStudents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-3">Nenhum aluno encontrado</p>
                      ) : (
                        filteredStudents.slice(0, 8).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors"
                            onClick={() => { setStudentId(String(s.id)); setStudentSearch(""); }}
                          >
                            <p className="text-sm font-medium">{s.user?.firstName} {s.user?.lastName}</p>
                            <p className="text-xs text-muted-foreground">{s.user?.email}</p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Recebido <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  R$
                </span>
                <Input
                  id="amount"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={amount ? formatAmountDisplay(amount.replace(".", "").replace(",", "")) : ""}
                  onChange={handleAmountChange}
                  className="pl-9 text-base font-semibold"
                />
              </div>
            </div>

            {/* Date + Payment method side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Data do Recebimento <span className="text-red-500">*</span></Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento <span className="text-red-500">*</span></Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição / Observação <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                id="description"
                placeholder="Ex: Mensalidade de Junho, taxa de matrícula..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Summary */}
            {isValid && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Resumo do lançamento</p>
                <p className="text-sm text-green-800">
                  <strong>{selectedStudent?.user?.firstName} {selectedStudent?.user?.lastName}</strong>{" "}
                  pagou{" "}
                  <strong>
                    R${" "}
                    {parseFloat(amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </strong>{" "}
                  via <strong>{PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}</strong>{" "}
                  em <strong>{new Date(paymentDate + "T12:00:00").toLocaleDateString("pt-BR")}</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!isValid || mutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Registrar Recebimento
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
