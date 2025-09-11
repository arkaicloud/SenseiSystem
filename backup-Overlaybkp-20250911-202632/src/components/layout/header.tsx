import React, { useState } from 'react';
import { LanguageSwitcher } from './language-switcher';
import { useTranslations } from '@/hooks/use-translations';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from './sidebar';
import { useQuery } from '@tanstack/react-query';
import { Award } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const { t } = useTranslations();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Fetch school configuration for mobile header branding
  const { data: schoolConfigResponse } = useQuery<{ config: any }>({
    queryKey: ["/api/school-config"],
  });

  const schoolConfig = schoolConfigResponse?.config || null;

  return (
    <>
      <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center justify-between border-b border-gray-700 h-16 bg-gray-800">
        <div className="flex items-center space-x-3">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-300 focus:outline-none"
              >
                <span className="sr-only">Open sidebar</span>
                <i className="fas fa-bars text-xl"></i>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[250px] bg-gray-800 border-r border-gray-700">
              <Sidebar />
            </SheetContent>
          </Sheet>
          
          {schoolConfig?.logoUrl ? (
            <img 
              src={schoolConfig.logoUrl} 
              alt={schoolConfig.schoolName || "Logo da Academia"} 
              className="h-8 w-auto max-w-[80px] object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`${schoolConfig?.logoUrl ? 'hidden' : 'flex'} items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md shadow-sm`}>
            <Award className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <h1 className="text-lg font-bold text-white mr-4 truncate">
          {schoolConfig?.schoolName || title}
        </h1>
      </div>
      
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
    </>
  );
};

export default Header;
