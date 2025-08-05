import React, { useState } from "react";
import { Label } from "../../client/src/components/ui/label";
import { Button } from "../../client/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../client/src/components/ui/card";
import { Upload, FileText, CheckCircle, AlertTriangle, X } from "lucide-react";

interface DocumentsStepProps {
  data: any;
  updateData: (data: any) => void;
  isMinor: boolean;
}

const DocumentsStep: React.FC<DocumentsStepProps> = ({ data, updateData, isMinor }) => {
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'idle' | 'uploading' | 'success' | 'error'}>({});

  const handleFileUpload = (documentType: string, file: File | null) => {
    updateData({
      documents: {
        ...data.documents,
        [documentType]: file
      }
    });
  };

  const hasHealthIssues = () => {
    const healthForm = data.healthForm;
    return healthForm.hasCardiacProblems || 
           healthForm.hasInjuries || 
           healthForm.takingMedication || 
           healthForm.hasPhysicalLimitations;
  };

  const documents = [
    {
      key: "idDocument",
      title: "Documento de Identidade",
      description: "RG, CNH ou documento oficial com foto",
      required: true,
      file: data.documents?.idDocument
    },
    {
      key: "proofOfAddress",
      title: "Comprovante de Residência",
      description: "Conta de luz, água, telefone ou similar (até 3 meses)",
      required: false,
      file: data.documents?.proofOfAddress
    },
    {
      key: "medicalClearance",
      title: "Atestado Médico",
      description: "Obrigatório para quem marcou 'Sim' nas questões de saúde",
      required: hasHealthIssues(),
      file: data.documents?.medicalClearance
    }
  ];

  if (isMinor) {
    documents.push({
      key: "responsibleIdDocument",
      title: "Documento do Responsável",
      description: "RG ou CNH do responsável legal",
      required: true,
      file: data.documents?.responsibleIdDocument
    });
  }

  const FileUploadArea: React.FC<{
    documentKey: string;
    title: string;
    description: string;
    required: boolean;
    file?: File;
  }> = ({ documentKey, title, description, required, file }) => {
    return (
      <Card className={`border-2 border-dashed transition-colors ${
        required && !file 
          ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20"
          : file
            ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {file ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : required ? (
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {title}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                {file && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileUpload(documentKey, null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {description}
              </p>

              {file ? (
                <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-300">
                  <FileText className="w-4 h-4" />
                  <span>{file.name}</span>
                  <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id={`file-${documentKey}`}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        handleFileUpload(documentKey, selectedFile);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById(`file-${documentKey}`)?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Formatos aceitos: PDF, JPG, PNG (máx. 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
            <FileText className="w-5 h-5" />
            <span>Upload de Documentos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 dark:text-blue-300">
            Faça o upload dos documentos necessários para completar sua matrícula. 
            Os documentos obrigatórios são marcados com *.
          </p>
        </CardContent>
      </Card>

      {/* Document Upload Areas */}
      <div className="space-y-4">
        {documents.map((doc) => (
          <FileUploadArea
            key={doc.key}
            documentKey={doc.key}
            title={doc.title}
            description={doc.description}
            required={doc.required}
            file={doc.file}
          />
        ))}
      </div>

      {/* Medical Clearance Notice */}
      {hasHealthIssues() && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="w-5 h-5" />
              <span>Atestado Médico Obrigatório</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
              <p>
                <strong>Importante:</strong> Como você marcou "Sim" em alguma questão de saúde, 
                é obrigatório apresentar atestado médico para liberar a prática esportiva.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>O atestado deve ser emitido por médico registrado no CRM</li>
                <li>Deve autorizar especificamente a prática de artes marciais</li>
                <li>Validade máxima de 3 meses da data de emissão</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Requisitos dos Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Qualidade da Imagem:</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                <li>Imagem nítida e legível</li>
                <li>Boa iluminação</li>
                <li>Documento completo na foto</li>
                <li>Sem reflexos ou sombras</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Formatos Aceitos:</h4>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                <li>PDF (preferencial)</li>
                <li>JPG ou JPEG</li>
                <li>PNG</li>
                <li>Tamanho máximo: 5MB</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="border-gray-200 dark:border-gray-600">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Privacidade:</strong> Seus documentos são armazenados de forma segura e utilizados 
              apenas para fins de matrícula e identificação. Não compartilhamos suas informações 
              com terceiros sem sua autorização expressa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsStep;