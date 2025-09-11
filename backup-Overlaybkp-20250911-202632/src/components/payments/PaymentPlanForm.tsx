import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPaymentPlanSchema } from "@shared/schema";
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
import { useTranslation } from "react-i18next";
import { brlToCents, centsToBRL, formatBRLInput } from "@shared/money";

// Form schema with price input as string (will be converted to cents)
const paymentPlanFormSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  amount: z.string().min(1, { message: "Valor é obrigatório" }),
  frequency: z.string(),
  description: z.string().optional(),
});

type PaymentPlanFormValues = z.infer<typeof paymentPlanFormSchema>;

interface PaymentPlanFormProps {
  defaultValues?: Partial<{
    name: string;
    amount: number; // This comes in cents from API
    frequency: string;
    description: string;
  }>;
  onSubmit: (data: { name: string; amount: number; frequency: string; description?: string }) => void;
  isLoading: boolean;
}

const PaymentPlanForm: React.FC<PaymentPlanFormProps> = ({
  defaultValues,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  
  const form = useForm<PaymentPlanFormValues>({
    resolver: zodResolver(paymentPlanFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      amount: defaultValues?.amount ? centsToBRL(defaultValues.amount).replace('R$', '').trim() : "",
      frequency: defaultValues?.frequency || "monthly",
      description: defaultValues?.description || "",
    },
  });

  const handleFormSubmit = (data: PaymentPlanFormValues) => {
    const amountInCents = brlToCents(data.amount);
    onSubmit({
      name: data.name,
      amount: amountInCents,
      frequency: data.frequency,
      description: data.description,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('plan_name')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('plan_amount')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                  <Input 
                    type="text" 
                    className="pl-9" 
                    {...field}
                    placeholder="110,00"
                    onChange={(e) => {
                      const formatted = formatBRLInput(e.target.value);
                      field.onChange(formatted);
                    }}
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
              <FormLabel>{t('plan_frequency')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('select_frequency')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="weekly">{t('weekly')}</SelectItem>
                  <SelectItem value="biweekly">{t('biweekly')}</SelectItem>
                  <SelectItem value="monthly">{t('monthly')}</SelectItem>
                  <SelectItem value="quarterly">{t('quarterly')}</SelectItem>
                  <SelectItem value="semiannual">{t('semiannual')}</SelectItem>
                  <SelectItem value="annual">{t('annual')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('plan_description')}</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2">{t('saving')}</span>
                <span className="material-icons animate-spin text-sm">refresh</span>
              </>
            ) : defaultValues?.name ? (
              t('update_plan')
            ) : (
              t('create_plan')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentPlanForm;