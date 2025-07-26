import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Users, Calendar, CreditCard, Settings, User, FileText, CheckSquare, Home, Clock, MessageSquare, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, isMobile }) => {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { t } = useTranslation();

  // Buscar configuração da escola para obter o nome
  const { data: schoolConfig } = useQuery({
    queryKey: ['/api/school-config'],
  });

  // Determine if a link is active
  const isActive = (path: string) => {
    return location === path || (path !== '/' && location.startsWith(path));
  };

  const linkClass = (path: string) => {
    return `flex items-center px-4 py-3 w-full text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? "text-white bg-primary-light border-r-4 border-white"
        : "text-gray-300 hover:bg-primary-light hover:text-white"
    }`;
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get pending users count for admin
  const { data: pendingUsersData } = useQuery({
    queryKey: ['/api/users/pending'],
    enabled: user?.role === 'admin',
    refetchInterval: 30000, // Check every 30 seconds
  });

  // If not authenticated, don't show sidebar
  if (!user) {
    return null;
  }

  // Get user initials for avatar safely
  const userInitials = user && user.firstName && user.lastName 
    ? getInitials(user.firstName, user.lastName) 
    : "??";

  // Format role name for display
  const formatRole = (role?: string) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Determine which menu items to show based on role
  const isAdmin = user?.role === "admin";
  const isInstructor = user?.role === "instructor" || isAdmin;
  const isStudent = user?.role === "student";

  const pendingCount = pendingUsersData?.users?.length || 0;

  return (
    <aside
      id="sidebar"
      className={`sidebar bg-primary text-white w-64 min-w-64 h-screen ${
        isMobile 
          ? `fixed top-0 left-0 z-50 ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out` 
          : "fixed top-0 left-0 z-40"
      } flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 flex items-center border-b border-primary-light flex-shrink-0">
        <div className="bg-white p-1 rounded mr-3">
          <div className="belt black-belt w-8 h-8 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {schoolConfig?.config?.schoolName?.charAt(0)?.toUpperCase() || 'S'}
            </span>
          </div>
        </div>
        <h1 className="font-montserrat font-bold text-[16px]">
          {schoolConfig?.config?.schoolName || 'SenseiSystem'}
        </h1>
      </div>
      {/* Navigation links - scrollable middle section */}
      <nav className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 py-4">
          <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wide">{t('main')}</div>
          <Link href="/" className={linkClass("/")}>
            <Home className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Painel</span>
          </Link>

          {isInstructor && (
            <Link href="/students" className={linkClass("/students")}>
              <Users className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="truncate">Alunos</span>
            </Link>
          )}

          {isInstructor && (
            <Link href="/students-at-risk" className={linkClass("/students-at-risk")}>
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="truncate">Alunos em Risco</span>
            </Link>
          )}

          {isAdmin && (
            <div className="relative">
              <Link href="/pending-users" className={linkClass("/pending-users")}>
                <Clock className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">Aprovações</span>
                {pendingCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-auto h-5 w-5 flex items-center justify-center text-xs p-0"
                  >
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            </div>
          )}

          <Link href="/attendance" className={linkClass("/attendance")}>
            <CheckSquare className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Presença</span>
          </Link>

          {!isStudent && (
            <Link href="/classes" className={linkClass("/classes")}>
              <Calendar className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="truncate">Aulas</span>
            </Link>
          )}

          {isInstructor && (
            <>
              <Link href="/payments" className={linkClass("/payments")}>
                <CreditCard className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">Pagamentos</span>
              </Link>
              
              <Link href="/payment-plans" className={linkClass("/payment-plans")}>
                <FileText className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">Planos</span>
              </Link>

              <Link href="/communications" className={linkClass("/communications")}>
                <MessageSquare className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">Comunicados</span>
              </Link>
            </>
          )}

          <div className="px-4 py-2 mt-4 text-xs text-gray-400 uppercase tracking-wide">
            CONTA
          </div>
          <Link href="/profile" className={linkClass("/profile")}>
            <User className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Perfil</span>
          </Link>

          <Link href="/settings" className={linkClass("/settings")}>
            <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Configurações</span>
          </Link>

          {isAdmin && (
            <>
              <Link href="/school-config" className={linkClass("/school-config")}>
                <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">Configurações da Escola</span>
              </Link>
            </>
          )}

        </div>
        
        {/* User info and footer - fixed at bottom */}
        <div className="border-t border-primary-light flex-shrink-0">
          <div className="p-4 flex items-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
              <span className="font-bold text-white">{userInitials}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-300">{formatRole(user.role)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="h-8 w-8 text-gray-300 hover:text-white hover:bg-primary-light"
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="px-4 pb-3 text-xs text-gray-400">
            <p className="text-[14px]">SenseiSystem - Version 1.0.0</p>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;