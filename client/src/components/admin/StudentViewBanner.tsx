import { useState } from "react";
import { Eye, Loader2, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

export default function StudentViewBanner() {
  const { user } = useAuth();
  const [isRestoring, setIsRestoring] = useState(false);
  const isViewingAsStudent = Boolean((user as any)?.isImpersonating);

  if (!user || !isViewingAsStudent) return null;

  const stopStudentView = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      const response = await fetch("/api/admin/student-view/stop", {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Não foi possível voltar ao Super Admin.");
      }
      queryClient.clear();
      window.location.assign("/");
    } catch (error) {
      console.error("Erro ao restaurar Super Admin:", error);
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[70] flex h-14 items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 text-amber-950 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <p className="truncate text-sm">
          <span className="font-semibold">Visualização de aluno:</span>{" "}
          {user.firstName} {user.lastName}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 gap-2 border-amber-400 bg-white text-amber-950 hover:bg-amber-100"
        onClick={stopStudentView}
        disabled={isRestoring}
      >
        {isRestoring ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RotateCcw className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Voltar ao Super Admin</span>
        <span className="sm:hidden">Voltar</span>
      </Button>
    </div>
  );
}