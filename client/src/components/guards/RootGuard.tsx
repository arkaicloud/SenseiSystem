import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBootLoader } from '@/hooks/useBootLoader';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import AppLoadingScreen from '@/components/loading/AppLoadingScreen';
import MainLayout from '@/components/layouts/MainLayout';

interface RootGuardProps {
  children: React.ReactNode;
}

export function RootGuard({ children }: RootGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isBooting, progress } = useBootLoader();
  const [location] = useLocation();
  const [dashboardReady, setDashboardReady] = useState(false);
  const queryClient = useQueryClient();

  // Public routes that don't need authentication or layout
  const publicRoutes = [
    '/login',
    '/onboarding', 
    '/awaiting-approval',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];
  
  const isPublicRoute = publicRoutes.some(route => 
    location === route || location.startsWith(route)
  );

  // Verificar se os dados essenciais do dashboard estão carregados
  useEffect(() => {
    if (!isBooting && user && !isPublicRoute) {
      const checkDashboardData = () => {
        const hasUserData = !!queryClient.getQueryData(['/api/user']);
        const hasMetrics = !!queryClient.getQueryData(['/api/dashboard/metrics']);
        const hasSchoolConfig = !!queryClient.getQueryData(['/api/school-config']);
        
        if (hasUserData && hasMetrics && hasSchoolConfig) {
          // Pequeno delay para garantir que o React processou os dados
          setTimeout(() => setDashboardReady(true), 100);
        }
      };

      checkDashboardData();
      
      // Fallback: marcar como pronto após 2 segundos mesmo sem todos os dados
      const fallbackTimer = setTimeout(() => setDashboardReady(true), 2000);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [isBooting, user, isPublicRoute, queryClient]);

  // For public routes, render without layout or guards
  if (isPublicRoute) {
    return <div className="w-full h-full min-h-screen m-0 p-0">{children}</div>;
  }

  // Show loading screen during authentication, boot process, or dashboard loading
  if (authLoading || isBooting || (user && !dashboardReady)) {
    return <AppLoadingScreen progress={progress} />;
  }

  // If not authenticated, redirect will be handled by individual routes
  if (!user) {
    return <div className="w-full h-full min-h-screen m-0 p-0">{children}</div>;
  }

  // User is authenticated and dashboard is ready - render with layout
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}