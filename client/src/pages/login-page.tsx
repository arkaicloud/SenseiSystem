import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Award, Calendar, CreditCard, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, user, error, isLoading } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginData.username, loginData.password);
  };

  const features = [
    {
      icon: CheckCircle,
      title: "trackAttendanceFeature",
      description: "trackAttendanceDescription",
    },
    {
      icon: Award,
      title: "beltProgressionFeature", 
      description: "beltProgressionDescription",
    },
    {
      icon: Calendar,
      title: "classScheduleFeature",
      description: "classScheduleDescription", 
    },
    {
      icon: CreditCard,
      title: "paymentManagementFeature",
      description: "paymentManagementDescription",
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Huios Jiu Jitsu
            </h1>
          </div>

          {/* Login Form */}
          <div className="bg-white p-8 rounded-lg border border-gray-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">login</h2>
              <p className="text-gray-600 text-sm">Digite suas credenciais para acessar.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">email</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'login'
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Ainda não tem conta?</p>
                <button type="button" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Matrícula
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">Sistema de Gestão para Escolas e Dojos</p>
          </div>
        </div>
      </div>

      {/* Right Side - Welcome Area */}
      <div className="flex-1 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 leading-tight">
              Bem-vindo ao<br />
              Senseisystem
            </h1>
          </div>

          {/* Features List */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-full p-3 flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-lg font-semibold mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}