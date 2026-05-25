import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users } from "lucide-react";
import { brlToCents, centsToBRL, formatBRLInput } from "@shared/money";

const paymentPlanFormSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  amount: z.string().min(1, { message: "Valor é obrigatório" }),
  frequency: z.string().min(1, { message: "Frequência é obrigatória" }),
  description: z.string().optional(),
  isFamily: z.boolean().default(false),
  maxStudents: z.number().min(2).max(10).default(2),
});

type PaymentPlanFormValues = z.infer<typeof paymentPlanFormSchema>;

interface PaymentPlanFormProps {
  defaultValues?: Partial<{
    name: string;
    amount: number;
    frequency: string;
    description: string;
    isFamily: boolean;
    maxStudents: number;
  }>;
  onSubmit: (data: { name: string; amount: number; frequency: string; description?: string; isFamily: boolean; maxStudents: number }) => void;
  onCancel?: () => void;
  isLoading: boolean;
}

const FREQUENCIES = [
  { value: "weekly",     label: "Semanal" },
  { value: "biweekly",  label: "Quinzenal" },
  { value: "monthly",   label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "semiannual",label: "Semestral" },
  { value: "annual",    label: "Anual" },
];

const PaymentPlanForm: React.FC<PaymentPlanFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const isEditing = !!defaultValues?.name;

  const form = useForm<PaymentPlanFormValues>({
    resolver: zodResolver(paymentPlanFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      amount: defaultValues?.amount
        ? centsToBRL(defaultValues.amount).replace("R$", "").trim()
        : "",
      frequency: defaultValues?.frequency || "monthly",
      description: defaultValues?.description || "",
      isFamily: defaultValues?.isFamily ?? false,
      maxStudents: defaultValues?.maxStudents ?? 2,
    },
  });

  const isFamily = form.watch("isFamily");

  const handleFormSubmit = (data: PaymentPlanFormValues) => {
    onSubmit({
      name: data.name,
      amount: brlToCents(data.amount),
      frequency: data.frequency,
      description: data.description,
      isFamily: data.isFamily,
      maxStudents: data.isFamily ? data.maxStudents : 1,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-5">

        {/* Nome */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do plano</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Família Mensal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Valor + Frequência — lado a lado */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">R$</span>
                    <Input
                      type="text"
                      className="pl-9"
                      placeholder="110,00"
                      {...field}
                      onChange={(e) => field.onChange(formatBRLInput(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequência</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FREQUENCIES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o que está incluído neste plano..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Plano Família toggle */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <FormField
            control={form.control}
            name="isFamily"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <FormLabel className="text-sm font-medium cursor-pointer mb-0">
                      Plano Família
                    </FormLabel>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      field.value ? "bg-primary" : "bg-input"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                        field.value ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Permite vincular múltiplos alunos sob um mesmo responsável financeiro
                </p>
              </FormItem>
            )}
          />

          {isFamily && (
            <FormField
              control={form.control}
              name="maxStudents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Máximo de alunos</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} alunos
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="min-w-[130px]">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : isEditing ? (
              "Salvar alterações"
            ) : (
              "Criar plano"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentPlanForm;
