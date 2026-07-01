import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
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
  const prevUserIdRef = useRef<number | undefined>(undefined);

  const isEligible = !!user && (user.role === "guardian" || user.role === "student");

  const { data, isLoading } = useQuery<{ dependents: ManagedStudent[] }>({
    queryKey: ["/api/guardian/dependents"],
    enabled: isEligible,
  });

  const managedStudents = data?.dependents ?? [];

  const isGuardianMode =
    !!user && (user.role === "guardian" || (user.role === "student" && managedStudents.length > 0));

  // On every new login (user ID change), clear saved student selection so the
  // guardian always sees the selection screen after logging in.
  useEffect(() => {
    if (!user?.id) {
      prevUserIdRef.current = undefined;
      return;
    }
    if (user.id !== prevUserIdRef.current) {
      // New login detected — clear cached selection
      sessionStorage.removeItem("activeStudentId");
      setActiveStudentState(null);
      prevUserIdRef.current = user.id;
    }
  }, [user?.id]);

  // Restore active student within the same login session (e.g. page navigation)
  useEffect(() => {
    if (!isEligible) return;
    if (managedStudents.length === 0) return;

    const saved = sessionStorage.getItem("activeStudentId");
    if (saved) {
      const found = managedStudents.find((s) => s.studentId === Number(saved));
      if (found) {
        setActiveStudentState(found);
      }
    }
  }, [managedStudents.length, isEligible]);

  const setActiveStudent = useCallback((s: ManagedStudent | null) => {
    setActiveStudentState(s);
    if (s) {
      sessionStorage.setItem("activeStudentId", String(s.studentId));
    } else {
      sessionStorage.removeItem("activeStudentId");
    }
  }, []);

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
