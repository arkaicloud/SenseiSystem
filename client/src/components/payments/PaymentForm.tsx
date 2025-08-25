import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentPaymentSchema } from "@shared/schema";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { centsToBRL, brlToCents, formatBRLInput } from "@shared/money";
import { CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

// Extend the payment schema for form validation
const paymentFormSchema = z.object({
  studentId: z.number({ required_error: "Selecione um aluno" }).min(1, { message: "Selecione um aluno" }),
  planId: z.number({ required_error: "Selecione um plano de pagamento" }).min(1, { message: "Selecione um plano de pagamento" }),
  status: z.enum(["paid", "pending", "overdue"], {
    required_error: "Selecione um status",
    invalid_type_error: "Status inválido",
  }).default("pending"),
  dueDate: z.date({ required_error: "Selecione a data de vencimento" }),
  paidDate: z.date().optional().nullable(),
  amount: z.number({ required_error: "Informe o valor" }).min(1, { message: "O valor deve ser maior que 0" }),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface Student {
  id: number;
  name: string;
}

interface PaymentPlan {
  id: number;
  name: string;
  amount: number;
  frequency: string;
}

interface PaymentFormProps {
  defaultValues?: Partial<PaymentFormValues>;
  students: Student[];
  plans: PaymentPlan[];
  onSubmit: (data: PaymentFormValues) => void;
  isLoading?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  defaultValues,
  students,
  plans,
  onSubmit,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      studentId: defaultValues?.studentId || 0,
      planId: defaultValues?.planId || 0,
      status: defaultValues?.status || "pending",
      dueDate: defaultValues?.dueDate || new Date(),
      paidDate: defaultValues?.paidDate || null,
      amount: defaultValues?.amount || 0,
      notes: defaultValues?.notes || "",
    },
  });

  // Watch for plan changes to update amount
  const selectedPlanId = form.watch("planId");
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  React.useEffect(() => {
    if (selectedPlan) {
      form.setValue("amount", selectedPlan.amount);
    }
  }, [selectedPlanId, form, selectedPlan]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('student')}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('select_student')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem
                      key={student.id}
                      value={student.id.toString()}
                    >
                      {student.name}
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
          name="planId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('payment_plan')}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('select_payment_plan')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem
                      key={plan.id}
                      value={plan.id.toString()}
                    >
                      {plan.name} - {centsToBRL(plan.amount)} ({t(plan.frequency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('due_date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>{t('pick_date')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 max-w-[300px]" align="start" side="bottom" sideOffset={4}>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="w-full"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('status')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_status')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="paid">{t('paid')}</SelectItem>
                    <SelectItem value="pending">{t('pending')}</SelectItem>
                    <SelectItem value="overdue">{t('overdue')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.watch("status") === "paid" && (
          <FormField
            control={form.control}
            name="paidDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('payment_date')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>{t('pick_date')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 max-w-[300px]" align="start" side="bottom" sideOffset={4}>
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      className="w-full"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('amount')} (R$)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="99,00"
                  {...field}
                  value={formatBRLInput(field.value.toString())}
                  onChange={(e) => {
                    const value = parseCurrencyBRL(e.target.value);
                    field.onChange(isNaN(value) ? 0 : value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('notes')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('payment_notes_placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-secondary hover:bg-secondary-dark"
            disabled={isLoading}
          >
            {isLoading ? t('saving') : t('save_payment')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentForm;