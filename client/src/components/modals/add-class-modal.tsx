import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertClassSessionSchema } from '@shared/schema';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const AddClassModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
}: AddClassModalProps) => {
  const { t } = useTranslations();
  
  // Extend the schema with custom validation
  const formSchema = insertClassSessionSchema.extend({
    title: z.string().min(1, { message: t('class.titleRequired') }),
    date: z.string().min(1, { message: t('class.dateRequired') }),
    startTime: z.string().min(1, { message: t('class.startTimeRequired') }),
    endTime: z.string().min(1, { message: t('class.endTimeRequired') }),
    capacity: z.preprocess(
      (val) => parseInt(val as string, 10),
      z.number().min(1, { message: t('class.capacityRequired') })
    ),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      startTime: '',
      endTime: '',
      beltLevel: 'all',
      capacity: 20
    }
  });
  
  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Convert date string to Date object for the API
    const apiData = {
      ...data,
      date: new Date(data.date).toISOString()
    };
    
    onSubmit(apiData);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>{t('class.addClass')}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {t('class.classInfo')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('class.title')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('class.fundamentals')} 
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('class.date')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
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
                name="beltLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('class.beltLevel')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || 'all'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue placeholder={t('class.allLevels')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        <SelectItem value="all">{t('class.allLevels')}</SelectItem>
                        <SelectItem value="white+">{t('student.whiteBelt')}+</SelectItem>
                        <SelectItem value="blue+">{t('student.blueBelt')}+</SelectItem>
                        <SelectItem value="purple+">{t('student.purpleBelt')}+</SelectItem>
                        <SelectItem value="brown+">{t('student.brownBelt')}+</SelectItem>
                        <SelectItem value="black">{t('student.blackBelt')}</SelectItem>
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
                    <FormLabel>{t('class.startTime')}</FormLabel>
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
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('class.endTime')}</FormLabel>
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
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('class.capacity')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        {...field} 
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClassModal;
