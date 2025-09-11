import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard/index";
import Students from "@/pages/students";
import PendingUsers from "@/pages/pending-users";
import StudentsAtRisk from "@/pages/students-at-risk";
import AsaasPayments from "@/pages/asaas-payments";
import FinancialDashboard from "@/pages/financial-dashboard";
import Classes from "@/pages/classes";
import NewAttendance from "@/pages/new-attendance";
import Payments from "@/pages/payments";
import PaymentPlans from "@/pages/payment-plans";
import Reports from "@/pages/reports";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import SchoolConfig from "@/pages/school-config";
import Communications from "@/pages/communications";
import BeltManagement from "@/pages/admin/BeltManagement";
import WeekAgendaPage from "@/pages/student/week-agenda";
import StudentNoticesPage from "@/pages/student/notices";
import LoginPage from "@/pages/LoginPage";
import WelcomePage from "@/pages/welcome-page";
import OnboardingPage from "@/pages/onboarding-page";
import AwaitingApprovalPage from "@/pages/awaiting-approval";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import { AuthProvider } from "@/providers/auth-provider";
import { LanguageProvider } from "@/providers/i18n-provider";
import { ThemeProvider } from "@/hooks/use-theme";
import { LoadingProvider, useLoading } from "@/hooks/LoadingContext";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useRouteLoading } from "@/hooks/useRouteLoading";
import { ProtectedRoute } from "@/lib/protected-route";
import { PendingRouteGuard } from "@/lib/pending-route-guard";
import { RootGuard } from "@/components/guards/RootGuard";
import StudentsAtRiskPage from "./pages/students-at-risk";
import SettingsPage from "./pages/settings";
import AsaasPaymentsPage from "./pages/asaas-payments";
import CommunicationsPage from "./pages/admin/communications";

function Router() {
  // Hook para detectar mudanças de rota e mostrar loading overlay
  useRouteLoading();
  
  return (
    <Switch>
      {/* Protected routes */}
      <ProtectedRoute path="/" component={() => <Dashboard />} />
      <ProtectedRoute path="/dashboard" component={() => <Dashboard />} />
      <ProtectedRoute
        path="/students"
        component={() => <Students />}
        allowedRoles={["admin", "instructor"]}
      />
      <ProtectedRoute
        path="/pending-users"
        component={() => <PendingUsers />}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/admin/pending-approvals"
        component={() => <PendingUsers />}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/students-at-risk"
        component={() => <StudentsAtRisk />}
        allowedRoles={["admin", "instructor"]}
      />
      <ProtectedRoute
        path="/asaas-payments"
        component={() => <AsaasPayments />}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/financial"
        component={() => <FinancialDashboard />}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/attendance"
        component={() => <NewAttendance />}
        allowedRoles={["admin", "instructor"]}
      />
      <ProtectedRoute
        path="/classes"
        component={() => <Classes />}
      />
      <ProtectedRoute
        path="/payments"
        component={() => <Payments />}
        allowedRoles={["admin", "instructor"]}
      />
      <ProtectedRoute
        path="/payment-plans"
        component={() => <PaymentPlans />}
        allowedRoles={["admin", "instructor"]}
      />
      <ProtectedRoute
        path="/communications"
        component={() => <Communications />}
        allowedRoles={["admin", "instructor"]}
      />
      <ProtectedRoute
        path="/reports"
        component={() => <Reports />}
        allowedRoles={["admin", "instructor"]}
      />
      <ProtectedRoute
        path="/profile"
        component={() => <Profile />}
      />
      <ProtectedRoute
        path="/settings"
        component={() => <Settings />}
      />
      <ProtectedRoute
        path="/school-config"
        component={() => <SchoolConfig />}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/belt-management"
        component={() => <BeltManagement />}
        allowedRoles={["admin"]}
      />
      <ProtectedRoute
        path="/student/week-agenda"
        component={() => <WeekAgendaPage />}
        allowedRoles={["student"]}
      />
      <ProtectedRoute
        path="/agenda"
        component={() => <WeekAgendaPage />}
        allowedRoles={["student"]}
      />
      <ProtectedRoute
        path="/student/notices"
        component={() => <StudentNoticesPage />}
        allowedRoles={["student"]}
      />

      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/awaiting-approval" component={AwaitingApprovalPage} />
      <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
      <Route path="/auth/reset-password" component={ResetPasswordPage} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const { busy, loadingText } = useLoading();
  
  return (
    <div className="w-full h-full min-h-screen m-0 p-0">
      <Toaster />
      <PendingRouteGuard>
        <RootGuard>
          <Router />
        </RootGuard>
      </PendingRouteGuard>
      {busy && <LoadingOverlay text={loadingText} />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <ThemeProvider>
                <AppShell />
              </ThemeProvider>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </LoadingProvider>
    </QueryClientProvider>
  );
}

export default App;