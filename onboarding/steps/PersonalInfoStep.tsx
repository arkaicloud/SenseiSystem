import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, MapPin, Calendar, FileText } from "lucide-react";

interface PersonalInfoStepProps {
  data: any;
  updateData: (data: any) => void;
  isMinor: boolean;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ data, updateData }) => {
  const handleChange = (field: string, value: string) => {
    updateData({
      personalInfo: {
        ...data.personalInfo,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Dados Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  value={data.personalInfo.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Seu primeiro nome"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  value={data.personalInfo.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Seu sobrenome"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento *</Label>
              <Input
                id="birthDate"
                type="date"
                value={data.personalInfo.birthDate}
                onChange={(e) => handleChange("birthDate", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={data.personalInfo.rg}
                  onChange={(e) => handleChange("rg", e.target.value)}
                  placeholder="00.000.000-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={data.personalInfo.cpf}
                  onChange={(e) => handleChange("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato e Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Contato</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={data.personalInfo.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone/Celular *</Label>
              <Input
                id="phone"
                value={data.personalInfo.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço Residencial</Label>
              <Input
                id="address"
                value={data.personalInfo.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modalidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Modalidade de Interesse</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="martialArt">Modalidade *</Label>
            <Select
              value={data.personalInfo.martialArt}
              onValueChange={(value) => handleChange("martialArt", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jiu-jitsu">Jiu-Jitsu</SelectItem>
                <SelectItem value="judo">Judô</SelectItem>
                <SelectItem value="karate">Karatê</SelectItem>
                <SelectItem value="muay-thai">Muay Thai</SelectItem>
                <SelectItem value="mma">MMA</SelectItem>
                <SelectItem value="other">Outras</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Informação:</strong> Os campos marcados com * são obrigatórios. 
          Certifique-se de fornecer informações precisas para facilitar o processo de matrícula.
        </p>
      </div>
    </div>
  );
};

export default PersonalInfoStep;