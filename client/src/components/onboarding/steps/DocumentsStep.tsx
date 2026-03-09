import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, FileText, CheckCircle, Upload, X, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const handleSignatureDone = (data: SignatureData) => {
    setSignatureData(data);
    setShowSignaturePad(false);
  };

  const handleMedicalFile = (f: File) => {
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(f.type)) {
      alert("Tipo não permitido. Use PDF, JPG ou PNG.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo: 10MB.");
      return;
    }
    setMedicalFile(f);
  };

  const handleNext = () => {
    onNext({
      signatureData: signatureData?.signatureData ?? null,
      signatureType: signatureData?.signatureType ?? null,
      signatureTimestamp: signatureData?.signatureTimestamp ?? null,
      signatureLatitude: signatureData?.signatureLatitude ?? null,
      signatureLongitude: signatureData?.signatureLongitude ?? null,
      medicalCertFile: medicalFile,
      medicalCertSkipped: medicalFile === null,
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
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Documentos e Assinatura</h3>
        <p className="text-sm text-muted-foreground">
          Confirme sua matrícula com assinatura eletrônica.
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-medium">Progresso</h4>
              <p className="text-sm text-muted-foreground">
                {completedCount} de 2 etapas obrigatórias concluídas
              </p>
            </div>
            <Badge variant={canFinish ? "default" : "secondary"}>
              {canFinish ? "Pronto para finalizar" : "Pendente"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 1 - Health form (already done) */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Questionário de Saúde
              <Badge variant="outline" className="text-xs">Obrigatório</Badge>
            </div>
            <Badge className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Enviado
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enviado em {new Date().toLocaleDateString("pt-BR")}
          </p>
        </CardContent>
      </Card>

      {/* 2 - Electronic Signature */}
      <Card className={signatureData ? "border-green-200 bg-green-50/30" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Assinatura Eletrônica
              <Badge variant="outline" className="text-xs">Obrigatório</Badge>
            </div>
            {signatureData ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Assinado
              </Badge>
            ) : (
              <Badge variant="secondary">Pendente</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {signatureData ? (
            <div className="space-y-3">
              <div className="border rounded-lg overflow-hidden bg-white">
                <img
                  src={signatureData.signatureData}
                  alt="Assinatura"
                  className="w-full max-h-24 object-contain p-2"
                />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Tipo: {signatureData.signatureType === "drawn" ? "Desenhada" : "Digitada"} •{" "}
                  {new Date(signatureData.signatureTimestamp).toLocaleString("pt-BR")}
                </p>
                {signatureData.signatureLatitude && (
                  <p>
                    Localização: {signatureData.signatureLatitude},{" "}
                    {signatureData.signatureLongitude}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSignaturePad(true)}
                className="text-xs"
              >
                Refazer assinatura
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Assine digitalmente para confirmar os termos de matrícula. Você pode desenhar
                com o mouse ou digitar seu nome.
              </p>
              <Button onClick={() => setShowSignaturePad(true)} className="w-full sm:w-auto">
                Assinar agora
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3 - Medical Certificate (optional) */}
      <Card className={medicalFile ? "border-green-200 bg-green-50/30" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Atestado Médico
              {requiresMedical ? (
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                  Requerido
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Opcional</Badge>
              )}
            </div>
            {medicalFile ? (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enviado
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Pendente
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requiresMedical && !medicalFile && (
            <Alert className="mb-3 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                Suas respostas de saúde indicam necessidade de atestado. Você pode enviar agora
                ou após a matrícula pelo seu perfil.
              </AlertDescription>
            </Alert>
          )}

          {medicalFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{medicalFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMedicalFile(null)}
                className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Atestado médico para atividades físicas.{" "}
                <span className="font-medium">Pode ser enviado depois no seu perfil.</span>
              </p>
              <label className="block">
                <div className="relative border-2 border-dashed border-muted-foreground/20 rounded-lg p-5 text-center hover:border-muted-foreground/40 transition-colors cursor-pointer">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Clique para enviar</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG até 10MB</p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleMedicalFile(f);
                      e.target.value = "";
                    }}
                  />
                </div>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {canFinish && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Ótimo! Você assinou o termo de matrícula. Clique em "Finalizar Matrícula" para
            concluir.
            {!medicalFile && requiresMedical && (
              <span className="block mt-1 text-orange-700 font-medium">
                O atestado médico está pendente e pode ser enviado depois.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
        <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canFinish || isSubmitting}
          className="w-full sm:w-auto min-w-[160px]"
        >
          {isSubmitting ? "Finalizando..." : "Finalizar Matrícula"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
