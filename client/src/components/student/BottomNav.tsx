import { Home, CalendarDays, Bell, User, BarChart3 } from "lucide-react";
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
      to: "/student/attendance-stats", 
      icon: BarChart3, 
      label: "Presenças",
      isActive: location === "/student/attendance-stats"
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
      className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 border-t backdrop-blur shadow-[0_-6px_16px_rgba(0,0,0,0.08)] z-50"
      style={{ 
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
        paddingTop: "8px"
      }}
      aria-label="Student bottom navigation"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link 
                href={item.to} 
                className={`flex flex-col items-center justify-center min-h-[44px] text-xs gap-1 transition-colors rounded-lg p-2 ${
                  item.isActive 
                    ? "text-foreground font-medium" 
                    : "text-foreground/80 hover:text-foreground"
                }`}
                aria-current={item.isActive ? "page" : undefined}
                data-testid={`link-nav-${item.label.toLowerCase()}`}
              >
                <Icon size={22} strokeWidth={item.isActive ? 2.5 : 2} />
                <span className="text-xs leading-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}