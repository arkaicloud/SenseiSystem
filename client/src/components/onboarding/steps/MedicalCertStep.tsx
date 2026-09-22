import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, FileText, MapPin, Clock } from "lucide-react";

export interface MedicalCertData {
  medicalCertFile: File | null;
  medicalCertSkipped: boolean;
}

interface MedicalCertStepProps {
  onNext: (data: MedicalCertData) => void;
  onBack: () => void;
  requiresMedical?: boolean;
  isMobile?: boolean;
}

export default function MedicalCertStep({
  onNext,
  onBack,
  isMobile = false,
}: MedicalCertStepProps) {
  const handleContinue = () => onNext({ medicalCertFile: null, medicalCertSkipped: true });

  if (!isMobile) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <h3 className="text-lg font-semibold">Atestado Médico</h3>
          <p className="text-sm text-muted-foreground">
            Suas respostas indicam necessidade de atestado médico.
          </p>
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Atestado médico necessário</p>
              <p className="text-sm text-orange-700 mt-1">
                Com base em suas respostas de saúde, você precisa de um <strong>atestado médico para atividades físicas</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 pt-1">
            <MapPin className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
            <p className="text-sm text-orange-700">
              Leve o atestado <strong>pessoalmente até a escola</strong>. A equipe irá registrar o documento e liberar sua matrícula completa.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
            <p className="text-sm text-orange-700">
              Sua matrícula ficará como <strong>pendente de atestado</strong> até a entrega na escola.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button onClick={handleContinue}>
            Entendido, finalizar matrícula <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-6">
      <div className="px-6 pt-8 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-orange-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Atestado Médico</h2>
        <p className="text-sm text-muted-foreground mt-1">Necessário para sua matrícula</p>
      </div>

      <div className="px-6 space-y-4">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Atestado médico necessário</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Com base nas suas respostas de saúde, você precisa apresentar um{" "}
                <strong className="text-white">atestado médico para atividades físicas</strong>.
              </p>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Leve até a escola</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Traga o atestado <strong className="text-white">pessoalmente</strong> à escola. Nossa equipe irá registrar e liberar sua matrícula.
              </p>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Matrícula pendente</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Sua matrícula ficará marcada como <strong className="text-amber-400">pendente de atestado</strong> até a entrega na escola.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <Button
            onClick={handleContinue}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-semibold rounded-2xl text-base"
          >
            Entendido, finalizar matrícula <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button
            type="button"
            onClick={onBack}
            className="w-full h-12 bg-transparent border border-white/15 text-muted-foreground hover:bg-white/5 rounded-2xl text-sm"
          >
            <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
