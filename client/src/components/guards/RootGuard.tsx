import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useBootLoader } from '@/hooks/useBootLoader';
import { useLocation } from 'wouter';
import { AppLoadingOverlay } from '@/components/loading/AppLoadingOverlay';
import MainLayout from '@/components/layouts/MainLayout';

interface RootGuardProps {
  children: React.ReactNode;
}

export function RootGuard({ children }: RootGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isBooting, progress, quote } = useBootLoader();
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
    return <div className="w-full h-full min-h-screen m-0 p-0 bg-slate-950">{children}</div>;
  }

  // Show overlay during authentication or boot process
  const showOverlay = authLoading || isBooting;

  return (
    <>
      <AppLoadingOverlay visible={showOverlay} progress={progress} quote={quote} />
      {(!showOverlay && user) ? (
        <MainLayout>{children}</MainLayout>
      ) : null}
    </>
  );
}