import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  FileText, 
  Activity, 
  Scale,
  Calendar,
  Heart,
  Award,
  Users,
  Upload,
  Save,
  X,
  FileCheck,
  Clock,
  Shield
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Schema completo para edição de aluno
const studentEditSchema = z.object({
  // Dados Pessoais
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  birthDate: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  gender: z.enum(["M", "F", "O"]).optional(),
  
  // Contato
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  
  // Endereço
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  
  // Saúde e Graduação
  healthQuestions: z.object({
    q1: z.boolean().default(false),
    q2: z.boolean().default(false),
    q3: z.boolean().default(false),
    q4: z.boolean().default(false),
    q5: z.boolean().default(false),
    q6: z.boolean().default(false),
    q7: z.boolean().default(false),
  }).optional(),
  medicalObservations: z.string().optional(),
  beltLevel: z.string().default("white"),
  lastPromotionDate: z.string().optional(),
  
  // Responsável Financeiro
  financialResponsibleName: z.string().optional(),
  financialResponsibleCpf: z.string().optional(),
  financialResponsibleEmail: z.string().optional(),
  financialResponsiblePhone: z.string().optional(),
  financialResponsibleRelation: z.string().optional(),
  
  // Plano
  paymentPlanId: z.number().optional(),
  planObservations: z.string().optional(),
  
  // Avaliação Física
  physicalAssessment: z.object({
    date: z.string().optional(),
    evaluator: z.string().optional(),
    height: z.number().optional(),
    weight: z.number().optional(),
    flexibility: z.number().optional(),
    strength: z.number().optional(),
    resistance: z.number().optional(),
    observations: z.string().optional(),
  }).optional(),
});

type StudentEditValues = z.infer<typeof studentEditSchema>;

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  cpf?: string;
  rg?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  student?: {
    beltLevel?: string;
    lastPromotionDate?: string;
    financialResponsibleName?: string;
    financialResponsibleCpf?: string;
    financialResponsibleEmail?: string;
    financialResponsiblePhone?: string;
    financialResponsibleRelation?: string;
    paymentPlanId?: number;
    medicalObservations?: string;
    planObservations?: string;
  };
}

