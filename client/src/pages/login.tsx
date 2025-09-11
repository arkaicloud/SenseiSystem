import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginSchema } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from '@/hooks/use-translations';
import TransitionGate from '@/components/ui/TransitionGate';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import LanguageSwitcher from '@/components/layout/language-switcher';

export default function Login() {
  const { t } = useTranslations();
  const { login, error, clearError, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  const [rememberMe, setRememberMe] = useState(false);
  const [showTransitionGate, setShowTransitionGate] = useState(false);
  const [userRole, setUserRole] = useState<string>('student');

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      clearError();
      const result = await login(data.email, data.password);
      
      // Não navegar imediatamente - mostrar TransitionGate
      if (result?.user?.role) {
        setUserRole(result.user.role);
        setShowTransitionGate(true);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      
      {showTransitionGate && (
        <TransitionGate 
          userRole={userRole}
          text="Carregando seu dojo..."
          onComplete={() => setShowTransitionGate(false)}
        />
      )}
      
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Jiujitsu Manager</CardTitle>
          <CardDescription className="text-center text-gray-400">
            {t('auth.loginToAccount')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-900 border-red-800 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your@email.com" 
                        {...field} 
                        className="bg-gray-900 border-gray-700 text-white"
                        autoComplete="email"
                        onChange={(e) => {
                          field.onChange(e);
                          clearError();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="bg-gray-900 border-gray-700 text-white"
                        autoComplete="current-password"
                        onChange={(e) => {
                          field.onChange(e);
                          clearError();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember-me" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label 
                    htmlFor="remember-me" 
                    className="text-sm text-gray-400 cursor-pointer"
                  >
                    {t('auth.rememberMe')}
                  </label>
                </div>
                <Link href="/forgot-password">
                  <a className="text-sm font-medium text-primary hover:text-blue-400">
                    {t('auth.forgotPassword')}
                  </a>
                </Link>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? t('common.loading') : t('auth.login')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-400">
            {t('auth.dontHaveAccount')}{' '}
            <Link href="/register">
              <a className="font-medium text-primary hover:text-blue-400">
                {t('auth.signUp')}
              </a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
