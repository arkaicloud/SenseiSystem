import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, User, Phone, Users, MapPin, Loader2, Award } from "lucide-react";
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

const BELT_LABEL: Record<string, string> = {
  white: "Branca", blue: "Azul", purple: "Roxa", brown: "Marrom", black: "Preta",
};

function ReviewSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <Icon className="w-4 h-4 text-[#2B54FF]" />
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs text-slate-200 text-right font-medium">{value}</span>
    </div>
  );
}

export default function FinalReviewStep({ onNext, onSubmit, onBack, formData, isSubmitting = false }: FinalReviewStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (onNext) { onNext(formData); return; }
    if (onSubmit) {
      setIsProcessing(true);
      try { await onSubmit(formData); } finally { setIsProcessing(false); }
    }
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("pt-BR") : "";
  const loading = isSubmitting || isProcessing;

  const beltLabel = BELT_LABEL[(formData as any)?.beltLevel] ?? (formData as any)?.beltLevel;
  const stripes = (formData as any)?.stripes ?? 0;
  const beltStr = stripes > 0 ? `${beltLabel} · ${stripes} ${stripes === 1 ? "grau" : "graus"}` : beltLabel;

  return (
    <div className="flex flex-col pb-6">
      <div className="px-6 pt-8 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Revisão Final</h2>
        <p className="text-sm text-slate-400 mt-1">Confira se todas as informações estão corretas</p>
      </div>

      <div className="px-6 space-y-3">
        <ReviewSection icon={User} title="Dados Pessoais">
          <Row label="Nome" value={`${formData.firstName} ${formData.lastName}`} />
          <Row label="Nascimento" value={formatDate(formData.birthDate)} />
          <Row label="E-mail" value={formData.email} />
          {beltLabel && (
            <div className="flex justify-between items-center gap-3">
              <span className="text-xs text-slate-500 shrink-0">Faixa</span>
              <span className="text-xs text-slate-200 font-medium flex items-center gap-1">
                <Award className="w-3 h-3" />{beltStr}
              </span>
            </div>
          )}
        </ReviewSection>

        <ReviewSection icon={Phone} title="Contato">
          <Row label="WhatsApp" value={formData.phone} />
        </ReviewSection>

        <ReviewSection icon={Users} title="Emergência">
          <Row label="Nome" value={formData.emergencyContact} />
          <Row label="Parentesco" value={formData.relationship} />
          <Row label="Telefone" value={formData.emergencyPhone} />
        </ReviewSection>

        <ReviewSection icon={MapPin} title="Endereço">
          <Row label="CEP" value={formData.zipCode} />
          <Row label="Endereço" value={`${formData.street}, ${formData.number}${formData.complement ? `, ${formData.complement}` : ""}`} />
          <Row label="Bairro / Cidade" value={`${formData.neighborhood} — ${formData.city}/${formData.state}`} />
        </ReviewSection>

        {/* Confirmation note */}
        <div className="bg-[#2B54FF]/10 border border-[#2B54FF]/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#2B54FF] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">Quase lá!</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ao avançar, você irá assinar eletronicamente e finalizar o cadastro. Você receberá um e-mail quando for aprovado.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 bg-[#2B54FF] hover:bg-[#2B54FF]/90 text-white font-semibold rounded-2xl text-base"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
            ) : (
              <><CheckCircle className="w-4 h-4 mr-2" />{onNext ? "Confirmar e Continuar" : "Finalizar Cadastro"}</>
            )}
          </Button>
          <Button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="w-full h-12 bg-transparent border border-white/15 text-slate-300 hover:bg-white/5 rounded-2xl text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
