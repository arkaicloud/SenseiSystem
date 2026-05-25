import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export interface ManagedStudent {
  studentId: number;
  userId: number;
  firstName: string;
  lastName: string;
  beltLevel: string;
  stripes: number;
  avatarColor: string;
}

interface GuardianContextType {
  managedStudents: ManagedStudent[];
  activeStudent: ManagedStudent | null;
  setActiveStudent: (s: ManagedStudent | null) => void;
  isGuardianMode: boolean;
  isLoadingDependents: boolean;
}

const GuardianContext = createContext<GuardianContextType>({
  managedStudents: [],
  activeStudent: null,
  setActiveStudent: () => {},
  isGuardianMode: false,
  isLoadingDependents: false,
});

export function GuardianProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeStudent, setActiveStudentState] = useState<ManagedStudent | null>(null);

  const isEligible = !!user && (user.role === "guardian" || user.role === "student");

  const { data, isLoading } = useQuery<{ dependents: ManagedStudent[] }>({
    queryKey: ["/api/guardian/dependents"],
    enabled: isEligible,
  });

  const managedStudents = data?.dependents ?? [];

  const isGuardianMode =
    !!user && (user.role === "guardian" || (user.role === "student" && managedStudents.length > 0));

  const setActiveStudent = useCallback((s: ManagedStudent | null) => {
    setActiveStudentState(s);
    if (s) {
      sessionStorage.setItem("activeStudentId", String(s.studentId));
    } else {
      sessionStorage.removeItem("activeStudentId");
    }
  }, []);

  useEffect(() => {
    if (!isEligible) return;
    if (managedStudents.length === 0) return;

    const saved = sessionStorage.getItem("activeStudentId");
    if (saved) {
      const found = managedStudents.find((s) => s.studentId === Number(saved));
      if (found) {
        setActiveStudentState(found);
        return;
      }
    }
    if (user?.role === "guardian") {
      setActiveStudentState(managedStudents[0] ?? null);
    }
  }, [managedStudents.length, user?.role, isEligible]);

  return (
    <GuardianContext.Provider
      value={{
        managedStudents,
        activeStudent,
        setActiveStudent,
        isGuardianMode,
        isLoadingDependents: isLoading,
      }}
    >
      {children}
    </GuardianContext.Provider>
  );
}

export function useGuardian() {
  return useContext(GuardianContext);
}
