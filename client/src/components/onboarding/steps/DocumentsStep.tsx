import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, FileText, Upload, CheckCircle, FileIcon, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocumentsStepProps {
  onNext: () => void;
  onBack: () => void;
}

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  required: boolean;
  completed: boolean;
  uploadedAt?: Date;
}

export default function DocumentsStep({ onNext, onBack }: DocumentsStepProps) {
  const [documents] = useState<DocumentInfo[]>([
    {
      id: '1',
      name: 'Questionário de Saúde',
      type: 'health_form',
      required: true,
      completed: true,
      uploadedAt: new Date()
    },
    {
      id: '2',
      name: 'RG ou CNH',
      type: 'identification',
      required: true,
      completed: false
    },
    {
      id: '3',
      name: 'Atestado Médico',
      type: 'medical_certificate',
      required: false,
      completed: false
    }
  ]);

  const requiredCompleted = documents.filter(doc => doc.required && doc.completed).length;
  const totalRequired = documents.filter(doc => doc.required).length;
  const allRequiredCompleted = requiredCompleted === totalRequired;

  const handleFileUpload = (documentId: string, file: File) => {
    // Implementar upload de arquivo
    console.log(`Uploading file for document ${documentId}:`, file);
  };

  const handleDownload = (documentId: string) => {
    // Implementar download de documento
    console.log(`Downloading document ${documentId}`);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Documentos</h3>
        <p className="text-sm text-muted-foreground">
          Envie os documentos necessários para completar sua matrícula.
        </p>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div>
              <h4 className="font-medium">Progresso dos Documentos</h4>
              <p className="text-sm text-muted-foreground">
                {requiredCompleted} de {totalRequired} documentos obrigatórios enviados
              </p>
            </div>
            <div className="flex space-x-2">
              <Badge variant={allRequiredCompleted ? "default" : "secondary"}>
                {allRequiredCompleted ? "Completo" : "Pendente"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((document) => (
          <Card key={document.id} className={`transition-all ${document.completed ? 'border-green-200 bg-green-50/30' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-base">{document.name}</span>
                  {document.required && (
                    <Badge variant="outline" className="text-xs">
                      Obrigatório
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {document.completed ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enviado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Pendente
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document.completed ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <FileIcon className="h-4 w-4" />
                      <span>Enviado em {document.uploadedAt?.toLocaleDateString('pt-BR')}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document.id)}
                      className="text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {document.type === 'identification' && "Envie uma foto nítida do seu RG ou CNH."}
                    {document.type === 'medical_certificate' && "Atestado médico para atividades físicas (opcional)."}
                  </p>
                  
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center hover:border-muted-foreground/40 transition-colors">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Clique para enviar ou arraste o arquivo</p>
                      <p className="text-xs text-muted-foreground">
                        PDF, JPG, PNG até 10MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(document.id, file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Success Message */}
      {allRequiredCompleted && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Excelente! Todos os documentos obrigatórios foram enviados. Você pode prosseguir para finalizar sua matrícula.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 pt-6">
        <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!allRequiredCompleted}
          className="w-full sm:w-auto min-w-[140px]"
        >
          Finalizar Matrícula
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}