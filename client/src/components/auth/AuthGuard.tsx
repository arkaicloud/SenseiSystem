import { useAuth } from "@/hooks/use-auth";
import { useBootLoader } from "@/hooks/useBootLoader";
import AppLoadingScreen from "@/components/loading/AppLoadingScreen";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isBooting, progress } = useBootLoader();

  // Se está carregando autenticação ou fazendo boot, mostrar loading
  if (authLoading || isBooting) {
    return <AppLoadingScreen progress={progress} />;
  }

  // Se não está autenticado, redirecionar será feito pelo sistema de rotas
  if (!user) {
    return null;
  }

  // Se usuário está pendente, redirecionar para aguardando aprovação
  if (user.status === 'pending') {
    window.location.href = '/awaiting-approval';
    return <AppLoadingScreen progress={100} />;
  }

  // Usuário autenticado e ativo, renderizar children
  return <>{children}</>;
}