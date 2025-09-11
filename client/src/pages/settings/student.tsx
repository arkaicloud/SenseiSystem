import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Define form validation schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function StudentSettings() {
  const { t } = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();

  // Form setup for password change
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const handlePasswordChange = async (data: z.infer<typeof passwordSchema>) => {
    try {
      const response = await apiRequest('PUT', '/api/user/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao alterar senha');
      }

      toast({
        title: "Senha alterada",
        description: "Atualize sua senha para manter sua conta segura",
      });
      passwordForm.reset();
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao alterar senha",
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle>{t('settings.changePassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.currentPassword')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        {...field} 
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.newPassword')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        {...field} 
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      {t('settings.passwordHint')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        {...field} 
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit">
                  {t('settings.updatePassword')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle>{t('settings.notificationPreferences')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-4">{t('settings.notificationDescription')}</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">{t('settings.emailNotifications')}</h4>
                <p className="text-xs text-gray-400">{t('settings.emailNotificationsDesc')}</p>
              </div>
              <Button variant="outline" size="sm">
                {t('common.edit')}
              </Button>
            </div>
            
            <Separator className="bg-gray-700" />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">{t('settings.appNotifications')}</h4>
                <p className="text-xs text-gray-400">{t('settings.appNotificationsDesc')}</p>
              </div>
              <Button variant="outline" size="sm">
                {t('common.edit')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle>{t('settings.accountInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">{t('settings.email')}</p>
              <p className="text-md">{user?.email}</p>
            </div>
            
            <Separator className="bg-gray-700" />
            
            <div>
              <p className="text-sm text-gray-400">{t('settings.role')}</p>
              <p className="text-md capitalize">{user?.role}</p>
            </div>

            <Separator className="bg-gray-700" />
            
            <div className="pt-2">
              <Button variant="destructive" size="sm">
                {t('settings.deleteAccount')}
              </Button>
              <p className="text-xs text-gray-400 mt-2">
                {t('settings.deleteAccountWarning')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}