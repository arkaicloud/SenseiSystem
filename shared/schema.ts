import { pgTable, text, serial, integer, boolean, timestamp, varchar, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'instructor', 'student']);
export const beltLevelEnum = pgEnum('belt_level', ['white', 'blue', 'purple', 'brown', 'black']);
export const paymentStatusEnum = pgEnum('payment_status', ['paid', 'pending', 'overdue']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late']);
export const documentTypeEnum = pgEnum('document_type', ['health_form', 'graduation_certificate', 'medical_certificate', 'identification', 'contract', 'other']);
export const schoolPaymentStatusEnum = pgEnum('school_payment_status', ['pending', 'paid', 'overdue', 'cancelled', 'failed']);

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
  birthDate: timestamp("birth_date"),
  street: text("street"),
  number: text("number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  joinDate: timestamp("join_date").defaultNow(),
  active: boolean("active").default(true),
  status: text("status").default('pending'), // pending, active, inactive, blocked
  // Login streak tracking
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastLoginDate: timestamp("last_login_date"),
  totalLogins: integer("total_logins").default(0),
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
  // Avatar personalization
  avatarColor: text("avatar_color").default('#3b82f6'),
  avatarStyle: text("avatar_style").default('initials'),
  avatarImage: text("avatar_image"),
  // Financial responsibility information
  financialResponsibleName: text("financial_responsible_name"),
  financialResponsibleEmail: text("financial_responsible_email"),
  financialResponsiblePhone: text("financial_responsible_phone"),
  financialResponsibleCpf: text("financial_responsible_cpf"),
  financialResponsibleRelationship: text("financial_responsible_relationship"), // "self", "parent", "guardian", "spouse"
  // ASAAS integration fields
  asaasCustomerId: text("asaas_customer_id"), // ID do cliente no ASAAS
  asaasSubscriptionId: text("asaas_subscription_id"), // ID da assinatura no ASAAS
  // Payment preferences
  paymentPlanId: integer("payment_plan_id").references(() => paymentPlans.id),
  preferredDueDate: integer("preferred_due_date").default(5), // Dia preferido do mês para vencimento (1-28)
});

