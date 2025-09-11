import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Award, Calendar, CreditCard } from "lucide-react";

const WelcomePage: React.FC = () => {
  const [, setLocation] = useLocation();

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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
            Bem-vindo ao<br />
            Senseisystem
          </h1>
        </div>

        {/* Features List */}
        <div className="space-y-6 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-6">
              <div className="bg-white/20 rounded-full p-4 flex-shrink-0">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <div className="text-white">
                <h3 className="text-xl font-semibold mb-1">
                  {feature.title}
                </h3>
                <p className="text-blue-100 text-lg">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button 
            onClick={() => setLocation("/dashboard")}
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-12 py-4 text-xl rounded-full shadow-lg"
          >
            Começar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;