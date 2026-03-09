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

  const handleFile = (f: File) => {
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(f.type)) { alert("Tipo não permitido. Use PDF, JPG ou PNG."); return; }
    if (f.size > 10 * 1024 * 1024) { alert("Arquivo muito grande. Máximo: 10MB."); return; }
    setFile(f);
  };

  const handleSkip = () => onNext({ medicalCertFile: null, medicalCertSkipped: true });
  const handleSubmit = () => onNext({ medicalCertFile: file, medicalCertSkipped: file === null });

  if (!isMobile) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <h3 className="text-lg font-semibold">Atestado Médico</h3>
          <p className="text-sm text-muted-foreground">
            {requiresMedical ? "Suas respostas indicam necessidade de atestado médico." : "Atestado médico para atividades físicas (opcional)."}
          </p>
        </div>
        {requiresMedical && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">
              Um atestado médico é necessário. Você pode finalizar agora e enviar depois.
            </AlertDescription>
          </Alert>
        )}
        {!file ? (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#2B54FF]/40 hover:bg-[#2B54FF]/5 transition-all">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Clique para selecionar o arquivo</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — até 10MB</p>
            </div>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          </label>
        ) : (
          <div className="flex items-center justify-between bg-green-50/30 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button onClick={() => setFile(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleSkip} className="text-amber-600">Enviar depois</Button>
            {file && <Button onClick={handleSubmit}>Finalizar Matrícula <ArrowRight className="ml-2 h-4 w-4" /></Button>}
          </div>
        </div>
      </div>
    );
  }

  /* ── Mobile dark VYTA theme ── */
  return (
    <div className="flex flex-col pb-6">
      <div className="px-6 pt-8 pb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${requiresMedical ? "bg-orange-500/20 border border-orange-500/40" : "bg-[#2B54FF]/20 border border-[#2B54FF]/40"}`}>
          <FileText className={`w-6 h-6 ${requiresMedical ? "text-orange-400" : "text-[#2B54FF]"}`} />
        </div>
        <h2 className="text-2xl font-bold text-white">Atestado Médico</h2>
        <p className="text-sm text-slate-400 mt-1">
          {requiresMedical ? "Necessário para sua matrícula" : "Opcional — pode enviar depois"}
        </p>
      </div>

      <div className="px-6 space-y-4">
        {requiresMedical && (
          <Alert className="border-orange-500/30 bg-orange-500/10">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-300 text-sm">
              Com base nas suas respostas, um atestado médico é necessário. Você pode finalizar a matrícula agora e enviar o atestado depois.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload area */}
        {!file ? (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center hover:border-[#2B54FF]/40 hover:bg-[#2B54FF]/5 transition-all">
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">Toque para selecionar o arquivo</p>
              <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG — até 10MB</p>
            </div>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          </label>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-green-400 mt-3 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Arquivo selecionado com sucesso
            </p>
          </div>
        )}

        {/* Skip option */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Não tenho o atestado agora</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Você pode finalizar a matrícula e enviar o atestado depois pelo sistema.
                {requiresMedical && <span className="text-orange-400 font-medium"> A matrícula ficará pendente até o envio.</span>}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="mt-3 h-8 text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 text-xs rounded-xl px-3"
              >
                Enviar depois e finalizar
                <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          {file && (
            <Button onClick={handleSubmit} className="w-full h-14 bg-[#2B54FF] hover:bg-[#2B54FF]/90 text-white font-semibold rounded-2xl text-base">
              Enviar e Finalizar Matrícula <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
          <Button type="button" onClick={onBack} className="w-full h-12 bg-transparent border border-white/15 text-slate-300 hover:bg-white/5 rounded-2xl text-sm">
            <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
