import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCPF, unformatCPF, formatRG, unformatRG, formatPhone, unformatPhone, formatCEP, unformatCEP, toDisplayDate, toISODate } from "@/lib/formatters";

// shadcn/ui imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const StudentSchema = z.object({
  id: z.number(),
  firstName: z.string().min(1, "Nome obrigatório"),
  lastName: z.string().min(1, "Sobrenome obrigatório"),
  birthDate: z.string().nullable().optional(),
  cpf: z.string().nullable().optional(),
  rg: z.string().nullable().optional(),
  gender: z.enum(["M", "F", "O"]).optional(),
  email: z.string().email().nullable(),
  phone: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  medicalObservations: z.string().nullable().optional(),
  beltLevel: z.string().nullable().optional(),
  paymentPlanId: z.number().nullable().optional(),
  financialResponsibleName: z.string().nullable().optional(),
  financialResponsibleCpf: z.string().nullable().optional(),
  financialResponsibleEmail: z.string().nullable().optional(),
  financialResponsiblePhone: z.string().nullable().optional(),
  financialResponsibleRelation: z.enum(["self", "parent", "spouse", "other"]).nullable().optional(),
});

type FormValues = z.infer<typeof StudentSchema>;

type Props = {
  studentId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function StudentEditDialog({ studentId, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("dados");
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: [`/api/users/${studentId}`],
    enabled: open && !!studentId,
  });

  // Fetch payment plans
  const { data: paymentPlansData } = useQuery({
    queryKey: ["/api/payment-plans"],
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(StudentSchema),
    defaultValues: {
      id: studentId,
      firstName: "",
      lastName: "",
      birthDate: "",
      cpf: "",
      rg: "",
      gender: undefined,
      email: "",
      phone: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      medicalObservations: "",
      beltLevel: "",
      paymentPlanId: null,
      financialResponsibleName: "",
      financialResponsibleCpf: "",
      financialResponsibleEmail: "",
      financialResponsiblePhone: "",
      financialResponsibleRelation: null,
    },
    mode: "onChange",
  });

  // Load user data when dialog opens
  useEffect(() => {
    if (!open || !userData) return;
    
    const user = userData as any;
    form.reset({
      id: user?.id || studentId,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      birthDate: user?.student?.birthDate ? toDisplayDate(user.student.birthDate) : "",
      cpf: formatCPF(user?.student?.cpf || ""),
      rg: formatRG(user?.student?.rg || ""),
      gender: user?.student?.gender || undefined,
      email: user?.email || "",
      phone: formatPhone(user?.student?.phone || ""),
      emergencyContactName: user?.student?.emergencyContactName || "",
      emergencyContactPhone: formatPhone(user?.student?.emergencyContactPhone || ""),
      zipCode: formatCEP(user?.student?.zipCode || ""),
      street: user?.student?.street || "",
      number: user?.student?.number || "",
      complement: user?.student?.complement || "",
      neighborhood: user?.student?.neighborhood || "",
      city: user?.student?.city || "",
      state: user?.student?.state || "",
      medicalObservations: user?.student?.medicalObservations || "",
      beltLevel: user?.student?.beltLevel || "",
      paymentPlanId: user?.student?.paymentPlanId || null,
      financialResponsibleName: user?.student?.financialResponsibleName || "",
      financialResponsibleCpf: formatCPF(user?.student?.financialResponsibleCpf || ""),
      financialResponsibleEmail: user?.student?.financialResponsibleEmail || "",
      financialResponsiblePhone: formatPhone(user?.student?.financialResponsiblePhone || ""),
      financialResponsibleRelation: user?.student?.financialResponsibleRelation || null,
    });
  }, [open, userData, form, studentId]);

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email?.trim(),
        student: {
          birthDate: toISODate(values.birthDate),
          cpf: unformatCPF(values.cpf),
          rg: unformatRG(values.rg),
          gender: values.gender,
          phone: unformatPhone(values.phone),
          emergencyContactName: values.emergencyContactName?.trim() || null,
          emergencyContactPhone: unformatPhone(values.emergencyContactPhone),
          zipCode: unformatCEP(values.zipCode),
          street: values.street?.trim() || null,
          number: values.number?.trim() || null,
          complement: values.complement?.trim() || null,
          neighborhood: values.neighborhood?.trim() || null,
          city: values.city?.trim() || null,
          state: values.state?.trim() || null,
          medicalObservations: values.medicalObservations?.trim() || null,
          beltLevel: values.beltLevel?.trim() || null,
          paymentPlanId: values.paymentPlanId,
          financialResponsibleName: values.financialResponsibleName?.trim() || null,
          financialResponsibleCpf: unformatCPF(values.financialResponsibleCpf),
          financialResponsibleEmail: values.financialResponsibleEmail?.trim() || null,
          financialResponsiblePhone: unformatPhone(values.financialResponsiblePhone),
          financialResponsibleRelation: values.financialResponsibleRelation,
        }
      };
      
      const response = await fetch(`/api/users/${studentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao salvar");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Salvo!", 
        description: "Dados do aluno atualizados com sucesso." 
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao salvar", 
        description: error?.message || "Tente novamente.", 
        variant: "destructive" 
      });
    }
  });

  async function onSubmit(values: FormValues) {
    updateMutation.mutate(values);
  }

  const headerTitle = useMemo(() => {
    if (!userData) return "Editando Aluno";
    const user = userData as any;
    return `Editando ${user?.firstName || ""} ${user?.lastName || ""}`;
  }, [userData]);

  if (userLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-screen h-screen md:h-[85vh] md:max-w-5xl lg:max-w-7xl p-0 overflow-hidden md:rounded-2xl">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && form.formState.isDirty && !window.confirm("Descartar alterações não salvas?")) return;
      onOpenChange(v);
    }}>
      <DialogContent className="w-screen h-screen md:h-[85vh] md:max-w-5xl lg:max-w-7xl p-0 overflow-hidden md:rounded-2xl">
        {/* HEADER */}
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b">
          <DialogHeader className="px-4 py-3 md:px-6">
            <DialogTitle className="text-lg md:text-xl">{headerTitle}</DialogTitle>
            <DialogDescription className="hidden md:block">
              Gerenciar informações completas do aluno incluindo dados pessoais, contato, endereço, saúde e documentos.
            </DialogDescription>
          </DialogHeader>

          {/* TABS BAR */}
          <div className="border-t">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap gap-1 px-2 md:px-4 py-2">
                <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="contato">Contato</TabsTrigger>
                <TabsTrigger value="endereco">Endereço</TabsTrigger>
                <TabsTrigger value="saude">Saúde & Graduação</TabsTrigger>
                <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* BODY */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="relative h-[calc(100%-140px)] md:h-[calc(100%-120px)]">
          <div className="h-full overflow-y-auto px-4 md:px-6 py-4 space-y-6">
            {/* DADOS PESSOAIS */}
            {tab === "dados" && (
              <section className="space-y-4">
                <h3 className="text-base font-semibold">Dados Pessoais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <Label>Nome *</Label>
                    <Input {...form.register("firstName")} placeholder="Ex.: Gabriela" />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Sobrenome *</Label>
                    <Input {...form.register("lastName")} placeholder="Ex.: Santos" />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Data de Nascimento</Label>
                    <Input
                      value={form.watch("birthDate") || ""}
                      onChange={(e) => form.setValue("birthDate", e.target.value)}
                      placeholder="dd/mm/aaaa"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <Input
                      value={form.watch("cpf") || ""}
                      onChange={(e) => form.setValue("cpf", formatCPF(e.target.value))}
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>RG</Label>
                    <Input
                      value={form.watch("rg") || ""}
                      onChange={(e) => form.setValue("rg", formatRG(e.target.value))}
                      inputMode="numeric"
                      placeholder="00.000.000-0"
                    />
                  </div>
                  <div>
                    <Label>Sexo</Label>
                    <Controller
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                            <SelectItem value="O">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* CONTATO */}
            {tab === "contato" && (
              <section className="space-y-4">
                <h3 className="text-base font-semibold">Contato</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Label>E-mail *</Label>
                    <Input {...form.register("email")} type="email" placeholder="email@exemplo.com" />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={form.watch("phone") || ""}
                      onChange={(e) => form.setValue("phone", formatPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      inputMode="tel"
                    />
                  </div>
                  <div>
                    <Label>Contato de Emergência - Nome</Label>
                    <Input {...form.register("emergencyContactName")} placeholder="Nome completo" />
                  </div>
                  <div>
                    <Label>Contato de Emergência - Telefone</Label>
                    <Input
                      value={form.watch("emergencyContactPhone") || ""}
                      onChange={(e) => form.setValue("emergencyContactPhone", formatPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      inputMode="tel"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ENDEREÇO */}
            {tab === "endereco" && (
              <section className="space-y-4">
                <h3 className="text-base font-semibold">Endereço</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <Label>CEP</Label>
                    <Input
                      value={form.watch("zipCode") || ""}
                      onChange={(e) => form.setValue("zipCode", formatCEP(e.target.value))}
                      inputMode="numeric"
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <Label>Logradouro</Label>
                    <Input {...form.register("street")} placeholder="Rua, Avenida, etc." />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input {...form.register("number")} placeholder="123" />
                  </div>
                  <div>
                    <Label>Complemento</Label>
                    <Input {...form.register("complement")} placeholder="Apto, Casa, etc." />
                  </div>
                  <div>
                    <Label>Bairro</Label>
                    <Input {...form.register("neighborhood")} placeholder="Bairro" />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input {...form.register("city")} placeholder="Cidade" />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input {...form.register("state")} maxLength={2} placeholder="SP" />
                  </div>
                </div>
              </section>
            )}

            {/* SAÚDE & GRADUAÇÃO */}
            {tab === "saude" && (
              <section className="space-y-4">
                <h3 className="text-base font-semibold">Saúde & Graduação</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Observações de Saúde</Label>
                    <Textarea 
                      {...form.register("medicalObservations")} 
                      placeholder="Alergias, restrições médicas, etc."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label>Nível da Faixa</Label>
                    <Input {...form.register("beltLevel")} placeholder="Branca, Azul, Roxa, etc." />
                  </div>
                </div>
              </section>
            )}

            {/* FINANCEIRO */}
            {tab === "financeiro" && (
              <section className="space-y-4">
                <h3 className="text-base font-semibold">Responsável Financeiro</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2">
                    <Label>Nome do Responsável</Label>
                    <Input {...form.register("financialResponsibleName")} placeholder="Nome completo" />
                  </div>
                  <div>
                    <Label>Relação</Label>
                    <Controller
                      control={form.control}
                      name="financialResponsibleRelation"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="self">Próprio aluno</SelectItem>
                            <SelectItem value="parent">Pai/Mãe</SelectItem>
                            <SelectItem value="spouse">Cônjuge</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div>
                    <Label>CPF do Responsável</Label>
                    <Input
                      value={form.watch("financialResponsibleCpf") || ""}
                      onChange={(e) => form.setValue("financialResponsibleCpf", formatCPF(e.target.value))}
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>E-mail do Responsável</Label>
                    <Input {...form.register("financialResponsibleEmail")} type="email" placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <Label>Telefone do Responsável</Label>
                    <Input
                      value={form.watch("financialResponsiblePhone") || ""}
                      onChange={(e) => form.setValue("financialResponsiblePhone", formatPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      inputMode="tel"
                    />
                  </div>
                  <div>
                    <Label>Plano de Pagamento</Label>
                    <Controller
                      control={form.control}
                      name="paymentPlanId"
                      render={({ field }) => (
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar plano" />
                          </SelectTrigger>
                          <SelectContent>
                            {(paymentPlansData as any)?.paymentPlans?.map((plan: any) => (
                              <SelectItem key={plan.id} value={plan.id.toString()}>
                                {plan.name} - R$ {plan.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* FOOTER STICKY */}
          <div className="sticky bottom-0 z-20 bg-background/90 backdrop-blur border-t px-4 md:px-6 py-3 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <DialogClose asChild>
              <Button variant="ghost" type="button" disabled={updateMutation.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}