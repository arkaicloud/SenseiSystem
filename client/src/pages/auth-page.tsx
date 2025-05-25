import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { beltLevelEnum, userRoleEnum } from "@shared/schema";
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
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
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
                                  <Input placeholder="John" {...field} />
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
                                  <Input placeholder="Doe" {...field} />
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
                                  <Input placeholder="you@example.com" {...field} />
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
                                  <Input placeholder="johndoe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('phone')}</FormLabel>
                                <FormControl>
                                  <Input placeholder="(555) 123-4567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="emergencyContact"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('emergencyContact')}</FormLabel>
                                <FormControl>
                                  <Input placeholder="Contact name and number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                          
                        {/* Campo de data de nascimento temporariamente removido */}
                          
                        <div>
                          <h3 className="text-lg font-medium mb-2">{t('address')}</h3>
                            
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <FormField
                              control={registerForm.control}
                              name="zipCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('zipCode')}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="12345-678" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                // Função para buscar endereço por CEP poderia ser implementada aqui
                                alert('Funcionalidade de busca de endereço a ser implementada');
                              }}
                              className="mt-8"
                            >
                              {t('searchAddress')}
                            </Button>
                          </div>
                            
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={registerForm.control}
                              name="street"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('street')}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Street name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('number')}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                            
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={registerForm.control}
                              name="complement"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('complement')}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Apt 4B" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="neighborhood"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('neighborhood')}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Downtown" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                            
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={registerForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('city')}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="City" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={registerForm.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('state')}</FormLabel>
                                  <FormControl>
                                    <Input placeholder="State" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Role field removed - all new users will be registered as "student" by default */}

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
                                      <SelectItem value="white">{t('whiteBelt')}</SelectItem>
                                      <SelectItem value="blue">{t('blueBelt')}</SelectItem>
                                      <SelectItem value="purple">{t('purpleBelt')}</SelectItem>
                                      <SelectItem value="brown">{t('brownBelt')}</SelectItem>
                                      <SelectItem value="black">{t('blackBelt')}</SelectItem>
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
                                  <Select
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    defaultValue={field.value?.toString() || "0"}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t('numberOfStripes')} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="0">0</SelectItem>
                                      <SelectItem value="1">1</SelectItem>
                                      <SelectItem value="2">2</SelectItem>
                                      <SelectItem value="3">3</SelectItem>
                                      <SelectItem value="4">4</SelectItem>
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
          <h1 className="text-3xl font-bold mb-6">SenseiSystem</h1>
          <h2 className="text-2xl font-semibold mb-4">{t('appDescription')}</h2>
          <p className="mb-6 text-lg">
            {t('appSubDescription')}
          </p>
          
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
  );
}