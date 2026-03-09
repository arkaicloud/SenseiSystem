import React from "react";
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
import { Loader2 } from "lucide-react";
import { brlToCents, centsToBRL, formatBRLInput } from "@shared/money";

const paymentPlanFormSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  amount: z.string().min(1, { message: "Valor é obrigatório" }),
  frequency: z.string().min(1, { message: "Frequência é obrigatória" }),
  description: z.string().optional(),
});

type PaymentPlanFormValues = z.infer<typeof paymentPlanFormSchema>;

interface PaymentPlanFormProps {
  defaultValues?: Partial<{
    name: string;
    amount: number;
    frequency: string;
    description: string;
  }>;
  onSubmit: (data: { name: string; amount: number; frequency: string; description?: string }) => void;
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
    },
  });

  const handleFormSubmit = (data: PaymentPlanFormValues) => {
    onSubmit({
      name: data.name,
      amount: brlToCents(data.amount),
      frequency: data.frequency,
      description: data.description,
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
                <Input placeholder="Ex: Mensal Básico" {...field} />
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