interface StudentEditDialogProps {
  studentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentEditDialog({ studentId, open, onOpenChange }: StudentEditDialogProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch student data
  const { data: student, isLoading } = useQuery<Student>({
    queryKey: [`/api/users/${studentId}`],
    enabled: !!studentId && open,
  });

  // Fetch payment plans
  const { data: paymentPlansData } = useQuery<{ plans: any[] }>({
    queryKey: ["/api/payment-plans"],
  });

  // Fetch belt levels
  const { data: beltLevels } = useQuery({
    queryKey: ["/api/admin/belts"],
  });

  const form = useForm<StudentEditValues>({
    resolver: zodResolver(studentEditSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      beltLevel: "white",
      healthQuestions: {
        q1: false, q2: false, q3: false, q4: false, q5: false, q6: false, q7: false
      },
      physicalAssessment: {
        height: 0,
        weight: 0,
        flexibility: 0,
        strength: 0,
        resistance: 0,
      },
    },
  });

  // Load student data into form
  useEffect(() => {
    if (student && open) {
      form.reset({
        firstName: student.firstName || "",
        lastName: student.lastName || "",
        email: student.email || "",
        phone: student.phone || "",
        birthDate: student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : "",
        cpf: student.cpf || "",
        rg: student.rg || "",
        zipCode: student.zipCode || "",
        street: student.street || "",
        number: student.number || "",
        complement: student.complement || "",
        neighborhood: student.neighborhood || "",
        city: student.city || "",
        state: student.state || "",
        emergencyContactName: (student as any).emergencyContact || "",
        emergencyContactPhone: (student as any).emergencyPhone || "",
        beltLevel: student.student?.beltLevel || "white",
        lastPromotionDate: student.student?.lastPromotionDate ? 
          new Date(student.student.lastPromotionDate).toISOString().split('T')[0] : "",
        financialResponsibleName: student.student?.financialResponsibleName || "",
        financialResponsibleCpf: student.student?.financialResponsibleCpf || "",
        financialResponsibleEmail: student.student?.financialResponsibleEmail || "",
        financialResponsiblePhone: student.student?.financialResponsiblePhone || "",
        financialResponsibleRelation: student.student?.financialResponsibleRelation || "",
        paymentPlanId: student.student?.paymentPlanId || undefined,
        medicalObservations: student.student?.medicalObservations || "",
        planObservations: student.student?.planObservations || "",
      });
    }
  }, [student, open, form]);

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async (data: StudentEditValues) => {
      const response = await fetch(`/api/users/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar aluno');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Dados do aluno atualizados com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${studentId}`] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar aluno: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StudentEditValues) => {
    updateStudentMutation.mutate(data);
  };

  const paymentPlans = paymentPlansData?.plans || [];

  const formatCurrency = (amountInCents: number) => {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const calculateIMC = (height: number, weight: number) => {
    if (height && weight) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return "0";
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-background border-border">
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Carregando dados do aluno...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col bg-background border-border">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b border-border pb-4">
          <DialogTitle className="text-foreground flex items-center gap-2">
            <User className="h-5 w-5" />
            Edição Completa do Aluno - {student?.firstName} {student?.lastName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Gerenciar informações completas do aluno incluindo dados pessoais, contato, saúde e documentos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="sticky top-0 z-10 grid w-full grid-cols-9 bg-muted h-16 p-2 mb-4 shadow-sm">
                <TabsTrigger value="personal" className="text-sm p-3 flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <User className="h-5 w-5" />
                  <span className="text-xs">Dados Pessoais</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="text-sm p-3 flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Phone className="h-5 w-5" />
                  <span className="text-xs">Contato</span>
                </TabsTrigger>
                <TabsTrigger value="address" className="text-sm p-3 flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <MapPin className="h-5 w-5" />
                  <span className="text-xs">Endereço</span>
                </TabsTrigger>
                <TabsTrigger value="health" className="text-sm p-3 flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Heart className="h-5 w-5" />
                  <span className="text-xs">Saúde e Graduação</span>
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-sm p-3 flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Responsável Financeiro</span>
                </TabsTrigger>
                <TabsTrigger value="plan" className="text-sm p-3 flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Plano</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-sm p-3 flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Documentos</span>
                </TabsTrigger>
                <TabsTrigger value="physical" className="text-sm p-3 flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Activity className="h-5 w-5" />
                  <span className="text-xs">Avaliação Física</span>
                </TabsTrigger>
                <TabsTrigger value="contract" className="text-sm p-3 flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileCheck className="h-5 w-5" />
                  <span className="text-xs">Termos</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">

              {/* Tab 1: Dados Pessoais */}
              <TabsContent value="personal" className="space-y-6 mt-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Dados Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Nome *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-input border-border text-foreground"
                                placeholder="Nome é obrigatório"
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
                            <FormLabel className="text-foreground">Sobrenome *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-input border-border text-foreground"
                                placeholder="Sobrenome é obrigatório"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Data de Nascimento</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date"
                                className="bg-input border-border text-foreground"
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
                            <FormLabel className="text-foreground">CPF</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-input border-border text-foreground"
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
                            <FormLabel className="text-foreground">RG</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-input border-border text-foreground"
                                placeholder="00.000.000-0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Sexo (opcional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-input border-border text-foreground">
                                <SelectValue placeholder="Selecionar sexo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="M">Masculino</SelectItem>
                              <SelectItem value="F">Feminino</SelectItem>
                              <SelectItem value="O">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Contato */}
              <TabsContent value="contact" className="space-y-6 mt-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Informações de Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">E-mail *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email"
                                className="bg-input border-border text-foreground"
                                placeholder="E-mail é obrigatório"
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
                            <FormLabel className="text-foreground">Telefone Celular</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-input border-border text-foreground"
                                placeholder="(00) 00000-0000"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="bg-border" />
                    
                    <div>
                      <h4 className="text-primary font-medium mb-4">Contato de Emergência</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="emergencyContactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Nome</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-input border-border text-foreground"
                                  placeholder="Nome do contato de emergência"
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
                              <FormLabel className="text-foreground">Telefone</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-input border-border text-foreground"
                                  placeholder="Telefone do contato de emergência"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Endereço */}
              <TabsContent value="address" className="space-y-6 mt-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Endereço
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">CEP</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white"
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
                            <FormLabel className="text-gray-300">Logradouro</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="Rua, Avenida, etc."
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
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Número</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="123"
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
                            <FormLabel className="text-gray-300">Complemento</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="Apto, Casa, etc."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Bairro</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="Bairro"
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
                            <FormLabel className="text-gray-300">Cidade</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="Cidade"
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
                            <FormLabel className="text-gray-300">Estado</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="SP"
                                maxLength={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: Saúde e Graduação */}
              <TabsContent value="health" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Questionário de Saúde PAR-Q
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Responda SIM ou NÃO para cada pergunta abaixo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        "Algum médico já disse que você possui algum problema de coração?",
                        "Você sente dores no peito quando pratica atividade física?",
                        "No último mês, você sentiu dores no peito quando não estava praticando atividade física?",
                        "Você apresenta desequilíbrio devido à tontura e/ou perda de consciência?",
                        "Você tem algum problema ósseo ou articular que poderia ser piorado pela atividade física?",
                        "Algum médico já recomendou o uso de medicamentos para sua pressão arterial ou condição do coração?",
                        "Você tem conhecimento, através da sua própria experiência e/ou aconselhamento médico, de alguma outra razão física que o impeça de participar de atividades físicas?"
                      ].map((question, index) => (
                        <FormField
                          key={index}
                          control={form.control}
                          name={`healthQuestions.q${index + 1}` as any}
                          render={({ field }) => (
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                              />
                              <label className="text-sm text-gray-300">
                                {index + 1}. {question}
                              </label>
                            </div>
                          )}
                        />
                      ))}

