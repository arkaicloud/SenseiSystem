import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, User, Award, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { beltLevelEnum } from "@shared/schema";

// Schemas para cada etapa
const step1Schema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
});

const step2Schema = z.object({
  beltLevel: z.enum(beltLevelEnum.enumValues, { required_error: "Selecione sua graduação atual" }),
  stripes: z.preprocess((val) => (val === "" ? 0 : Number(val)), z.number().min(0).max(4)),
});

const step3Schema = z.object({
  username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type OnboardingData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema> & z.infer<typeof step3Schema>;

interface StudentOnboardingProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function StudentOnboarding({ onBack, onSuccess }: StudentOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { registerMutation, error } = useAuth();
  const { t } = useTranslations();

  // Forms para cada etapa
  const step1Form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const step2Form = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      beltLevel: undefined,
      stripes: 0,
    },
  });

  const step3Form = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleStep1Submit = (data: z.infer<typeof step1Schema>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: z.infer<typeof step2Schema>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleStep3Submit = async (data: z.infer<typeof step3Schema>) => {
    const completeData = { ...onboardingData, ...data } as OnboardingData;
    setIsSubmitting(true);

    try {
      await registerMutation.mutateAsync({
        firstName: completeData.firstName,
        lastName: completeData.lastName,
        username: completeData.username,
        email: completeData.email,
        password: completeData.password,
        confirmPassword: completeData.confirmPassword,
        role: "student" as const,
        phone: completeData.phone,
        beltLevel: completeData.beltLevel,
        stripes: completeData.stripes,
        emergencyContact: "",
        birthDate: undefined,
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      });
      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / 3) * 100;

  const steps = [
    { number: 1, title: "Informações Básicas", icon: User },
    { number: 2, title: "Graduação Atual", icon: Award },
    { number: 3, title: "Criar Conta", icon: Lock },
  ];

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Matrícula Realizada!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Sua conta foi criada e está aguardando aprovação. Você será notificado quando for ativada.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header com progresso */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Matrícula na Academia</h2>
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Etapa {currentStep} de 3</span>
            <span>{Math.round(progressPercentage)}% concluído</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        {/* Indicadores de etapas */}
        <div className="flex justify-between mt-4">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex flex-col items-center space-y-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                      ? 'bg-primary text-white' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className={`text-xs text-center ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conteúdo das etapas */}
      <Card>
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Etapa 1: Informações Básicas */}
          {currentStep === 1 && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Vamos começar com suas informações básicas</h3>
                <p className="text-sm text-muted-foreground">
                  Precisamos de alguns dados básicos para criar sua conta na academia.
                </p>
              </div>
              
              <Form {...step1Form}>
                <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={step1Form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input placeholder="João" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={step1Form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome *</FormLabel>
                          <FormControl>
                            <Input placeholder="Silva" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={step1Form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail *</FormLabel>
                        <FormControl>
                          <Input placeholder="joao@exemplo.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step1Form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="min-w-24">
                      Próximo <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Etapa 2: Graduação */}
          {currentStep === 2 && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Qual sua graduação atual?</h3>
                <p className="text-sm text-muted-foreground">
                  Isso nos ajuda a entender seu nível e direcioná-lo para as turmas adequadas.
                </p>
              </div>
              
              <Form {...step2Form}>
                <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
                  <FormField
                    control={step2Form.control}
                    name="beltLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduação Atual *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione sua graduação" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                    control={step2Form.control}
                    name="stripes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Graus</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o número de graus" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Sem graus</SelectItem>
                            <SelectItem value="1">1 grau</SelectItem>
                            <SelectItem value="2">2 graus</SelectItem>
                            <SelectItem value="3">3 graus</SelectItem>
                            <SelectItem value="4">4 graus</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>
                    <Button type="submit" className="min-w-24">
                      Próximo <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Etapa 3: Criar Conta */}
          {currentStep === 3 && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Criar sua conta</h3>
                <p className="text-sm text-muted-foreground">
                  Por último, escolha um nome de usuário e senha para acessar o sistema.
                </p>
              </div>
              
              <Form {...step3Form}>
                <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-4">
                  <FormField
                    control={step3Form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Usuário *</FormLabel>
                        <FormControl>
                          <Input placeholder="joaosilva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={step3Form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={step3Form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="min-w-32">
                      {isSubmitting ? "Criando conta..." : "Finalizar Matrícula"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}