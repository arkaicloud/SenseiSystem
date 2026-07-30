
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useBeltLevels } from "@/hooks/useBeltLevels";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// ── Schema ──────────────────────────────────────────────────────────────────
const studentEditSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  birthDate: z.string().nullable(),
  enrollmentDate: z.string().nullable(),
  sex: z.string().nullable(),
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
  stripes: z.number().nullable(),
  lastPromotionDate: z.string().nullable(),
  financialResponsibleName: z.string().nullable(),
  financialResponsibleCpf: z.string().nullable(),
  financialResponsibleEmail: z.string().nullable(),
  financialResponsiblePhone: z.string().nullable(),
  financialResponsibleRelation: z.string().nullable(),
  isStudentResponsible: z.boolean().default(true),
  paymentPlanId: z.number().nullable(),
  preferredDueDate: z.number().nullable(),
  medicalObservations: z.string().nullable(),
  planObservations: z.string().nullable(),
  healthQuestionnaireCompletedAt: z.string().nullable(),
  agreedToHealthTerms: z.boolean().nullable(),
  healthTermsAgreedAt: z.string().nullable(),
  requiresMedicalCertificate: z.boolean().nullable(),
});

type StudentEditFormData = z.infer<typeof studentEditSchema>;

interface StudentEditDialogProps {
  studentId: number;
  studentName?: string;
  open: boolean;
  readOnly?: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Tab types ────────────────────────────────────────────────────────────────
type TabKey = "personal" | "contact" | "address" | "health" | "financial";

const TABS: { key: TabKey; label: string }[] = [
  { key: "personal",  label: "Dados Pessoais" },
  { key: "contact",   label: "Contato" },
  { key: "address",   label: "Endereço" },
  { key: "health",    label: "Saúde & Graduação" },
  { key: "financial", label: "Financeiro" },
];

// ── Helper components ────────────────────────────────────────────────────────
function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-1">
      {children}
    </h3>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function StudentEditDialog({
  studentId,
  studentName = "",
  open,
  readOnly = false,
  onOpenChange,
}: StudentEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("personal");

  const { allBeltOptions, isLoading: isLoadingBelts } = useBeltLevels();

  const { data: studentData, isLoading: isLoadingStudent } = useQuery({
    queryKey: [`/api/students/${studentId}`],
    queryFn: () => fetch(`/api/students/${studentId}?include=all`).then((r) => r.json()),
    enabled: open && !!studentId,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: paymentPlansData } = useQuery({
    queryKey: ["/api/payment-plans"],
    queryFn: () => fetch("/api/payment-plans").then((r) => r.json()),
    enabled: open,
  });

  const paymentPlans = paymentPlansData?.plans || [];

  const form = useForm<StudentEditFormData>({
    resolver: zodResolver(studentEditSchema),
    defaultValues: {
      firstName: "", lastName: "", birthDate: null, enrollmentDate: null,
      sex: null, cpf: null, rg: null, email: null, phone: null,
      emergencyContactName: null, emergencyContactPhone: null,
      street: null, number: null, complement: null, neighborhood: null,
      city: null, state: null, zipCode: null,
      beltLevel: "white", stripes: 0, lastPromotionDate: null,
      financialResponsibleName: null, financialResponsibleCpf: null,
      financialResponsibleEmail: null, financialResponsiblePhone: null,
      financialResponsibleRelation: null, isStudentResponsible: true,
      paymentPlanId: null, preferredDueDate: 5,
      medicalObservations: null, planObservations: null,
      healthQuestionnaireCompletedAt: null, agreedToHealthTerms: null,
      healthTermsAgreedAt: null, requiresMedicalCertificate: null,
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (data: StudentEditFormData) => {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        enrollmentDate: data.enrollmentDate,
        cpf: data.cpf,
        rg: data.rg,
        sex: data.sex,
        contact: { email: data.email, phone: data.phone },
        emergency: { name: data.emergencyContactName, phone: data.emergencyContactPhone },
        financialResponsible: {
          relation: data.financialResponsibleRelation,
          name: data.isStudentResponsible ? `${data.firstName} ${data.lastName}` : data.financialResponsibleName,
          cpf: data.isStudentResponsible ? data.cpf : data.financialResponsibleCpf,
          email: data.isStudentResponsible ? data.email : data.financialResponsibleEmail,
          phone: data.isStudentResponsible ? data.phone : data.financialResponsiblePhone,
        },
        billing: { planId: data.paymentPlanId, preferredDueDay: data.preferredDueDate },
        address: {
          zip: data.zipCode, street: data.street, number: data.number,
          complement: data.complement, district: data.neighborhood,
          city: data.city, state: data.state,
        },
        health: { notes: data.medicalObservations },
        graduation: {
          beltLevel: data.beltLevel,
          stripes: data.stripes,
          graduationDate: data.lastPromotionDate,
        },
      };
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Erro ao atualizar aluno");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Dados atualizados com sucesso" });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Erro ao atualizar aluno", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (studentData && open) {
      form.reset({
        firstName: studentData.firstName || "",
        lastName: studentData.lastName || "",
        birthDate: studentData.birthDate ? new Date(studentData.birthDate).toISOString().split("T")[0] : null,
        enrollmentDate: studentData.enrollmentDate ? new Date(studentData.enrollmentDate).toISOString().split("T")[0] : null,
        sex: studentData.sex || null,
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
        stripes: studentData.graduation?.stripes || 0,
        lastPromotionDate: studentData.graduation?.graduationDate
          ? new Date(studentData.graduation.graduationDate).toISOString().split("T")[0]
          : null,
        financialResponsibleName: studentData.financialResponsibleName || null,
        financialResponsibleCpf: studentData.financialResponsibleCpf || null,
        financialResponsibleEmail: studentData.financialResponsibleEmail || null,
        financialResponsiblePhone: studentData.financialResponsiblePhone || null,
        isStudentResponsible:
          !studentData.financialResponsibleName ||
          studentData.financialResponsibleName === `${studentData.firstName} ${studentData.lastName}` ||
          (studentData.financialResponsibleCpf === studentData.cpf &&
            studentData.financialResponsibleEmail === studentData.contact?.email),
        financialResponsibleRelation: studentData.financialResponsible?.relation || null,
        paymentPlanId: studentData.billing?.planId || null,
        preferredDueDate: studentData.billing?.preferredDueDay || 5,
        medicalObservations: studentData.health?.notes || null,
        planObservations: null,
        healthQuestionnaireCompletedAt: studentData.healthQuestionnaireCompletedAt || null,
        agreedToHealthTerms: studentData.agreedToHealthTerms || null,
        healthTermsAgreedAt: studentData.healthTermsAgreedAt || null,
        requiresMedicalCertificate: studentData.requiresMedicalCertificate || null,
      });
    }
  }, [studentData, open, form]);

