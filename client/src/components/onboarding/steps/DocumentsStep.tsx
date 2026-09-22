import { useState } from "react";
import { CheckCircle, FileText, Clock } from "lucide-react";
import ElectronicSignatureStep, { type SignatureData } from "./ElectronicSignatureStep";

interface DocumentsStepProps {
  onNext: (data?: any) => void;
  onBack: () => void;
  defaultValues?: any;
  isSubmitting?: boolean;
  requiresMedical?: boolean;
}

export default function DocumentsStep({
  onNext,
  onBack,
  isSubmitting = false,
  requiresMedical = false,
}: DocumentsStepProps) {
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const handleSignatureDone = (data: SignatureData) => {
    setSignatureData(data);
    setShowSignaturePad(false);
  };

  const handleNext = () => {
    onNext({
      signatureData: signatureData?.signatureData ?? null,
      signatureType: signatureData?.signatureType ?? null,
      signatureTimestamp: signatureData?.signatureTimestamp ?? null,
      signatureLatitude: signatureData?.signatureLatitude ?? null,
      signatureLongitude: signatureData?.signatureLongitude ?? null,
      medicalCertFile: null,
      medicalCertSkipped: true,
    });
  };

  const canFinish = signatureData !== null;

  if (showSignaturePad) {
    return (
      <ElectronicSignatureStep
        onNext={handleSignatureDone}
        onBack={() => setShowSignaturePad(false)}
        isMobile={false}
      />
    );
  }

  const completedCount = [true, signatureData !== null].filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-[#2B54FF]/40 flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white">Documentos e Assinatura</h2>
        <p className="text-muted-foreground text-sm">Confirme sua matrícula com assinatura eletrônica</p>
      </div>

      {/* Progress bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">Progresso</p>
            <p className="text-muted-foreground text-xs mt-0.5">{completedCount} de 2 etapas obrigatórias concluídas</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            canFinish
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-white/10 text-muted-foreground border border-white/10'
          }`}>
            {canFinish ? "✓ Pronto para finalizar" : "Pendente"}
          </span>
        </div>
        <div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* 1 - Health form (already done) */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Questionário de Saúde</p>
              <p className="text-muted-foreground text-xs">Enviado em {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            Enviado
          </span>
        </div>
      </div>

      {/* 2 - Electronic Signature */}
      <div className={`rounded-2xl p-5 border ${
        signatureData
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-white/5 border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              signatureData ? 'bg-green-500/20' : 'bg-primary/20'
            }`}>
              <FileText className={`w-5 h-5 ${signatureData ? 'text-green-400' : 'text-primary'}`} />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Assinatura Eletrônica</p>
              <span className="text-xs text-muted-foreground bg-white/10 border border-white/10 px-2 py-0.5 rounded-full">Obrigatório</span>
            </div>
          </div>
          {signatureData ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
              <CheckCircle className="w-3.5 h-3.5" />
              Assinado
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-muted-foreground border border-white/10">Pendente</span>
          )}
        </div>

        {signatureData ? (
          <div className="space-y-3">
            <div className="border border-white/10 rounded-xl overflow-hidden bg-card">
              <img
                src={signatureData.signatureData}
                alt="Assinatura"
                className="w-full max-h-24 object-contain p-2"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tipo: {signatureData.signatureType === "drawn" ? "Desenhada" : "Digitada"} •{" "}
              {new Date(signatureData.signatureTimestamp).toLocaleString("pt-BR")}
            </p>
            <button
              type="button"
              onClick={() => setShowSignaturePad(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-muted-foreground hover:bg-white/10 transition-colors"
            >
              Refazer assinatura
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Assine digitalmente para confirmar os termos de matrícula. Você pode desenhar com o mouse ou digitar seu nome.
            </p>
            <button
              type="button"
              onClick={() => setShowSignaturePad(true)}
              className="h-11 px-6 rounded-xl bg-primary hover:bg-[#2348db] text-white font-semibold transition-colors text-sm"
            >
              Assinar agora
            </button>
          </div>
        )}
      </div>

      {/* 3 - Medical Certificate (informational only) */}
      {requiresMedical && (
        <div className="rounded-2xl p-5 border border-orange-500/30 bg-orange-500/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Atestado Médico</p>
              <span className="text-xs px-2 py-0.5 rounded-full border text-orange-400 border-orange-400/30 bg-orange-400/10">
                Pendente — entregar na escola
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Suas respostas de saúde indicam necessidade de atestado médico para atividades físicas.{" "}
            <strong className="text-white">Leve o documento pessoalmente até a escola</strong> — a equipe irá registrar e liberar sua matrícula.
          </p>
        </div>
      )}

      {/* Ready banner */}
      {canFinish && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
          <div className="text-sm text-green-300">
            <p className="font-medium">Tudo pronto!</p>
            <p className="text-green-400/70 text-xs mt-0.5">
              Você assinou o termo de matrícula. Clique em "Finalizar Matrícula" para concluir.
            </p>
            {!medicalFile && requiresMedical && (
              <p className="text-orange-400 text-xs mt-1 font-medium">
                O atestado médico está pendente e pode ser enviado depois.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-12 px-6 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center gap-2 font-medium"
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canFinish || isSubmitting}
          className="h-12 px-8 rounded-xl bg-primary hover:bg-[#2348db] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center gap-2 min-w-[180px] justify-center"
        >
          {isSubmitting ? "Finalizando..." : "Finalizar Matrícula →"}
        </button>
      </div>
    </div>
  );
}
