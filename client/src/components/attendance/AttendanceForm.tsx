import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { BeltWithLabel } from "@/components/ui/belt";
import { cn } from "@/lib/utils";

// Schema for the class info
const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  date: z.date(),
  startTime: z.string(),
  instructor: z.string(),
});

// Schema for each student attendance
const studentAttendanceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  name: z.string(),
  initials: z.string(),
  beltLevel: z.enum(["white", "blue", "purple", "brown", "black"]),
  isPresent: z.boolean().default(false),
});

// Form schema for the entire attendance form
const attendanceFormSchema = z.object({
  classId: z.number(),
  students: z.array(studentAttendanceSchema),
});

type ClassInfo = z.infer<typeof classSchema>;
type StudentAttendance = z.infer<typeof studentAttendanceSchema>;
type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

interface AttendanceFormProps {
  classInfo: ClassInfo;
  students: StudentAttendance[];
  onSubmit: (data: AttendanceFormValues) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  classInfo,
  students,
  onSubmit,
  isLoading = false,
  placeholder = "Search students...",
}) => {
  const [filter, setFilter] = useState("");

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      classId: classInfo.id,
      students: students.map(student => ({
        ...student,
        isPresent: false,
      })),
    },
  });

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(filter.toLowerCase())
  );

  const toggleAllStudents = (checked: boolean) => {
    const updatedStudents = form.getValues().students.map(student => ({
      ...student,
      isPresent: checked,
    }));
    form.setValue("students", updatedStudents);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl font-bold mb-1 md:mb-2">{classInfo.name}</h2>
        <p className="text-gray-600 text-sm md:text-base">
          {classInfo.date.toLocaleDateString()} at {classInfo.startTime} • Instructor: {classInfo.instructor}
        </p>
      </div>

      <div className="mb-3 md:mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <span className="material-icons text-sm">search</span>
          </div>
        </div>
      </div>

      <div className="mb-3 md:mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {filteredStudents.length} students
        </p>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="select-all" 
            onCheckedChange={(checked) => toggleAllStudents(!!checked)} 
          />
          <label htmlFor="select-all" className="text-sm font-medium">
            Select All
          </label>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
          <div className="divide-y divide-gray-100">
            {filteredStudents.map((student, index) => (
              <FormField
                key={student.id}
                control={form.control}
                name={`students.${index}.isPresent`}
                render={({ field }) => (
                  <FormItem className="py-2 md:py-3 flex items-center space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-200 flex items-center justify-center mr-2 md:mr-3">
                        <span className="font-medium text-xs md:text-sm">{student.initials}</span>
                      </div>
                      <div>
                        <FormLabel className={cn(
                          "text-sm md:text-base font-medium text-gray-900",
                          field.value && "line-through text-gray-400"
                        )}>
                          {student.name}
                        </FormLabel>
                        <BeltWithLabel level={student.beltLevel} size="sm" />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>

          <div className="pt-3 md:pt-4 flex justify-end">
            <Button
              type="submit"
              className="bg-secondary hover:bg-secondary-dark text-sm md:text-base"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AttendanceForm;