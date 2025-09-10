import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Loader2, LogOut, Users, Calendar, CreditCard, Settings, User, 
  Home, CheckSquare, MessageSquare, AlertTriangle, GraduationCap, 
  UserCheck, DollarSign, Building2, BarChart3, UserCog, ChevronDown,
  FileText, Clock, Award, X
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: MenuItem[];
  roles?: string[];
}

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, isMobile, onClose }) => {
  const { user, logout, isLoading } = useAuth();
  const [location] = useLocation();
  const { t } = useTranslation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // Buscar configuração da escola para obter o nome
  const { data: schoolConfig } = useQuery({
    queryKey: ['/api/school-config'],
  });

  // Get pending users count for admin
  const { data: pendingUsersData } = useQuery({
    queryKey: ['/api/users/pending'],
    enabled: user?.role === 'admin',
    refetchInterval: 30000,
  });

  const pendingCount = (pendingUsersData as any)?.users?.length || 0;

  // Menu structure
  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      path: "/",
    },
    {
      id: "alunos",
      label: "Alunos",
      icon: GraduationCap,
      roles: ["admin", "instructor"],
      children: [
        {
          id: "lista-alunos",
          label: "Lista de Alunos",
          icon: Users,
          path: "/students",
          roles: ["admin", "instructor"],
        },
        {
          id: "alunos-risco",
          label: "Engajamento em Baixa",
          icon: AlertTriangle,
          path: "/students-at-risk",
          roles: ["admin", "instructor"],
        },
        
        {
          id: "gerenciar-faixas",
          label: "Gerenciar Faixas",
          icon: Award,
          path: "/belt-management",
          roles: ["admin", "instructor"],
        },
      ],
    },
    {
      id: "aulas",
      label: "Aulas",
      icon: Calendar,
      children: [
        {
          id: "turmas-horarios",
          label: "Turmas e Horários",
          icon: Clock,
          path: "/classes",
          roles: ["admin", "instructor"],
        },
        {
          id: "controle-presenca",
          label: "Controle de Presença",
          icon: CheckSquare,
          path: "/attendance",
        },
      ],
    },
    {
      id: "financeiro",
      label: "Financeiro",
      icon: DollarSign,
      roles: ["admin", "instructor"],
      children: [
        {
          id: "mensalidades",
          label: "Contas a Receber",
          icon: CreditCard,
          path: "/payments",
          roles: ["admin", "instructor"],
        },
        {
          id: "planos",
          label: "Planos",
          icon: FileText,
          path: "/payment-plans",
          roles: ["admin", "instructor"],
        },
        {
          id: "financial-dashboard",
          label: "Painel Financeiro",
          icon: BarChart3,
          path: "/financial",
          roles: ["admin"],
        },
        {
          id: "asaas-payments",
          label: "Integração ASAAS",
          icon: CreditCard,
          path: "/asaas-payments",
          roles: ["admin"],
        },
      ],
    },
    {
      id: "comunicados",
      label: "Comunicados",
      icon: MessageSquare,
      path: "/communications",
      roles: ["admin", "instructor"],
    },
    {
      id: "agenda-semana",
      label: "Agenda da Semana", 
      icon: Calendar,
      path: "/student/agenda",
      roles: ["student"],
    },
  ];

  // Check if user has permission for a menu item
  const hasPermission = (item: MenuItem) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || "");
  };

  // Filter menu items based on user role
  const getFilteredMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(hasPermission)
      .map(item => ({
        ...item,
        children: item.children ? getFilteredMenuItems(item.children) : undefined
      }))
      .filter(item => !item.children || item.children.length > 0);
  };

  const filteredMenuItems = getFilteredMenuItems(menuItems);

  // Check if a path is active
  const isActive = (path: string) => {
    return location === path || (path !== '/' && location.startsWith(path));
  };

  // Check if any child is active
  const hasActiveChild = (children?: MenuItem[]): boolean => {
    if (!children) return false;
    return children.some(child => 
      (child.path && isActive(child.path)) || hasActiveChild(child.children)
    );
  };

  // Toggle submenu
  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };


  // Get user initials for avatar safely
  const userInitials = user && user.firstName && user.lastName 
    ? getInitials(user.firstName, user.lastName) 
    : "??";

  // Format role name for display
  const formatRole = (role?: string) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (!user) {
    return null;
  }

  // Render menu item
  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isMenuOpen = openMenus.includes(item.id);
    const isItemActive = item.path && isActive(item.path);
    const hasActiveChildItem = hasActiveChild(item.children);

    if (hasChildren) {
      return (
        <div key={item.id} className="mb-1">
          <button
            onClick={() => toggleMenu(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              level === 0 ? "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
              (isMenuOpen || hasActiveChildItem) && "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
            )}
          >
            <div className="flex items-center">
              <item.icon className={cn("w-5 h-5 mr-3", level > 0 && "w-4 h-4 mr-2")} />
              <span>{item.label}</span>
            </div>
            <ChevronDown 
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isMenuOpen && "rotate-180"
              )} 
            />
          </button>

          {/* Submenu com animação */}
          <div 
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </div>
          </div>
        </div>
      );
    }

    // Menu item sem filhos
    const ItemContent = (
      <div className={cn(
        "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
        level === 0 ? "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
        isItemActive && "bg-blue-600 dark:bg-blue-500 text-white border-r-2 border-blue-600 dark:border-blue-500"
      )}>
        <item.icon className={cn("w-5 h-5 mr-3", level > 0 && "w-4 h-4 mr-2")} />
        <span className="flex-1">{item.label}</span>

        {/* Badge para pedidos pendentes */}
        {item.id === "pedidos-pendentes" && pendingCount > 0 && (
          <Badge 
            variant="destructive" 
            className="ml-2 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {pendingCount}
          </Badge>
        )}
      </div>
    );

    return (
      <div key={item.id} className="mb-1">
        {item.path ? (
          <Link href={item.path}>
            {ItemContent}
          </Link>
        ) : (
          ItemContent
        )}
      </div>
    );
  };

  return (
    <aside
      id="sidebar"
      className={cn(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 w-64 min-w-64 h-screen",
        isMobile 
          ? `fixed top-0 left-0 z-50 ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out shadow-2xl` 
          : "fixed top-0 left-0 z-40",
        "flex flex-col"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center">
          <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-lg mr-3">
            <span className="text-white text-sm font-bold">
              {(schoolConfig as any)?.config?.schoolName?.charAt(0)?.toUpperCase() || 'S'}
            </span>
          </div>
          <h1 className="font-semibold text-slate-900 dark:text-white text-lg">
            {(schoolConfig as any)?.config?.schoolName || 'SenseiSystem'}
          </h1>
        </div>
        
        {/* Close button for mobile */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation - scrollable middle section */}
      <nav className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 p-4">
          {filteredMenuItems.map(item => renderMenuItem(item))}
        </div>

        {/* Social Media Section */}
        {((schoolConfig as any)?.config?.instagram || (schoolConfig as any)?.config?.facebook || (schoolConfig as any)?.config?.whatsapp || (schoolConfig as any)?.config?.youtube || (schoolConfig as any)?.config?.tiktok) && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Redes Sociais
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Instagram */}
              {(schoolConfig as any)?.config?.instagram && (
                <a
                  href={(schoolConfig as any).config.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                  title="Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}

              {/* Facebook */}
              {(schoolConfig as any)?.config?.facebook && (
                <a
                  href={(schoolConfig as any).config.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                  title="Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}

              {/* WhatsApp */}
              {(schoolConfig as any)?.config?.whatsapp && (
                <a
                  href={`https://wa.me/${(schoolConfig as any).config.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                  title="WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                  </svg>
                </a>
              )}

              {/* YouTube */}
              {(schoolConfig as any)?.config?.youtube && (
                <a
                  href={(schoolConfig as any).config.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                  title="YouTube"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}

              {/* TikTok */}
              {(schoolConfig as any)?.config?.tiktok && (
                <a
                  href={(schoolConfig as any).config.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-black dark:bg-gray-800 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                  title="TikTok"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Footer - fixed at bottom */}
      <div className="border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-500">
          <p>SenseiSystem - Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;