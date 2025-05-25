import { 
  users, type User, type InsertUser,
  students, type Student, type InsertStudent,
  classes, type Class, type InsertClass,
  attendance, type Attendance, type InsertAttendance,
  paymentPlans, type PaymentPlan, type InsertPaymentPlan,
  studentPayments, type StudentPayment, type InsertStudentPayment,
  activityLogs, type ActivityLog, type InsertActivityLog,
  type StudentWithUser, type ClassWithInstructor,
  type AttendanceWithDetails, type StudentPaymentWithDetails
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private classes: Map<number, Class>;
  private attendance: Map<number, Attendance>;
  private paymentPlans: Map<number, PaymentPlan>;
  private studentPayments: Map<number, StudentPayment>;
  private activityLogs: Map<number, ActivityLog>;
  
  private userCurrentId: number;
  private studentCurrentId: number;
  private classCurrentId: number;
  private attendanceCurrentId: number;
  private paymentPlanCurrentId: number;
  private studentPaymentCurrentId: number;
  private activityLogCurrentId: number;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.classes = new Map();
    this.attendance = new Map();
    this.paymentPlans = new Map();
    this.studentPayments = new Map();
    this.activityLogs = new Map();
    
    this.userCurrentId = 1;
    this.studentCurrentId = 1;
    this.classCurrentId = 1;
    this.attendanceCurrentId = 1;
    this.paymentPlanCurrentId = 1;
    this.studentPaymentCurrentId = 1;
    this.activityLogCurrentId = 1;
    
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
      password: "admin123", // In a real app, this would be hashed
      role: "admin",
      phone: "555-123-4567",
      emergencyContact: "",
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
      password: "instructor123",
      role: "instructor",
      phone: "555-234-5678",
      emergencyContact: "",
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
    const user: User = { ...insertUser, id };
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
    const student: Student = { ...insertStudent, id };
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
      const dateStr = date.toDateString();
      attendances = attendances.filter(
        (attendance) => attendance.date.toDateString() === dateStr,
      );
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
}

export const storage = new MemStorage();
