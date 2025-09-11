import { queryClient } from "@/lib/queryClient";

// Pré-carrega chunks do dashboard baseado no role do usuário
export const preloadDashboardChunk = (userRole: string) => {
  switch (userRole) {
    case 'admin':
      return import("../pages/dashboard/admin");
    case 'instructor':
      return import("../pages/dashboard/instructor");
    case 'student':
      return import("../pages/dashboard/student");
    default:
      return import("../pages/dashboard/index");
  }
};

// Queries essenciais para o dashboard do estudante
async function prefetchStudentDashboard() {
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ["/api/user"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/student/profile"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/classes/today"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/student/attendance-current-month"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/student/financial"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/school-config"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/public/belts"] }),
  ]);
}

// Queries essenciais para o dashboard do admin
async function prefetchAdminDashboard() {
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ["/api/user"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/school-config"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/users/pending"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/dashboard-customization"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/public/belts"] }),
  ]);
}

// Queries essenciais para o dashboard do instrutor
async function prefetchInstructorDashboard() {
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ["/api/user"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/school-config"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/classes/today"] }),
    queryClient.prefetchQuery({ queryKey: ["/api/dashboard-customization"] }),
  ]);
}

// Função principal que aquece o dashboard baseado no role
export async function warmUpDashboard(userRole: string) {
  const chunkPromise = preloadDashboardChunk(userRole);
  
  let dataPromise;
  switch (userRole) {
    case 'admin':
      dataPromise = prefetchAdminDashboard();
      break;
    case 'instructor':
      dataPromise = prefetchInstructorDashboard();
      break;
    case 'student':
      dataPromise = prefetchStudentDashboard();
      break;
    default:
      dataPromise = prefetchStudentDashboard();
  }

  await Promise.all([chunkPromise, dataPromise]);
}