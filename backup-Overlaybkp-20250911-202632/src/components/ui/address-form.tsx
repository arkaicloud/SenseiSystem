import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin } from "lucide-react";

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

interface AddressFormProps {
  form: UseFormReturn<any>;
  fieldPrefix?: string;
}

export default function AddressForm({ form, fieldPrefix = "" }: AddressFormProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const validateCep = (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    return cleanCep.length === 8;
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    
    if (!validateCep(cep)) {
      setCepError("CEP deve ter 8 dígitos");
      return;
    }

    setIsLoadingCep(true);
    setCepError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado");
        return;
      }

      // Preenche automaticamente os campos de endereço
      const setFieldValue = (field: string, value: string) => {
        const fieldName = fieldPrefix ? `${fieldPrefix}.${field}` : field;
        form.setValue(fieldName, value);
      };

      setFieldValue("street", data.logradouro);
      setFieldValue("neighborhood", data.bairro);
      setFieldValue("city", data.localidade);
      setFieldValue("state", data.uf);

      // Limpa o erro se tudo deu certo
      setCepError(null);
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setCepError("Erro ao consultar CEP. Tente novamente.");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepBlur = (cep: string) => {
    if (cep && validateCep(cep)) {
      fetchAddressByCep(cep);
    }
  };

  const getFieldName = (field: string) => fieldPrefix ? `${fieldPrefix}.${field}` : field;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <MapPin className="w-4 h-4 text-primary" />
        <h4 className="font-medium">Endereço Residencial</h4>
      </div>

      {/* CEP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={getFieldName("zipCode")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>CEP *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="00000-000"
                    {...field}
                    value={formatCep(field.value || "")}
                    onChange={(e) => {
                      const formatted = formatCep(e.target.value);
                      field.onChange(formatted);
                    }}
                    onBlur={(e) => {
                      field.onBlur();
                      handleCepBlur(e.target.value);
                    }}
                    maxLength={9}
                  />
                  {isLoadingCep && (
                    <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div></div>
      </div>

      {/* Erro do CEP */}
      {cepError && (
        <Alert variant="destructive">
          <AlertDescription>{cepError}</AlertDescription>
        </Alert>
      )}

      {/* Logradouro e Número */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name={getFieldName("street")}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Logradouro *</FormLabel>
              <FormControl>
                <Input placeholder="Rua das Flores" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={getFieldName("number")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número *</FormLabel>
              <FormControl>
                <Input placeholder="123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Complemento */}
      <FormField
        control={form.control}
        name={getFieldName("complement")}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Complemento</FormLabel>
            <FormControl>
              <Input placeholder="Apartamento 45, Bloco B" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Bairro e Cidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={getFieldName("neighborhood")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro *</FormLabel>
              <FormControl>
                <Input placeholder="Centro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={getFieldName("city")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade *</FormLabel>
              <FormControl>
                <Input placeholder="São Paulo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={getFieldName("state")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado *</FormLabel>
              <FormControl>
                <Input placeholder="SP" {...field} maxLength={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div></div>
      </div>
    </div>
  );
}