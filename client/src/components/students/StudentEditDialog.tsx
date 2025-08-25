import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getStudentById, updateStudent, StudentEditDTO, listBillingPlans, BillingPlan
} from "@/services/api/students";
import {
  formatCPF, unformatCPF, formatRG, unformatRG, formatPhone, unformatPhone,
  formatCEP, unformatCEP, toDisplayDate, toISODate, formatName
} from "@/lib/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Schema = z.object({
  id: z.number(),
  firstName: z.string().min(1, "Nome obrigatório"),
  lastName: z.string().min(1, "Sobrenome obrigatório"),
  birthDate: z.string().nullable().optional(),
  cpf: z.string().nullable().optional(),
  rg: z.string().nullable().optional(),
  sex: z.enum(["M","F","O"]).nullable().optional(),
  contact: z.object({
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
  }),
  emergency: z.object({
    name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
  }),
  financialResponsible: z.object({
    relation: z.string().nullable().optional(),
  }),
  billing: z.object({
    planId: z.number().nullable().optional(),
    preferredDueDay: z.number().int().min(1).max(31).nullable().optional(),
  }),
  address: z.object({
    zip: z.string().nullable().optional(),
    street: z.string().nullable().optional(),
    number: z.string().nullable().optional(),
    complement: z.string().nullable().optional(),
    district: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
  }),
  health: z.object({ notes: z.string().nullable().optional() }),
  graduation: z.object({
    beltLevel: z.string().nullable().optional(),
    graduationDate: z.string().nullable().optional(),
  }),
});
type FormValues = z.infer<typeof Schema>;

type Props = {
  studentId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentName: string;
  readOnly?: boolean; // para o "olho"
};

