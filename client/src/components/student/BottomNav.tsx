import { Home, CalendarDays, Bell, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();
  
  const navItems = [
    { 
      to: "/dashboard", 
      icon: Home, 
      label: "Início",
      isActive: location === "/dashboard" || location === "/"
    },
    { 
      to: "/student/week-agenda", 
      icon: CalendarDays, 
      label: "Agenda",
      isActive: location === "/student/week-agenda"
    },
    { 
      to: "/student/notices", 
      icon: Bell, 
      label: "Avisos",
      isActive: location.includes("/notices")
    },
    { 
      to: "/settings", 
      icon: User, 
      label: "Perfil",
      isActive: location === "/settings"
    }
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 md:hidden"
      style={{ 
        paddingBottom: "env(safe-area-inset-bottom, 8px)"
      }}
    >
      <ul className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link 
                href={item.to} 
                className={`flex flex-col items-center justify-center h-full text-xs gap-1 transition-colors ${
                  item.isActive 
                    ? "text-primary font-medium" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Icon size={20} strokeWidth={item.isActive ? 2.5 : 2} />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}