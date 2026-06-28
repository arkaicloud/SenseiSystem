import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LogOut, Users, Calendar, CreditCard, Settings, 
  Home, CheckSquare, MessageSquare, AlertTriangle, GraduationCap, 
  UserCheck, DollarSign, Building2, BarChart3, ChevronDown,
  FileText, Award, X, Bell, Ticket, HeartHandshake
} from "lucide-react";
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
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const { data: schoolConfig } = useQuery({ queryKey: ['/api/school-config'] });
  const { data: pendingUsersData } = useQuery({
    queryKey: ['/api/users/pending'],
    enabled: user?.role === 'admin',
    refetchInterval: 30000,
  });

  const pendingCount = (pendingUsersData as any)?.users?.length || 0;
  const schoolName = (schoolConfig as any)?.config?.schoolName || 'SenseiSystem';
  const schoolLetter = schoolName.charAt(0).toUpperCase();

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/" },
    {
      id: "alunos", label: "Alunos", icon: GraduationCap,
      roles: ["admin", "instructor"],
      children: [
        { id: "lista-alunos", label: "Lista de Alunos", icon: Users, path: "/students", roles: ["admin", "instructor"] },
        { id: "aprovacoes-pendentes", label: "Aprovações Pendentes", icon: UserCheck, path: "/admin/pending-approvals", roles: ["admin"] },
        { id: "alunos-risco", label: "Engajamento em Baixa", icon: AlertTriangle, path: "/students-at-risk", roles: ["admin", "instructor"] },
        { id: "gerenciar-faixas", label: "Gerenciar Faixas", icon: Award, path: "/belt-management", roles: ["admin", "instructor"] },
      ],
    },
    { id: "aulas", label: "Aulas", icon: Calendar, path: "/classes", roles: ["admin", "instructor"] },
    { id: "presencas", label: "Controle de Aulas", icon: CheckSquare, path: "/attendance", roles: ["admin", "instructor"] },
    {
      id: "financeiro", label: "Financeiro", icon: DollarSign,
      roles: ["admin", "instructor"],
      children: [
        { id: "planos", label: "Planos", icon: FileText, path: "/payment-plans", roles: ["admin", "instructor"] },
        { id: "financial-dashboard", label: "Painel Financeiro", icon: BarChart3, path: "/financial", roles: ["admin"] },
        { id: "coupons", label: "Cupons", icon: Ticket, path: "/coupons", roles: ["admin"] },
        { id: "family-plans", label: "Planos Família", icon: HeartHandshake, path: "/admin/family-plans", roles: ["admin"] },
      ],
    },
    { id: "comunicados", label: "Comunicados", icon: MessageSquare, path: "/communications", roles: ["admin", "instructor"] },
    { id: "school-config", label: "Configuração da Escola", icon: Settings, path: "/school-config", roles: ["admin"] },
    { id: "asaas-integration", label: "Integração ASAAS", icon: CreditCard, path: "/asaas-payments", roles: ["admin"] },
    { id: "agenda-semana", label: "Agenda da Semana", icon: Calendar, path: "/agenda", roles: ["student"] },
    { id: "avisos-aluno", label: "Avisos", icon: Bell, path: "/student/notices", roles: ["student"] },
  ];

  const hasPermission = (item: MenuItem) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || "");
  };

  const getFilteredMenuItems = (items: MenuItem[]): MenuItem[] =>
    items
      .filter(hasPermission)
      .map(item => ({ ...item, children: item.children ? getFilteredMenuItems(item.children) : undefined }))
      .filter(item => !item.children || item.children.length > 0);

  const filteredMenuItems = getFilteredMenuItems(menuItems);

  const isActive = (path: string) =>
    location === path || (path !== '/' && location.startsWith(path));

  const hasActiveChild = (children?: MenuItem[]): boolean =>
    !children ? false : children.some(c => (c.path && isActive(c.path)) || hasActiveChild(c.children));

  const toggleMenu = (menuId: string) =>
    setOpenMenus(prev => prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]);

  const userInitials = user?.firstName && user?.lastName
    ? getInitials(user.firstName, user.lastName) : "??";

  const formatRole = (role?: string) => {
    const map: Record<string, string> = { admin: 'Administrador', instructor: 'Instrutor', student: 'Aluno' };
    return role ? (map[role] || role) : '';
  };

  if (!user) return null;

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isMenuOpen = openMenus.includes(item.id);
    const isItemActive = item.path && isActive(item.path);
    const hasActiveChildItem = hasActiveChild(item.children);

    if (hasChildren) {
      return (
        <div key={item.id} className="mb-0.5">
          <button
            onClick={() => toggleMenu(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-all duration-150",
              (isMenuOpen || hasActiveChildItem)
                ? "bg-indigo-50 text-indigo-700 font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-medium"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
              <span>{item.label}</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 text-slate-400", isMenuOpen && "rotate-180")} />
          </button>

          <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
            <div className="ml-3 mt-0.5 pl-4 border-l border-slate-100 space-y-0.5 py-1">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </div>
          </div>
        </div>
      );
    }

    const ItemContent = (
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-150",
        level === 0
          ? isItemActive
            ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-200"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-medium"
          : isItemActive
            ? "bg-indigo-50 text-indigo-700 font-semibold"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium"
      )}>
        <item.icon className="flex-shrink-0" style={{ width: level === 0 ? 18 : 16, height: level === 0 ? 18 : 16 }} />
        <span className="flex-1">{item.label}</span>
        {(item.id === "aprovacoes-pendentes") && pendingCount > 0 && (
          <Badge variant="destructive" className="ml-1 h-5 min-w-5 flex items-center justify-center text-xs p-0 px-1">
            {pendingCount}
          </Badge>
        )}
      </div>
    );

    return (
      <div key={item.id} className="mb-0.5">
        {item.path ? (
          <Link href={item.path} onClick={isMobile ? onClose : undefined}>{ItemContent}</Link>
        ) : ItemContent}
      </div>
    );
  };

  const cfg = (schoolConfig as any)?.config;
  const hasSocial = cfg?.instagram || cfg?.facebook || cfg?.whatsapp || cfg?.youtube || cfg?.tiktok;

  return (
    <aside
      id="sidebar"
      className={cn(
        "bg-white border-r border-slate-200/80 w-64 min-w-64 h-screen flex flex-col",
        isMobile
          ? `fixed top-0 left-0 z-50 ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out shadow-2xl`
          : "fixed top-0 left-0 z-40"
      )}
    >
      {/* Logo / School name */}
      <div className="px-5 py-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-200">
            <span className="text-white text-sm font-bold">{schoolLetter}</span>
          </div>
          <span className="font-semibold text-slate-800 text-base leading-tight">{schoolName}</span>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="space-y-0.5">
          {filteredMenuItems.map(item => renderMenuItem(item))}
        </div>

        {/* Social */}
        {hasSocial && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5 px-3">Redes Sociais</p>
            <div className="flex items-center gap-2 flex-wrap px-3">
              {cfg?.instagram && (
                <a href={cfg.instagram} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white hover:scale-110 transition-transform" title="Instagram">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {cfg?.facebook && (
                <a href={cfg.facebook} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform" title="Facebook">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {cfg?.whatsapp && (
                <a href={`https://wa.me/${cfg.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white hover:scale-110 transition-transform" title="WhatsApp">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/></svg>
                </a>
              )}
              {cfg?.youtube && (
                <a href={cfg.youtube} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white hover:scale-110 transition-transform" title="YouTube">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              )}
              {cfg?.tiktok && (
                <a href={cfg.tiktok} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white hover:scale-110 transition-transform" title="TikTok">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </a>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-100 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">{formatRole(user.role)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex-shrink-0"
            onClick={async () => { try { await logout(); } catch (e) { console.error(e); } }}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
