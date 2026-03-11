import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginSchema } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from '@/hooks/use-translations';
import TransitionGate from '@/components/ui/TransitionGate';
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
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import LanguageSwitcher from '@/components/layout/language-switcher';
import loginBg from '@assets/623672939_18075453335579318_4231356417421325038_n_1773257814964.webp';

export default function Login() {
  const { t } = useTranslations();
  const { login, error, clearError, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  const [rememberMe, setRememberMe] = useState(false);
  const [showTransitionGate, setShowTransitionGate] = useState(false);
  const [userRole, setUserRole] = useState<string>('student');
  const [showPassword, setShowPassword] = useState(false);

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
      
      if (result && 'user' in result && result.user?.role) {
        setUserRole(result.user.role);
        setShowTransitionGate(true);
      } else {
        setShowTransitionGate(true);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] font-inter">
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

      <div className="vyta-hero h-[280px] sm:h-[320px]">
        <img
          src={loginBg}
          alt="Martial Arts"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="vyta-hero-gradient" />
        <div className="vyta-hero-content flex flex-col justify-between h-full p-6">
          <div className="pt-2">
            <span className="text-[22px] font-bold text-white tracking-[2px] font-inter">
              SENSEI
            </span>
          </div>
          <div className="pb-2">
            <h1 className="text-[32px] font-bold text-white leading-[38px] font-inter">
              Seu dojo digital.
            </h1>
            <p className="text-[15px] text-white/80 font-inter mt-2">
              Gerencie sua academia com facilidade.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 pt-8 pb-8 -mt-4 bg-white rounded-t-3xl relative z-10">
        <h2 className="text-[22px] font-bold text-[#0D0D0D] font-inter mb-1">
          Entrar
        </h2>
        <p className="text-[14px] text-[#8D8D8D] font-inter mb-6">
          {t('auth.loginToAccount')}
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4 bg-[#FEE2E2] border-[#EF4444] text-[#EF4444] rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-medium text-[#0D0D0D] font-inter">
                    {t('auth.email')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="seu@email.com" 
                      {...field} 
                      className="h-[48px] bg-[#F0F2F7] border-[#E8EAF0] text-[#0D0D0D] rounded-xl font-inter text-[15px] placeholder:text-[#B0B0B0] focus:ring-2 focus:ring-[#2B54FF] focus:border-transparent"
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
                  <FormLabel className="text-[14px] font-medium text-[#0D0D0D] font-inter">
                    {t('auth.password')}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                        className="h-[48px] bg-[#F0F2F7] border-[#E8EAF0] text-[#0D0D0D] rounded-xl font-inter text-[15px] placeholder:text-[#B0B0B0] focus:ring-2 focus:ring-[#2B54FF] focus:border-transparent pr-12"
                        autoComplete="current-password"
                        onChange={(e) => {
                          field.onChange(e);
                          clearError();
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0B0B0] hover:text-[#8D8D8D] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
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
                  className="border-[#E8EAF0] data-[state=checked]:bg-[#2B54FF] data-[state=checked]:border-[#2B54FF]"
                />
                <label 
                  htmlFor="remember-me" 
                  className="text-[13px] text-[#8D8D8D] cursor-pointer font-inter"
                >
                  {t('auth.rememberMe')}
                </label>
              </div>
              <Link href="/forgot-password">
                <a className="text-[13px] font-medium text-[#2B54FF] font-inter">
                  {t('auth.forgotPassword')}
                </a>
              </Link>
            </div>
            
            <button 
              type="submit" 
              className="vyta-btn-primary w-full h-[52px] flex items-center justify-center disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('auth.login')
              )}
            </button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-[14px] text-[#8D8D8D] font-inter">
            {t('auth.dontHaveAccount')}{' '}
            <Link href="/register">
              <a className="font-semibold text-[#2B54FF] font-inter">
                {t('auth.signUp')}
              </a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
