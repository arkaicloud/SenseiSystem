import React, { useContext } from "react";
import { AuthContext } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, CheckCircle, Lock, MessageCircle, LogOut } from "lucide-react";

export default function AwaitingApprovalPage() {
  const { user, logout } = useContext(AuthContext);
  
  // Fetch school configuration for tenant-specific branding
  const { data: schoolConfigResponse } = useQuery<{ config: any }>({
    queryKey: ["/api/school-config"],
  });

  const schoolConfig = schoolConfigResponse?.config || null;

  const handleLogout = () => {
    logout();
  };

  const handleContactSchool = () => {
    const phone = schoolConfig?.whatsapp || schoolConfig?.phone;
    if (phone) {
      const message = encodeURIComponent(
        `Olá! Sou ${user?.firstName} ${user?.lastName} e gostaria de saber sobre o status da minha matrícula.`
      );
      // Remove formatação e adiciona código do Brasil se necessário
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="text-gray-600 hover:text-gray-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      <Card className="w-full max-w-2xl bg-white shadow-lg">
        <CardHeader className="text-center pb-6">
          {/* School Logo */}
          <div className="flex justify-center mb-6">
            {schoolConfig?.logoUrl ? (
              <img 
                src={schoolConfig.logoUrl} 
                alt={schoolConfig.schoolName || "Logo da Academia"} 
                className="max-h-20 w-auto object-contain"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Clock className="w-10 h-10 text-white" />
              </div>
            )}
          </div>

          {/* Welcome Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Olá, {user?.firstName || user?.email?.split('@')[0]}!
          </h1>
          
          <p className="text-lg text-gray-600">
            Seu cadastro foi recebido com sucesso pela{" "}
            <strong className="text-blue-600">
              {schoolConfig?.schoolName || "nossa academia"}
            </strong>.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Análise em Andamento
                </h3>
                <p className="text-blue-800 mb-3">
                  Estamos analisando suas informações e em breve seu acesso será liberado.
                </p>
                <p className="text-blue-700 text-sm">
                  Assim que a escola vincular seu plano de pagamento, você será notificado por e-mail ou WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {/* Status Steps */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Cadastro realizado</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-700">Plano será vinculado em breve</span>
            </div>
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">Acesso será liberado após aprovação</span>
            </div>
          </div>

          {/* Contact Button */}
          {(schoolConfig?.whatsapp || schoolConfig?.phone) && (
            <div className="pt-4">
              <Button 
                onClick={handleContactSchool}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar com a diretoria
              </Button>
            </div>
          )}

          {/* Additional Information */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              <strong>Precisa de ajuda?</strong><br />
              Entre em contato conosco pelos canais oficiais da escola.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}