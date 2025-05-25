import { pgTable, text, serial, integer, boolean, timestamp, varchar, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'instructor', 'student']);
export const beltLevelEnum = pgEnum('belt_level', ['white', 'blue', 'purple', 'brown', 'black']);
export const paymentStatusEnum = pgEnum('payment_status', ['paid', 'pending', 'overdue']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('student'),
  phone: text("phone"),
  emergencyContact: text("emergency_contact"),
  joinDate: timestamp("join_date").defaultNow(),
  active: boolean("active").default(true),
});

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  beltLevel: beltLevelEnum("belt_level").notNull().default('white'),
  stripes: integer("stripes").default(0),
  lastPromotionDate: timestamp("last_promotion_date"),
  attendanceRate: integer("attendance_rate").default(0),
  notes: text("notes"),
});

// Classes table
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  instructorId: integer("instructor_id").references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // "HH:MM" format
  duration: integer("duration").notNull(), // in minutes
  maxCapacity: integer("max_capacity"),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id, { onDelete: 'cascade' }).notNull(),
  classId: integer("class_id").references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp("date").notNull().defaultNow(),
  status: attendanceStatusEnum("status").notNull().default('present'),
  checkedInBy: integer("checked_in_by").references(() => users.id),
});

// Payment plans table
export const paymentPlans = pgTable("payment_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: integer("amount").notNull(), // in cents
  frequency: text("frequency").notNull(), // monthly, quarterly, etc.
  description: text("description"),
});

// Student payments table
export const studentPayments = pgTable("student_payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id, { onDelete: 'cascade' }).notNull(),
  planId: integer("plan_id").references(() => paymentPlans.id).notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  amount: integer("amount").notNull(), // in cents
  notes: text("notes"),
});

// Activity log table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  activity: text("activity").notNull(),
  entityType: text("entity_type"), // e.g., 'student', 'class', 'payment'
  entityId: integer("entity_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertPaymentPlanSchema = createInsertSchema(paymentPlans).omit({ id: true });
export const insertStudentPaymentSchema = createInsertSchema(studentPayments).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type PaymentPlan = typeof paymentPlans.$inferSelect;
export type InsertPaymentPlan = z.infer<typeof insertPaymentPlanSchema>;

export type StudentPayment = typeof studentPayments.$inferSelect;
export type InsertStudentPayment = z.infer<typeof insertStudentPaymentSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Custom extended types for frontend use
export type StudentWithUser = Student & {
  user: User;
};

export type ClassWithInstructor = Class & {
  instructor?: User;
};

export type AttendanceWithDetails = Attendance & {
  student: StudentWithUser;
  class: ClassWithInstructor;
};

export type StudentPaymentWithDetails = StudentPayment & {
  student: StudentWithUser;
  plan: PaymentPlan;
};
