import { useLocation, useRoute } from "wouter";
import StudentEditDialog from "@/components/students/StudentEditDialog";

export default function StudentEditPage() {
  const [, params] = useRoute("/students/:id/edit");
  const [, setLocation] = useLocation();
  const studentId = Number(params?.id);

  if (!Number.isFinite(studentId)) {
    setLocation("/students");
    return null;
  }

  return (
    <StudentEditDialog
      studentId={studentId}
      open
      fullPage
      onOpenChange={(open) => {
        if (!open) setLocation("/students");
      }}
    />
  );
}
