
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown, Ticket, X, UserRound, Phone, MapPin, HeartPulse, Wallet, ArrowLeft } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MedicalCertificateUpload from "@/components/students/MedicalCertificateUpload";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calendarDateKey, localCalendarDateKey } from "@shared/calendarDates";

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
  preferredDueDate: z.number().int().min(1).max(31).nullable(),
  couponCode: z.string().nullable(),
  medicalObservations: z.string().nullable(),
  planObservations: z.string().nullable(),
  healthQuestionnaireCompletedAt: z.string().nullable(),
  agreedToHealthTerms: z.boolean().nullable(),
  healthTermsAgreedAt: z.string().nullable(),
  requiresMedicalCertificate: z.boolean().nullable(),
});

type StudentEditFormData = z.infer<typeof studentEditSchema>;

type StudentCoupon = {
  id: number;
  code: string;
  description: string | null;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
};

interface StudentEditDialogProps {
  studentId: number;
  studentName?: string;
  open: boolean;
  readOnly?: boolean;
  onOpenChange: (open: boolean) => void;
  fullPage?: boolean;
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
    <h3 className="text-sm font-semibold text-secondary-foreground dark:text-secondary-foreground mb-3 mt-1">
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
  fullPage = false,
}: StudentEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("personal");
  const [isScholarship, setIsScholarship] = useState(false);
  const [couponPickerOpen, setCouponPickerOpen] = useState(false);

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

  const paymentPlans = (paymentPlansData?.plans || []).filter(
    (plan: any) => !plan.isScholarship
  );

  const { data: couponsData } = useQuery<{ coupons: StudentCoupon[] }>({
    queryKey: ["/api/coupons"],
    queryFn: () => fetch("/api/coupons").then((r) => {
      if (!r.ok) throw new Error("Não foi possível carregar os cupons");
      return r.json();
    }),
    enabled: open,
  });

  const coupons = couponsData?.coupons || [];

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
      couponCode: null,
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
        billing: {
          planId: isScholarship ? null : data.paymentPlanId,
          preferredDueDay: data.preferredDueDate,
          isScholarship,
          couponCode: data.couponCode || null,
        },
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
    onSuccess: (_result, data) => {
      trackEvent("student_billing_updated", {
        scholarship: isScholarship,
        has_plan: Boolean(data.paymentPlanId),
      });
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
      setIsScholarship(!!studentData.billing?.isScholarship);
      form.reset({
        firstName: studentData.firstName || "",
        lastName: studentData.lastName || "",
        birthDate: calendarDateKey(studentData.birthDate),
        enrollmentDate: calendarDateKey(studentData.enrollmentDate),
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
        lastPromotionDate: calendarDateKey(studentData.graduation?.graduationDate),
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
        couponCode: studentData.billing?.couponCode || null,
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

  const studentRecord = studentData?.student || studentData;
  const displayName = [studentRecord?.firstName, studentRecord?.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ") || studentName?.trim() || "Aluno";

  const content = (
    <>
        {/* ── Dialog header ──────────────────────────────────────── */}
        {!fullPage && <>
        <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-0 sm:px-6 sm:pt-5">
          <div className="mb-1 flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">✎</div>
            <div>
          <DialogTitle className="pr-8 text-left text-lg font-semibold text-foreground sm:text-xl">
            {readOnly ? `Aluno — ${displayName}` : `Editar aluno — ${displayName}`}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            {readOnly ? "Visualizando dados do aluno" : "Atualize as informações do aluno nos campos abaixo"}
          </p></div></div>

          {/* Underline tabs */}
          <div className="-mx-4 mt-4 border-b border-border px-4 dark:border-border sm:-mx-6 sm:px-6">
            <nav className="-mb-px grid grid-cols-5 gap-1 overflow-x-auto [scrollbar-width:none]">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  aria-current={activeTab === tab.key ? "page" : undefined}
                  className={`flex min-h-12 min-w-[108px] items-center justify-center rounded-t-lg border-b-2 px-2 py-3 text-center text-[11px] font-semibold transition-colors whitespace-nowrap sm:min-w-0 sm:px-4 sm:text-sm ${
                    activeTab === tab.key
                      ? "border-primary text-accent-foreground"
                      : "border-transparent text-muted-foreground hover:text-secondary-foreground hover:border-border dark:text-muted-foreground dark:hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </DialogHeader>
        </>}

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className={fullPage ? "min-w-0 flex-1" : "min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background/40"}>
          {isLoadingStudent ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
              <p className="text-sm text-muted-foreground">Carregando dados do aluno...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="student-edit-form">
                <div className={fullPage ? "student-profile-fields flex flex-col gap-6 p-5 sm:p-8" : "flex flex-col gap-4 px-4 py-5 sm:px-8 sm:py-7"}>

                  {/* ── Dados Pessoais ─────────────────────────── */}
                  {activeTab === "personal" && (
                    <>
                      <SectionTitle>Informações Pessoais</SectionTitle>
                      <FieldRow>
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome *</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sobrenome *</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="birthDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data de Nascimento</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="enrollmentDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data de Matrícula</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="sex" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gênero</FormLabel>
                            <Select disabled={readOnly} value={field.value || ""} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="border-border dark:border-border focus:ring-primary">
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
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CPF</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="000.000.000-00" className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="rg" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">RG</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
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
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">E-mail</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="(00) 00000-0000" className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <SectionTitle>Contato de Emergência</SectionTitle>
                      <FieldRow>
                        <FormField control={form.control} name="emergencyContactName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="emergencyContactPhone" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="(00) 00000-0000" className="border-border dark:border-border focus-visible:ring-primary" />
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
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CEP</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="00000-000" className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="street" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Logradouro</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="number" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Número</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="complement" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Complemento</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="neighborhood" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bairro</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cidade</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <FieldRow>
                        <FormField control={form.control} name="state" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado (UF)</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={readOnly} value={field.value || ""} maxLength={2} className="border-border dark:border-border focus-visible:ring-primary" />
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
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Faixa</FormLabel>
                            <Select disabled={readOnly || isLoadingBelts} value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="border-border dark:border-border focus:ring-primary">
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
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Graus (Listras)</FormLabel>
                            <Select disabled={readOnly} value={field.value?.toString() || "0"} onValueChange={(v) => field.onChange(parseInt(v, 10) || 0)}>
                              <FormControl>
                                <SelectTrigger className="border-border dark:border-border focus:ring-primary">
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
                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data da Última Graduação</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} disabled={readOnly} value={field.value || ""} className="border-border dark:border-border focus-visible:ring-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </FieldRow>

                      <SectionTitle>Observações de Saúde</SectionTitle>
                      <FormField control={form.control} name="medicalObservations" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observações Médicas</FormLabel>
                          <FormControl>
                            <Textarea {...field} disabled={readOnly} value={field.value || ""} rows={3} className="border-border dark:border-border focus-visible:ring-primary resize-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Health questionnaire info */}
                      {(studentData?.healthQuestionnaireCompletedAt || studentData?.agreedToHealthTerms) && (
                        <div className="mt-4 p-4 rounded-xl bg-accent dark:bg-accent border border-primary dark:border-primary">
                          <p className="text-xs font-semibold text-accent-foreground dark:text-accent-foreground mb-2 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Questionário de Saúde (PAR-Q+) — Assinatura Eletrônica
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-xs text-accent-foreground dark:text-accent-foreground">
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
                      <MedicalCertificateUpload
                        studentId={studentData.id}
                        required={studentData.requiresMedicalCertificate}
                        status={studentData.medicalCertificateStatus}
                        readOnly={readOnly}
                      />
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
                              className="rounded border-border text-accent-foreground focus:ring-primary"
                            />
                            <span className="text-sm text-secondary-foreground dark:text-secondary-foreground">
                              O próprio aluno é o responsável financeiro
                            </span>
                          </label>
                        </FormItem>
                      )} />

                      {!form.watch("isStudentResponsible") && (
                        <div className="rounded-xl border border-border dark:border-border p-4 space-y-4 bg-background dark:bg-background">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados do Responsável</p>
                          <FieldRow>
                            <FormField control={form.control} name="financialResponsibleName" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={readOnly} value={field.value || ""} className="bg-card dark:bg-card border-border dark:border-border focus-visible:ring-primary" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="financialResponsibleCpf" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">CPF</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="000.000.000-00" className="bg-card dark:bg-card border-border dark:border-border focus-visible:ring-primary" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </FieldRow>
                          <FieldRow>
                            <FormField control={form.control} name="financialResponsibleEmail" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">E-mail</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} disabled={readOnly} value={field.value || ""} className="bg-card dark:bg-card border-border dark:border-border focus-visible:ring-primary" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="financialResponsiblePhone" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Telefone</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={readOnly} value={field.value || ""} placeholder="(00) 00000-0000" className="bg-card dark:bg-card border-border dark:border-border focus-visible:ring-primary" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </FieldRow>
                        </div>
                      )}

                      {/* Cabeçalho com toggle bolsista */}
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <h3 className="text-sm font-semibold text-secondary-foreground dark:text-secondary-foreground">Plano de Pagamento</h3>
                        {!readOnly && (
                          isScholarship ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsScholarship(false);
                                form.setValue("couponCode", null);
                              }}
                              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                            >
                              Remover bolsa →
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsScholarship(true);
                                form.setValue("paymentPlanId", null);
                                form.setValue("couponCode", null);
                              }}
                              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                            >
                              🎓 Aplicar bolsa →
                            </button>
                          )
                        )}
                      </div>

                      {/* Modo bolsista */}
                      {isScholarship && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            🎓 Bolsista
                          </span>
                          {form.watch("couponCode") && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">
                              Cupom: <span className="font-mono font-semibold">{form.watch("couponCode")}</span>
                            </span>
                          )}
                          <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400">Isento de mensalidade</span>
                        </div>
                      )}

                      {/* Modo plano pago */}
                      {!isScholarship && (
                        <FieldRow>
                          <FormField control={form.control} name="paymentPlanId" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plano</FormLabel>
                              <Select
                                disabled={readOnly}
                                value={field.value ? String(field.value) : ""}
                                onValueChange={(v) => field.onChange(v ? parseInt(v) : null)}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-border dark:border-border focus:ring-primary">
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
                              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vencimento (dia)</FormLabel>
                              <Select
                                disabled={readOnly}
                                value={field.value ? String(field.value) : "5"}
                                onValueChange={(v) => field.onChange(parseInt(v))}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-border dark:border-border focus:ring-primary">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 31 }, (_, index) => index + 1).map((d) => (
                                    <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="couponCode" render={({ field }) => {
                            const selectedCoupon = coupons.find((coupon) => coupon.code === field.value);
                            const isCouponUsable = (coupon: StudentCoupon) =>
                              coupon.active &&
                              (!coupon.expiresAt || calendarDateKey(coupon.expiresAt)! >= localCalendarDateKey()) &&
                              (coupon.maxUses === null || coupon.usedCount < coupon.maxUses);

                            return (
                              <FormItem className="sm:col-span-2">
                                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Cupom de desconto (opcional)
                                </FormLabel>
                                <div className="flex gap-2">
                                  <Popover open={couponPickerOpen} onOpenChange={setCouponPickerOpen}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        disabled={readOnly}
                                        className="min-w-0 flex-1 justify-between border-border bg-card font-normal dark:border-border dark:bg-card"
                                      >
                                        <span className={`flex min-w-0 items-center gap-2 ${selectedCoupon ? "text-foreground dark:text-foreground" : "text-muted-foreground"}`}>
                                          <Ticket className="h-4 w-4 shrink-0" />
                                          <span className="truncate">
                                            {selectedCoupon
                                              ? `${selectedCoupon.code} — ${selectedCoupon.discountPercent}%`
                                              : "Selecionar cupom"}
                                          </span>
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-[min(420px,calc(100vw-3rem))] p-0">
                                      <Command>
                                        <CommandInput placeholder="Pesquisar código ou descrição..." />
                                        <CommandList>
                                          <CommandEmpty>Nenhum cupom encontrado.</CommandEmpty>
                                          <CommandGroup heading="Todos os cupons">
                                            {coupons.map((coupon) => {
                                              const usable = isCouponUsable(coupon);
                                              const status = !coupon.active
                                                ? "Inativo"
                                                : coupon.expiresAt && calendarDateKey(coupon.expiresAt)! < localCalendarDateKey()
                                                  ? "Expirado"
                                                  : coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses
                                                    ? "Esgotado"
                                                    : null;

                                              return (
                                                <CommandItem
                                                  key={coupon.id}
                                                  value={`${coupon.code} ${coupon.description || ""}`}
                                                  disabled={!usable}
                                                  onSelect={() => {
                                                    if (!usable) return;
                                                    field.onChange(coupon.code);
                                                    setCouponPickerOpen(false);
                                                    if (coupon.discountPercent === 100) {
                                                      setIsScholarship(true);
                                                      form.setValue("paymentPlanId", null);
                                                    }
                                                  }}
                                                >
                                                  <Check className={`mr-2 h-4 w-4 ${field.value === coupon.code ? "opacity-100" : "opacity-0"}`} />
                                                  <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                      <span className="font-mono font-semibold">{coupon.code}</span>
                                                      <span className="text-xs font-semibold text-emerald-600">{coupon.discountPercent}%</span>
                                                    </div>
                                                    {coupon.description && (
                                                      <p className="truncate text-xs text-muted-foreground">{coupon.description}</p>
                                                    )}
                                                  </div>
                                                  {status && <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">{status}</span>}
                                                </CommandItem>
                                              );
                                            })}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  {field.value && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      disabled={readOnly}
                                      aria-label="Remover cupom"
                                      onClick={() => field.onChange(null)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                {selectedCoupon && (
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                    {selectedCoupon.discountPercent === 100
                                      ? "Este cupom aplica bolsa integral."
                                      : `${selectedCoupon.discountPercent}% de desconto no plano selecionado.`}
                                  </p>
                                )}
                                <FormMessage />
                              </FormItem>
                            );
                          }} />
                        </FieldRow>
                      )}

                      <FormField control={form.control} name="planObservations" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observações Financeiras</FormLabel>
                          <FormControl>
                            <Textarea {...field} disabled={readOnly} value={field.value || ""} rows={3} className="border-border dark:border-border focus-visible:ring-primary resize-none" />
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
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
            <div className={fullPage ? "hidden" : "flex gap-1"}>
              {TABS.map((tab) => (
                <div
                  key={tab.key}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    activeTab === tab.key ? "bg-primary" : "bg-muted dark:bg-muted"
                  }`}
                />
              ))}
            </div>
            <div className={fullPage ? "grid w-full grid-cols-2 gap-4" : "flex items-center gap-2 sm:gap-3"}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="min-h-11 flex-1 border-border px-3 text-secondary-foreground hover:bg-muted sm:flex-none sm:px-4"
              >
                {fullPage ? "Descartar alterações" : "Cancelar"}
              </Button>
              {!readOnly && (
                <Button
                  type="submit"
                  form="student-edit-form"
                  disabled={updateStudentMutation.isPending}
                  className="min-h-11 min-w-[92px] flex-1 bg-primary text-primary-foreground hover:bg-primary-light sm:flex-none sm:min-w-[100px]"
                >
                  {updateStudentMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Salvando...
                    </span>
                  ) : "Salvar alterações"}
                </Button>
              )}
            </div>
          </div>
        )}
    </>
  );

  if (fullPage) {
    const icons = { personal: UserRound, contact: Phone, address: MapPin, health: HeartPulse, financial: Wallet };
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <Button variant="ghost" className="w-fit" onClick={() => onOpenChange(false)}><ArrowLeft className="mr-2 size-4" />Voltar para alunos</Button>
        <div className="grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-border bg-card p-5 lg:min-h-[660px]">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Avatar className="size-28 ring-4 ring-background">
                <AvatarImage src={studentRecord?.avatarImage || studentRecord?.photoUrl || studentRecord?.user?.photoUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-accent text-3xl text-accent-foreground">{displayName.split(" ").slice(0,2).map((name: string) => name[0]).join("")}</AvatarFallback>
              </Avatar>
              <div><h1 className="text-lg font-semibold">{displayName}</h1><p className="mt-1 text-sm text-muted-foreground">Cadastro do aluno</p></div>
            </div>
            <nav aria-label="Seções do cadastro" className="mt-6 flex gap-2 overflow-x-auto lg:flex-col">
              {TABS.map((tab) => { const Icon = icons[tab.key]; return <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} aria-current={activeTab === tab.key ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-colors ${activeTab === tab.key ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}><Icon className="size-4 shrink-0" />{tab.label}</button>; })}
            </nav>
          </aside>
          <section aria-label="Editar cadastro do aluno" className="flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-border bg-card [&>div:last-child]:border-t-0 [&>div:last-child]:px-5 [&>div:last-child]:pb-7 sm:[&>div:last-child]:px-8">{content}</section>
        </div>
      </div>
    );
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="flex max-h-[92dvh] max-w-4xl flex-col gap-0 overflow-hidden p-0">{content}</DialogContent></Dialog>;
}
