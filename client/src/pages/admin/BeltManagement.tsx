import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeltLevel {
  id: number;
  name: string;
  levelKey: string;
  colorCode: string;
  category: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const beltFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  levelKey: z.string().min(1, 'Chave do nível é obrigatória'),
  colorCode: z.string().min(4, 'Código de cor é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  order: z.number().min(1, 'Ordem deve ser maior que 0'),
});

type BeltFormData = z.infer<typeof beltFormSchema>;

export function BeltManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBelt, setEditingBelt] = useState<BeltLevel | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: beltsData, isLoading } = useQuery<{ belts: BeltLevel[] }>({
    queryKey: ['/api/admin/belts'],
  });

  const createBeltMutation = useMutation({
    mutationFn: async (data: BeltFormData) => {
      const response = await fetch('/api/admin/belts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create belt');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/belts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/belts'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Faixa criada com sucesso!',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar faixa. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const updateBeltMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BeltFormData> }) => {
      const response = await fetch(`/api/admin/belts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update belt');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/belts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/belts'] });
      setEditingBelt(null);
      toast({
        title: 'Sucesso',
        description: 'Faixa atualizada com sucesso!',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar faixa. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const deleteBeltMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/belts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete belt');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/belts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/belts'] });
      toast({
        title: 'Sucesso',
        description: 'Faixa removida com sucesso!',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao remover faixa. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<BeltFormData>({
    resolver: zodResolver(beltFormSchema),
    defaultValues: {
      name: '',
      levelKey: '',
      colorCode: '#000000',
      order: 1,
    },
  });

  const editForm = useForm<BeltFormData>({
    resolver: zodResolver(beltFormSchema),
  });

  const onSubmit = (data: BeltFormData) => {
    createBeltMutation.mutate(data);
  };

  const onEdit = (belt: BeltLevel) => {
    setEditingBelt(belt);
    editForm.reset({
      name: belt.name,
      levelKey: belt.levelKey,
      colorCode: belt.colorCode,
      order: belt.order,
    });
  };

  const onSaveEdit = (data: BeltFormData) => {
    if (editingBelt) {
      updateBeltMutation.mutate({ id: editingBelt.id, data });
    }
  };

  const onDelete = (id: number) => {
    if (confirm('Tem certeza que deseja remover esta faixa?')) {
      deleteBeltMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gerenciamento de Faixas</h1>
            <p className="text-muted-foreground">Configure os níveis de faixas do jiu-jitsu</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  const belts = beltsData?.belts || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Faixas</h1>
          <p className="text-muted-foreground">Configure os níveis de faixas do jiu-jitsu</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Faixa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Faixa</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Faixa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Faixa Branca" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="levelKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave do Nível</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="colorCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor da Faixa</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createBeltMutation.isPending}>
                    {createBeltMutation.isPending ? 'Criando...' : 'Criar Faixa'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faixas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {belts.map((belt) => (
              <div 
                key={belt.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                {editingBelt?.id === belt.id ? (
                  <Form {...editForm}>
                    <form 
                      onSubmit={editForm.handleSubmit(onSaveEdit)} 
                      className="flex items-center space-x-4 flex-1"
                    >
                      <FormField
                        control={editForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="levelKey"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="colorCode"
                        render={({ field }) => (
                          <FormItem className="w-16">
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="order"
                        render={({ field }) => (
                          <FormItem className="w-20">
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          size="sm" 
                          disabled={updateBeltMutation.isPending}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingBelt(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <>
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-8 h-8 rounded-full border-2" 
                        style={{ backgroundColor: belt.colorCode }}
                      />
                      <div>
                        <h3 className="font-medium">{belt.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Chave: {belt.levelKey} | Ordem: {belt.order}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {belt.colorCode}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(belt)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(belt.id)}
                        disabled={deleteBeltMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {belts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma faixa cadastrada. Clique em "Nova Faixa" para começar.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BeltManagement;