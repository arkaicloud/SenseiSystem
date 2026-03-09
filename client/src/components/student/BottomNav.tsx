import { Home, CalendarDays, Bell, User, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();
  
  const navItems = [
    { 
      to: "/dashboard", 
      icon: Home, 
      label: "Inicio",
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
      label: "Presencas",
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
      className="fixed bottom-0 left-0 right-0 md:hidden z-50"
      style={{ 
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
        paddingTop: "10px",
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #E8EAF0",
      }}
      aria-label="Student bottom navigation"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5 gap-0 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link 
                href={item.to} 
                className="flex flex-col items-center justify-center py-1 transition-colors"
                aria-current={item.isActive ? "page" : undefined}
              >
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
                  style={{
                    backgroundColor: item.isActive ? "#EEF1FF" : "transparent",
                  }}
                >
                  <Icon 
                    size={22} 
                    strokeWidth={item.isActive ? 2.5 : 1.8}
                    style={{ color: item.isActive ? "#2B54FF" : "#B0B0B0" }}
                  />
                </div>
                <span 
                  className="text-[11px] mt-0.5 font-inter"
                  style={{ 
                    color: item.isActive ? "#2B54FF" : "#B0B0B0",
                    fontWeight: item.isActive ? 600 : 500,
                    letterSpacing: "0.3px"
                  }}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