// School Configuration table (tenant information)
export const schoolConfig = pgTable("school_config", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").notNull().default("Academia de Jiu-Jitsu"),
  congratsMessage: text("congrats_message").notNull().default("🏆 Parabéns!\nVocê acaba de conquistar a sua {beltName}!\n\nQue Deus continue fortalecendo sua fé e determinação nessa jornada.\n\n\"Tudo posso naquele que me fortalece.\"\n(Filipenses 4:13)\n\nOSS!"),
  logoUrl: text("logo_url"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  defaultTheme: text("default_theme").notNull().default("light"), // "light" or "dark"
  attendanceMaxDaysAhead: integer("attendance_max_days_ahead").notNull().default(7), // Máximo de dias para visualizar/confirmar aulas
  // ASAAS Integration fields
  asaasCustomerId: text("asaas_customer_id"), // Customer ID no ASAAS
  asaasApiKey: text("asaas_api_key"), // API Key ASAAS (pode ser criptografada)
  planValue: integer("plan_value").default(19990), // Valor do plano em centavos (R$ 199,90)
  planType: text("plan_type").default("monthly"), // Tipo do plano
  active: boolean("active").default(true), // Status da escola
  trialEndDate: timestamp("trial_end_date"), // Data fim do trial
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// School Payments table - Pagamentos da escola/tenant no ASAAS
export const schoolPayments = pgTable("school_payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => schoolConfig.id, { onDelete: 'cascade' }).notNull(),
  asaasPaymentId: text("asaas_payment_id").unique(), // ID do pagamento no ASAAS
  status: schoolPaymentStatusEnum("status").notNull().default('pending'),
  dueDate: timestamp("due_date").notNull(),
  value: integer("value").notNull(), // Valor em centavos
  paidAt: timestamp("paid_at"),
  description: text("description").default("Mensalidade SenseiSystem"),
  externalReference: text("external_reference"), // Referência externa
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk Actions enum
export const riskActionEnum = pgEnum('risk_action', ['call', 'email', 'whatsapp', 'visit', 'discount', 'other']);

// School Events table
export const schoolEvents = pgTable("school_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventDate: timestamp("event_date").notNull(),
  location: text("location"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
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
  maxStudents: integer("max_students").default(20), // Limite máximo de alunos por aula
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
  isScholarship: boolean("is_scholarship").default(false), // Indica se é plano de bolsista
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
  overdueAt: timestamp("overdue_at"), // Data quando ficou inadimplente
});

// Attendance Changes table - Controle de confirmações e cancelamentos
export const attendanceChanges = pgTable("attendance_changes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id, { onDelete: 'cascade' }).notNull(),
  classId: integer("class_id").references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp("date").notNull(), // Data da aula
  changeType: text("change_type").notNull(), // 'confirm' ou 'cancel'
  createdAt: timestamp("created_at").defaultNow(),
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

// Dashboard customization table
export const dashboardCustomizations = pgTable("dashboard_customizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  layout: text("layout").notNull().default('default'), // 'default', 'compact', 'minimal'
  theme: text("theme").notNull().default('light'), // 'light', 'dark', 'auto'
  widgetOrder: text("widget_order").array().notNull().default(['stats', 'notifications', 'attendance', 'events']),
  hiddenWidgets: text("hidden_widgets").array().notNull().default([]),
  showWelcomeMessage: boolean("show_welcome_message").notNull().default(true),
  compactMode: boolean("compact_mode").notNull().default(false),
  showQuickActions: boolean("show_quick_actions").notNull().default(true),
  backgroundColor: text("background_color").default('#ffffff'),
  accentColor: text("accent_color").default('#3b82f6'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Risk Actions table
export const riskActions = pgTable("risk_actions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id, { onDelete: 'cascade' }).notNull(),
  actionType: riskActionEnum("action_type").notNull(),
  notes: text("notes"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Risk Settings table
export const riskSettings = pgTable("risk_settings", {
  id: serial("id").primaryKey(),
  frequencyThreshold: integer("frequency_threshold").notNull().default(60),
  daysThreshold: integer("days_threshold").notNull().default(7),
  autoAlerts: boolean("auto_alerts").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id, { onDelete: 'cascade' }).notNull(),
  documentType: documentTypeEnum("document_type").notNull(),
  fileName: text("file_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  notes: text("notes"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true })
  .extend({
    // Garantir que o birthDate possa ser recebido como string e convertido para Date no servidor
    birthDate: z.string().optional().nullable(),
  });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertSchoolConfigSchema = createInsertSchema(schoolConfig).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSchoolPaymentSchema = createInsertSchema(schoolPayments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertAttendanceChangesSchema = createInsertSchema(attendanceChanges).omit({ id: true, createdAt: true });
export const insertPaymentPlanSchema = createInsertSchema(paymentPlans).omit({ id: true });
export const insertStudentPaymentSchema = createInsertSchema(studentPayments).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true });
export const insertSchoolEventSchema = createInsertSchema(schoolEvents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDashboardCustomizationSchema = createInsertSchema(dashboardCustomizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRiskActionSchema = createInsertSchema(riskActions).omit({ id: true, createdAt: true });
export const insertRiskSettingsSchema = createInsertSchema(riskSettings).omit({ id: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type SchoolConfig = typeof schoolConfig.$inferSelect;
export type InsertSchoolConfig = z.infer<typeof insertSchoolConfigSchema>;

export type SchoolPayment = typeof schoolPayments.$inferSelect;
export type InsertSchoolPayment = z.infer<typeof insertSchoolPaymentSchema>;

export type SchoolEvent = typeof schoolEvents.$inferSelect;
export type InsertSchoolEvent = z.infer<typeof insertSchoolEventSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type AttendanceChanges = typeof attendanceChanges.$inferSelect;
export type InsertAttendanceChanges = z.infer<typeof insertAttendanceChangesSchema>;

export type PaymentPlan = typeof paymentPlans.$inferSelect;
export type InsertPaymentPlan = z.infer<typeof insertPaymentPlanSchema>;

export type StudentPayment = typeof studentPayments.$inferSelect;
export type InsertStudentPayment = z.infer<typeof insertStudentPaymentSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type DashboardCustomization = typeof dashboardCustomizations.$inferSelect;
export type InsertDashboardCustomization = z.infer<typeof insertDashboardCustomizationSchema>;

export type RiskAction = typeof riskActions.$inferSelect;
export type InsertRiskAction = z.infer<typeof insertRiskActionSchema>;

export type RiskSettings = typeof riskSettings.$inferSelect;
export type InsertRiskSettings = z.infer<typeof insertRiskSettingsSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

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

// Define table relations
export const usersRelations = relations(users, ({ many }) => ({
  students: many(students),
  instructedClasses: many(classes, { relationName: "instructor" }),
  activityLogs: many(activityLogs),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  attendances: many(attendance),
  payments: many(studentPayments),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  instructor: one(users, {
    fields: [classes.instructorId],
    references: [users.id],
    relationName: "instructor",
  }),
  attendances: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
  checkedInByUser: one(users, {
    fields: [attendance.checkedInBy],
    references: [users.id],
  }),
}));

export const paymentPlansRelations = relations(paymentPlans, ({ many }) => ({
  studentPayments: many(studentPayments),
}));

export const studentPaymentsRelations = relations(studentPayments, ({ one }) => ({
  student: one(students, {
    fields: [studentPayments.studentId],
    references: [students.id],
  }),
  plan: one(paymentPlans, {
    fields: [studentPayments.planId],
    references: [paymentPlans.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Login Streak Achievements table
export const streakAchievements = pgTable("streak_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  achievementType: text("achievement_type").notNull(), // "streak", "total_logins", "comeback"
  achievementName: text("achievement_name").notNull(),
  achievementDescription: text("achievement_description").notNull(),
  streakCount: integer("streak_count"),
  iconName: text("icon_name").notNull(),
  iconColor: text("icon_color").notNull(),
  earnedDate: timestamp("earned_date").defaultNow(),
  isDisplayed: boolean("is_displayed").default(true),
});

// Daily Login Records table
export const dailyLoginRecords = pgTable("daily_login_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  loginDate: timestamp("login_date").notNull(),
  loginCount: integer("login_count").default(1),
  streakDay: integer("streak_day").notNull(),
  bonusPoints: integer("bonus_points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Streak achievements relations
export const streakAchievementsRelations = relations(streakAchievements, ({ one }) => ({
  user: one(users, {
    fields: [streakAchievements.userId],
    references: [users.id],
  }),
}));

// Daily login records relations
export const dailyLoginRecordsRelations = relations(dailyLoginRecords, ({ one }) => ({
  user: one(users, {
    fields: [dailyLoginRecords.userId],
    references: [users.id],
  }),
}));

// TypeScript types for new tables
export type StreakAchievement = typeof streakAchievements.$inferSelect;
export type InsertStreakAchievement = typeof streakAchievements.$inferInsert;

export type DailyLoginRecord = typeof dailyLoginRecords.$inferSelect;
export type InsertDailyLoginRecord = typeof dailyLoginRecords.$inferInsert;

// Streak achievement with relations
export type StreakAchievementWithUser = StreakAchievement & {
  user: User;
};

// Daily login record with relations  
export type DailyLoginRecordWithUser = DailyLoginRecord & {
  user: User;
};

// Updated user type with streak data
export type UserWithStreakData = User & {
  streakAchievements?: StreakAchievement[];
  dailyLoginRecords?: DailyLoginRecord[];
};

// Update users relations to include new tables (replace the original)
export const usersRelationsWithStreak = relations(users, ({ many }) => ({
  students: many(students),
  instructedClasses: many(classes, { relationName: "instructor" }),
  activityLogs: many(activityLogs),
  streakAchievements: many(streakAchievements),
  dailyLoginRecords: many(dailyLoginRecords),
}));
