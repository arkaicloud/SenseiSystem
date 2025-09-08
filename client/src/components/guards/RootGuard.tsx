import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBootLoader } from '@/hooks/useBootLoader';
import { useLocation } from 'wouter';
import AppLoadingScreen from '@/components/loading/AppLoadingScreen';
import MainLayout from '@/components/layouts/MainLayout';

interface RootGuardProps {
  children: React.ReactNode;
}

export function RootGuard({ children }: RootGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isBooting, progress } = useBootLoader();
  const [location] = useLocation();

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

  // For public routes, render without layout or guards
  if (isPublicRoute) {
    return <div className="w-full h-full min-h-screen m-0 p-0">{children}</div>;
  }

  // Show loading screen during authentication or boot process
  if (authLoading || isBooting) {
    return <AppLoadingScreen progress={progress} />;
  }

  // If not authenticated, redirect will be handled by individual routes
  if (!user) {
    return <div className="w-full h-full min-h-screen m-0 p-0">{children}</div>;
  }

  // User is authenticated and boot is complete - render with layout
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}