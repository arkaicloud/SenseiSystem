import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Gift, Phone, Mail, MessageCircle, Cake } from "lucide-react";
import { BeltWithLabel } from "@/components/ui/belt";

interface BirthdayStudent {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string | null;
  beltLevel: string;
  stripes: number;
}

export function BirthdayNotifications() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: birthdaysData, isLoading } = useQuery({
    queryKey: ['/api/birthdays/today'],
    refetchInterval: 60000, // Refresh every minute
  });

  const birthdays = (birthdaysData as any)?.birthdays || [];

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleContact = (student: BirthdayStudent, type: 'call' | 'whatsapp') => {
    if (!student.phone) return;
    
    const phone = student.phone.replace(/\D/g, ''); // Remove non-digits
    
    if (type === 'call') {
      window.open(`tel:${phone}`, '_blank');
    } else if (type === 'whatsapp') {
      const message = encodeURIComponent(
        `🎉 Feliz Aniversário, ${student.firstName}! 🎂\n\n` +
        `A família da academia deseja um dia repleto de alegria e bênçãos! ` +
        `Que Deus continue fortalecendo sua jornada no Jiu-Jitsu!\n\n` +
        `OSS! 🥋`
      );
      window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
    }
  };

  // Notification alert for birthdays
  if (birthdays.length > 0 && !isDialogOpen) {
    return (
      <Alert className="mb-6 border-l-4 border-l-yellow-500 bg-yellow-50">
        <Gift className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-yellow-800">
            🎉 {birthdays.length === 1 
              ? `${birthdays[0].firstName} faz aniversário hoje!` 
              : `${birthdays.length} alunos fazem aniversário hoje!`
            }
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="ml-2">
                Ver Aniversariantes
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Cake className="h-5 w-5 text-yellow-600" />
                  Aniversariantes de Hoje
                </DialogTitle>
              </DialogHeader>
              <BirthdayList birthdays={birthdays} onContact={handleContact} />
            </DialogContent>
          </Dialog>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

interface BirthdayListProps {
  birthdays: BirthdayStudent[];
  onContact: (student: BirthdayStudent, type: 'call' | 'whatsapp') => void;
}

function BirthdayList({ birthdays, onContact }: BirthdayListProps) {
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-4">
      {birthdays.map((student) => {
        const age = calculateAge(student.birthDate);
        
        return (
          <Card key={student.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold text-lg">
                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {student.firstName} {student.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <BeltWithLabel 
                      beltLevel={student.beltLevel as any} 
                      stripes={student.stripes} 
                      showLabel={true}
                    />
                    <Badge variant="outline" className="text-xs">
                      {age} anos
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {student.phone && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onContact(student, 'call')}
                      className="flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      Ligar
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onContact(student, 'whatsapp')}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                    >
                      <MessageCircle className="h-3 w-3" />
                      WhatsApp
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                🎂 <strong>Sugestão de mensagem:</strong> "Feliz Aniversário, {student.firstName}! 
                Que Deus continue abençoando sua jornada no Jiu-Jitsu. A família da academia 
                deseja um dia repleto de alegria! OSS!"
              </p>
            </div>
          </Card>
        );
      })}
      
      {birthdays.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Cake className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum aniversariante hoje</p>
        </div>
      )}
    </div>
  );
}

// Card component for dashboard when there are birthdays
export function BirthdayCard() {
  const { data: birthdaysData, isLoading } = useQuery({
    queryKey: ['/api/birthdays/today'],
    refetchInterval: 60000,
  });

  const birthdays = (birthdaysData as any)?.birthdays || [];

  if (isLoading || birthdays.length === 0) {
    return null;
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Aniversariantes
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-yellow-50 flex items-center justify-center">
          <Gift className="h-4 w-4 text-yellow-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{birthdays.length}</div>
        <p className="text-xs text-muted-foreground">
          {birthdays.length === 1 ? 'pessoa faz' : 'pessoas fazem'} aniversário hoje
        </p>
        <div className="mt-2">
          {birthdays.slice(0, 2).map((student: BirthdayStudent) => (
            <div key={student.id} className="text-sm font-medium">
              🎂 {student.firstName} {student.lastName}
            </div>
          ))}
          {birthdays.length > 2 && (
            <div className="text-xs text-muted-foreground">
              +{birthdays.length - 2} mais
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}