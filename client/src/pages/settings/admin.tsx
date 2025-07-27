import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
const formSchema = z.object({
  schoolName: z.string().min(1, 'School name is required'),
  openingTime: z.string().min(1, 'Opening time is required'),
  closingTime: z.string().min(1, 'Closing time is required'),
  logoUrl: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().optional(),
});

export default function AdminSettings() {
  const { t } = useTranslations();
  const { toast } = useToast();

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schoolName: 'Jiujitsu Academy', // Default values would come from API
      openingTime: '06:00',
      closingTime: '22:00',
      logoUrl: '',
      address: '',
      phone: '',
      email: '',
      website: ''
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      console.log('Saving admin settings:', data);
      // API call would happen here
      
      toast({
        title: t('settings.saveSuccess'),
        description: t('settings.settingsUpdated'),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.saveFailed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{t('settings.schoolSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.schoolName')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="openingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.openingTime')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="time"
                          {...field} 
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="closingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.closingTime')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="time"
                          {...field} 
                          className="bg-gray-900 border-gray-700 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.logoUrl')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="https://example.com/logo.png"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      {t('settings.logoDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>{t('settings.contactInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.address')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="123 Main St, City"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.phone')}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="+1 (555) 123-4567"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.email')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          {...field} 
                          className="bg-gray-900 border-gray-700 text-white"
                          placeholder="contact@academy.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.website')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="https://academy.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}