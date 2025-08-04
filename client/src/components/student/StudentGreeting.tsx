import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar } from "lucide-react";

interface StudentGreetingProps {
  studentName: string;
  currentBelt: {
    name: string;
    color: string;
    promotionDate: string;
  };
  primaryColor: string;
}

export const StudentGreeting = ({ studentName, currentBelt, primaryColor }: StudentGreetingProps) => {
  const getBeltColor = (color: string) => {
    const colors: Record<string, string> = {
      white: "bg-slate-100 text-slate-800 border-slate-300",
      blue: "bg-blue-100 text-blue-800 border-blue-300",
      purple: "bg-purple-100 text-purple-800 border-purple-300",
      brown: "bg-amber-700 text-white border-amber-700",
      black: "bg-black text-white border-black",
    };
    return colors[color.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <Card 
      className="text-white shadow-lg border-0"
      style={{ backgroundColor: primaryColor }}
    >
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Olá, {studentName}! 👋</h1>
            <p className="text-white/80 text-sm">
              Continue sua jornada nas artes marciais com dedicação e disciplina.
            </p>
          </div>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              <div>
                <p className="text-sm text-white/80">Faixa Atual</p>
                <Badge variant="secondary" className={`${getBeltColor(currentBelt.color)} font-semibold`}>
                  {currentBelt.name}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Calendar className="w-4 h-4" />
              <span>Desde {currentBelt.promotionDate}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};