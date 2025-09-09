import React from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertStudentSchema } from '@shared/schema';
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

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  userId?: number;
}

export const AddStudentModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  userId
}: AddStudentModalProps) => {
  const { t } = useTranslations();
  
  // Extend the schema with custom validation
  const formSchema = insertStudentSchema.extend({
    name: z.string().min(1, { message: t('student.nameRequired') }),
    email: z.string().email({ message: t('student.invalidEmail') }).optional(),
    cpf: z.string().min(1, { message: t('student.cpfRequired') }),
    sex: z.enum(['M', 'F'], { 
      errorMap: () => ({ message: t('student.genderRequired') || 'Gênero é obrigatório' }) 
    }),
    modality: z.enum(['Adulto', 'Feminino', 'Kids'], { 
      errorMap: () => ({ message: t('student.modalityRequired') }) 
    }),
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      cpf: '',
      sex: 'M' as 'M' | 'F',
      modality: 'Adulto',
      street: '',
      city: '',
      state: '',
      zip: '',
      currentBelt: 'white',
      currentGrade: 0,
      isActive: true,
      userId: userId || 1 // Default to first user (admin) if no userId provided
    }
  });
  
  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>{t('student.addStudent')}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {t('student.studentInfo')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('student.fullName')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('student.email')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="student@example.com" 
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
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('student.cpf')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="000.000.000-00" 
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
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue placeholder="Selecione o gênero" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="modality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('student.modality')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || 'Adulto'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue placeholder={t('student.selectModality')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        <SelectItem value="Adulto">{t('student.adulto')}</SelectItem>
                        <SelectItem value="Feminino">{t('student.feminino')}</SelectItem>
                        <SelectItem value="Kids">{t('student.kids')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('student.street')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123 Main St" 
                        {...field} 
                        value={field.value || ''}
                        className="bg-gray-900 border-gray-700 text-white"
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
                    <FormLabel>{t('student.city')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="São Paulo" 
                        {...field} 
                        value={field.value || ''}
                        className="bg-gray-900 border-gray-700 text-white"
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
                    <FormLabel>{t('student.state')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        <SelectItem value="SP">SP</SelectItem>
                        <SelectItem value="RJ">RJ</SelectItem>
                        <SelectItem value="MG">MG</SelectItem>
                        <SelectItem value="RS">RS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('student.zip')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00000-000" 
                        {...field} 
                        value={field.value || ''}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentBelt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('student.belt')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || 'white'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue placeholder="Select belt" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white">
                        <SelectItem value="white">{t('student.whiteBelt')}</SelectItem>
                        <SelectItem value="blue">{t('student.blueBelt')}</SelectItem>
                        <SelectItem value="purple">{t('student.purpleBelt')}</SelectItem>
                        <SelectItem value="brown">{t('student.brownBelt')}</SelectItem>
                        <SelectItem value="black">{t('student.blackBelt')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('student.grade')}</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={(field.value || 0).toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-gray-700 text-white">
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

export default AddStudentModal;
