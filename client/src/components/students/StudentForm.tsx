import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BeltWithLabel } from "@/components/ui/belt";

// Extend the user schema for student creation
const studentFormSchema = insertUserSchema.extend({
  beltLevel: z.enum(["white", "blue", "purple", "brown", "black"]).default("white"),
  stripes: z.number().min(0).max(4).default(0),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  mobile: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  complement: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  defaultValues?: Partial<StudentFormValues>;
  onSubmit: (data: StudentFormValues) => void;
  isLoading?: boolean;
}

const StudentForm: React.FC<StudentFormProps> = ({
  defaultValues,
  onSubmit,
  isLoading = false,
}) => {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      role: "student",
      beltLevel: "white",
      stripes: 0,
      emergencyContact: "",
      notes: "",
      phone: "",
      mobile: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      complement: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="João" {...field} />
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
                <FormLabel>Sobrenome</FormLabel>
                <FormControl>
                  <Input placeholder="Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="joao.silva@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome de Usuário</FormLabel>
                <FormControl>
                  <Input placeholder="joaosilva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="beltLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível da Faixa</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue>
                        {field.value && (
                          <BeltWithLabel level={field.value as any} />
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="white">
                      <BeltWithLabel level="white" />
                    </SelectItem>
                    <SelectItem value="blue">
                      <BeltWithLabel level="blue" />
                    </SelectItem>
                    <SelectItem value="purple">
                      <BeltWithLabel level="purple" />
                    </SelectItem>
                    <SelectItem value="brown">
                      <BeltWithLabel level="brown" />
                    </SelectItem>
                    <SelectItem value="black">
                      <BeltWithLabel level="black" />
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stripes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grau</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Número de listras" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">0 Listras</SelectItem>
                    <SelectItem value="1">1 Listra</SelectItem>
                    <SelectItem value="2">2 Listras</SelectItem>
                    <SelectItem value="3">3 Listras</SelectItem>
                    <SelectItem value="4">4 Listras</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contatos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 9999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Celular</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="emergencyContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contato de Emergência</FormLabel>
              <FormControl>
                <Input placeholder="Nome: (11) 99999-9999" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
          
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rua/Avenida</FormLabel>
                <FormControl>
                  <Input placeholder="Rua das Flores, 123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="São Paulo" {...field} />
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
                    <Input placeholder="SP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="01234-567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="complement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl>
                  <Input placeholder="Apto 45, Bloco B" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Input placeholder="Informações adicionais" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" className="bg-secondary hover:bg-secondary-dark" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Aluno"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StudentForm;
