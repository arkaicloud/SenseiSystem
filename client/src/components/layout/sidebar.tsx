import React from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslations } from '@/hooks/use-translations';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarMenuItem } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Award } from 'lucide-react';

// Icons from Font Awesome (using className approach)
export const Sidebar = () => {
  const { t } = useTranslations();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  
  // Fetch school configuration for tenant-specific branding
  const { data: schoolConfigResponse } = useQuery<{ config: any }>({
    queryKey: ["/api/school-config"],
  });

  // Safely extract config from response
  const schoolConfig = schoolConfigResponse?.config || null;
  
  const menuItems: SidebarMenuItem[] = [
    { 
      key: 'dashboard', 
      label: t('common.dashboard'), 
      icon: 'fas fa-tachometer-alt', 
      href: '/dashboard',
      roles: ['admin', 'manager', 'instructor', 'student']
    },
    { 
      key: 'students', 
      label: t('common.students'), 
      icon: 'fas fa-users', 
      href: '/students',
      roles: ['admin', 'manager', 'instructor']
    },
    { 
      key: 'classes', 
      label: t('common.classes'), 
      icon: 'fas fa-calendar-alt', 
      href: '/classes',
      roles: ['admin', 'manager', 'instructor', 'student']
    },
    { 
      key: 'attendance', 
      label: t('common.attendance'), 
      icon: 'fas fa-clipboard-list', 
      href: '/attendance',
      roles: ['admin', 'manager', 'instructor']
    },
    { 
      key: 'plans', 
      label: t('common.plans'), 
      icon: 'fas fa-tag', 
      href: '/plans',
      roles: ['admin', 'manager']
    },
    { 
      key: 'settings', 
      label: t('common.settings'), 
      icon: 'fas fa-cog', 
      href: '/settings',
      roles: ['admin', 'manager', 'instructor', 'student']
    }
  ];
  
  const filteredItems = user 
    ? menuItems.filter(item => item.roles.includes(user.role)) 
    : [];
  
  const isActive = (path: string) => {
    if (path === '/dashboard' && location === '/') return true;
    return location === path || location.startsWith(`${path}/`);
  };

  return (
    <div className="flex flex-col w-64 bg-gray-800 border-r border-gray-700">
      <div className="h-16 flex items-center px-3 border-b border-gray-700">
        <div className="flex items-center space-x-3 w-full">
          {schoolConfig?.logoUrl ? (
            <div className="flex-shrink-0">
              <img 
                src={schoolConfig.logoUrl} 
                alt={schoolConfig.schoolName || "Logo da Academia"} 
                className="h-10 w-auto max-w-[100px] md:max-w-[120px] object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
                <Award className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
              <Award className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm md:text-base font-bold text-white truncate">
              {schoolConfig?.schoolName || "SenseiSystem"}
            </h1>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-grow py-4">
        <nav className="flex-1 px-2 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t('common.dashboard')}
          </div>
          
          <Link href="/dashboard">
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isActive('/dashboard') 
                ? 'bg-primary text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}>
              <i className={`${isActive('/dashboard') ? 'text-primary-light' : 'text-gray-400'} mr-3 fas fa-tachometer-alt w-4 text-center`}></i>
              {t('common.dashboard')}
            </a>
          </Link>
          
          <div className="px-3 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t('common.management')}
          </div>
          
          {filteredItems
            .filter(item => item.key !== 'dashboard' && item.key !== 'settings')
            .map(item => (
              <Link key={item.key} href={item.href}>
                <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href) 
                    ? 'bg-primary text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}>
                  <i className={`${isActive(item.href) ? 'text-primary-light' : 'text-gray-400'} mr-3 ${item.icon} w-4 text-center`}></i>
                  {item.label}
                </a>
              </Link>
            ))}
          
          <div className="px-3 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t('common.account')}
          </div>
          
          <Link href="/settings">
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isActive('/settings') 
                ? 'bg-primary text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}>
              <i className={`${isActive('/settings') ? 'text-primary-light' : 'text-gray-400'} mr-3 fas fa-cog w-4 text-center`}></i>
              {t('common.settings')}
            </a>
          </Link>
          
          <a 
            href="#" 
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          >
            <i className="fas fa-sign-out-alt mr-3 text-gray-400 w-4 text-center"></i>
            {t('common.logout')}
          </a>
        </nav>
      </div>
      
      {user && (
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <Avatar>
              <AvatarFallback>
                {user.email.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {user.student?.name || user.email}
              </p>
              <p className="text-xs font-medium text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
