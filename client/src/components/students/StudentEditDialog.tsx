
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Schema de validação
const studentEditSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  birthDate: z.string().nullable(),
  cpf: z.string().nullable(),
  rg: z.string().nullable(),
  email: z.string().email("E-mail inválido").nullable(),
  phone: z.string().nullable(),
  emergencyContactName: z.string().nullable(),
  emergencyContactPhone: z.string().nullable(),
  street: z.string().nullable(),
  number: z.string().nullable(),
  complement: z.string().nullable(),
  neighborhood: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zipCode: z.string().nullable(),
  beltLevel: z.string(),
  lastPromotionDate: z.string().nullable(),
  financialResponsibleName: z.string().nullable(),
  financialResponsibleCpf: z.string().nullable(),
  financialResponsibleEmail: z.string().nullable(),
  financialResponsiblePhone: z.string().nullable(),
  financialResponsibleRelation: z.string().nullable(),
  paymentPlanId: z.number().nullable(),
  preferredDueDate: z.number().nullable(),
  medicalObservations: z.string().nullable(),
  planObservations: z.string().nullable(),
});

type StudentEditFormData = z.infer<typeof studentEditSchema>;

interface StudentEditDialogProps {
  studentId: number;
  studentName?: string;
  open: boolean;
  readOnly?: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentEditDialog({
  studentId,
  studentName = "",
  open,
  readOnly = false,
  onOpenChange,
}: StudentEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar dados do aluno
  const { data: studentData, isLoading: isLoadingStudent } = useQuery({
    queryKey: [`/api/students/${studentId}`],
    queryFn: () => fetch(`/api/students/${studentId}?include=all`).then(res => res.json()),
    enabled: open && !!studentId,
    staleTime: 0,
    cacheTime: 0,
  });

  // Buscar planos de pagamento
  const { data: paymentPlansData } = useQuery({
    queryKey: ["/api/billing/plans"],
    queryFn: () => fetch('/api/billing/plans').then(res => res.json()),
    enabled: open,
  });

  const paymentPlans = paymentPlansData || [];

  // Form setup
  const form = useForm<StudentEditFormData>({
    resolver: zodResolver(studentEditSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: null,
      cpf: null,
      rg: null,
      email: null,
      phone: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      street: null,
      number: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
      zipCode: null,
      beltLevel: "white",
      lastPromotionDate: null,
      financialResponsibleName: null,
      financialResponsibleCpf: null,
      financialResponsibleEmail: null,
      financialResponsiblePhone: null,
      financialResponsibleRelation: null,
      paymentPlanId: null,
      preferredDueDate: 5,
      medicalObservations: null,
      planObservations: null,
    },
  });

  // Mutation para atualizar aluno
  const updateStudentMutation = useMutation({
    mutationFn: async (data: StudentEditFormData) => {
      // Converter para formato DTO esperado pelo backend
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        cpf: data.cpf,
        rg: data.rg,
        sex: null, // Mapeado do gender se necessário
        contact: {
          email: data.email,
          phone: data.phone
        },
        emergency: {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone
        },
        financialResponsible: {
          relation: data.financialResponsibleRelation
        },
        billing: {
          planId: data.paymentPlanId,
          preferredDueDay: data.preferredDueDate
        },
        address: {
          zip: data.zipCode,
          street: data.street,
          number: data.number,
          complement: data.complement,
          district: data.neighborhood,
          city: data.city,
          state: data.state
        },
        health: {
          notes: data.medicalObservations
        },
        graduation: {
          beltLevel: data.beltLevel,
          graduationDate: data.lastPromotionDate
        }
      };

      const response = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar aluno");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Dados do aluno atualizados com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar aluno",
        variant: "destructive",
      });
    },
  });

  // Preencher form quando dados carregarem
  useEffect(() => {
    if (studentData && open) {
      form.reset({
        firstName: studentData.firstName || "",
        lastName: studentData.lastName || "",
        birthDate: studentData.birthDate ? new Date(studentData.birthDate).toISOString().split('T')[0] : null,
        cpf: studentData.cpf || null,
        rg: studentData.rg || null,
        email: studentData.contact?.email || "",
        phone: studentData.contact?.phone || null,
        emergencyContactName: studentData.emergency?.name || null,
        emergencyContactPhone: studentData.emergency?.phone || null,
        street: studentData.address?.street || null,
        number: studentData.address?.number || null,
        complement: studentData.address?.complement || null,
        neighborhood: studentData.address?.district || null,
        city: studentData.address?.city || null,
        state: studentData.address?.state || null,
        zipCode: studentData.address?.zip || null,
        beltLevel: studentData.graduation?.beltLevel || "white",
        lastPromotionDate: studentData.graduation?.graduationDate ? new Date(studentData.graduation.graduationDate).toISOString().split('T')[0] : null,
        financialResponsibleName: null, // Será adicionado no futuro se necessário
        financialResponsibleCpf: null, // Será adicionado no futuro se necessário
        financialResponsibleEmail: null, // Será adicionado no futuro se necessário
        financialResponsiblePhone: null, // Será adicionado no futuro se necessário
        financialResponsibleRelation: studentData.financialResponsible?.relation || null,
        paymentPlanId: studentData.billing?.planId || null,
        preferredDueDate: studentData.billing?.preferredDueDay || 5,
        medicalObservations: studentData.health?.notes || null,
        planObservations: null,
      });
    }
  }, [studentData, open, form]);

  const onSubmit = (data: StudentEditFormData) => {
    if (readOnly) return;
    updateStudentMutation.mutate(data);
  };

  const displayName = studentData ? 
    `${studentData.firstName} ${studentData.lastName}` : 
    studentName || "Aluno";

  // Detectar se é mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${
        isMobile 
          ? 'max-w-[95vw] max-h-[95vh] p-4' 
          : 'max-w-4xl max-h-[90vh]'
      } overflow-y-auto`}>
        <DialogHeader className={isMobile ? 'pb-2' : ''}>
          <DialogTitle className={isMobile ? 'text-lg' : ''}>
            {readOnly ? `Visualizando ${displayName}` : `Editando ${displayName}`}
          </DialogTitle>
          <p className={`text-sm text-muted-foreground ${isMobile ? 'hidden' : ''}`}>
            Gerencie informações completas do aluno incluindo dados pessoais, contato, endereço, saúde, financeiro e documentos.
          </p>
        </DialogHeader>

        {isLoadingStudent ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando dados do aluno...</p>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className={`grid w-full ${
                  isMobile 
                    ? 'grid-cols-3 h-auto p-1 gap-1' 
                    : 'grid-cols-5'
                }`}>
                  <TabsTrigger value="personal" className={isMobile ? 'text-xs px-2 py-2 h-auto' : ''}>
                    {isMobile ? 'Pessoal' : 'Dados Pessoais'}
                  </TabsTrigger>
                  <TabsTrigger value="contact" className={isMobile ? 'text-xs px-2 py-2 h-auto' : ''}>
                    Contato
                  </TabsTrigger>
                  <TabsTrigger value="address" className={isMobile ? 'text-xs px-2 py-2 h-auto' : ''}>
                    {isMobile ? 'End.' : 'Endereço'}
                  </TabsTrigger>
                  {!isMobile && (
                    <>
                      <TabsTrigger value="health">Saúde & Graduação</TabsTrigger>
                      <TabsTrigger value="financial">Financeiro</TabsTrigger>
                    </>
                  )}
                </TabsList>
                
                {/* Segunda linha de tabs para mobile */}
                {isMobile && (
                  <TabsList className="grid w-full grid-cols-2 h-auto p-1 gap-1 mt-1">
                    <TabsTrigger value="health" className="text-xs px-2 py-2 h-auto">
                      Saúde & Faixa
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="text-xs px-2 py-2 h-auto">
                      Financeiro
                    </TabsTrigger>
                  </TabsList>
                )}

              {/* Dados Pessoais */}
                <TabsContent value="personal" className="space-y-4">
                  <div className={`grid gap-4 ${
                    isMobile ? 'grid-cols-1' : 'grid-cols-2'
                  }`}>
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                              placeholder="dd/mm/aaaa"
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
                          <FormLabel>CPF *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                              placeholder="000.000.000-00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Contato */}
                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                              placeholder="(00) 00000-0000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contato de Emergência</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone de Emergência</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                              placeholder="(00) 00000-0000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Endereço */}
                <TabsContent value="address" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                              placeholder="00000-000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
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
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
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
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                              maxLength={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Saúde & Graduação */}
                <TabsContent value="health" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="beltLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Graduação</FormLabel>
                          <Select
                            disabled={readOnly}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a faixa" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="white">Faixa Branca</SelectItem>
                              <SelectItem value="blue">Faixa Azul</SelectItem>
                              <SelectItem value="purple">Faixa Roxa</SelectItem>
                              <SelectItem value="brown">Faixa Marrom</SelectItem>
                              <SelectItem value="black">Faixa Preta</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastPromotionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Última Graduação</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="medicalObservations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Médicas</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={readOnly}
                            value={field.value || ""}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Financeiro */}
                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="financialResponsibleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Responsável Financeiro</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="financialResponsibleCpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF do Responsável</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                              placeholder="000.000.000-00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="financialResponsibleEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail do Responsável</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="financialResponsiblePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone do Responsável</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={readOnly}
                              value={field.value || ""}
                              placeholder="(00) 00000-0000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentPlanId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plano de Pagamento</FormLabel>
                          <Select
                            disabled={readOnly}
                            value={field.value?.toString() || ""}
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um plano" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentPlans.map((plan: any) => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  {plan.name} - R$ {(plan.amount / 100).toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredDueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia de Vencimento Preferido</FormLabel>
                          <Select
                            disabled={readOnly}
                            value={field.value?.toString() || "5"}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o dia" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[5, 10, 15, 20, 25, 30].map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  Dia {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="planObservations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações do Plano</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={readOnly}
                            value={field.value || ""}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
                {!readOnly && (
                  <Button
                    type="submit"
                    disabled={updateStudentMutation.isPending}
                  >
                    {updateStudentMutation.isPending ? "Salvando..." : "Salvar alterações"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
