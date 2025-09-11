import React, { useEffect, useContext } from "react";
import { AuthContext } from "@/providers/auth-provider";
import { useLocation } from "wouter";

interface PendingRouteGuardProps {
  children: React.ReactNode;
}

export function PendingRouteGuard({ children }: PendingRouteGuardProps) {
  const { user, isLoading } = useContext(AuthContext);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Don't redirect if still loading or no user
    if (isLoading || !user) return;

    // Don't redirect if already on awaiting approval page
    if (location === '/awaiting-approval') return;

    // Don't redirect if on public pages
    const publicRoutes = ['/login', '/onboarding', '/awaiting-approval'];
    if (publicRoutes.includes(location)) return;

    // Redirect pending users to awaiting approval page
    if (user.status === 'pending') {
      setLocation('/awaiting-approval');
    }
  }, [user, isLoading, location, setLocation]);

  // If user is pending and not on awaiting approval page, don't render content
  if (user && user.status === 'pending' && location !== '/awaiting-approval') {
    return null;
  }

  return <>{children}</>;
}