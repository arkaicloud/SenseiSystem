import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/hooks/use-translations";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CreditCard, ChevronRight } from "lucide-react";
import { TodayClasses } from "@/components/student/TodayClasses";
import { NoticesBlock } from "@/components/student/NoticesBlock";
import { Link } from "wouter";
import heroImg from "@assets/karate-fighters-tatami-fighting-championship_1773070189913.jpg";
import beltImg from "@assets/karate-player-tying-his-belt_1773070189914.jpg";

export default function StudentDashboard() {
  const { t } = useTranslations();
  const { user } = useAuth();

  const { data: studentData, isLoading: isStudentLoading } = useQuery({
    queryKey: ["/api/student/profile", user?.id],
    enabled: !!user?.id,
  });

  const { data: todayClasses, isLoading: isClassesLoading } = useQuery({
    queryKey: ["/api/classes/today"],
  });

  if (isStudentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#2B54FF]/20"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const getBeltColor = (beltLevel: string) => {
    const colors: Record<string, string> = {
      white: "#FFFFFF", blue: "#0066CC", purple: "#800080",
      brown: "#8B4513", black: "#000000",
    };
    return colors[beltLevel] || "#FFFFFF";
  };

  const formatBelt = (beltLevel: string, stripes: number) => {
    const beltNames: Record<string, string> = {
      white: "Branca", blue: "Azul", purple: "Roxa",
      brown: "Marrom", black: "Preta",
    };
    const stripesText = stripes > 0 ? ` (${stripes} ${stripes === 1 ? "grau" : "graus"})` : "";
    return `${beltNames[beltLevel] || beltLevel}${stripesText}`;
  };

  const beltLevel = (studentData as any)?.beltLevel || "white";
  const stripes = (studentData as any)?.stripes || 0;

  return (
    <div className="font-inter -mx-3 -mt-3 md:mx-0 md:mt-0">
      <div className="vyta-hero h-[280px] md:h-[220px] md:rounded-2xl">
        <img
          src={heroImg}
          alt="BJJ Training"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="vyta-hero-gradient" />
        <div className="vyta-hero-content flex flex-col justify-between h-full p-5 pt-6">
          <div>
            <span className="text-[22px] font-bold text-white tracking-[2px] font-inter">
              SENSEI
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-[28px] font-bold text-white leading-[34px] font-inter">
              Fala, {user?.firstName}!
            </h1>
            <p className="text-[15px] text-white/80 font-inter">
              Bora treinar hoje?
            </p>
            {(studentData as any)?.beltLevel && (
              <div className="flex items-center gap-3 mt-3">
                <div className="relative">
                  <div
                    className={`w-20 h-5 rounded-sm shadow-lg ${beltLevel === "white" ? "border border-white/50" : ""}`}
                    style={{ backgroundColor: getBeltColor(beltLevel) }}
                  />
                  {stripes > 0 && (
                    <div className="absolute inset-0 flex justify-end items-center pr-1 space-x-0.5">
                      {Array.from({ length: stripes }, (_, i) => (
                        <div key={i} className="w-0.5 h-3 rounded-full bg-white" />
                      ))}
                    </div>
                  )}
                </div>
                <span className="vyta-pill">
                  Faixa {formatBelt(beltLevel, stripes)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 pb-24 space-y-6">
        <div className="vyta-card-hero">
          <img src={beltImg} alt="Treino" />
          <div className="vyta-card-hero-gradient" />
          <div className="vyta-card-hero-content">
            <span className="vyta-pill mb-2">
              <Calendar className="w-3 h-3" />
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
            </span>
            <h3 className="text-lg font-bold text-white font-inter mt-1">Aulas de Hoje</h3>
            <p className="text-sm text-white/70 font-inter">Confirme sua presença nas aulas</p>
          </div>
        </div>

        {(studentData as any)?.id && (
          <TodayClasses
            classes={
              Array.isArray((todayClasses as any)?.classes)
                ? (todayClasses as any).classes
                : []
            }
            studentId={(studentData as any)?.id}
            primaryColor="#2B54FF"
            isLoading={isClassesLoading}
          />
        )}

        {(studentData as any)?.id && (
          <NoticesBlock
            studentId={(studentData as any)?.id}
            primaryColor="#2B54FF"
            limit={3}
          />
        )}

        <div className="flex gap-3">
          <Link href="/student/week-agenda" className="flex-1">
            <div className="vyta-card p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF1FF] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#2B54FF]" />
                </div>
                <span className="font-semibold text-sm font-inter">Agenda</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#B0B0B0]" />
            </div>
          </Link>
          <Link href="/student/attendance-stats" className="flex-1">
            <div className="vyta-card p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF1FF] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#2B54FF]" />
                </div>
                <span className="font-semibold text-sm font-inter">Presenças</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#B0B0B0]" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
