import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Layout } from '@/components/layout/layout';
import { useTranslations } from '@/hooks/use-translations';
import AdminDashboard from './admin';
import InstructorDashboard from './instructor';
import StudentDashboardNew from './StudentDashboardNew';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslations();
  const [_, navigate] = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [isLoading, user, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">{t('common.loading')}</div>
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect to login
  }
  
  // Render different dashboard based on user role
  const renderDashboard = () => {
    console.log('Rendering dashboard for user role:', user.role);
    switch (user.role) {
      case 'admin':
      case 'manager':
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
      case 'manager':
        return t('dashboard.adminDashboard');
      case 'instructor':
        return t('dashboard.instructorDashboard');
      case 'student':
        return t('dashboard.studentDashboard');
      default:
        return t('common.dashboard');
    }
  };
  
  // For student dashboard, render without Layout wrapper since it has its own design
  if (user.role === 'student') {
    return renderDashboard();
  }

  return (
    <Layout title={getDashboardTitle()}>
      {renderDashboard()}
    </Layout>
  );
}
