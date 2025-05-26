import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClassSchema } from "@shared/schema";
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

// Extend the class schema for form validation
const classFormSchema = z.object({
  name: z.string().min(3, { message: "Nome da aula é obrigatório" }),
  description: z.string().optional().nullable(),
  instructorId: z.number().optional().nullable(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Digite um horário válido no formato 24h (HH:MM)",
  }),
  duration: z.number().min(15, { message: "Duração deve ser de pelo menos 15 minutos" }),
  maxCapacity: z.number().optional().nullable(),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

interface Instructor {
  id: number;
  name: string;
}

interface ClassFormProps {
  defaultValues?: Partial<ClassFormValues>;
  instructors: Instructor[];
  onSubmit: (data: ClassFormValues) => void;
  isLoading?: boolean;
}

const ClassForm: React.FC<ClassFormProps> = ({
  defaultValues,
  instructors,
  onSubmit,
  isLoading = false,
}) => {
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
      description: "",
      instructorId: undefined,
      dayOfWeek: 1, // Monday
      startTime: "18:00",
      duration: 60,
      maxCapacity: 20,
      ...defaultValues,
    },
  });

  const daysOfWeek = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda-feira" },
    { value: 2, label: "Terça-feira" },
    { value: 3, label: "Quarta-feira" },
    { value: 4, label: "Quinta-feira" },
    { value: 5, label: "Sexta-feira" },
    { value: 6, label: "Sábado" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Aula</FormLabel>
              <FormControl>
                <Input placeholder="Aula Fundamentals" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição e detalhes da aula"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instructorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instrutor</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um instrutor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Nenhum instrutor</SelectItem>
                  {instructors.map((instructor) => (
                    <SelectItem
                      key={instructor.id}
                      value={instructor.id.toString()}
                    >
                      {instructor.name}
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
            name="dayOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia da Semana</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um dia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
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
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário de Início (24h)</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    placeholder="18:00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (minutos)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={15}
                    step={5}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxCapacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidade Máxima (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="20"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => 
                      field.onChange(e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-secondary hover:bg-secondary-dark"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar Aula"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClassForm;
