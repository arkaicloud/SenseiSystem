import { Suspense, lazy } from "react";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

// Lazy loading baseado no role do usuário
const StudentDashboard = lazy(() => import("./student"));
const AdminDashboard = lazy(() => import("./admin"));
const InstructorDashboard = lazy(() => import("./instructor"));

interface DashboardLazyProps {
  userRole: string;
}

export default function DashboardLazy({ userRole }: DashboardLazyProps) {
  const getDashboardComponent = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'instructor':
        return <InstructorDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {getDashboardComponent()}
    </Suspense>
  );
}