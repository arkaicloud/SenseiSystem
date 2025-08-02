import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layouts/MainLayout";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import PendingUsers from "@/pages/pending-users";
import StudentsAtRisk from "@/pages/students-at-risk";
import Classes from "@/pages/classes";
import Attendance from "@/pages/attendance";
import Payments from "@/pages/payments";
import PaymentPlans from "@/pages/payment-plans";
import Reports from "@/pages/reports";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import SchoolConfig from "@/pages/school-config";
import Communications from "@/pages/communications";
import AuthPage from "@/pages/auth-page";
import OnboardingPage from "@/pages/onboarding-page";
import { AuthProvider } from "@/providers/auth-provider";
import { LanguageProvider } from "@/providers/i18n-provider";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
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
        path="/students-at-risk" 
        component={() => <StudentsAtRisk />} 
        allowedRoles={["admin", "instructor"]} 
      />
      <ProtectedRoute 
        path="/attendance" 
        component={() => <Attendance />} 
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

      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <ThemeProvider>
              <div className="min-h-screen bg-background">
                <Toaster />
                <MainLayout>
                  <Router />
                </MainLayout>
              </div>
            </ThemeProvider>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;