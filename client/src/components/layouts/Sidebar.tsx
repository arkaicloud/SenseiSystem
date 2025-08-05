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
          label: "Alunos em Risco",
          icon: AlertTriangle,
          path: "/students-at-risk",
          roles: ["admin", "instructor"],
        },
        {
          id: "pedidos-pendentes",
          label: "Pedidos Pendentes",
          icon: UserCheck,
          path: "/pending-users",
          roles: ["admin"],
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
      id: "configuracoes",
      label: "Configurações",
      icon: Settings,
      children: [
        {
          id: "meu-perfil",
          label: "Meu Perfil",
          icon: UserCog,
          path: "/profile",
        },
        {
          id: "pessoais",
          label: "Pessoais",
          icon: User,
          path: "/settings",
        },
        {
          id: "da-escola",
          label: "Da Escola",
          icon: Building2,
          path: "/school-config",
          roles: ["admin"],
        },
        {
          id: "gerenciar-faixas",
          label: "Gerenciar Faixas",
          icon: Award,
          path: "/belt-management",
          roles: ["admin"],
        },
      ],
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

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
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
      </nav>

      {/* User info and footer - fixed at bottom */}
      <div className="border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="p-4 flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center mr-3">
            <span className="font-bold text-white text-sm">{userInitials}</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-900 dark:text-white text-sm">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{formatRole(user.role)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isLoading}
            className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="px-4 pb-3 text-xs text-slate-500 dark:text-slate-500">
          <p>SenseiSystem - Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;