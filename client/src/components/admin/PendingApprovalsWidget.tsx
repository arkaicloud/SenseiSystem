import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { UserCheck, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

interface PendingUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  joinDate: string;
}

export default function PendingApprovalsWidget() {
  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ["/api/users/pending"],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const pendingCount = pendingUsers?.users?.length || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Aprovações Pendentes
        </CardTitle>
        <UserCheck className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <CardDescription>
              {pendingCount === 0 
                ? "Nenhuma aprovação pendente"
                : `${pendingCount} aluno${pendingCount !== 1 ? 's' : ''} aguardando`
              }
            </CardDescription>
          </div>
          
          {pendingCount > 0 && (
            <div className="flex flex-col gap-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {pendingCount}
              </Badge>
              <Link href="/admin/pending-approvals">
                <Button size="sm" variant="outline">
                  Revisar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}