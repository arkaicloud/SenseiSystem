import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertStudentSchema, 
  insertClassSchema,
  insertAttendanceSchema,
  insertPaymentPlanSchema,
  insertStudentPaymentSchema,
  insertActivityLogSchema
} from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin, isInstructor, isSelfOrStaff } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // =====Stats/Dashboard Routes=====
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      // Calculate stats based on user role
      const totalStudents = (await storage.getStudents()).length;
      const totalClasses = (await storage.getClasses()).length;
      const totalAttendances = (await storage.getAttendanceWithDetails()).length;
      
      // Admins and instructors get all stats
      if (req.user.role === 'admin' || req.user.role === 'instructor') {
        const stats = {
          totalStudents,
          totalClasses,
          totalAttendances,
          activeStudents: Math.floor(totalStudents * 0.8), // This would be calculated from actual data
          averageAttendance: totalAttendances > 0 ? Math.floor((totalAttendances / totalClasses) * 100) / 100 : 0,
          beltDistribution: [
            { level: 'white', count: Math.floor(totalStudents * 0.4) },
            { level: 'blue', count: Math.floor(totalStudents * 0.3) },
            { level: 'purple', count: Math.floor(totalStudents * 0.15) },
            { level: 'brown', count: Math.floor(totalStudents * 0.1) },
            { level: 'black', count: Math.floor(totalStudents * 0.05) }
          ],
          revenueThisMonth: 0, // Would be calculated from payment data
        };
        
        return res.json({ stats });
      }
      
      // Students get limited stats
      if (req.user.role === 'student') {
        // Get student record
        const student = await storage.getStudentByUserId(req.user.id);
        
        if (!student) {
          return res.status(404).json({ message: "Student record not found" });
        }
        
        // Get student's attendance
        const studentAttendances = await storage.getAttendanceByStudent(student.id);
        
        const stats = {
          totalClasses,
          studentAttendances: studentAttendances.length,
          studentBelt: student.beltLevel,
          studentStripes: student.stripes,
          lastPromotion: student.lastPromotionDate,
          attendanceRate: student.attendanceRate || 0
        };
        
        return res.json({ stats });
      }
      
      res.status(403).json({ message: "Forbidden" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== User Routes =====
  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json({ users: users.map(u => ({ ...u, password: undefined })) });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(Number(id));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow users to view their own profile or admins to view any profile
      const requestUser = (req as any).user;
      if (requestUser.id !== user.id && requestUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(Number(id));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow users to update their own profile or admins to update any profile
      const requestUser = (req as any).user;
      if (requestUser.id !== user.id && requestUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Validate input
      const userData = req.body;
      
      // Don't allow role changes unless admin
      if (userData.role && userData.role !== user.role && requestUser.role !== 'admin') {
        return res.status(403).json({ message: "Cannot change role" });
      }
      
      const updatedUser = await storage.updateUser(user.id, userData);
      
      // Log activity
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} updated user profile for ${user.firstName} ${user.lastName}`,
        entityType: 'user',
        entityId: user.id
      });
      
      res.json({ user: { ...updatedUser!, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Student Routes =====
  app.get("/api/students", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const students = await storage.getStudentsWithUsers();
      res.json({ students });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const student = await storage.getStudent(Number(id));
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      const user = await storage.getUser(student.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found for student" });
      }
      
      // Only allow students to view their own profile or instructors/admins to view any profile
      const requestUser = (req as any).user;
      if (requestUser.id !== user.id && requestUser.role === 'student') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json({ student: { ...student, user: { ...user, password: undefined } } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/students/:id", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const { id } = req.params;
      const student = await storage.getStudent(Number(id));
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Validate input
      const studentData = req.body;
      
      const updatedStudent = await storage.updateStudent(student.id, studentData);
      const user = await storage.getUser(student.userId);
      
      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} updated student record for ${user?.firstName} ${user?.lastName}`,
        entityType: 'student',
        entityId: student.id
      });
      
      res.json({ student: updatedStudent });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Class Routes =====
  app.get("/api/classes", isAuthenticated, async (req, res) => {
    try {
      const classes = await storage.getClassesWithInstructors();
      res.json({ classes });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/classes/today", isAuthenticated, async (req, res) => {
    try {
      const classes = await storage.getTodaysClasses();
      res.json({ classes });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/classes/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const classItem = await storage.getClass(Number(id));
      
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      let instructor = undefined;
      if (classItem.instructorId) {
        instructor = await storage.getUser(classItem.instructorId);
      }
      
      res.json({ class: { ...classItem, instructor } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/classes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const classData = insertClassSchema.parse(req.body);
      
      const classItem = await storage.createClass(classData);
      
      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} created a new class: ${classItem.name}`,
        entityType: 'class',
        entityId: classItem.id
      });
      
      res.status(201).json({ class: classItem });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid class data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/classes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const classItem = await storage.getClass(Number(id));
      
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      const classData = req.body;
      
      const updatedClass = await storage.updateClass(classItem.id, classData);
      
      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} updated class: ${classItem.name}`,
        entityType: 'class',
        entityId: classItem.id
      });
      
      res.json({ class: updatedClass });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid class data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Attendance Routes =====
  app.get("/api/attendance", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const attendances = await storage.getAttendanceWithDetails();
      res.json({ attendances });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/attendance/class/:classId", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const { classId } = req.params;
      const { date } = req.query;
      
      let dateObj = undefined;
      if (date) {
        dateObj = new Date(date as string);
      }
      
      const attendances = await storage.getAttendanceByClass(Number(classId), dateObj);
      res.json({ attendances });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/attendance/student/:studentId", isAuthenticated, async (req, res) => {
    try {
      const { studentId } = req.params;
      const student = await storage.getStudent(Number(studentId));
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Only allow students to view their own attendance or instructors/admins to view any attendance
      const requestUser = (req as any).user;
      if (requestUser.id !== student.userId && requestUser.role === 'student') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const attendances = await storage.getAttendanceByStudent(Number(studentId));
      res.json({ attendances });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/attendance", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      
      // Verify student exists
      const student = await storage.getStudent(attendanceData.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Verify class exists
      const classItem = await storage.getClass(attendanceData.classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      const attendance = await storage.createAttendance(attendanceData);
      
      // Log activity
      const requestUser = (req as any).user;
      const user = await storage.getUser(student.userId);
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} recorded attendance for ${user?.firstName} ${user?.lastName} in ${classItem.name}`,
        entityType: 'attendance',
        entityId: attendance.id
      });
      
      res.status(201).json({ attendance });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Payment Plan Routes =====
  app.get("/api/payment-plans", isAuthenticated, async (req, res) => {
    try {
      const plans = await storage.getPaymentPlans();
      res.json({ plans });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/payment-plans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const planData = insertPaymentPlanSchema.parse(req.body);
      
      const plan = await storage.createPaymentPlan(planData);
      
      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} created a new payment plan: ${plan.name}`,
        entityType: 'payment-plan',
        entityId: plan.id
      });
      
      res.status(201).json({ plan });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment plan data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Student Payment Routes =====
  app.get("/api/student-payments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const payments = await storage.getStudentPaymentsWithDetails();
      res.json({ payments });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/student-payments/overdue", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const payments = await storage.getOverduePayments();
      res.json({ payments });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/student-payments/student/:studentId", isAuthenticated, async (req, res) => {
    try {
      const { studentId } = req.params;
      const student = await storage.getStudent(Number(studentId));
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Only allow students to view their own payments or admins to view any payments
      const requestUser = (req as any).user;
      if (requestUser.id !== student.userId && requestUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const payments = await storage.getStudentPaymentsByStudent(Number(studentId));
      res.json({ payments });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/student-payments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const paymentData = insertStudentPaymentSchema.parse(req.body);
      
      // Verify student exists
      const student = await storage.getStudent(paymentData.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Verify payment plan exists
      const plan = await storage.getPaymentPlan(paymentData.planId);
      if (!plan) {
        return res.status(404).json({ message: "Payment plan not found" });
      }
      
      const payment = await storage.createStudentPayment(paymentData);
      
      // Log activity
      const requestUser = (req as any).user;
      const user = await storage.getUser(student.userId);
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} created a new payment for ${user?.firstName} ${user?.lastName}: ${plan.name}`,
        entityType: 'student-payment',
        entityId: payment.id
      });
      
      res.status(201).json({ payment });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/student-payments/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getStudentPayment(Number(id));
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const paymentData = req.body;
      
      const updatedPayment = await storage.updateStudentPayment(payment.id, paymentData);
      
      // Log activity
      const requestUser = (req as any).user;
      const student = await storage.getStudent(payment.studentId);
      const user = await storage.getUser(student?.userId || 0);
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} updated payment for ${user?.firstName} ${user?.lastName}`,
        entityType: 'student-payment',
        entityId: payment.id
      });
      
      res.json({ payment: updatedPayment });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Activity Log Routes =====
  app.get("/api/activity-logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await storage.getActivityLogs(limit ? Number(limit) : undefined);
      res.json({ logs });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Stats Routes =====
  app.get("/api/stats", isAuthenticated, isInstructor, async (req, res) => {
    try {
      // Get counts
      const users = await storage.getUsers();
      const students = await storage.getStudents();
      const classes = await storage.getClasses();
      const attendances = await storage.getAttendanceWithDetails();
      const payments = await storage.getStudentPaymentsWithDetails();
      
      // Calculate statistics
      const totalStudents = students.length;
      
      // Get current month's classes
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const classesThisMonth = classes.length; // Simplified for demo
      
      // Calculate average attendance
      const avgAttendance = totalStudents > 0 ? 76 : 0; // Simplified for demo
      
      // Calculate revenue (sum of all paid payments)
      const revenue = payments
        .filter(payment => payment.status === 'paid')
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      res.json({
        stats: {
          totalStudents,
          classesThisMonth,
          avgAttendance: `${avgAttendance}%`,
          revenue: (revenue / 100).toFixed(2) // Convert cents to dollars
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
