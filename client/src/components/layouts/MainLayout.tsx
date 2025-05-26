import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { SchoolConfig } from "@shared/schema";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const { t } = useTranslation();

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // For the auth page, just render children with no layout
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Get user initials for avatar if authenticated
  const userInitials = user ? getInitials(user.firstName, user.lastName) : "??";

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} isMobile={isMobile} />

      {/* Main content */}
      <main className={`flex-1 ${!isMobile && user ? "ml-64" : ""} transition-all duration-300 ease-in-out relative min-h-screen`}>
        {/* Mobile header */}
        {isMobile && user && (
          <div className="bg-white shadow-sm border-b md:hidden flex items-center justify-between px-4 py-3">
            <button
              id="menu-toggle"
              className="text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary rounded p-1"
              onClick={toggleSidebar}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <div className="bg-primary p-1 rounded mr-2">
                <div className="belt black-belt w-6 h-6 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
              </div>
              <h1 className="font-montserrat font-bold text-base sm:text-lg">
                {schoolConfig?.schoolName || 'SenseiSystem'}
              </h1>
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="font-bold text-white text-xs">{userInitials}</span>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
