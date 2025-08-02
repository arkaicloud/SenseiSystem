import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, User, Phone, Users, MapPin, Loader2 } from "lucide-react";
import type { PersonalDataType } from "./PersonalDataStep";
import type { ContactInfoType } from "./ContactInfoStep";
import type { EmergencyContactType } from "./EmergencyContactStep";
import type { AddressType } from "./AddressStep";

export type CompleteFormData = PersonalDataType & ContactInfoType & EmergencyContactType & AddressType;

interface FinalReviewStepProps {
  onNext?: (data: CompleteFormData) => void;
  onSubmit?: (data: CompleteFormData) => Promise<void>;
  onBack: () => void;
  formData: CompleteFormData;
  isSubmitting?: boolean;
}

export default function FinalReviewStep({ onNext, onSubmit, onBack, formData, isSubmitting = false }: FinalReviewStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (onNext) {
      onNext(formData);
      return;
    }
    
    if (onSubmit) {
      setIsProcessing(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const loading = isSubmitting || isProcessing;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2">Revisão Final</h3>
        <p className="text-sm text-muted-foreground px-4">
          Confira se todas as informações estão corretas antes de finalizar
        </p>
      </div>

      <div className="space-y-4">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <User className="w-4 h-4" />
              <span>Dados Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nome:</span>
              <span className="text-sm font-medium">{formData.firstName} {formData.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nascimento:</span>
              <span className="text-sm font-medium">{formatDate(formData.birthDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">E-mail:</span>
              <span className="text-sm font-medium">{formData.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Phone className="w-4 h-4" />
              <span>Contato</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Telefone:</span>
              <span className="text-sm font-medium">{formData.phone}</span>
            </div>
            {formData.whatsapp && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">WhatsApp:</span>
                <span className="text-sm font-medium">{formData.whatsapp}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contato de Emergência */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Users className="w-4 h-4" />
              <span>Emergência</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nome:</span>
              <span className="text-sm font-medium">{formData.emergencyContact}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Parentesco:</span>
              <span className="text-sm font-medium">{formData.relationship}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Telefone:</span>
              <span className="text-sm font-medium">{formData.emergencyPhone}</span>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <MapPin className="w-4 h-4" />
              <span>Endereço</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">CEP:</span>
              <span className="text-sm font-medium">{formData.zipCode}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Endereço:</span>
              <div className="font-medium mt-1">
                {formData.street}, {formData.number}
                {formData.complement && `, ${formData.complement}`}
              </div>
              <div className="font-medium">
                {formData.neighborhood} - {formData.city}/{formData.state}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Quase lá!</h4>
            <p className="text-sm text-blue-700">
              Ao finalizar, você receberá um e-mail de confirmação e poderá acessar sua conta na academia.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-3 pt-4">
        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 text-base font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Finalizando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {onNext ? "Continuar" : "Finalizar Cadastro"}
            </>
          )}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          disabled={loading}
          className="w-full h-12 text-base font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    </div>
  );
}