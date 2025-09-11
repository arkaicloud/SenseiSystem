import React, { Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';
import DashboardLazy from './DashboardLazy';

export default function DashboardPage() {
  const { user } = useAuth();
  
  if (!user) {
    return <DashboardSkeleton />; // Fallback skeleton
  }
  
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLazy userRole={user.role} />
    </Suspense>
  );
}