export default function StudentEditDialog({ studentId, open, onOpenChange, studentName, readOnly }: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState("dados");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      id: studentId,
      firstName: "", lastName: "", birthDate: "",
      cpf: "", rg: "", sex: null,
      contact: { email: "", phone: "" },
      emergency: { name: "", phone: "" },
      financialResponsible: { relation: "Eu mesmo(a)" },
      billing: { planId: null, preferredDueDay: null },
      address: { zip: "", street: "", number: "", complement: "", district: "", city: "", state: "" },
      health: { notes: "" },
      graduation: { beltLevel: "", graduationDate: "" },
    },
    mode: "onChange",
  });

  // carrega planos p/ select
  useEffect(() => {
    listBillingPlans().then(setPlans).catch(() => {});
  }, []);

  // carregar aluno correto com cancelamento
  useEffect(() => {
    if (!open || !studentId) return;
    setLoading(true);

    // aborta requisição anterior
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const dto = await getStudentById(studentId);
        if (controller.signal.aborted) return;

        form.reset({
          id: dto.id,
          firstName: formatName(dto.firstName),
          lastName: formatName(dto.lastName),
          birthDate: toDisplayDate(dto.birthDate),
          cpf: formatCPF(dto.cpf || ""),
          rg: formatRG(dto.rg || ""),
          sex: (dto.sex as any) || null,
          contact: {
            email: dto.contact?.email || "",
            phone: formatPhone(dto.contact?.phone || ""),
          },
          emergency: {
            name: dto.emergency?.name || "",
            phone: formatPhone(dto.emergency?.phone || ""),
          },
          financialResponsible: { relation: dto.financialResponsible?.relation || "Eu mesmo(a)" },
          billing: {
            planId: dto.billing?.planId ?? null,
            preferredDueDay: dto.billing?.preferredDueDay ?? null,
          },
          address: {
            zip: formatCEP(dto.address?.zip || ""),
            street: dto.address?.street || "",
            number: dto.address?.number || "",
            complement: dto.address?.complement || "",
            district: dto.address?.district || "",
            city: dto.address?.city || "",
            state: dto.address?.state || "",
          },
          health: { notes: dto.health?.notes || "" },
          graduation: {
            beltLevel: dto.graduation?.beltLevel || "",
            graduationDate: toDisplayDate(dto.graduation?.graduationDate),
          },
        });
      } catch (e) {
        toast({ title: "Erro ao carregar", description: "Não foi possível carregar os dados do aluno.", variant: "destructive" });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const payload: StudentEditDTO = {
        id: values.id,
        firstName: formatName(values.firstName),
        lastName: formatName(values.lastName),
        birthDate: toISODate(values.birthDate) || null,
        cpf: unformatCPF(values.cpf),
        rg: unformatRG(values.rg),
        sex: (values.sex as any) || null,
        contact: {
          email: values.contact.email?.trim() || null,
          phone: unformatPhone(values.contact.phone),
        },
        emergency: {
          name: formatName(values.emergency.name),
          phone: unformatPhone(values.emergency.phone),
        },
        financialResponsible: { relation: values.financialResponsible.relation?.trim() || null },
        billing: {
          planId: values.billing.planId ?? null,
          preferredDueDay: values.billing.preferredDueDay ?? null,
        },
        address: {
          zip: unformatCEP(values.address.zip),
          street: formatName(values.address.street),
          number: formatName(values.address.number),
          complement: formatName(values.address.complement),
          district: formatName(values.address.district),
          city: formatName(values.address.city),
          state: formatName(values.address.state),
        },
        health: { notes: values.health.notes?.trim() || null },
        graduation: {
          beltLevel: values.graduation.beltLevel?.trim() || null,
          graduationDate: toISODate(values.graduation.graduationDate) || null,
        },
      };

      await updateStudent(studentId, payload);
      toast({ title: "Salvo!", description: "Dados do aluno atualizados com sucesso." });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.response?.data?.detail || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const headerTitle = useMemo(() => `Editando ${studentName}`, [studentName]);

  return (
    <Dialog key={studentId} open={open} onOpenChange={(v) => {
      if (!v && form.formState.isDirty && !readOnly && !window.confirm("Descartar alterações não salvas?")) return;
      onOpenChange(v);
    }}>
      <DialogContent className="w-screen h-screen md:h-[85vh] md:max-w-5xl lg:max-w-7xl p-0 overflow-hidden md:rounded-2xl">
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b">
          <DialogHeader className="px-4 py-3 md:px-6">
            <DialogTitle className="text-lg md:text-xl">{headerTitle}</DialogTitle>
            <DialogDescription>Gerenciar informações completas do aluno incluindo dados pessoais, contato, endereço, saúde, financeiro e documentos.</DialogDescription>
          </DialogHeader>
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

        <form onSubmit={form.handleSubmit(onSubmit)} className="relative h-[calc(100%-140px)] md:h-[calc(100%-120px)]">
          <div className="h-full overflow-y-auto px-4 md:px-6 py-4 space-y-6">
            {/* DADOS PESSOAIS */}
            {tab === "dados" && (
              <section className="space-y-4">
                <h3 className="text-base font-semibold">Dados Pessoais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div><Label>Nome *</Label><Input disabled={readOnly} {...form.register("firstName")} /></div>
                  <div><Label>Sobrenome *</Label><Input disabled={readOnly} {...form.register("lastName")} /></div>
                  <div>
                    <Label>Data de Nascimento *</Label>
                    <Input disabled={readOnly} value={form.watch("birthDate") || ""} onChange={(e)=>form.setValue("birthDate", e.target.value)} placeholder="dd/mm/aaaa" inputMode="numeric"/>
                  </div>
                  <div><Label>CPF *</Label><Input disabled={readOnly} value={form.watch("cpf") || ""} onChange={(e)=>form.setValue("cpf", formatCPF(e.target.value))} inputMode="numeric"/></div>
                  <div><Label>RG *</Label><Input disabled={readOnly} value={form.watch("rg") || ""} onChange={(e)=>form.setValue("rg", formatRG(e.target.value))} inputMode="numeric"/></div>
                  <div>
                    <Label>Sexo</Label>
                    <Select disabled={readOnly} value={form.watch("sex") ?? ""} onValueChange={(v)=>form.setValue("sex", (v||null) as any)}>
                      <SelectTrigger><SelectValue placeholder="Selecionar"/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                        <SelectItem value="O">Outro/Prefiro não dizer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            )}

            {/* CONTATO + EMERGÊNCIA */}
            {tab === "contato" && (
              <section className="space-y-4">
                <h3 className="text-base font-semibold">Contato</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="sm:col-span-2"><Label>E-mail *</Label><Input disabled={readOnly} type="email" {...form.register("contact.email")} placeholder="seu@email.com"/></div>
                  <div>
                    <Label>Telefone/Celular *</Label>
                    <Controller control={form.control} name="contact.phone" render={({field})=>(
                      <Input disabled={readOnly} {...field} value={field.value||""} onChange={(e)=>field.onChange(formatPhone(e.target.value))} inputMode="tel"/>
                    )}/>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-medium">Contato de Emergência</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                    <div className="sm:col-span-2"><Label>Nome *</Label><Input disabled={readOnly} {...form.register("emergency.name")}/></div>
                    <div>
                      <Label>Telefone de Emergência *</Label>
                      <Controller control={form.control} name="emergency.phone" render={({field})=>(
                        <Input disabled={readOnly} {...field} value={field.value||""} onChange={(e)=>field.onChange(formatPhone(e.target.value))} inputMode="tel"/>
                      )}/>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ENDEREÇO */}
            {tab === "endereco" && (
              <section className="space-y-4">
                <h3 className="text-base font-semibold">Endereço Residencial</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div><Label>CEP *</Label><Input disabled={readOnly} value={form.watch("address.zip") || ""} onChange={(e)=>form.setValue("address.zip", formatCEP(e.target.value))} inputMode="numeric"/></div>
                  <div className="lg:col-span-2"><Label>Logradouro *</Label><Input disabled={readOnly} {...form.register("address.street")}/></div>
                  <div><Label>Número *</Label><Input disabled={readOnly} {...form.register("address.number")}/></div>
                  <div className="lg:col-span-2"><Label>Complemento</Label><Input disabled={readOnly} {...form.register("address.complement")}/></div>
                  <div><Label>Bairro *</Label><Input disabled={readOnly} {...form.register("address.district")}/></div>
                  <div><Label>Cidade *</Label><Input disabled={readOnly} {...form.register("address.city")}/></div>
                  <div><Label>Estado *</Label><Input disabled={readOnly} {...form.register("address.state")} maxLength={2} placeholder="SP"/></div>
                </div>
              </section>
            )}

            {/* SAÚDE & GRADUAÇÃO */}
            {tab === "saude" && (
              <section className="space-y-4">
                <h3 className="text-base font-semibold">Saúde & Graduação</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-3"><Label>Observações de Saúde</Label><Input disabled={readOnly} {...form.register("health.notes")} placeholder="Alergias, restrições, etc."/></div>
                  <div><Label>Faixa (nível)</Label><Input disabled={readOnly} {...form.register("graduation.beltLevel")} placeholder="Branca, Azul, ..."/></div>
                  <div>
                    <Label>Data de Graduação</Label>
                    <Input disabled={readOnly} value={form.watch("graduation.graduationDate") || ""} onChange={(e)=>form.setValue("graduation.graduationDate", e.target.value)} placeholder="dd/mm/aaaa" inputMode="numeric"/>
                  </div>
                </div>
              </section>
            )}

            {/* FINANCEIRO */}
            {tab === "financeiro" && (
              <section className="space-y-4">
                <h3 className="text-base font-semibold">Responsável Financeiro & Plano</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label>Grau de Parentesco *</Label>
                    <Input disabled={readOnly} {...form.register("financialResponsible.relation")} placeholder="Eu mesmo(a), Pai, Mãe..."/>
                  </div>
                  <div>
                    <Label>Plano de Mensalidade *</Label>
                    <Select disabled={readOnly} value={(form.watch("billing.planId") ?? "").toString()}
                      onValueChange={(v)=>form.setValue("billing.planId", v ? Number(v) : null)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o plano"/></SelectTrigger>
                      <SelectContent>
                        {plans.map(p => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Dia de Vencimento Preferido *</Label>
                    <Select disabled={readOnly} value={(form.watch("billing.preferredDueDay") ?? "").toString()}
                      onValueChange={(v)=>form.setValue("billing.preferredDueDay", v ? Number(v) : null)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o dia"/></SelectTrigger>
                      <SelectContent>
                        {[...Array(31)].map((_,i)=>(<SelectItem key={i+1} value={String(i+1)}>{i+1}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-0 z-20 bg-background/90 backdrop-blur border-t px-4 md:px-6 py-3 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <DialogClose asChild><Button variant="ghost" type="button">Fechar</Button></DialogClose>
            {!readOnly && <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar alterações"}</Button>}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}