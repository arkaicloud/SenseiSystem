import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { beltLevelEnum, userRoleEnum, type SchoolConfig } from "@shared/schema";
import { useTranslation } from "react-i18next";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Registration form schema
const registerSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
  role: z.enum(userRoleEnum.enumValues),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  birthDate: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  beltLevel: z.enum(beltLevelEnum.enumValues).optional(),
  stripes: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)), 
    z.number().min(0).max(4).optional()
  ),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(
  (data) => {
    // If role is student, beltLevel is required
    if (data.role === "student" && !data.beltLevel) {
      return false;
    }
    return true;
  },
  {
    message: "Belt level is required for students",
    path: ["beltLevel"],
  }
);

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { t } = useTranslation();

  // Carregar configurações da escola
  const { data: schoolConfigData } = useQuery<{ config: SchoolConfig }>({
    queryKey: ['/api/school-config'],
    retry: false,
  });

  const schoolConfig = schoolConfigData?.config;

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "student", // Default is always student, no selection needed
      phone: "",
      emergencyContact: "",
      birthDate: undefined,
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      beltLevel: undefined,
      stripes: 0,
    },
  });

  // Watch role to conditionally render belt fields
  const selectedRole = registerForm.watch("role");

  // Login form submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  // Registration form submission
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    // Enviar os valores diretamente, como o birthDate já é uma string
    registerMutation.mutate(values, {
      onSuccess: () => {
        setRegistrationSuccess(true);
        // Clear form
        registerForm.reset();
      },
    });
  };

  // If user is already logged in, redirect to home
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left side - Forms */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Logo e nome da escola acima do login */}
            <div className="text-center mb-6 sm:mb-8">
              {schoolConfig?.logoUrl && (
                <div className="mb-3 sm:mb-4">
                  <img 
                    src={schoolConfig.logoUrl} 
                    alt={schoolConfig.schoolName || "Logo da Academia"} 
                    className="h-12 sm:h-16 w-auto mx-auto object-contain"
                  />
                </div>
              )}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                {schoolConfig?.schoolName || "SenseiSystem"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Sistema de Gestão para Escolas e Dojos
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('login')}</TabsTrigger>
                <TabsTrigger value="register">{t('register')}</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('login')}</CardTitle>
                    <CardDescription>
                      {t('loginDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('email')}</FormLabel>
                              <FormControl>
                                <Input placeholder="you@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('password')}</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('loggingIn')}
                            </>
                          ) : (
                            t('login')
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('createAccount')}</CardTitle>
                    <CardDescription>
                      {t('registerDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {registrationSuccess ? (
                      <Alert className="mb-4">
                        <AlertTitle>{t('registrationSuccess')}</AlertTitle>
                        <AlertDescription>
                          {t('registrationSuccessMessage')}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Form {...registerForm}>
                        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={registerForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('firstName')}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="João" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('lastName')}</FormLabel>
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
                              control={registerForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('email')}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="joao@exemplo.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('username')}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="joaosilva" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Belt Level Field - Only for students */}
                          {selectedRole === "student" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={registerForm.control}
                                name="beltLevel"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('beltLevel')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={t('selectBeltLevel')} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="white">Branca</SelectItem>
                                        <SelectItem value="blue">Azul</SelectItem>
                                        <SelectItem value="purple">Roxa</SelectItem>
                                        <SelectItem value="brown">Marrom</SelectItem>
                                        <SelectItem value="black">Preta</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={registerForm.control}
                                name="stripes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('stripes')}</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Faixas" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="0">0 faixas</SelectItem>
                                        <SelectItem value="1">1 faixa</SelectItem>
                                        <SelectItem value="2">2 faixas</SelectItem>
                                        <SelectItem value="3">3 faixas</SelectItem>
                                        <SelectItem value="4">4 faixas</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={registerForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('password')}</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('confirmPassword')}</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button
                            type="submit"
                            className="w-full"
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('creatingAccount')}
                              </>
                            ) : (
                              t('createAccount')
                            )}
                          </Button>
                        </form>
                      </Form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right side - Hero section */}
        <div className="flex-1 bg-primary p-6 flex flex-col justify-center text-white">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-6">Bem-vindo ao Senseisystem</h1>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="mr-3 bg-white text-primary p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <div>
                  <h3 className="font-semibold">{t('trackAttendanceFeature')}</h3>
                  <p>{t('trackAttendanceDescription')}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 bg-white text-primary p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                </div>
                <div>
                  <h3 className="font-semibold">{t('beltProgressionFeature')}</h3>
                  <p>{t('beltProgressionDescription')}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 bg-white text-primary p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </div>
                <div>
                  <h3 className="font-semibold">{t('classScheduleFeature')}</h3>
                  <p>{t('classScheduleDescription')}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-3 bg-white text-primary p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-credit-card"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                </div>
                <div>
                  <h3 className="font-semibold">{t('paymentManagementFeature')}</h3>
                  <p>{t('paymentManagementDescription')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer with school contact information */}
      <footer className="bg-muted border-t px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="text-center md:text-left mb-2 md:mb-0">
            <span className="font-medium">Sistema de Gestão para Escolas e Dojos</span>
          </div>
          
          {/* Informações de contato da escola */}
          {schoolConfig && (
            <div className="flex flex-col md:flex-row gap-4 text-center md:text-right">
              {schoolConfig.address && (
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>{schoolConfig.address}</span>
                </div>
              )}
              
              {schoolConfig.phone && (
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>{schoolConfig.phone}</span>
                </div>
              )}
              
              {schoolConfig.website && (
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <a href={schoolConfig.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {schoolConfig.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}