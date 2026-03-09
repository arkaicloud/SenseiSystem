import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Ticket, Search, Loader2, GraduationCap } from "lucide-react";

type Coupon = {
  id: number;
  code: string;
  description: string | null;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
};

const couponFormSchema = z.object({
  code: z.string().min(2, "Código deve ter ao menos 2 caracteres").max(50).toUpperCase(),
  description: z.string().optional(),
  discountPercent: z.coerce
    .number()
    .min(1, "Desconto mínimo é 1%")
    .max(100, "Desconto máximo é 100%"),
  maxUses: z.coerce.number().min(1).nullable().optional(),
  active: z.boolean().default(true),
  expiresAt: z.string().optional().nullable(),
});

type CouponFormData = z.infer<typeof couponFormSchema>;

export default function CouponsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ coupons: Coupon[] }>({
    queryKey: ["/api/coupons"],
  });

  const coupons = data?.coupons || [];
  const filtered = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      description: "",
      discountPercent: 10,
      maxUses: null,
      active: true,
      expiresAt: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CouponFormData) =>
      apiRequest("POST", "/api/coupons", {
        ...data,
        code: data.code.toUpperCase(),
        maxUses: data.maxUses || null,
        expiresAt: data.expiresAt || null,
        description: data.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({ title: "Cupom criado com sucesso!" });
      setDialogOpen(false);
      form.reset();
    },
    onError: async (error: any) => {
      const msg = error?.message || "Erro ao criar cupom";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CouponFormData> }) =>
      apiRequest("PUT", `/api/coupons/${id}`, {
        ...data,
        code: data.code?.toUpperCase(),
        maxUses: data.maxUses || null,
        expiresAt: data.expiresAt || null,
        description: data.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({ title: "Cupom atualizado!" });
      setDialogOpen(false);
      setEditingCoupon(null);
      form.reset();
    },
    onError: async (error: any) => {
      const msg = error?.message || "Erro ao atualizar cupom";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({ title: "Cupom excluído!" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Erro ao excluir cupom", variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingCoupon(null);
    form.reset({
      code: "",
      description: "",
      discountPercent: 10,
      maxUses: undefined,
      active: true,
      expiresAt: null,
    });
    setDialogOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    form.reset({
      code: coupon.code,
      description: coupon.description || "",
      discountPercent: coupon.discountPercent,
      maxUses: coupon.maxUses ?? undefined,
      active: coupon.active,
      expiresAt: coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().split("T")[0]
        : null,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: CouponFormData) => {
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary" />
            Cupons de Desconto
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie cupons para descontos parciais ou bolsas integrais (100%).
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Cupom
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cupom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Ticket className="w-8 h-8" />
                    <p className="font-medium">Nenhum cupom encontrado</p>
                    <Button variant="outline" size="sm" onClick={openCreate} className="mt-2 gap-1">
                      <Plus className="w-4 h-4" />
                      Criar primeiro cupom
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-primary">
                        {coupon.code}
                      </span>
                      {coupon.discountPercent === 100 && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <GraduationCap className="w-3 h-3" />
                          Bolsista
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {coupon.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        coupon.discountPercent === 100
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }
                      variant="outline"
                    >
                      {coupon.discountPercent}% off
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {coupon.usedCount}
                    {coupon.maxUses !== null ? ` / ${coupon.maxUses}` : ""}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleDateString("pt-BR")
                      : "Sem vencimento"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.active ? "default" : "secondary"}>
                      {coupon.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(coupon)}
                        className="h-8 w-8"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(coupon.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditingCoupon(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: BOLSA2026"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="font-mono uppercase"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Bolsista integral — semestre 2026/1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (%) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="Ex: 100 para bolsista gratuito"
                        {...field}
                      />
                    </FormControl>
                    {form.watch("discountPercent") === 100 && (
                      <p className="text-xs text-green-700 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        100% = Bolsista — acesso gratuito
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxUses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de usos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Ilimitado"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validade</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm font-medium">Ativo</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Cupom disponível para uso no cadastro
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setDialogOpen(false); setEditingCoupon(null); }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCoupon ? "Salvar alterações" : "Criar cupom"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
