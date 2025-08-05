import { useState } from "react";
import { Bell, UserCheck, Gift, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface PendingUser {
  id: number;
  firstName: string;
  lastName: string;
  joinDate: string;
}

interface Birthday {
  id: number;
  name: string;
  date: string;
  type: 'student' | 'instructor';
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  // Buscar aprovações pendentes
  const { data: pendingUsers } = useQuery({
    queryKey: ["/api/users/pending"],
    refetchInterval: 30000,
  });

  // Simular aniversariantes de hoje (você pode implementar uma API real depois)
  const getTodayBirthdays = (): Birthday[] => {
    const today = new Date();
    const todayStr = `${today.getDate()} de ${today.toLocaleDateString('pt-BR', { month: 'short' })}`;
    
    // Mock data - substitua por dados reais da API
    const mockBirthdays: Birthday[] = [
      { id: 1, name: "João Silva", date: todayStr, type: "student" as const },
      { id: 2, name: "Maria Santos", date: todayStr, type: "instructor" as const },
    ];
    
    return mockBirthdays.filter(() => Math.random() < 0.3); // 30% chance de ter aniversariante hoje
  };

  const todayBirthdays = getTodayBirthdays();
  const pendingCount = (pendingUsers as any)?.users?.length || 0;
  const birthdaysCount = todayBirthdays.length;
  const totalNotifications = pendingCount + birthdaysCount;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary rounded p-2 transition-colors duration-200"
        >
          <Bell className="w-5 h-5" />
          {totalNotifications > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs p-0"
            >
              {totalNotifications > 9 ? "9+" : totalNotifications}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {totalNotifications === 0 ? (
          <DropdownMenuItem disabled>
            <div className="flex items-center text-muted-foreground">
              <Bell className="h-4 w-4 mr-2" />
              Nenhuma notificação
            </div>
          </DropdownMenuItem>
        ) : (
          <>
            {/* Aprovações Pendentes */}
            {pendingCount > 0 && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/admin/pending-approvals" className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <UserCheck className="h-4 w-4 mr-3 text-orange-500" />
                    <div className="flex-1">
                      <div className="font-medium">Aprovações Pendentes</div>
                      <div className="text-sm text-muted-foreground">
                        {pendingCount} aluno{pendingCount !== 1 ? 's' : ''} aguardando aprovação
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {pendingCount}
                    </Badge>
                  </Link>
                </DropdownMenuItem>
                {birthdaysCount > 0 && <DropdownMenuSeparator />}
              </>
            )}
            
            {/* Aniversariantes */}
            {birthdaysCount > 0 && (
              <DropdownMenuItem disabled>
                <div className="flex items-center p-2 w-full">
                  <Gift className="h-4 w-4 mr-3 text-pink-500" />
                  <div className="flex-1">
                    <div className="font-medium">Aniversariantes Hoje</div>
                    <div className="text-sm text-muted-foreground">
                      {todayBirthdays.map((birthday, index) => (
                        <div key={birthday.id}>
                          {birthday.name} ({birthday.type === 'student' ? 'Aluno' : 'Professor'})
                          {index < todayBirthdays.length - 1 && ', '}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                    {birthdaysCount}
                  </Badge>
                </div>
              </DropdownMenuItem>
            )}
          </>
        )}
        
        {totalNotifications > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setIsOpen(false)}
              className="text-center text-muted-foreground"
            >
              Fechar notificações
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}