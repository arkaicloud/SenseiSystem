import React from "react";
import { Input } from "../../client/src/components/ui/input";
import { Label } from "../../client/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../client/src/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../../client/src/components/ui/card";
import { Users, Phone, FileText, AlertCircle } from "lucide-react";

interface ResponsiblePartyStepProps {
  data: any;
  updateData: (data: any) => void;
  isMinor: boolean;
}

const ResponsiblePartyStep: React.FC<ResponsiblePartyStepProps> = ({ data, updateData, isMinor }) => {
  const handleChange = (field: string, value: string) => {
    updateData({
      responsibleParty: {
        ...data.responsibleParty,
        [field]: value
      }
    });
  };

  if (!isMinor) {
    return (
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
            <AlertCircle className="w-5 h-5" />
            <span>Responsável Legal Não Necessário</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 dark:text-blue-300">
            Como você é maior de 18 anos, não é necessário informar dados de responsável legal. 
            Você pode prosseguir para a próxima etapa.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notice for Minors */}
      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
            <AlertCircle className="w-5 h-5" />
            <span>Responsável Legal Obrigatório</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 dark:text-orange-300">
            Como você é menor de 18 anos, é obrigatório fornecer os dados de um responsável legal 
            que será responsável pela autorização das atividades.
          </p>
        </CardContent>
      </Card>

      {/* Responsible Party Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Dados do Responsável Legal</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="responsibleName">Nome Completo *</Label>
            <Input
              id="responsibleName"
              value={data.responsibleParty?.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nome completo do responsável legal"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="relationship">Grau de Parentesco *</Label>
              <Select
                value={data.responsibleParty?.relationship || ""}
                onValueChange={(value) => handleChange("relationship", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o parentesco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pai">Pai</SelectItem>
                  <SelectItem value="mae">Mãe</SelectItem>
                  <SelectItem value="avo">Avô/Avó</SelectItem>
                  <SelectItem value="tio">Tio/Tia</SelectItem>
                  <SelectItem value="tutor">Tutor Legal</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibleCpf">CPF *</Label>
              <Input
                id="responsibleCpf"
                value={data.responsibleParty?.cpf || ""}
                onChange={(e) => handleChange("cpf", e.target.value)}
                placeholder="000.000.000-00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Contato de Emergência *</Label>
            <Input
              id="emergencyContact"
              value={data.responsibleParty?.emergencyContact || ""}
              onChange={(e) => handleChange("emergencyContact", e.target.value)}
              placeholder="(11) 99999-9999"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Legal Notice */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Responsabilidades Legais</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>O responsável legal declara estar ciente de que:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Autoriza a participação do menor nas atividades da academia</li>
              <li>Está ciente dos riscos naturais da prática de artes marciais</li>
              <li>Assume responsabilidade pelas informações prestadas</li>
              <li>Deve comunicar imediatamente qualquer mudança no estado de saúde do menor</li>
              <li>Autoriza o atendimento médico de emergência caso necessário</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact Info */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
            <Phone className="w-5 h-5" />
            <span>Informação Importante</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            O contato de emergência será usado apenas em situações de urgência durante as atividades. 
            Certifique-se de fornecer um número que esteja sempre disponível.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponsiblePartyStep;