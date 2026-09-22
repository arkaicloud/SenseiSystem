import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { SchoolConfig } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sun, Moon, LogOut, Building2, User, UserCheck, ChevronDown, Eye } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import NotificationBell from "@/components/notifications/NotificationBell";
import { StudentBell } from "@/components/student/StudentBell";
import BottomNav from "@/components/student/BottomNav";
import { StudentSwitcher } from "@/components/guardian/StudentSwitcher";
import StudentViewDialog from "@/components/admin/StudentViewDialog";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' && window.innerWidth < 1024
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [isPWA, setIsPWA] = useState(false);
  const [studentViewDialogOpen, setStudentViewDialogOpen] = useState(false);

  const toggleCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  };
  const { user, isLoading, logout } = useAuth();
  const [location] = useLocation();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  // Buscar configuração da escola
  const { data: schoolConfigData } = useQuery<{ config: SchoolConfig }>({
    queryKey: ["/api/school-config"],
    enabled: !!user,
  });

  // Buscar contagem de aprovações pendentes para admins
  const { data: pendingUsersData } = useQuery({
    queryKey: ['/api/users/pending'],
    enabled: user?.role === 'admin',
    refetchInterval: 30000,
  });

  // Buscar perfil do aluno para notificações
  const { data: studentProfile } = useQuery({
    queryKey: ['/api/student/profile'],
    enabled: user?.role === 'student',
  });

  const schoolConfig = schoolConfigData?.config;
  const pendingCount = (pendingUsersData as any)?.users?.length || 0;
  const isSuperAdmin = Boolean((user as any)?.isSuperAdmin);

  // Don't show layout on auth page
  const isAuthPage = location === "/auth";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Detect PWA
    const detectPWA = () => {
      const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone || 
                       document.referrer.includes('android-app://');
      setIsPWA(isPWAMode);
    };

    handleResize();
    detectPWA();
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
    return (
      <div className="w-full h-full min-h-screen m-0 p-0 bg-background">
        {children}
      </div>
    );
  }

  // Remove loading check - handled by RootGuard now

  // Get user initials for avatar if authenticated
  const userInitials = user ? getInitials(user.firstName, user.lastName) : "??";

  return (
    <div className="flex w-full h-full min-h-screen bg-background dark:bg-background relative m-0 p-0">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation - hidden on mobile for students and guardians */}
      {user && (
        <div className={(user?.role === 'student' || user?.role === 'guardian') ? 'hidden lg:block' : ''}>
          <Sidebar
            isOpen={sidebarOpen}
            isMobile={isMobile}
            onClose={() => setSidebarOpen(false)}
            isCollapsed={!isMobile && sidebarCollapsed}
            onToggleCollapse={toggleCollapse}
          />
        </div>
      )}

      {/* Main content */}
      <main className={`flex-1 ${
        !isMobile && user && user?.role !== 'student' && user?.role !== 'guardian'
          ? sidebarCollapsed ? "ml-16" : "ml-64"
          : ""
      } ${(user?.role === 'student' || user?.role === 'guardian') ? "lg:ml-64" : ""} transition-all duration-300 ease-in-out relative min-h-screen overflow-x-hidden w-0`}>
        {/* Desktop header */}
        {!isMobile && user && (
          <div className="bg-background/95 backdrop-blur-xl border-b border-border dark:border-border hidden lg:flex items-center justify-between px-8 py-5 sticky top-0 z-40">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-foreground dark:text-foreground">
                Bem-vindo, {user.firstName}!
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Student Switcher for guardians */}
              <StudentSwitcher />

              {/* Notification Bell */}
              {user?.role === 'admin' && <NotificationBell />}
              {user?.role === 'student' && studentProfile && typeof studentProfile === 'object' && studentProfile !== null && 'id' in studentProfile && (
                <StudentBell studentId={(studentProfile as { id: number }).id} />
              )}
              
              {/* Theme toggle button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-secondary-foreground dark:text-secondary-foreground hover:text-foreground dark:hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded p-2 transition-colors duration-200"
                title={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>
              
              {/* Admin & User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-8">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <span className="font-bold text-white text-xs">{userInitials}</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Admin Options */}
                  {user?.role === 'admin' && (
                    <>
                      {isSuperAdmin && (
                        <DropdownMenuItem
                          onSelect={() => setStudentViewDialogOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Visualizar como aluno</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/admin/pending-approvals" className="flex items-center gap-2 w-full">
                          <UserCheck className="w-4 h-4" />
                          <span>Pedidos Pendentes</span>
                          {pendingCount > 0 && (
                            <span className="ml-auto bg-danger/100 text-white text-xs rounded-full px-2 py-1">
                              {pendingCount}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/school-config" className="flex items-center gap-2 w-full">
                          <Building2 className="w-4 h-4" />
                          <span>Configurações da Escola</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {/* User Options */}
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 w-full">
                      <User className="w-4 h-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Logout */}
                  <DropdownMenuItem 
                    onClick={async () => {
                      try {
                        await logout();
                      } catch (error) {
                        console.error('Logout error:', error);
                      }
                    }}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
        
        {/* Mobile header - VYTA style for students/guardians, standard for admins */}
        {isMobile && user && (user?.role === 'student' || user?.role === 'guardian') && (
          <div className="lg:hidden" />
        )}
        {isMobile && user && user?.role !== 'student' && user?.role !== 'guardian' && (
          <div className="bg-background/95 backdrop-blur-xl border-b border-border dark:border-border lg:hidden flex items-center justify-between px-4 py-3 fixed top-0 left-0 right-0 z-50">
            <button
              id="menu-toggle"
              className="text-secondary-foreground dark:text-secondary-foreground hover:text-foreground dark:hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded p-2 active:bg-muted dark:active:bg-muted transition-colors duration-200"
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
              <h1 className="font-montserrat font-bold text-base sm:text-lg text-foreground dark:text-foreground">
                {schoolConfig?.schoolName || 'SenseiSystem'}
              </h1>
              <span className="ml-3 text-sm text-secondary-foreground dark:text-muted-foreground hidden sm:inline">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Student Switcher for guardians - mobile */}
              <StudentSwitcher />

              {user?.role === 'admin' && <NotificationBell />}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-secondary-foreground dark:text-secondary-foreground hover:text-foreground dark:hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded p-2 transition-colors duration-200"
                title={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-8">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <span className="font-bold text-white text-xs">{userInitials}</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {user?.role === 'admin' && (
                    <>
                      {isSuperAdmin && (
                        <DropdownMenuItem
                          onSelect={() => setStudentViewDialogOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Visualizar como aluno</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/admin/pending-approvals" className="flex items-center gap-2 w-full">
                          <UserCheck className="w-4 h-4" />
                          <span>Pedidos Pendentes</span>
                          {pendingCount > 0 && (
                            <span className="ml-auto bg-danger/100 text-white text-xs rounded-full px-2 py-1">
                              {pendingCount}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/school-config" className="flex items-center gap-2 w-full">
                          <Building2 className="w-4 h-4" />
                          <span>Configurações da Escola</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 w-full">
                      <User className="w-4 h-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={async () => {
                      try {
                        await logout();
                      } catch (error) {
                        console.error('Logout error:', error);
                      }
                    }}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Page content */}
        <div 
          className={`px-3 py-3 lg:px-8 lg:py-8 min-h-screen overflow-x-auto ${isMobile && user && user?.role !== 'student' && user?.role !== 'guardian' ? "pt-20" : ""} ${isMobile && (user?.role === 'student' || user?.role === 'guardian') ? "pt-0" : ""} ${!isMobile && user ? "pt-0" : ""} ${(user?.role === 'student' || user?.role === 'guardian') ? "lg:pb-6" : ""}`}
          style={(user?.role === 'student' || user?.role === 'guardian') ? {
            paddingBottom: isMobile 
              ? 'calc(80px + env(safe-area-inset-bottom, 0px))' 
              : '1.5rem',
            ...(isMobile ? { backgroundColor: 'hsl(var(--background))' } : {})
          } : undefined}
        >
          <div className="max-w-full min-w-0">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation - for students and guardians on mobile */}
      {(user?.role === 'student' || user?.role === 'guardian') && <BottomNav />}
      {isSuperAdmin && (
        <StudentViewDialog
          open={studentViewDialogOpen}
          onOpenChange={setStudentViewDialogOpen}
        />
      )}
    </div>
  );
};

export default MainLayout;