import React, { useEffect } from 'react';
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
  const [location, setLocation] = useLocation();

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

  // Show overlay during authentication or boot process
  const showOverlay = authLoading || isBooting;

  // Redirect to login if not authenticated and not loading
  useEffect(() => {
    if (!authLoading && !isBooting && !user && !isPublicRoute) {
      setLocation('/login');
    }
  }, [authLoading, isBooting, user, isPublicRoute, setLocation]);

  // For public routes, render without layout or guards
  if (isPublicRoute) {
    return <div className="w-full h-full min-h-screen m-0 p-0 bg-slate-950">{children}</div>;
  }

  // Render overlay if loading/booting
  if (showOverlay) {
    return <AppLoadingOverlay visible={true} progress={progress} quote={quote} />;
  }

  // Render main layout if user is authenticated
  if (user) {
    return <MainLayout>{children}</MainLayout>;
  }

  // Fallback: render nothing while redirect happens
  return <div className="w-full h-full min-h-screen bg-slate-950" />;
}