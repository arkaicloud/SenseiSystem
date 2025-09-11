import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Layout } from '@/components/layout/layout';
import { useTranslations } from '@/hooks/use-translations';
import AdminDashboard from './admin';
import InstructorDashboard from './instructor';
import StudentDashboardNew from './StudentDashboardNew';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslations();
  
  // No loading check needed - handled by RootGuard
  // No auth check needed - handled by ProtectedRoute
  
  if (!user) {
    return <div className="min-h-screen bg-slate-950" />; // Fallback skeleton, should not happen due to guards
  }
  
  // Render different dashboard based on user role
  const renderDashboard = () => {
    console.log('Rendering dashboard for user role:', user.role);
    switch (user.role) {
      case 'admin':
        console.log('Rendering AdminDashboard');
        return <AdminDashboard />;
      case 'instructor':
        console.log('Rendering InstructorDashboard');
        return <InstructorDashboard />;
      case 'student':
        console.log('Rendering StudentDashboard');
        return <StudentDashboardNew />;
      default:
        console.log('Rendering default StudentDashboard');
        return <StudentDashboardNew />;
    }
  };
  
  const getDashboardTitle = () => {
    switch (user.role) {
      case 'admin':
        return t('dashboard.adminDashboard');
      case 'instructor':
        return t('dashboard.instructorDashboard');
      case 'student':
        return t('dashboard.studentDashboard');
      default:
        return t('common.dashboard');
    }
  };
  
  // Render all dashboards without additional Layout wrapper since MainLayout already provides the structure
  return renderDashboard();
}