  // Reset to first tab when dialog opens
  useEffect(() => {
    if (open) setActiveTab("personal");
  }, [open]);

  const onSubmit = (data: StudentEditFormData) => {
    if (readOnly) return;
    updateStudentMutation.mutate(data);
  };

  const displayName = studentData
    ? `${studentData.firstName} ${studentData.lastName}`
    : studentName || "Aluno";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] p-0 overflow-hidden flex flex-col gap-0 rounded-2xl">
        {/* ── Dialog header ──────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {readOnly ? displayName : `Editar — ${displayName}`}
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-0.5">
            {readOnly ? "Visualizando dados do aluno" : "Atualize as informações do aluno nos campos abaixo"}
          </p>

          {/* Underline tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mt-4 -mx-6 px-6">
            <nav className="-mb-px flex gap-0 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </DialogHeader>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingStudent ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
              <p className="text-sm text-gray-400">Carregando dados do aluno...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="student-edit-form">
                <div className="px-6 py-5 space-y-4">

                  {/* ── Dados Pessoais ─────────────────────────── */}
                  {activeTab === "personal" && (
                    <>
                      <SectionTitle>Informações Pessoais</SectionTitle>
                      <FieldRow>
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome *</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sobrenome *</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="birthDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data de Nascimento</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="enrollmentDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data de Matrícula</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="sex" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gênero</FormLabel>
                            <Select disabled={readOnly} value={field.value || ""} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="border-gray-200 dark:border-gray-700 focus:ring-blue-500">
                                  <SelectValue placeholder="Selecionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="M">Masculino</SelectItem>
                                <SelectItem value="F">Feminino</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="cpf" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">CPF</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="000.000.000-00" className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="rg" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">RG</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>
                    </>
                  )}

                  {/* ── Contato ────────────────────────────────── */}
                  {activeTab === "contact" && (
                    <>
                      <SectionTitle>Contato</SectionTitle>
                      <FieldRow>
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">E-mail</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="(00) 00000-0000" className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <SectionTitle>Contato de Emergência</SectionTitle>
                      <FieldRow>
                        <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="(00) 00000-0000" className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>
                    </>
                  )}

                  {/* ── Endereço ───────────────────────────────── */}
                  {activeTab === "address" && (
                    <>
                      <SectionTitle>Endereço</SectionTitle>
                      <FieldRow>
                        <FormField control={form.control} name="zipCode" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">CEP</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="00000-000" className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="street" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Logradouro</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="number" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Número</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="complement" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Complemento</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="neighborhood" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bairro</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cidade</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="state" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estado (UF)</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} maxLength={2} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>
                    </>
                  )}

                  {/* ── Saúde & Graduação ──────────────────────── */}
                  {activeTab === "health" && (
                    <>
                      <SectionTitle>Graduação</SectionTitle>
                      <FieldRow>
                        <FormField control={form.control} name="beltLevel" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Faixa</FormLabel>
                            <Select disabled={readOnly || isLoadingBelts} value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="border-gray-200 dark:border-gray-700 focus:ring-blue-500">
                                  <SelectValue placeholder="Selecionar faixa" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingBelts ? (
                                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                                ) : allBeltOptions.length > 0 ? (
                                  allBeltOptions.map((belt) => (
                                    <SelectItem key={belt.value} value={belt.value}>{belt.label}</SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-belts" disabled>Nenhuma faixa</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="stripes" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Graus (Listras)</FormLabel>
                            <Select disabled={readOnly} value={field.value?.toString() || "0"} onValueChange={(v) => field.onChange(parseInt(v, 10) || 0)}>
                              <FormControl>
                                <SelectTrigger className="border-gray-200 dark:border-gray-700 focus:ring-blue-500">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[0, 1, 2, 3, 4].map((n) => (
                                  <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "listra" : "listras"}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="lastPromotionDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data da Última Graduação</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} disabled={readOnly} value={field.value || ""} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <SectionTitle>Observações de Saúde</SectionTitle>
                      <FormField control={form.control} name="medicalObservations" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Observações Médicas</FormLabel>
                          <FormControl>
                            <Textarea {...field} disabled={readOnly} value={field.value || ""} rows={3} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500 resize-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Health questionnaire info */}
                      {(studentData?.healthQuestionnaireCompletedAt || studentData?.agreedToHealthTerms) && (
                        <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Questionário de Saúde (PAR-Q+) — Assinatura Eletrônica
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-xs text-blue-700 dark:text-blue-300">
                            {studentData.healthQuestionnaireCompletedAt && (
                              <div>
                                <span className="font-medium">Preenchido em:</span>
                                <p>{new Date(studentData.healthQuestionnaireCompletedAt).toLocaleString("pt-BR")}</p>
                              </div>
                            )}
                            {studentData.agreedToHealthTerms && (
                              <div>
                                <span className="font-medium">Termos aceitos:</span>
                                <p className="text-emerald-600">✓ Concordou</p>
                              </div>
                            )}
                          </div>
                          {studentData.medicalCertificateStatus && (
                            <div className="mt-3 flex items-center gap-3">
                              <span className="text-xs font-medium">Atestado:</span>
                              <span className={`text-xs ${
                                ["RECEIVED", "UPLOADED"].includes(studentData.medicalCertificateStatus)
                                  ? "text-emerald-600" : "text-amber-600"
                              }`}>
                                {studentData.medicalCertificateStatus === "RECEIVED" ? "✅ Recebido na escola" :
                                 studentData.medicalCertificateStatus === "UPLOADED" ? "✅ Enviado" :
                                 studentData.medicalCertificateStatus === "PENDING" ? "⏳ Pendente" :
                                 studentData.medicalCertificateStatus}
                              </span>
                              {studentData.medicalCertificateStatus === "PENDING" && !readOnly && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/students/${studentData.id}/medical-cert-status`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        credentials: "include",
                                        body: JSON.stringify({ status: "RECEIVED" }),
                                      });
                                      if (res.ok) {
                                        toast({ title: "Atestado confirmado!", description: "Marcado como recebido." });
                                        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
                                      }
                                    } catch { /* ignore */ }
                                  }}
                                  className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 font-medium transition-colors"
                                >
                                  ✓ Marcar como recebido
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Financeiro ─────────────────────────────── */}
                  {activeTab === "financial" && (
                    <>
                      <SectionTitle>Responsável Financeiro</SectionTitle>
                      <FormField control={form.control} name="isStudentResponsible" render={({ field }) => (
                        <FormItem>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.value}
                              disabled={readOnly}
                              onChange={(e) => {
                                field.onChange(e.target.checked);
                                if (e.target.checked) {
                                  form.setValue("financialResponsibleName", null);
                                  form.setValue("financialResponsibleCpf", null);
                                  form.setValue("financialResponsibleEmail", null);
                                  form.setValue("financialResponsiblePhone", null);
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              O próprio aluno é o responsável financeiro
                            </span>
                          </label>
                        </FormItem>
                      )} />

                      {!form.watch("isStudentResponsible") && (
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dados do Responsável</p>
                          <FieldRow>
                            <FormField control={form.control} name="financialResponsibleName" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={readOnly} value={field.value || ""} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="financialResponsibleCpf" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">CPF</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="000.000.000-00" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </FieldRow>
                          <FieldRow>
                            <FormField control={form.control} name="financialResponsibleEmail" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">E-mail</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} disabled={readOnly} value={field.value || ""} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="financialResponsiblePhone" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefone</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="(00) 00000-0000" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </FieldRow>
                        </div>
                      )}

                      <SectionTitle>Plano de Pagamento</SectionTitle>
                      <FieldRow>
                        <FormField control={form.control} name="paymentPlanId" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plano</FormLabel>
                            <Select
                              disabled={readOnly}
                              value={field.value ? String(field.value) : ""}
                              onValueChange={(v) => field.onChange(v ? parseInt(v) : null)}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-200 dark:border-gray-700 focus:ring-blue-500">
                                  <SelectValue placeholder="Selecionar plano" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {paymentPlans.map((plan: any) => (
                                  <SelectItem key={plan.id} value={String(plan.id)}>
                                    {plan.name} — R$ {Number((plan.amount || 0) / 100).toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="preferredDueDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vencimento (dia)</FormLabel>
                            <Select
                              disabled={readOnly}
                              value={field.value ? String(field.value) : "5"}
                              onValueChange={(v) => field.onChange(parseInt(v))}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-200 dark:border-gray-700 focus:ring-blue-500">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[5, 10, 15, 20, 25].map((d) => (
                                  <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FormField control={form.control} name="planObservations" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-gray-500 uppercase tracking-wide">Observações Financeiras</FormLabel>
                          <FormControl>
                            <Textarea {...field} disabled={readOnly} value={field.value || ""} rows={3} className="border-gray-200 dark:border-gray-700 focus-visible:ring-blue-500 resize-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </>
                  )}

                </div>
              </form>
            </Form>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        {!isLoadingStudent && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-1">
              {TABS.map((tab) => (
                <div
                  key={tab.key}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    activeTab === tab.key ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </Button>
              {!readOnly && (
                <Button
                  type="submit"
                  form="student-edit-form"
                  disabled={updateStudentMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                >
                  {updateStudentMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Salvando...
                    </span>
                  ) : "Salvar"}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
