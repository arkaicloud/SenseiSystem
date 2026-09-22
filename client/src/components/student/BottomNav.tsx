import { CalendarDays, CheckCircle2, Home, ReceiptText, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    {
      to: "/dashboard", 
      icon: Home,
      label: "Inicio",
      isActive: location === "/dashboard" || location === "/",
    },
    {
      to: "/student/week-agenda",
      icon: CalendarDays,
      label: "Agenda",
      isActive: location === "/student/week-agenda",
    },
    {
      to: "/payments",
      icon: ReceiptText,
      label: "Pagamentos",
      isActive: location === "/payments",
    },
    {
      to: "/settings",
      icon: UserRound,
      label: "Perfil",
      isActive: location === "/settings" || location === "/profile",
    },
  ];

  return (
    <nav
      className="fixed inset-x-3 z-50 md:hidden"
      style={{ bottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}
      aria-label="Navegação principal do aluno"
    >
      <ul className="mx-auto grid h-[70px] max-w-xl grid-cols-5 items-center rounded-[26px] border border-border/70 bg-card/85 px-2 shadow-[0_12px_32px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex h-full items-center justify-center">
              <Link
                href={item.to}
                className={`flex min-w-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 transition-colors ${
                  item.isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={item.isActive ? "page" : undefined}
              >
                <Icon size={19} strokeWidth={item.isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}

        <li className="relative flex h-full items-center justify-center">
          <Link
            href="/checkin"
            aria-label="Abrir check-in"
            className="absolute -top-7 flex size-[62px] items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(43,84,255,0.35)] transition-transform hover:-translate-y-0.5 active:scale-95"
          >
            <CheckCircle2 className="size-7" strokeWidth={2.2} />
            <span className="sr-only">Check-in</span>
          </Link>
        </li>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex h-full items-center justify-center">
              <Link
                href={item.to}
                className={`flex min-w-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 transition-colors ${
                  item.isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={item.isActive ? "page" : undefined}
              >
                <Icon size={19} strokeWidth={item.isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
