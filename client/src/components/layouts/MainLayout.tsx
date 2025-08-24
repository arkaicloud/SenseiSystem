import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { SchoolConfig } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import NotificationBell from "@/components/notifications/NotificationBell";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  // Buscar configuração da escola
  const { data: schoolConfigData } = useQuery<{ config: SchoolConfig }>({
    queryKey: ["/api/school-config"],
    enabled: !!user,
  });

  const schoolConfig = schoolConfigData?.config;

  // Don't show layout on auth page
  const isAuthPage = location === "/auth";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const menuToggle = document.getElementById("menu-toggle");

      if (
        isMobile &&
        sidebarOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        event.target !== menuToggle
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isMobile, sidebarOpen]);

  const toggleSidebar = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSidebarOpen(!sidebarOpen);
  };

  // For public routes (login, onboarding, etc.) - no layout needed
  const publicRoutes = ['/login', '/onboarding', '/awaiting-approval', '/auth/forgot-password', '/auth/reset-password'];
  const isPublicRoute = publicRoutes.some(route => location === route || location.startsWith(route));
  
  if (isAuthPage || isPublicRoute || !user) {
    return <div className="w-full h-full min-h-screen m-0 p-0">{children}</div>;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 m-0 p-0">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-white mx-auto mb-4" />
          <p className="text-slate-300 dark:text-slate-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Get user initials for avatar if authenticated
  const userInitials = user ? getInitials(user.firstName, user.lastName) : "??";

  return (
    <div className="flex w-full h-full min-h-screen bg-white dark:bg-gray-900 relative m-0 p-0">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      {user && <Sidebar isOpen={sidebarOpen} isMobile={isMobile} onClose={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className={`flex-1 ${!isMobile && user ? "ml-64" : ""} transition-all duration-300 ease-in-out relative min-h-screen overflow-x-hidden`}>
        {/* Desktop header */}
        {!isMobile && user && (
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 hidden md:flex items-center justify-between px-6 py-3 sticky top-0 z-40">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Bem-vindo, {user.firstName}!
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              {user?.role === 'admin' && <NotificationBell />}
              
              {/* Theme toggle button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary rounded p-2 transition-colors duration-200"
                title={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>
              
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="font-bold text-white text-xs">{userInitials}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile header */}
        {isMobile && user && (
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 md:hidden flex items-center justify-between px-4 py-3 fixed top-0 left-0 right-0 z-50">
            <button
              id="menu-toggle"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary rounded p-2 active:bg-gray-100 dark:active:bg-gray-700 transition-colors duration-200"
              onClick={(e) => toggleSidebar(e)}
              onTouchStart={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
              onTouchEnd={(e) => e.currentTarget.style.backgroundColor = ''}
              type="button"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center flex-1">
              <div className="bg-primary p-1 rounded mr-2">
                <div className="belt black-belt w-6 h-6 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {schoolConfig?.schoolName?.charAt(0) || 'S'}
                  </span>
                </div>
              </div>
              <h1 className="font-montserrat font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                {schoolConfig?.schoolName || 'SenseiSystem'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Notification Bell */}
              {user?.role === 'admin' && <NotificationBell />}
              
              {/* Theme toggle button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary rounded p-2 transition-colors duration-200"
                title={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>
              
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="font-bold text-white text-xs">{userInitials}</span>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className={`px-3 py-3 md:px-6 md:py-6 min-h-screen ${isMobile && user ? "pt-16" : ""} ${!isMobile && user ? "pt-0" : ""}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;