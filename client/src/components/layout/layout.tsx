import React from 'react';
import { useLocation } from 'wouter';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from '@/hooks/use-translations';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout = ({ children, title }: LayoutProps) => {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  const { t } = useTranslations();

  // Redirect to login if not authenticated
  React.useEffect(() => {
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
