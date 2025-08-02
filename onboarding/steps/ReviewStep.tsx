import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Heart, Users, FileText, Shield, Check, AlertTriangle } from "lucide-react";

interface ReviewStepProps {
  data: any;
  updateData: (data: any) => void;
  isMinor: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ data, updateData, isMinor }) => {
  const handleConsentChange = (field: string, value: boolean) => {
    updateData({
      consent: {
        ...data.consent,
        [field]: value
      }
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Não informado";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getMartialArtLabel = (value: string) => {
    const labels: {[key: string]: string} = {
      "jiu-jitsu": "Jiu-Jitsu",
      "judo": "Judô",
      "karate": "Karatê",
      "muay-thai": "Muay Thai",
      "mma": "MMA",
      "other": "Outras"
    };
    return labels[value] || value;
  };

  const getRelationshipLabel = (value: string) => {
    const labels: {[key: string]: string} = {
      "pai": "Pai",
      "mae": "Mãe",
      "avo": "Avô/Avó",
      "tio": "Tio/Tia",
      "tutor": "Tutor Legal",
      "outro": "Outro"
    };
    return labels[value] || value;
  };

  const hasHealthIssues = () => {
    const healthForm = data.healthForm;
    return healthForm.hasCardiacProblems || 
           healthForm.hasInjuries || 
           healthForm.takingMedication || 
           healthForm.hasPhysicalLimitations;
  };

  const getUploadedDocuments = () => {
    const docs = [];
    if (data.documents?.idDocument) docs.push("Documento de Identidade");
    if (data.documents?.proofOfAddress) docs.push("Comprovante de Residência");
    if (data.documents?.medicalClearance) docs.push("Atestado Médico");
    if (data.documents?.responsibleIdDocument) docs.push("Documento do Responsável");
    return docs;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
            <Check className="w-5 h-5" />
            <span>Revisão Final</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 dark:text-green-300">
            Revise todas as informações fornecidas antes de finalizar sua matrícula. 
            Confirme que todos os dados estão corretos.
          </p>
        </CardContent>
      </Card>

      {/* Personal Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Informações Pessoais</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Nome:</strong> {data.personalInfo.firstName} {data.personalInfo.lastName}</p>
              <p><strong>Data de Nascimento:</strong> {formatDate(data.personalInfo.birthDate)}</p>
              <p><strong>CPF:</strong> {data.personalInfo.cpf || "Não informado"}</p>
              <p><strong>RG:</strong> {data.personalInfo.rg || "Não informado"}</p>
            </div>
            <div>
              <p><strong>E-mail:</strong> {data.personalInfo.email}</p>
              <p><strong>Telefone:</strong> {data.personalInfo.phone}</p>
              <p><strong>Modalidade:</strong> {getMartialArtLabel(data.personalInfo.martialArt)}</p>
              {data.personalInfo.address && (
                <p><strong>Endereço:</strong> {data.personalInfo.address}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Information Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Avaliação de Saúde</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hasHealthIssues() ? (
              <div>
                <Badge variant="destructive" className="mb-2">Atenção Médica Necessária</Badge>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Foram identificadas condições de saúde que requerem atestado médico.
                </p>
                {data.healthForm.medicalDetails && (
                  <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border">
                    <p className="text-sm"><strong>Detalhes:</strong> {data.healthForm.medicalDetails}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Badge variant="secondary" className="mb-2">Nenhuma Restrição Declarada</Badge>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Nenhuma condição de saúde que impeça a prática esportiva foi declarada.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Responsible Party Summary (if minor) */}
      {isMinor && data.responsibleParty && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Responsável Legal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p><strong>Nome:</strong> {data.responsibleParty.name}</p>
              <p><strong>Parentesco:</strong> {getRelationshipLabel(data.responsibleParty.relationship)}</p>
              <p><strong>CPF:</strong> {data.responsibleParty.cpf}</p>
              <p><strong>Contato de Emergência:</strong> {data.responsibleParty.emergencyContact}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Documentos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getUploadedDocuments().length > 0 ? (
              <div>
                <p className="text-sm font-medium mb-2">Documentos enviados:</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {getUploadedDocuments().map((doc, index) => (
                    <li key={index} className="text-green-700 dark:text-green-300">{doc}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nenhum documento foi enviado ainda.
              </p>
            )}
            
            {hasHealthIssues() && !data.documents?.medicalClearance && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Atestado médico obrigatório</strong> - Necessário para liberar a prática.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms and Consent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Termos e Consentimentos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="healthDeclaration"
                checked={data.consent.healthDeclaration}
                onCheckedChange={(checked) => handleConsentChange("healthDeclaration", checked as boolean)}
              />
              <Label htmlFor="healthDeclaration" className="text-sm leading-relaxed">
                <strong>Declaração de Aptidão:</strong> Declaro que gozo de boa saúde e não apresento 
                restrições médicas para a prática de artes marciais, ou que apresentei atestado médico 
                autorizando a prática esportiva. Comprometo-me a comunicar imediatamente qualquer mudança 
                no meu estado de saúde.
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="riskAwareness"
                checked={data.consent.riskAwareness}
                onCheckedChange={(checked) => handleConsentChange("riskAwareness", checked as boolean)}
              />
              <Label htmlFor="riskAwareness" className="text-sm leading-relaxed">
                <strong>Ciência dos Riscos:</strong> Estou ciente dos riscos naturais da prática de artes 
                marciais e autorizo {isMinor ? "a participação do menor" : "minha participação"} nas aulas, 
                treinos, campeonatos e demais atividades da academia. Assumo total responsabilidade pelos 
                dados fornecidos e isento a escola de qualquer responsabilidade decorrente de omissão ou 
                informação incorreta.
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="dataProcessing"
                checked={data.consent.dataProcessing}
                onCheckedChange={(checked) => handleConsentChange("dataProcessing", checked as boolean)}
              />
              <Label htmlFor="dataProcessing" className="text-sm leading-relaxed">
                <strong>Uso de Dados:</strong> Autorizo o uso dos meus dados pessoais para fins de matrícula, 
                identificação, comunicação e atividades educacionais da academia, conforme a Lei Geral de 
                Proteção de Dados (LGPD). Tenho ciência de que posso solicitar a exclusão dos meus dados 
                a qualquer momento.
              </Label>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded border">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Local e Data:</strong> Brasil, {new Date().toLocaleDateString('pt-BR')}
              <br />
              <strong>Assinatura Digital:</strong> Ao finalizar este cadastro, você está fornecendo sua 
              assinatura digital eletrônica, que tem a mesma validade legal de uma assinatura manuscrita 
              conforme a MP 2.200-2/2001 e Lei 14.063/2020.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Final Validation */}
      {(!data.consent.healthDeclaration || !data.consent.riskAwareness || !data.consent.dataProcessing) && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-700 dark:text-orange-300">
                <strong>Atenção:</strong> Você deve aceitar todos os termos e consentimentos para 
                finalizar sua matrícula.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewStep;