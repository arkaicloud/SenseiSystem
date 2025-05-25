import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, isMobile }) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();

  // Determine if a link is active
  const isActive = (path: string) => {
    return location === path || (path !== '/' && location.startsWith(path));
  };

  const linkClass = (path: string) => {
    return `flex items-center px-4 py-3 ${
      isActive(path)
        ? "text-white bg-primary-light"
        : "text-gray-300 hover:bg-primary-light hover:text-white"
    }`;
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

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

  return (
    <aside
      id="sidebar"
      className={`sidebar bg-primary text-white w-64 fixed h-full z-10 ${
        isMobile ? (isOpen ? "open" : "") : ""
      }`}
      style={{
        transform: isMobile && !isOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.3s ease-in-out",
      }}
    >
      <div className="p-4 flex items-center border-b border-primary-light">
        <div className="bg-white p-1 rounded mr-3">
          <div className="belt black-belt w-8 h-8 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
        </div>
        <h1 className="font-montserrat font-bold text-xl">SenseiSystem</h1>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-primary-light">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
            <span className="font-bold text-white">{userInitials}</span>
          </div>
          <div className="flex-1">
            <p className="font-medium">{user.firstName} {user.lastName}</p>
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
      </div>

      {/* Navigation links */}
      <nav className="mt-4 flex flex-col h-[calc(100vh-180px)] overflow-y-auto">
        <div className="px-4 py-2 text-xs text-gray-400 uppercase">Principal</div>
        <Link href="/" className={linkClass("/")}>
          <span className="mr-3" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
          </span>
          <span>Painel</span>
        </Link>

        {isInstructor && (
          <Link href="/students" className={linkClass("/students")}>
            <span className="mr-3" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 21a8 8 0 0 0-16 0" /><circle cx="10" cy="8" r="5" /><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" /><path d="M20 16.5c0-2.37-1.5-4.5-3-6" /></svg>
            </span>
            <span>Alunos</span>
          </Link>
        )}

        <Link href="/attendance" className={linkClass("/attendance")}>
          <span className="mr-3" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          </span>
          <span>Presença</span>
        </Link>

        <Link href="/classes" className={linkClass("/classes")}>
          <span className="mr-3" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
          </span>
          <span>Aulas</span>
        </Link>

        {isInstructor && (
          <>
            <Link href="/payments" className={linkClass("/payments")}>
              <span className="mr-3" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
              </span>
              <span>Pagamentos</span>
            </Link>

            <Link href="/reports" className={linkClass("/reports")}>
              <span className="mr-3" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
              </span>
              <span>Relatórios</span>
            </Link>
          </>
        )}

        <div className="px-4 py-2 mt-4 text-xs text-gray-400 uppercase">
          Conta
        </div>
        <Link href="/profile" className={linkClass("/profile")}>
          <span className="mr-3" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>
          </span>
          <span>Perfil</span>
        </Link>

        {isAdmin && (
          <Link href="/settings" className={linkClass("/settings")}>
            <span className="mr-3" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
            </span>
            <span>Config.</span>
          </Link>
        )}

        <div className="mt-auto px-4 py-3 text-xs text-gray-400">
          <p>Version 1.0.0</p>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;