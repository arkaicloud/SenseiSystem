import { 
  users, type User, type InsertUser,
  students, type Student, type InsertStudent,
  classes, type Class, type InsertClass,
  attendance, type Attendance, type InsertAttendance,
  paymentPlans, type PaymentPlan, type InsertPaymentPlan,
  studentPayments, type StudentPayment, type InsertStudentPayment,
  activityLogs, type ActivityLog, type InsertActivityLog,
  schoolEvents, type SchoolEvent, type InsertSchoolEvent,
  schoolConfig, type SchoolConfig, type InsertSchoolConfig,
  dashboardCustomizations, type DashboardCustomization, type InsertDashboardCustomization,
  riskActions, type RiskAction, type InsertRiskAction,
  riskSettings, type RiskSettings, type InsertRiskSettings,
  type StudentWithUser, type ClassWithInstructor,
  type AttendanceWithDetails, type StudentPaymentWithDetails
} from "@shared/schema";
import { eq, and, gte, lte, desc, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Students
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  getStudents(): Promise<Student[]>;
  getStudentsWithUsers(): Promise<StudentWithUser[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  // School Configuration
  getSchoolConfig(): Promise<SchoolConfig | undefined>;
  updateSchoolConfig(config: Partial<SchoolConfig>): Promise<SchoolConfig>;

  // School Events
  getSchoolEvent(id: number): Promise<SchoolEvent | undefined>;
  getSchoolEvents(activeOnly?: boolean): Promise<SchoolEvent[]>;
  createSchoolEvent(event: InsertSchoolEvent): Promise<SchoolEvent>;
  updateSchoolEvent(id: number, event: Partial<SchoolEvent>): Promise<SchoolEvent | undefined>;
  deleteSchoolEvent(id: number): Promise<boolean>;

  // Classes
  getClass(id: number): Promise<Class | undefined>;
  getClasses(): Promise<Class[]>;
  getClassesWithInstructors(): Promise<ClassWithInstructor[]>;
  getClassesByInstructor(instructorId: number): Promise<Class[]>;
  getTodaysClasses(): Promise<ClassWithInstructor[]>;
  createClass(classItem: InsertClass): Promise<Class>;
  updateClass(id: number, classItem: Partial<Class>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;

  // Attendance
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByClass(classId: number, date?: Date): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceWithDetails(): Promise<AttendanceWithDetails[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;

  // Payment Plans
  getPaymentPlan(id: number): Promise<PaymentPlan | undefined>;
  getPaymentPlans(): Promise<PaymentPlan[]>;
  createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan>;
  updatePaymentPlan(id: number, plan: Partial<PaymentPlan>): Promise<PaymentPlan | undefined>;
  deletePaymentPlan(id: number): Promise<boolean>;

  // Student Payments
  getStudentPayment(id: number): Promise<StudentPayment | undefined>;
  getStudentPaymentsByStudent(studentId: number): Promise<StudentPayment[]>;
  getStudentPaymentsByPlan(planId: number): Promise<StudentPayment[]>;
  getStudentPaymentsWithDetails(): Promise<StudentPaymentWithDetails[]>;
  getOverduePayments(): Promise<StudentPaymentWithDetails[]>;
  createStudentPayment(payment: InsertStudentPayment): Promise<StudentPayment>;
  updateStudentPayment(id: number, payment: Partial<StudentPayment>): Promise<StudentPayment | undefined>;
  deleteStudentPayment(id: number): Promise<boolean>;

  // Activity Logs
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Dashboard Customizations
  getDashboardCustomization(userId: number): Promise<DashboardCustomization | undefined>;
  createDashboardCustomization(customization: InsertDashboardCustomization): Promise<DashboardCustomization>;
  updateDashboardCustomization(userId: number, customization: Partial<DashboardCustomization>): Promise<DashboardCustomization | undefined>;

  // Risk Management
  createRiskAction(action: InsertRiskAction): Promise<RiskAction>;
  getRiskActions(studentId?: number): Promise<RiskAction[]>;
  updateRiskAction(id: number, action: Partial<RiskAction>): Promise<RiskAction | undefined>;
  getRiskSettings(): Promise<RiskSettings | undefined>;
  updateRiskSettings(settings: InsertRiskSettings): Promise<RiskSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private classes: Map<number, Class>;
  private attendance: Map<number, Attendance>;
  private paymentPlans: Map<number, PaymentPlan>;
  private studentPayments: Map<number, StudentPayment>;
  private activityLogs: Map<number, ActivityLog>;
  private schoolEvents: Map<number, SchoolEvent>;
  private schoolConfig: SchoolConfig | undefined;
  private dashboardCustomizations: Map<number, DashboardCustomization>;
  private riskActions: Map<number, RiskAction>;
  private riskSettings: RiskSettings | undefined;

  private userCurrentId: number;
  private studentCurrentId: number;
  private classCurrentId: number;
  private attendanceCurrentId: number;
  private paymentPlanCurrentId: number;
  private studentPaymentCurrentId: number;
  private activityLogCurrentId: number;
  private schoolEventCurrentId: number;
  private dashboardCustomizationCurrentId: number;
  private riskActionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.classes = new Map();
    this.attendance = new Map();
    this.paymentPlans = new Map();
    this.studentPayments = new Map();
    this.activityLogs = new Map();
    this.schoolEvents = new Map();
    this.dashboardCustomizations = new Map();
    this.riskActions = new Map();

    this.userCurrentId = 1;
    this.studentCurrentId = 1;
    this.classCurrentId = 1;
    this.attendanceCurrentId = 1;
    this.paymentPlanCurrentId = 1;
    this.studentPaymentCurrentId = 1;
    this.activityLogCurrentId = 1;
    this.schoolEventCurrentId = 1;
    this.dashboardCustomizationCurrentId = 1;
    this.riskActionCurrentId = 1;

    this.seedData();
  }

  // Seed initial data
  private seedData() {
    // Create admin user
    const adminUser: User = {
      id: this.userCurrentId++,
      firstName: "John",
      lastName: "Sensei",
      username: "admin",
      email: "admin@senseisystem.com",
      password: "$2b$10$1HOmR7MXx5inyCqQg2UwgOgW7fSoP0V5TSbdx1ZQS/akkpfvp3j/6", // "password"
      role: "admin",
      phone: "555-123-4567",
      emergencyContact: "",
      birthDate: null,
      street: null,
      number: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
      zipCode: null,
      joinDate: new Date(),
      active: true
    };
    this.users.set(adminUser.id, adminUser);

    // Create an instructor
    const instructorUser: User = {
      id: this.userCurrentId++,
      firstName: "Maria",
      lastName: "Sensei",
      username: "instructor",
      email: "instructor@senseisystem.com",
      password: "$2b$10$O9hGnkb7dxHSHo5.jtffc.mUTQsQtMkj/K4GrP/NQFyukf8eZuU5G", // "password"
      role: "instructor",
      phone: "555-234-5678",
      emergencyContact: "",
      birthDate: null,
      street: null,
      number: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
      zipCode: null,
      joinDate: new Date(),
      active: true
    };
    this.users.set(instructorUser.id, instructorUser);

    // Create payment plans
    const basicPlan: PaymentPlan = {
      id: this.paymentPlanCurrentId++,
      name: "Basic Membership",
      amount: 9900, // $99.00
      frequency: "monthly",
      description: "Access to 2 classes per week"
    };
    this.paymentPlans.set(basicPlan.id, basicPlan);

    const standardPlan: PaymentPlan = {
      id: this.paymentPlanCurrentId++,
      name: "Standard Membership",
      amount: 12900, // $129.00
      frequency: "monthly",
      description: "Unlimited classes"
    };
    this.paymentPlans.set(standardPlan.id, standardPlan);

    const premiumPlan: PaymentPlan = {
      id: this.paymentPlanCurrentId++,
      name: "Premium Membership",
      amount: 14900, // $149.00
      frequency: "monthly",
      description: "Unlimited classes + private lesson"
    };
    this.paymentPlans.set(premiumPlan.id, premiumPlan);

    // Create classes
    const fundamentalsClass: Class = {
      id: this.classCurrentId++,
      name: "Fundamentals Class",
      description: "Basics of Jiu-Jitsu for beginners",
      instructorId: adminUser.id,
      dayOfWeek: 2, // Tuesday
      startTime: "18:00", // 6:00 PM
      duration: 60,
      maxCapacity: 20
    };
    this.classes.set(fundamentalsClass.id, fundamentalsClass);

    const advancedClass: Class = {
      id: this.classCurrentId++,
      name: "Advanced Class",
      description: "Advanced techniques for experienced practitioners",
      instructorId: instructorUser.id,
      dayOfWeek: 2, // Tuesday
      startTime: "19:30", // 7:30 PM
      duration: 90,
      maxCapacity: 15
    };
    this.classes.set(advancedClass.id, advancedClass);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      birthDate: insertUser.birthDate || null,
      street: insertUser.street || null,
      number: insertUser.number || null,
      complement: insertUser.complement || null,
      neighborhood: insertUser.neighborhood || null,
      city: insertUser.city || null,
      state: insertUser.state || null,
      zipCode: insertUser.zipCode || null,
      phone: insertUser.phone || null,
      emergencyContact: insertUser.emergencyContact || null,
      active: insertUser.active !== undefined ? insertUser.active : true
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Students
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.userId === userId,
    );
  }

  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudentsWithUsers(): Promise<StudentWithUser[]> {
    const students = await this.getStudents();
    return Promise.all(
      students.map(async (student) => {
        const user = await this.getUser(student.userId);
        if (!user) throw new Error(`User not found for student ${student.id}`);
        return { ...student, user };
      })
    );
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.studentCurrentId++;
    const student: Student = { 
      ...insertStudent, 
      id,
      beltLevel: insertStudent.beltLevel || "white",
      stripes: insertStudent.stripes || 0,
      lastPromotionDate: insertStudent.lastPromotionDate || null,
      attendanceRate: insertStudent.attendanceRate || 0,
      notes: insertStudent.notes || null,
      avatarColor: insertStudent.avatarColor || null,
      avatarStyle: insertStudent.avatarStyle || null,
      avatarImage: insertStudent.avatarImage || null
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const student = await this.getStudent(id);
    if (!student) return undefined;

    const updatedStudent = { ...student, ...studentData };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.students.delete(id);
  }

  // Classes
  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async getClassesWithInstructors(): Promise<ClassWithInstructor[]> {
    const classes = await this.getClasses();
    return Promise.all(
      classes.map(async (classItem) => {
        if (!classItem.instructorId) return { ...classItem, instructor: undefined };
        const instructor = await this.getUser(classItem.instructorId);
        return { ...classItem, instructor };
      })
    );
  }

  async getClassesByInstructor(instructorId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(
      (classItem) => classItem.instructorId === instructorId,
    );
  }

  async getTodaysClasses(): Promise<ClassWithInstructor[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const classes = Array.from(this.classes.values()).filter(
      (classItem) => classItem.dayOfWeek === dayOfWeek,
    );

    return Promise.all(
      classes.map(async (classItem) => {
        if (!classItem.instructorId) return { ...classItem, instructor: undefined };
        const instructor = await this.getUser(classItem.instructorId);
        return { ...classItem, instructor };
      })
    );
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const id = this.classCurrentId++;
    const classItem: Class = { ...insertClass, id };
    this.classes.set(id, classItem);
    return classItem;
  }

  async updateClass(id: number, classData: Partial<Class>): Promise<Class | undefined> {
    const classItem = await this.getClass(id);
    if (!classItem) return undefined;

    const updatedClass = { ...classItem, ...classData };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  async deleteClass(id: number): Promise<boolean> {
    return this.classes.delete(id);
  }

  // Attendance
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getAttendanceByClass(classId: number, date?: Date): Promise<Attendance[]> {
    let attendances = Array.from(this.attendance.values()).filter(
      (attendance) => attendance.classId === classId,
    );

    if (date) {
      const targetDate = date.toISOString().split('T')[0];
      attendances = attendances.filter(attendance => {
        const attendanceDate = new Date(attendance.date).toISOString().split('T')[0];
        return attendanceDate === targetDate;
      });
    }

    return attendances;
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (attendance) => attendance.studentId === studentId,
    );
  }

  async getAttendanceWithDetails(): Promise<AttendanceWithDetails[]> {
    const attendances = Array.from(this.attendance.values());
    return Promise.all(
      attendances.map(async (attendance) => {
        const student = await this.getStudent(attendance.studentId);
        if (!student) throw new Error(`Student not found for attendance ${attendance.id}`);

        const user = await this.getUser(student.userId);
        if (!user) throw new Error(`User not found for student ${student.id}`);

        const classItem = await this.getClass(attendance.classId);
        if (!classItem) throw new Error(`Class not found for attendance ${attendance.id}`);

        let instructor: User | undefined;
        if (classItem.instructorId) {
          instructor = await this.getUser(classItem.instructorId);
        }

        return {
          ...attendance,
          student: { ...student, user },
          class: { ...classItem, instructor }
        };
      })
    );
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceCurrentId++;
    const attendance: Attendance = { ...insertAttendance, id };
    this.attendance.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const attendance = await this.getAttendance(id);
    if (!attendance) return undefined;

    const updatedAttendance = { ...attendance, ...attendanceData };
    this.attendance.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async deleteAttendance(id: number): Promise<boolean> {
    return this.attendance.delete(id);
  }

  // Payment Plans
  async getPaymentPlan(id: number): Promise<PaymentPlan | undefined> {
    return this.paymentPlans.get(id);
  }

  async getPaymentPlans(): Promise<PaymentPlan[]> {
    return Array.from(this.paymentPlans.values());
  }

  async createPaymentPlan(insertPlan: InsertPaymentPlan): Promise<PaymentPlan> {
    const id = this.paymentPlanCurrentId++;
    const plan: PaymentPlan = { ...insertPlan, id };
    this.paymentPlans.set(id, plan);
    return plan;
  }

  async updatePaymentPlan(id: number, planData: Partial<PaymentPlan>): Promise<PaymentPlan | undefined> {
    const plan = await this.getPaymentPlan(id);
    if (!plan) return undefined;

    const updatedPlan = { ...plan, ...planData };
    this.paymentPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deletePaymentPlan(id: number): Promise<boolean> {
    return this.paymentPlans.delete(id);
  }

  // Student Payments
  async getStudentPayment(id: number): Promise<StudentPayment | undefined> {
    return this.studentPayments.get(id);
  }

  async getStudentPaymentsByStudent(studentId: number): Promise<StudentPayment[]> {
    return Array.from(this.studentPayments.values()).filter(
      (payment) => payment.studentId === studentId,
    );
  }

  async getStudentPaymentsByPlan(planId: number): Promise<StudentPayment[]> {
    return Array.from(this.studentPayments.values()).filter(
      (payment) => payment.planId === planId,
    );
  }

  async getStudentPaymentsWithDetails(): Promise<StudentPaymentWithDetails[]> {
    const payments = Array.from(this.studentPayments.values());
    return Promise.all(
      payments.map(async (payment) => {
        const student = await this.getStudent(payment.studentId);
        if (!student) throw new Error(`Student not found for payment ${payment.id}`);

        const user = await this.getUser(student.userId);
        if (!user) throw new Error(`User not found for student ${student.id}`);

        const plan = await this.getPaymentPlan(payment.planId);
        if (!plan) throw new Error(`Payment plan not found for payment ${payment.id}`);

        return {
          ...payment,
          student: { ...student, user },
          plan
        };
      })
    );
  }

  async getOverduePayments(): Promise<StudentPaymentWithDetails[]> {
    const now = new Date();
    const payments = Array.from(this.studentPayments.values()).filter(
      (payment) => payment.status === 'overdue' || 
                   (payment.status === 'pending' && payment.dueDate < now)
    );

    return Promise.all(
      payments.map(async (payment) => {
        const student = await this.getStudent(payment.studentId);
        if (!student) throw new Error(`Student not found for payment ${payment.id}`);

        const user = await this.getUser(student.userId);
        if (!user) throw new Error(`User not found for student ${student.id}`);

        const plan = await this.getPaymentPlan(payment.planId);
        if (!plan) throw new Error(`Payment plan not found for payment ${payment.id}`);

        return {
          ...payment,
          student: { ...student, user },
          plan
        };
      })
    );
  }

  async createStudentPayment(insertPayment: InsertStudentPayment): Promise<StudentPayment> {
    const id = this.studentPaymentCurrentId++;
    const payment: StudentPayment = { ...insertPayment, id };
    this.studentPayments.set(id, payment);
    return payment;
  }

  async updateStudentPayment(id: number, paymentData: Partial<StudentPayment>): Promise<StudentPayment | undefined> {
    const payment = await this.getStudentPayment(id);
    if (!payment) return undefined;

    const updatedPayment = { ...payment, ...paymentData };
    this.studentPayments.set(id, updatedPayment);
    return updatedPayment;
  }

  async deleteStudentPayment(id: number): Promise<boolean> {
    return this.studentPayments.delete(id);
  }

  // Activity Logs
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    return this.activityLogs.get(id);
  }

  async getActivityLogs(limit?: number): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? logs.slice(0, limit) : logs;
  }

  async getActivityLogsByUser(userId: number, limit?: number): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? logs.slice(0, limit) : logs;
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogCurrentId++;
    const log: ActivityLog = { ...insertLog, id };
    this.activityLogs.set(id, log);
    return log;
  }

  // School Configuration
  async getSchoolConfig(): Promise<SchoolConfig | undefined> {
    return this.schoolConfig;
  }

  async updateSchoolConfig(config: Partial<SchoolConfig>): Promise<SchoolConfig> {
    if (!this.schoolConfig) {
      this.schoolConfig = {
        id: 1,
        schoolName: "Academia de Jiu-Jitsu",
        congratsMessage: "🏆 Parabéns!\nVocê acaba de conquistar a sua {beltName}!\n\nQue Deus continue fortalecendo sua fé e determinação nessa jornada.\n\n\"Tudo posso naquele que me fortalece.\"\n(Filipenses 4:13)\n\nOSS!",
        logoUrl: null,
        address: null,
        phone: null,
        email: null,
        website: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...config
      };
    } else {
      this.schoolConfig = {
        ...this.schoolConfig,
        ...config,
        updatedAt: new Date()
      };
    }
    return this.schoolConfig;
  }

  // School Events
  async getSchoolEvent(id: number): Promise<SchoolEvent | undefined> {
    return this.schoolEvents.get(id);
  }

  async getSchoolEvents(activeOnly?: boolean): Promise<SchoolEvent[]> {
    const events = Array.from(this.schoolEvents.values());
    if (activeOnly) {
      const now = new Date();
      return events.filter(event => event.eventDate > now);
    }
    return events.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
  }

  async createSchoolEvent(insertEvent: InsertSchoolEvent): Promise<SchoolEvent> {
    const id = this.schoolEventCurrentId++;
    const event: SchoolEvent = { 
      ...insertEvent, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.schoolEvents.set(id, event);
    return event;
  }

  async updateSchoolEvent(id: number, eventData: Partial<SchoolEvent>): Promise<SchoolEvent | undefined> {
    const event = await this.getSchoolEvent(id);
    if (!event) return undefined;

    const updatedEvent = { 
      ...event, 
      ...eventData,
      updatedAt: new Date()
    };
    this.schoolEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteSchoolEvent(id: number): Promise<boolean> {
    return this.schoolEvents.delete(id);
  }

  // Dashboard Customizations
  async getDashboardCustomization(userId: number): Promise<DashboardCustomization | undefined> {
    for (const customization of this.dashboardCustomizations.values()) {
      if (customization.userId === userId) {
        return customization;
      }
    }
    return undefined;
  }

  async createDashboardCustomization(customization: InsertDashboardCustomization): Promise<DashboardCustomization> {
    const newCustomization: DashboardCustomization = {
      id: this.dashboardCustomizationCurrentId++,
      ...customization,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dashboardCustomizations.set(newCustomization.id, newCustomization);
    return newCustomization;
  }

  async updateDashboardCustomization(userId: number, customization: Partial<DashboardCustomization>): Promise<DashboardCustomization | undefined> {
    const existing = await this.getDashboardCustomization(userId);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...customization,
      updatedAt: new Date(),
    };
    this.dashboardCustomizations.set(existing.id, updated);
    return updated;
  }
}

import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { db, pool } from "./db";
import { eq, and, desc, sql, asc, gte, lte } from "drizzle-orm";
import { relations } from "drizzle-orm";
import * as schema from "@shared/schema";

// Database-backed storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    const PostgresSessionStore = connectPgSimple(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      role: userData.role || "student",
      joinDate: userData.joinDate || new Date(),
      active: userData.active ?? true
    }).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  // Students
  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.userId, userId));
    return student;
  }

  async getStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async getStudentsWithUsers(): Promise<StudentWithUser[]> {
    const result = await db.select({
      student: students,
      user: users
    })
    .from(students)
    .leftJoin(users, eq(students.userId, users.id));

    return result.map(item => ({
      ...item.student,
      user: item.user
    }));
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values({
      ...studentData,
      beltLevel: studentData.beltLevel || "white",
      stripes: studentData.stripes || 0,
      lastPromotionDate: studentData.lastPromotionDate || new Date(),
      attendanceRate: studentData.attendanceRate || 0
    }).returning();
    return student;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | undefined> {
    const [updatedStudent] = await db
      .update(students)
      .set(studentData)
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    await db.delete(students).where(eq(students.id, id));
    return true;
  }

  // Classes
  async getClass(id: number): Promise<Class | undefined> {
    const [classItem] = await db.select().from(classes).where(eq(classes.id, id));
    return classItem;
  }

  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  async getClassesWithInstructors(): Promise<ClassWithInstructor[]> {
    const result = await db.select({
      class: classes,
      instructor: users
    })
    .from(classes)
    .leftJoin(users, eq(classes.instructorId, users.id));

    return result.map(item => ({
      ...item.class,
      instructor: item.instructor
    }));
  }

  async getClassesByInstructor(instructorId: number): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.instructorId, instructorId));
  }

  async getTodaysClasses(): Promise<ClassWithInstructor[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const classesResult = await db.select({
      class: classes,
      instructor: users
    })
    .from(classes)
    .leftJoin(users, eq(classes.instructorId, users.id))
    .where(eq(classes.dayOfWeek, dayOfWeek));

    return classesResult.map(item => ({
      ...item.class,
      instructor: item.instructor
    }));
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [classItem] = await db.insert(classes).values({
      ...classData,
      description: classData.description || null,
      instructorId: classData.instructorId || null,
      maxCapacity: classData.maxCapacity || null
    }).returning();
    return classItem;
  }

  async updateClass(id: number, classData: Partial<Class>): Promise<Class | undefined> {
    const [updatedClass] = await db
      .update(classes)
      .set(classData)
      .where(eq(classes.id, id))
      .returning();
    return updatedClass;
  }

  async deleteClass(id: number): Promise<boolean> {
    await db.delete(classes).where(eq(classes.id, id));
    return true;
  }

  // Attendance
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const [attendanceItem] = await db.select().from(attendance).where(eq(attendance.id, id));
    return attendanceItem;
  }

  async getAttendanceByClass(classId: number, date?: Date): Promise<Attendance[]> {
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return await db.select()
        .from(attendance)
        .where(
          and(
            eq(attendance.classId, classId),
            gte(attendance.date, startOfDay),
            lte(attendance.date, endOfDay)
          )
        );
    }

    return await db.select().from(attendance).where(eq(attendance.classId, classId));
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }

  async getAttendanceWithDetails(): Promise<AttendanceWithDetails[]> {
    // Vamos usar uma abordagem mais simples para evitar problemas com joins complexos
    const attendanceRecords = await db.select().from(attendance);
    const results: AttendanceWithDetails[] = [];

    for (const record of attendanceRecords) {
      const student = await this.getStudent(record.studentId);
      const classItem = await this.getClass(record.classId);

      let user;
      let instructor;

      if (student) {
        user = await this.getUser(student.userId);
      }

      if (classItem && classItem.instructorId) {
        instructor = await this.getUser(classItem.instructorId);
      }

      results.push({
        ...record,
        student: student ? {
          ...student,
          user: user || undefined
        } : undefined,
        class: classItem ? {
          ...classItem,
          instructor: instructor ? {
            id: instructor.id,
            firstName: instructor.firstName,
            lastName: instructor.lastName,
            role: instructor.role
          } : undefined
        } : undefined
      });
    }

    return results;
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [attendanceItem] = await db.insert(attendance).values({
      ...attendanceData,
      date: attendanceData.date || new Date(),
      status: attendanceData.status || "present"
    }).returning();
    return attendanceItem;
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const [updatedAttendance] = await db
      .update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return updatedAttendance;
  }

  async deleteAttendance(id: number): Promise<boolean> {
    await db.delete(attendance).where(eq(attendance.id, id));
    return true;
  }

  // Payment Plans
  async getPaymentPlan(id: number): Promise<PaymentPlan | undefined> {
    const [plan] = await db.select().from(paymentPlans).where(eq(paymentPlans.id, id));
    return plan;
  }

  async getPaymentPlans(): Promise<PaymentPlan[]> {
    return await db.select().from(paymentPlans);
  }

  async createPaymentPlan(planData: InsertPaymentPlan): Promise<PaymentPlan> {
    const [plan] = await db.insert(paymentPlans).values({
      ...planData,
      description: planData.description || null
    }).returning();
    return plan;
  }

  async updatePaymentPlan(id: number, planData: Partial<PaymentPlan>): Promise<PaymentPlan | undefined> {
    const [updatedPlan] = await db
      .update(paymentPlans)
      .set(planData)
      .where(eq(paymentPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deletePaymentPlan(id: number): Promise<boolean> {
    await db.delete(paymentPlans).where(eq(paymentPlans.id, id));
    return true;
  }

  // Student Payments
  async getStudentPayment(id: number): Promise<StudentPayment | undefined> {
    const [payment] = await db.select().from(studentPayments).where(eq(studentPayments.id, id));
    return payment;
  }

  async getStudentPaymentsByStudent(studentId: number): Promise<StudentPayment[]> {
    return await db.select().from(studentPayments).where(eq(studentPayments.studentId, studentId));
  }

  async getStudentPaymentsByPlan(planId: number): Promise<StudentPayment[]> {
    return await db.select().from(studentPayments).where(eq(studentPayments.planId, planId));
  }

  async getStudentPaymentsWithDetails(): Promise<StudentPaymentWithDetails[]> {
    const result = await db.select({
      payment: studentPayments,
      student: students,
      user: users,
      plan: paymentPlans
    })
    .from(studentPayments)
    .leftJoin(students, eq(studentPayments.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(paymentPlans, eq(studentPayments.planId, paymentPlans.id));

    return result.map(item => ({
      ...item.payment,
      student: {
        ...item.student,
        user: item.user
      },
      plan: item.plan
    }));
  }

  async getOverduePayments(): Promise<StudentPaymentWithDetails[]> {
    const result = await db.select({
      payment: studentPayments,
      student: students,
      user: users,
      plan: paymentPlans
    })
    .from(studentPayments)
    .leftJoin(students, eq(studentPayments.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .leftJoin(paymentPlans, eq(studentPayments.planId, paymentPlans.id))
    .where(eq(studentPayments.status, "overdue"));

    return result.map(item => ({
      ...item.payment,
      student: {
        ...item.student,
        user: item.user
      },
      plan: item.plan
    }));
  }

  async createStudentPayment(paymentData: InsertStudentPayment): Promise<StudentPayment> {
    const [payment] = await db.insert(studentPayments).values({
      ...paymentData,
      status: paymentData.status || "pending",
      notes: paymentData.notes || null,
      paidDate: paymentData.paidDate || null
    }).returning();
    return payment;
  }

  async updateStudentPayment(id: number, paymentData: Partial<StudentPayment>): Promise<StudentPayment | undefined> {
    const [updatedPayment] = await db
      .update(studentPayments)
      .set(paymentData)
      .where(eq(studentPayments.id, id))
      .returning();
    return updatedPayment;
  }

  async deleteStudentPayment(id: number): Promise<boolean> {
    await db.delete(studentPayments).where(eq(studentPayments.id, id));
    return true;
  }

  // Activity Logs
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const [log] = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
    return log;
  }

  async getActivityLogs(limit?: number): Promise<ActivityLog[]> {
    const query = db.select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp));

    if (limit) {
      query.limit(limit);
    }

    return await query;
  }

  async getActivityLogsByUser(userId: number, limit?: number): Promise<ActivityLog[]> {
    const query = db.select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp));

    if (limit) {
      query.limit(limit);
    }

    return await query;
  }

  async createActivityLog(logData: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values({
      ...logData,
      userId: logData.userId || null,
      entityType: logData.entityType || null,
      entityId: logData.entityId || null,
      timestamp: logData.timestamp || new Date()
    }).returning();
    return log;
  }

  // School Events
  async getSchoolEvent(id: number): Promise<SchoolEvent | undefined> {
    const [event] = await db.select().from(schoolEvents).where(eq(schoolEvents.id, id));
    return event;
  }

  async getSchoolEvents(activeOnly: boolean = false): Promise<SchoolEvent[]> {
    let query = db.select().from(schoolEvents);

    if (activeOnly) {
      query = query.where(eq(schoolEvents.isActive, true));
    }

    return await query.orderBy(asc(schoolEvents.eventDate));
  }

  async createSchoolEvent(eventData: InsertSchoolEvent): Promise<SchoolEvent> {
    const [event] = await db.insert(schoolEvents).values({
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: eventData.isActive ?? true,
      imageUrl: eventData.imageUrl || null,
      location: eventData.location || null,
      createdBy: eventData.createdBy || null
    }).returning();
    return event;
  }

  async updateSchoolEvent(id: number, eventData: Partial<SchoolEvent>): Promise<SchoolEvent | undefined> {
    const [updatedEvent] = await db
      .update(schoolEvents)
      .set({
        ...eventData,
        updatedAt: new Date()
      })
      .where(eq(schoolEvents.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteSchoolEvent(id: number): Promise<boolean> {
    await db.delete(schoolEvents).where(eq(schoolEvents.id, id));
    return true;
  }

  // School Configuration
  async getSchoolConfig(): Promise<SchoolConfig | undefined> {
    const [config] = await db.select().from(schoolConfig).limit(1);
    return config;
  }

  async updateSchoolConfig(configData: Partial<SchoolConfig>): Promise<SchoolConfig> {
    // First, check if there's an existing config
    const existing = await this.getSchoolConfig();

    if (existing) {
      // Update the existing config
      const [updatedConfig] = await db
        .update(schoolConfig)
        .set({
          ...configData,
          updatedAt: new Date()
        })
        .where(eq(schoolConfig.id, existing.id))
        .returning();
      return updatedConfig;
    } else {
      // Create a new config
      const [newConfig] = await db
        .insert(schoolConfig)
        .values({
          schoolName: configData.schoolName || "Academia de Jiu-Jitsu",
          congratsMessage: configData.congratsMessage || "🏆 Parabéns!\nVocê acaba de conquistar a sua {beltName}!\n\nQue Deus continue fortalecendo sua fé e determinação nessa jornada.\n\n\"Tudo posso naquele que me fortalece.\"\n(Filipenses 4:13)\n\nOSS!",
          logoUrl: configData.logoUrl || null,
          address: configData.address || null,
          phone: configData.phone || null,
          email: configData.email || null,
          website: configData.website || null,
          defaultTheme: configData.defaultTheme || "light",
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return newConfig;
    }
  }
}

// Export the memory storage instance (temporary fix for date validation issue)
export const storage = new MemStorage();