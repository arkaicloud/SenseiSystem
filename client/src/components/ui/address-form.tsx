import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, MapPin } from "lucide-react";

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface AddressFormProps {
  form: UseFormReturn<any>;
  fieldPrefix?: string;
  dark?: boolean;
}

export default function AddressForm({ form, fieldPrefix = "", dark = false }: AddressFormProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.length <= 5 ? numbers : `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const validateCep = (cep: string) => cep.replace(/\D/g, "").length === 8;

  const fetchAddressByCep = async (cep: string) => {
    if (!validateCep(cep)) { setCepError("CEP deve ter 8 dígitos"); return; }
    setIsLoadingCep(true);
    setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`);
      const data: ViaCepResponse = await res.json();
      if (data.erro) { setCepError("CEP não encontrado"); return; }
      const set = (f: string, v: string) => form.setValue(fieldPrefix ? `${fieldPrefix}.${f}` : f, v);
      set("street", data.logradouro);
      set("neighborhood", data.bairro);
      set("city", data.localidade);
      set("state", data.uf);
      setCepError(null);
    } catch {
      setCepError("Erro ao consultar CEP. Tente novamente.");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const getFieldName = (field: string) => fieldPrefix ? `${fieldPrefix}.${field}` : field;

  // Styling tokens
  const inputCls = dark
    ? "h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-[#2B54FF]/50 focus-visible:border-[#2B54FF]/50"
    : "";
  const labelCls = dark ? "text-slate-300 text-sm font-medium" : "";
  const errorCls = dark ? "text-red-400 text-xs" : "";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <MapPin className={`w-4 h-4 ${dark ? "text-[#2B54FF]" : "text-primary"}`} />
        <h4 className={`font-medium ${dark ? "text-white" : ""}`}>Endereço Residencial</h4>
      </div>

      {/* CEP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={getFieldName("zipCode")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>CEP *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="00000-000"
                    {...field}
                    value={formatCep(field.value || "")}
                    onChange={(e) => field.onChange(formatCep(e.target.value))}
                    onBlur={(e) => { field.onBlur(); if (validateCep(e.target.value)) fetchAddressByCep(e.target.value); }}
                    maxLength={9}
                    className={inputCls}
                  />
                  {isLoadingCep && (
                    <Loader2 className={`absolute right-3 top-3.5 w-4 h-4 animate-spin ${dark ? "text-slate-400" : "text-muted-foreground"}`} />
                  )}
                </div>
              </FormControl>
              <FormMessage className={errorCls} />
            </FormItem>
          )}
        />
        <div />
      </div>

      {/* CEP error */}
      {cepError && (
        <div className={`text-xs px-3 py-2 rounded-lg border ${
          dark
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-red-50 border-red-200 text-red-600"
        }`}>
          {cepError}
        </div>
      )}

      {/* Street + Number */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name={getFieldName("street")}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className={labelCls}>Logradouro *</FormLabel>
              <FormControl>
                <Input placeholder="Rua das Flores" {...field} className={inputCls} />
              </FormControl>
              <FormMessage className={errorCls} />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={getFieldName("number")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Número *</FormLabel>
              <FormControl>
                <Input placeholder="123" {...field} className={inputCls} />
              </FormControl>
              <FormMessage className={errorCls} />
            </FormItem>
          )}
        />
      </div>

      {/* Complement */}
      <FormField
        control={form.control}
        name={getFieldName("complement")}
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelCls}>Complemento</FormLabel>
            <FormControl>
              <Input placeholder="Apartamento 45, Bloco B" {...field} className={inputCls} />
            </FormControl>
            <FormMessage className={errorCls} />
          </FormItem>
        )}
      />

      {/* Neighborhood + City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={getFieldName("neighborhood")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Bairro *</FormLabel>
              <FormControl>
                <Input placeholder="Centro" {...field} className={inputCls} />
              </FormControl>
              <FormMessage className={errorCls} />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={getFieldName("city")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Cidade *</FormLabel>
              <FormControl>
                <Input placeholder="São Paulo" {...field} className={inputCls} />
              </FormControl>
              <FormMessage className={errorCls} />
            </FormItem>
          )}
        />
      </div>

      {/* State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={getFieldName("state")}
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Estado *</FormLabel>
              <FormControl>
                <Input placeholder="SP" {...field} maxLength={2} className={inputCls} />
              </FormControl>
              <FormMessage className={errorCls} />
            </FormItem>
          )}
        />
        <div />
      </div>
    </div>
  );
}
