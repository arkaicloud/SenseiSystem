import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Upload, FileText, AlertTriangle, CheckCircle, Clock, X } from "lucide-react";

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
  requiresMedical = false,
  isMobile = false,
}: MedicalCertStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [skipped, setSkipped] = useState(false);

  const handleFile = (f: File) => {
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(f.type)) {
      alert("Tipo não permitido. Use PDF, JPG ou PNG.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo: 10MB.");
      return;
    }
    setFile(f);
    setSkipped(false);
  };

  const handleSkip = () => {
    setFile(null);
    setSkipped(true);
    onNext({ medicalCertFile: null, medicalCertSkipped: true });
  };

  const handleSubmit = () => {
    onNext({ medicalCertFile: file, medicalCertSkipped: file === null });
  };

  const canProceed = file !== null || !requiresMedical;

  const containerClass = isMobile
    ? "min-h-screen bg-gray-50 flex flex-col"
    : "space-y-6";

  const cardClass = isMobile
    ? "bg-white rounded-2xl shadow-sm p-4 mx-4 mb-4"
    : "bg-white border rounded-xl p-5 shadow-sm";

  return (
    <div className={containerClass}>
      {isMobile && (
        <div className="bg-white px-4 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Atestado Médico</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {requiresMedical ? "Necessário para sua matrícula" : "Opcional"}
          </p>
        </div>
      )}

      {!isMobile && (
        <div className="mb-2">
          <h3 className="text-lg font-semibold">Atestado Médico</h3>
          <p className="text-sm text-muted-foreground">
            {requiresMedical
              ? "Suas respostas indicam necessidade de atestado médico."
              : "Atestado médico para atividades físicas (opcional)."}
          </p>
        </div>
      )}

      <div className={`${isMobile ? "px-4 mt-4 space-y-4 flex-1" : "space-y-5"}`}>
        {requiresMedical && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">
              Com base nas suas respostas de saúde, um atestado médico é necessário para
              participar das atividades. Você pode finalizar a matrícula agora e enviar o
              atestado depois.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload area */}
        {!file ? (
          <div className={cardClass}>
            <p className="text-sm font-medium text-gray-700 mb-3">
              {requiresMedical ? "Enviar atestado médico" : "Enviar atestado médico (opcional)"}
            </p>
            <label className="block">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#2B54FF]/40 hover:bg-[#2B54FF]/5 transition-all">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Clique para selecionar o arquivo</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — até 10MB</p>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        ) : (
          <div className={`${cardClass} border-green-200 bg-green-50/30`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Arquivo selecionado com sucesso</span>
            </div>
          </div>
        )}

        {/* Skip option */}
        <div className={cardClass}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Não tenho o atestado agora</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Você pode finalizar a matrícula e enviar o atestado depois pelo sistema.
                {requiresMedical && (
                  <span className="text-orange-600 font-medium">
                    {" "}A matrícula ficará pendente até o envio.
                  </span>
                )}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
                className="mt-3 border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
              >
                Enviar depois e finalizar matrícula
                <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {isMobile ? (
        <div className="bg-white border-t p-4 flex flex-col gap-3">
          {file && (
            <Button
              onClick={handleSubmit}
              className="w-full h-12 bg-[#2B54FF] hover:bg-[#2B54FF]/90 text-white font-semibold rounded-xl"
            >
              Enviar e Finalizar Matrícula
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" onClick={onBack} className="w-full h-10 text-gray-500">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {file && (
            <Button onClick={handleSubmit} className="w-full sm:w-auto min-w-[160px]">
              Finalizar Matrícula
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