                      <FormField
                        control={form.control}
                        name="medicalObservations"
                        render={({ field }) => (
                          <FormItem className="mt-6">
                            <FormLabel className="text-gray-300">Observações Médicas</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                                placeholder="Descreva qualquer condição médica relevante, medicamentos em uso ou outras observações importantes..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Graduação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="beltLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Faixa Atual *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                  <SelectValue placeholder="Selecionar faixa" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-700 border-gray-600">
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
                            <FormLabel className="text-gray-300">Última Troca de Faixa</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date"
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab 5: Responsável Financeiro */}
              <TabsContent value="financial" className="space-y-6 mt-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Responsável Financeiro
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Como o aluno é menor de idade, é obrigatório informar um responsável financeiro
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="financialResponsibleRelation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Grau de Parentesco *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Selecionar parentesco" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="self">Próprio aluno</SelectItem>
                              <SelectItem value="parent">Pai/Mãe</SelectItem>
                              <SelectItem value="guardian">Responsável Legal</SelectItem>
                              <SelectItem value="spouse">Cônjuge</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="financialResponsibleName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Nome Completo *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="Nome é obrigatório"
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
                            <FormLabel className="text-gray-300">CPF *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="000.000.000-00"
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
                        name="financialResponsibleEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">E-mail</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email"
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="email@exemplo.com"
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
                            <FormLabel className="text-gray-300">Telefone</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="(00) 00000-0000"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 6: Plano */}
              <TabsContent value="plan" className="space-y-6 mt-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Plano de Mensalidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="paymentPlanId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Tipo de Plano *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Selecionar plano" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              {paymentPlans.map((plan: any) => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  {plan.name} - {formatCurrency(plan.amount)}
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
                      name="planObservations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Observações do Plano</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="Informações adicionais sobre o plano, descontos, promoções, etc."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 7: Documentos */}
              <TabsContent value="documents" className="space-y-6 mt-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-blue-400 font-medium">RG (Frente e Verso)</h4>
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-400 mb-2">Clique para fazer upload ou arraste o arquivo aqui</p>
                          <p className="text-xs text-gray-500">PDF, JPG ou PNG, máx. 5MB</p>
                          <Badge variant="secondary" className="mt-2">Pendente</Badge>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-blue-400 font-medium">CPF</h4>
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-400 mb-2">Clique para fazer upload ou arraste o arquivo aqui</p>
                          <p className="text-xs text-gray-500">PDF, JPG ou PNG, máx. 5MB</p>
                          <Badge variant="secondary" className="mt-2">Pendente</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <FileText className="h-4 w-4 mr-2" />
                        Baixar Todos os Documentos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 8: Avaliação Física */}
              <TabsContent value="physical" className="space-y-6 mt-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Avaliação Física
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Dados opcionais para acompanhamento do desenvolvimento físico do aluno
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="physicalAssessment.date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Data da Avaliação</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date"
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="physicalAssessment.evaluator"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Avaliador</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-gray-700 border-gray-600 text-white"
                                placeholder="Nome do professor/avaliador"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <h4 className="text-blue-400 font-medium mb-4">Medidas Corporais</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="physicalAssessment.height"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Altura (cm)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  className="bg-gray-700 border-gray-600 text-white"
                                  placeholder="170"
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="physicalAssessment.weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Peso (kg)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  className="bg-gray-700 border-gray-600 text-white"
                                  placeholder="70"
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <label className="text-gray-300 text-sm font-medium">IMC</label>
                          <div className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white">
                            {calculateIMC(
                              form.watch("physicalAssessment.height") || 0,
                              form.watch("physicalAssessment.weight") || 0
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-gray-300 text-sm font-medium">Categoria</label>
                          <div className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white">
                            {(() => {
                              const imc = Number(calculateIMC(
                                form.watch("physicalAssessment.height") || 0,
                                form.watch("physicalAssessment.weight") || 0
                              ));
                              if (imc < 18.5) return "Abaixo do peso";
                              if (imc < 25) return "Normal";
                              if (imc < 30) return "Sobrepeso";
                              return "Obesidade";
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-blue-400 font-medium mb-4">Testes Físicos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="physicalAssessment.flexibility"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Flexibilidade (0-10)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  min="0"
                                  max="10"
                                  className="bg-gray-700 border-gray-600 text-white"
                                  placeholder="0"
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Teste de sentar e alcançar</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="physicalAssessment.strength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Força (0-10)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  min="0"
                                  max="10"
                                  className="bg-gray-700 border-gray-600 text-white"
                                  placeholder="0"
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Teste de flexão de braço</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="physicalAssessment.resistance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Resistência (0-10)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  min="0"
                                  max="10"
                                  className="bg-gray-700 border-gray-600 text-white"
                                  placeholder="0"
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <p className="text-xs text-gray-500">Teste de resistência cardiovascular</p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="physicalAssessment.observations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Observações Técnicas</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                              placeholder="Observações sobre o desempenho, limitações, pontos de melhoria, etc."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 9: Contrato/Termos */}
              <TabsContent value="contract" className="space-y-6 mt-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <FileCheck className="h-5 w-5" />
                      Contrato e Termos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-600 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 dark:text-green-400 font-medium">Contrato assinado digitalmente</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          <Clock className="h-4 w-4 inline mr-2" />
                          Data: 5 de agosto de 2025 às 01:46
                        </p>
                        <p className="text-muted-foreground">
                          <Shield className="h-4 w-4 inline mr-2" />
                          IP: 192.168.1.100
                        </p>
                        <p className="text-muted-foreground">
                          <User className="h-4 w-4 inline mr-2" />
                          Responsável: Sistema Administrativo
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" className="border-border text-foreground hover:bg-accent">
                        <FileText className="h-4 w-4 mr-2" />
                        Remover Assinatura
                      </Button>
                      <Button variant="outline" className="border-border text-foreground hover:bg-accent">
                        <Mail className="h-4 w-4 mr-2" />
                        Reenviar Termos
                      </Button>
                      <Button variant="outline" className="border-border text-foreground hover:bg-accent">
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar PDF
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-primary font-medium">Conteúdo do Contrato</h4>
                      <div className="bg-muted border border-border rounded-lg p-4 max-h-64 overflow-y-auto">
                        <div className="text-foreground text-sm space-y-2">
                          <h5 className="font-medium">§3.1 Da Contratada:</h5>
                          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            <li>Ministrar as aulas conforme cronograma estabelecido;</li>
                            <li>Fornecer orientação técnica qualificada;</li>
                            <li>Manter as instalações em condições adequadas;</li>
                            <li>Zelar pela segurança dos alunos;</li>
                          </ul>
                          
                          <h5 className="font-medium mt-4">§3.2 Do Contratante:</h5>
                          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            <li>Efetuar o pagamento das mensalidades nas datas acordadas;</li>
                            <li>Respeitar as normas internas da academia;</li>
                            <li>Comunicar qualquer problema de saúde relevante;</li>
                          </ul>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="border-border text-foreground hover:bg-accent">
                        <Upload className="h-4 w-4 mr-2" />
                        Restaurar Modelo
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-primary font-medium">Histórico de Aceites</h4>
                      <div className="bg-muted border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-foreground font-medium">Aceite Digital Registrado</p>
                            <p className="text-muted-foreground text-sm">5 de agosto de 2025 às 01:46</p>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                            Válido
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              </div>
            </Tabs>

            <div className="flex justify-between items-center pt-6 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-border text-foreground hover:bg-accent"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  Visualizar como Aluno
                </Button>
                
                <Button 
                  type="submit"
                  disabled={updateStudentMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {updateStudentMutation.isPending ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}