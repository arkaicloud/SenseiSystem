import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users, students, beltLevels } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertStudentSchema, 
  insertClassSchema,
  insertAttendanceSchema,
  insertAttendanceChangesSchema,
  insertPaymentPlanSchema,
  insertStudentPaymentSchema,
  insertActivityLogSchema,
  insertSchoolEventSchema,
  insertDashboardCustomizationSchema,
  insertRiskActionSchema,
  insertRiskSettingsSchema,
  insertSchoolPaymentSchema,
  insertBeltLevelSchema
} from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin, isInstructor, isSelfOrStaff, hashPassword } from "./auth";
import { dashboardMetricsService } from "./services/dashboardMetrics";
import { engagementMetricsService } from "./services/engagementMetrics";
import { AsaasPaymentsService } from "./services/asaasPaymentsService";
import { AsaasService } from "./services/asaasService";
import { emailService } from "./services/emailService";
import crypto from "crypto";


export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // =====Dashboard Metrics Route=====
  app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await dashboardMetricsService.getMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('❌ Error fetching dashboard metrics:', error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Force refresh dashboard metrics (admin only)
  app.post("/api/dashboard/metrics/refresh", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const metrics = await dashboardMetricsService.refreshCache();
      res.json({ success: true, metrics });
    } catch (error) {
      console.error('❌ Error refreshing dashboard metrics:', error);
      res.status(500).json({ message: "Failed to refresh dashboard metrics" });
    }
  });

  // =====Engagement Metrics Route=====
  app.get("/api/admin/widgets/engagement", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const metrics = await engagementMetricsService.getMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('❌ Error fetching engagement metrics:', error);
      res.status(500).json({ message: "Failed to fetch engagement metrics" });
    }
  });

  // =====Belt Statistics Route=====
  app.get("/api/admin/stats/belts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // First get all available belts from the database
      const allBelts = await db
        .select({
          levelKey: beltLevels.levelKey,
          name: beltLevels.name,
          color: beltLevels.colorCode,
          category: beltLevels.category,
          order: beltLevels.order
        })
        .from(beltLevels)
        .where(eq(beltLevels.active, true))
        .orderBy(beltLevels.order);

      // Then get the student count for each belt
      const beltStats = await db
        .select({
          beltLevel: students.beltLevel,
          count: sql<number>`count(*)::int`
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(and(
          eq(users.status, 'active'),
          eq(users.active, true)
        ))
        .groupBy(students.beltLevel);

      // Create a map of belt counts
      const countMap: { [key: string]: number } = {};
      beltStats.forEach(stat => {
        countMap[stat.beltLevel] = stat.count;
      });

      // Create result with all belts, including zero counts
      const result = allBelts.map(belt => ({
        levelKey: belt.levelKey,
        name: belt.name,
        color: belt.color,
        category: belt.category,
        count: countMap[belt.levelKey] || 0,
        order: belt.order
      }));

      res.json(result);
    } catch (error) {
      console.error('❌ Error fetching belt statistics:', error);
      res.status(500).json({ message: "Failed to fetch belt statistics" });
    }
  });

  // =====Belt Levels CRUD Routes=====
  app.get("/api/admin/belts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const belts = await db
        .select()
        .from(beltLevels)
        .where(eq(beltLevels.active, true))
        .orderBy(beltLevels.order);

      res.json({ belts });
    } catch (error) {
      console.error('❌ Error fetching belt levels:', error);
      res.status(500).json({ message: "Failed to fetch belt levels" });
    }
  });

  app.post("/api/admin/belts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertBeltLevelSchema.parse(req.body);

      const [newBelt] = await db
        .insert(beltLevels)
        .values({
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.json({ belt: newBelt });
    } catch (error) {
      console.error('❌ Error creating belt level:', error);
      res.status(500).json({ message: "Failed to create belt level" });
    }
  });

  app.put("/api/admin/belts/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertBeltLevelSchema.partial().parse(req.body);

      const [updatedBelt] = await db
        .update(beltLevels)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(beltLevels.id, parseInt(id)))
        .returning();

      if (!updatedBelt) {
        return res.status(404).json({ message: "Belt level not found" });
      }

      res.json({ belt: updatedBelt });
    } catch (error) {
      console.error('❌ Error updating belt level:', error);
      res.status(500).json({ message: "Failed to update belt level" });
    }
  });

  app.delete("/api/admin/belts/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Soft delete by setting active to false
      const [deletedBelt] = await db
        .update(beltLevels)
        .set({ 
          active: false,
          updatedAt: new Date()
        })
        .where(eq(beltLevels.id, parseInt(id)))
        .returning();

      if (!deletedBelt) {
        return res.status(404).json({ message: "Belt level not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('❌ Error deleting belt level:', error);
      res.status(500).json({ message: "Failed to delete belt level" });
    }
  });

  // =====Birthdays Route=====
  app.get("/api/birthdays/today", isAuthenticated, async (req, res) => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1; // getMonth() returns 0-11
      const day = today.getDate();

      const birthdayStudents = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          birthDate: users.birthDate,
          phone: users.phone,
          beltLevel: students.beltLevel,
          stripes: students.stripes
        })
        .from(users)
        .innerJoin(students, eq(users.id, students.userId))
        .where(
          and(
            eq(users.active, true),
            sql`EXTRACT(MONTH FROM ${users.birthDate}) = ${month}`,
            sql`EXTRACT(DAY FROM ${users.birthDate}) = ${day}`
          )
        );

      res.json({ birthdays: birthdayStudents });
    } catch (error) {
      console.error('Error fetching birthdays:', error);
      res.status(500).json({ error: 'Failed to fetch birthdays' });
    }
  });

  // =====Student Profile Route (For logged in student)=====
  app.get("/api/student/profile", isAuthenticated, async (req, res) => {
    try {
      const requestUser = (req as any).user;

      // Only students can access this endpoint
      if (requestUser.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const student = await storage.getStudentByUserId(requestUser.id);
      if (!student) {
        return res.status(404).json({ error: 'Student profile not found' });
      }

      res.json({
        id: student.id,
        beltLevel: student.beltLevel,
        stripes: student.stripes,
        paymentPlanId: student.paymentPlanId,
        isFinancialResponsible: student.financialResponsibleCpf === requestUser.cpf
      });
    } catch (error) {
      console.error('Error fetching student profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // =====Student Profile Route by ID (For admins/instructors)=====
  app.get("/api/student/profile/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const userIdNumber = parseInt(userId);

      if (isNaN(userIdNumber)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const student = await storage.getStudentByUserId(userIdNumber);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      res.json({ student });
    } catch (error) {
      console.error('Error fetching student profile:', error);
      res.status(500).json({ error: 'Failed to fetch student profile' });
    }
  });

  // =====Student Current Month Attendance Route (for logged in student)=====
  app.get("/api/student/attendance-current-month", isAuthenticated, async (req, res) => {
    try {
      const requestUser = (req as any).user;

      // Only students can access this endpoint
      if (requestUser.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const student = await storage.getStudentByUserId(requestUser.id);
      if (!student) {
        return res.status(404).json({ error: 'Student profile not found' });
      }

      // Get current month attendance count
      const currentDate = new Date();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Get attendance records for current month
      const attendances = await storage.getAttendanceByStudent(student.id);
      const currentMonthAttendances = attendances.filter(att => {
        const attDate = new Date(att.date);
        return attDate >= firstDay && attDate <= lastDay && att.status === 'present';
      });

      // Calculate total available classes this month (rough estimate)
      const daysInMonth = lastDay.getDate();
      const weekdaysInMonth = Math.floor(daysInMonth * 5 / 7); // Rough estimate of weekdays
      const availableClasses = Math.min(weekdaysInMonth, 20); // Cap at 20 classes per month

      res.json({
        attendanceCount: currentMonthAttendances.length,
        totalClasses: availableClasses,
        attendanceRate: availableClasses > 0 ? Math.round((currentMonthAttendances.length / availableClasses) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // =====Student Current Month Attendance Route by ID (for admins/instructors)=====
  app.get("/api/student/attendance-current-month/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const userIdNumber = parseInt(userId);

      if (isNaN(userIdNumber)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const student = await storage.getStudentByUserId(userIdNumber);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Get current month attendance count
      const currentDate = new Date();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const attendances = await storage.getAttendanceByStudent(student.id);
      const currentMonthAttendances = attendances.filter(att => {
        const attDate = new Date(att.date);
        return attDate >= firstDay && attDate <= lastDay && att.status === 'present';
      });

      res.json({ 
        attendanceCount: currentMonthAttendances.length,
        totalClasses: 20 // Default estimate
      });
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      res.status(500).json({ error: 'Failed to fetch student attendance' });
    }
  });

  // =====Class Attendance Confirmation Route=====
  app.post("/api/classes/:classId/confirm-attendance", isAuthenticated, async (req, res) => {
    try {
      const { classId } = req.params;
      const requestUser = (req as any).user;

      const classIdNumber = parseInt(classId);

      if (isNaN(classIdNumber)) {
        return res.status(400).json({ error: 'Invalid class ID' });
      }

      // Only students can confirm their own attendance
      if (requestUser.role !== 'student') {
        return res.status(403).json({ error: 'Only students can confirm attendance' });
      }

      // Get student data from the logged user
      const student = await storage.getStudentByUserId(requestUser.id);
      if (!student) {
        return res.status(404).json({ error: 'Student profile not found' });
      }

      // Check if class exists
      const classSession = await storage.getClass(classIdNumber);
      if (!classSession) {
        return res.status(404).json({ error: 'Class not found' });
      }

      // Check if attendance already exists for today
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const existingAttendances = await storage.getAttendanceByStudent(student.id);
      const todayAttendance = existingAttendances.find(att => {
        const attDate = new Date(att.date);
        return att.classId === classIdNumber && 
               attDate >= startOfDay && 
               attDate < endOfDay;
      });

      if (todayAttendance) {
        return res.json({ success: true, message: 'Attendance already confirmed for this class today' });
      }

      // Create attendance record
      const attendanceData = {
        studentId: student.id,
        classId: classIdNumber,
        date: new Date(),
        status: 'present' as const,
        checkedInBy: requestUser.id
      };

      console.log('Creating attendance record:', attendanceData);
      await storage.createAttendance(attendanceData);

      res.json({ success: true, message: 'Attendance confirmed successfully' });
    } catch (error) {
      console.error('Error confirming attendance:', error);
      res.status(500).json({ error: 'Failed to confirm attendance' });
    }
  });

  // =====Financial Chart Data Route=====
  app.get("/api/financial-chart", isAuthenticated, async (req, res) => {
    try {
      const { timeRange = "30d" } = req.query;
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;

      // Get payment data for the specified period
      const payments = await storage.getStudentPaymentsWithDetails();
      const today = new Date();

      // Generate chart data for each day in the period
      const chartData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Calculate received and pending amounts for this date
        const dayPayments = payments.filter(payment => {
          if (payment.paidDate) {
            const paidDate = new Date(payment.paidDate);
            return paidDate.toISOString().split('T')[0] === dateStr;
          }
          return false;
        });

        const received = dayPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);

        const pending = payments
          .filter(p => p.status === 'pending' && p.dueDate && new Date(p.dueDate).toISOString().split('T')[0] <= dateStr)
          .reduce((sum, p) => sum + p.amount, 0);

        chartData.push({
          date: dateStr,
          received,
          pending: Math.max(0, pending)
        });
      }

      res.json(chartData);
    } catch (error) {
      console.error("Erro ao buscar dados do gráfico financeiro:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // =====Enrollment Chart Data Route=====
  app.get("/api/enrollment-chart", isAuthenticated, async (req, res) => {
    try {
      const { timeRange = "30d" } = req.query;
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;

      // Get all students for enrollment data
      const students = await storage.getStudents();
      const today = new Date();

      // Generate chart data for enrollment trends
      const chartData = [];
      let cumulativeTotal = 0;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Count new students registered on this date
        const newStudents = students.filter(student => {
          if (student.createdAt) {
            const createdDate = new Date(student.createdAt);
            return createdDate.toISOString().split('T')[0] === dateStr;
          }
          return false;
        }).length;

        cumulativeTotal += newStudents;

        // Calculate total active students up to this date
        const totalStudents = students.filter(student => {
          if (student.createdAt) {
            const createdDate = new Date(student.createdAt);
            return createdDate <= date && student.active !== false;
          }
          return false;
        }).length;

        chartData.push({
          date: dateStr,
          newStudents,
          totalStudents: Math.max(totalStudents, cumulativeTotal)
        });
      }

      res.json(chartData);
    } catch (error) {
      console.error("Erro ao buscar dados do gráfico de matrículas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // =====Financial Stats Route=====
  app.get("/api/financial-stats", isAuthenticated, async (req, res) => {
    try {
      // Buscar dados financeiros básicos
      const students = await storage.getStudents();
      const payments = await storage.getStudentPaymentsWithDetails();
      const paymentPlans = await storage.getPaymentPlans();

      // Calcular métricas financeiras
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Receita recebida este mês
      const thisMonthPayments = payments.filter(payment => {
        if (payment.status === 'paid' && payment.paidDate) {
          const paidDate = new Date(payment.paidDate);
          return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
        }
        return false;
      });
      const totalReceived = thisMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);

      // Pagamentos pendentes
      const pendingPayments = payments.filter(payment => payment.status === 'pending');
      const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);

      // Pagamentos em atraso
      const overduePayments = payments.filter(payment => {
        if (payment.status === 'overdue') return true;
        if (payment.status === 'pending' && payment.dueDate) {
          const dueDate = new Date(payment.dueDate);
          return dueDate < currentDate;
        }
        return false;
      });
      const overdueAmount = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);

      // Receita recorrente mensal estimada
      const activeStudents = students.filter(student => student.active !== false);
      const monthlyRecurring = activeStudents.length > 0 ? 
        activeStudents.length * (paymentPlans.length > 0 ? paymentPlans[0].amount : 150) : 0;

      // Crescimento da receita (simulado por enquanto)
      const revenueGrowth = Math.random() * 20 - 5; // Entre -5% e +15%

      const stats = {
        totalReceived,
        pendingAmount,
        overdueAmount,
        monthlyRecurring,
        revenueGrowth,
        totalStudents: activeStudents.length
      };

      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas financeiras:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        totalReceived: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        monthlyRecurring: 0,
        revenueGrowth: 0,
        totalStudents: 0
      });
    }
  });

  // ===== Stats/Dashboard Routes=====
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      // Dados básicos que serão usados para todos os tipos de usuário
      let totalStudents = 0;
      let totalClasses = 0;
      let totalAttendances = 0;

      try {
        totalStudents = (await storage.getStudents()).length;
      } catch (err) {
        console.error("Erro ao buscar estudantes:", err);
      }

      try {
        totalClasses = (await storage.getClasses()).length;
      } catch (err) {
        console.error("Erro ao buscar aulas:", err);
      }

      try {
        totalAttendances = (await storage.getAttendanceWithDetails()).length;
      } catch (err) {
        console.error("Erro ao buscar presenças:", err);
      }

      // Se não temos informações do usuário, retornamos apenas estatísticas básicas
      if (!req.user) {
        return res.json({ 
          stats: {
            totalStudents,
            totalClasses,
            totalAttendances
          }
        });
      }

      // Para administradores e instrutores - estatísticas completas
      if (req.user.role === 'admin' || req.user.role === 'instructor') {
        const stats = {
          totalStudents,
          totalClasses,
          totalAttendances,
          activeStudents: Math.floor(totalStudents * 0.8),
          averageAttendance: totalAttendances > 0 ? Math.floor((totalAttendances / totalClasses) * 100) / 100 : 0,
          beltDistribution: [
            { level: 'white', count: Math.floor(totalStudents * 0.4) },
            { level: 'blue', count: Math.floor(totalStudents * 0.3) },
            { level: 'purple', count: Math.floor(totalStudents * 0.15) },
            { level: 'brown', count: Math.floor(totalStudents * 0.1) },
            { level: 'black', count: Math.floor(totalStudents * 0.05) }
          ],
          revenueThisMonth: 0
        };

        return res.json({ stats });
      }

      // Para estudantes - estatísticas personalizadas
      if (req.user.role === 'student') {
        // Se não temos ID do usuário, retornamos estatísticas básicas
        if (!req.user.id) {
          return res.json({ 
            stats: {
              totalClasses,
              totalStudents
            },
            message: "Estatísticas limitadas - ID do usuário não disponível"
          });
        }

        let student = null;
        let studentAttendances = [];

        try {
          student = await storage.getStudentByUserId(req.user.id);
        } catch (err) {
          console.error("Erro ao buscar registro do estudante:", err);
        }

        if (!student) {
          return res.json({
            stats: {
              totalClasses,
              totalStudents
            },
            message: "Estatísticas limitadas - registro de estudante não encontrado"
          });
        }

        try {
          studentAttendances = await storage.getAttendanceByStudent(student.id);
        } catch (err) {
          console.error("Erro ao buscar presenças do estudante:", err);
        }

        const stats = {
          totalClasses,
          studentAttendances: studentAttendances ? studentAttendances.length : 0,
          studentBelt: student.beltLevel || 'white',
          studentStripes: student.stripes || 0,
          lastPromotion: student.lastPromotionDate || null,
          attendanceRate: student.attendanceRate || 0
        };

        return res.json({ stats });
      }

      // Se nenhum papel corresponde, retornamos apenas estatísticas básicas
      return res.json({ 
        stats: {
          totalStudents,
          totalClasses,
          totalAttendances
        },
        message: "Estatísticas limitadas - papel do usuário não reconhecido"
      });
    } catch (error) {
      console.error("Erro na rota de estatísticas:", error);
      return res.status(500).json({ 
        message: "Erro interno do servidor", 
        error: error.message 
      });
    }
  });

  // ===== Attendance Confirmation Routes =====

  // Endpoint removido - duplicado com o de baixo

  // Buscar presenças do usuário atual
  app.get("/api/attendance/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // Verificar se o usuário pode acessar esses dados
      if (req.user!.id !== userId && req.user!.role === 'student') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const student = await storage.getStudentByUserId(userId);
      if (!student) {
        return res.status(404).json({ message: "Registro de estudante não encontrado" });
      }

      const attendances = await storage.getAttendanceByStudent(student.id);
      res.json({ attendances });
    } catch (error) {
      console.error("Erro ao buscar presenças do usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== User Routes =====
  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Only return active users
      const activeUsers = users.filter(u => u.active);
      res.json({ users: activeUsers.map(u => ({ ...u, password: undefined })) });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get pending users (inactive users waiting for approval)
  app.get("/api/users/pending", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Only return inactive users
      const pendingUsers = users.filter(u => !u.active);

      // Include student data for each pending user
      const usersWithStudentData = await Promise.all(
        pendingUsers.map(async (user) => {
          try {
            const student = await storage.getStudentByUserId(user.id);
            return {
              ...user,
              password: undefined,
              student: student || null
            };
          } catch (error) {
            console.warn(`Failed to get student data for user ${user.id}:`, error);
            return {
              ...user,
              password: undefined,
              student: null
            };
          }
        })
      );

      res.json({ users: usersWithStudentData });
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Approve user mutation
  // Update payment plan for pending user
  app.patch("/api/users/:id/payment-plan", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { paymentPlanId } = req.body;

      if (isNaN(userId) || !paymentPlanId) {
        return res.status(400).json({ error: "ID do usuário e plano de pagamento são obrigatórios" });
      }

      // Verify payment plan exists
      const paymentPlan = await storage.getPaymentPlan(paymentPlanId);
      if (!paymentPlan) {
        return res.status(404).json({ error: "Plano de pagamento não encontrado" });
      }

      // Get user's student record
      const student = await storage.getStudentByUserId(userId);
      if (!student) {
        return res.status(404).json({ error: "Registro de aluno não encontrado" });
      }

      // Update payment plan
      await storage.updateStudent(student.id, { paymentPlanId });

      res.json({ 
        success: true, 
        message: "Plano de pagamento atualizado com sucesso",
        paymentPlan: paymentPlan.name
      });
    } catch (error) {
      console.error("Erro ao atualizar plano de pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/users/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { planId } = req.body;
      const user = await storage.getUser(Number(id));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.active) {
        return res.status(400).json({ message: "User is already active" });
      }

      // For students, payment plan is required
      if (user.role === 'student' && !planId) {
        return res.status(400).json({ message: "Payment plan is required for student approval" });
      }

      // Activate the user
      const updatedUser = await storage.updateUser(user.id, { active: true });

      // If it's a student, create a student payment and ASAAS integration
      if (user.role === 'student' && planId) {
        const student = await storage.getStudentByUserId(user.id);
        if (student) {
          const plan = await storage.getPaymentPlan(planId);
          if (plan) {
            // Create initial payment record
            const today = new Date();
            const dueDate = new Date(today);
            dueDate.setMonth(dueDate.getMonth() + (plan.frequency === 'monthly' ? 1 : 12));

            await storage.createStudentPayment({
              studentId: student.id,
              planId: plan.id,
              amount: plan.amount,
              dueDate: dueDate,
              status: 'pending'
            });

            // Create ASAAS customer and subscription after approval
            if (student.financialResponsibleName && student.financialResponsibleEmail) {
              try {
                const asaasService = new AsaasService();

                console.log('🎯 ARKAIDEV: Processando aprovação individual com anti-duplicata:', user.firstName, user.lastName);

                // Prepare student data for ASAAS with responsavel data
                const alunoData = {
                  ...student,
                  first_name: user.firstName,
                  last_name: user.lastName,
                  user_id: user.id,
                  street: user.street,
                  number: user.number,
                  complement: user.complement,
                  neighborhood: user.neighborhood,
                  zipCode: user.zipCode,
                  preferredDueDate: student.preferredDueDate || 5, // Incluir data de vencimento preferida
                  responsavel: {
                    nome: student.financialResponsibleName,
                    name: student.financialResponsibleName,
                    email: student.financialResponsibleEmail,
                    telefone: student.financialResponsiblePhone,
                    phone: student.financialResponsiblePhone,
                    cpf: student.financialResponsibleCpf,
                    endereco: user.street,
                    address: user.street,
                    numero: user.number,
                    addressNumber: user.number,
                    complemento: user.complement,
                    complement: user.complement,
                    cep: user.zipCode,
                    cidade: user.city || '',
                    city: user.city || ''
                  }
                };

                // 🎯 Use new ARKAIDEV function: Create or Sync cobrança (anti-duplicate)
                console.log('🔍 Verificando/criando cliente e cobrança ASAAS (anti-duplicata)...');

                // First get or create the customer
                const { customer, created } = await asaasService.getOrCreateAsaasCustomer(alunoData);
                console.log(`🏢 Cliente ASAAS: ${customer.id} (${created ? 'criado' : 'existente'})`);

                // Then create or sync the payment
                const payment = await asaasService.createOrSyncCobranca(customer.id, alunoData, plan);
                console.log(`✅ Processo concluído - Payment ID: ${payment.id}, Customer: ${payment.customer}`);

                // Update student with ASAAS customer ID if not already set
                if (!student.asaasCustomerId && payment.customer) {
                  await storage.updateStudent(student.id, { asaasCustomerId: payment.customer });
                }

                console.log('✅ ASAAS payment created:', payment.id);

                // Check if payment already exists in database before saving
                const existingPayment = await storage.getContaReceberByAsaasId(payment.id);
                if (!existingPayment) {
                  // Save payment to database only if it doesn't exist
                  await storage.createContaReceber({
                    studentId: student.id,
                    asaasPaymentId: payment.id,
                    asaasCustomerId: payment.customer,
                  status: payment.status,
                  billingType: payment.billingType as 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER',
                  value: Math.round(payment.value * 100), // Convert back to cents
                  netValue: payment.netValue ? Math.round(payment.netValue * 100) : null,
                  dueDate: new Date(payment.dueDate),
                  description: payment.description || '',
                  externalReference: payment.externalReference || null,
                  invoiceUrl: payment.invoiceUrl || null,
                  bankSlipUrl: payment.bankSlipUrl || null,
                  pixQrCode: payment.pixQrCode || null,
                  pixCopyAndPaste: payment.pixCopyAndPaste || null
                  });
                  console.log(`💾 Novo pagamento salvo no banco: ${payment.id}`);
                } else {
                  console.log(`⏭️ Pagamento já existe no banco, pulando: ${payment.id}`);
                }
              } catch (error) {
                console.error('❌ Error creating ASAAS customer/subscription:', error);
                // Continue with approval even if ASAAS fails - log the error but don't fail the approval
              }
            }
          } else {
            return res.status(404).json({ message: "Payment plan not found" });
          }
        } else {
          return res.status(404).json({ message: "Student profile not found" });
        }
      }

      // Create activity log for account activation
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        activity: `User account approved: ${user.firstName} ${user.lastName} (${user.role})`,
        userId: requestUser.id,
        entityType: "user",
        entityId: user.id,
        timestamp: new Date()
      });

      res.json({ 
        user: { ...updatedUser, password: undefined },
        message: "User approved successfully"
      });
    } catch (err) {
      console.error("Error approving user:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reject user
  app.post("/api/users/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = await storage.getUser(Number(id));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.active) {
        return res.status(400).json({ message: "Cannot reject an active user" });
      }

      // Delete the user and associated student record
      const student = await storage.getStudentByUserId(user.id);
      if (student) {
        await storage.deleteStudent(student.id);
      }

      await storage.deleteUser(user.id);

      // Create activity log for rejection
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        activity: `User rejected: ${user.firstName} ${user.lastName} (${user.role})${reason ? ` - Reason: ${reason}` : ''}`,
        userId: requestUser.id,
        entityType: "user",
        entityId: user.id,
        timestamp: new Date()
      });

      res.json({ 
        message: "User rejected successfully"
      });
    } catch (err) {
      console.error("Error rejecting user:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Revert approval - set user back to pending
  app.post("/api/users/:id/revert-approval", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = await storage.getUser(Number(id));

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (!user.active) {
        return res.status(400).json({ message: "Usuário já está pendente" });
      }

      // Set user back to pending
      const updatedUser = await storage.updateUser(user.id, { 
        active: false,
        status: 'pending'
      });

      // Create activity log for reversion
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        activity: `Aprovação revertida para usuário: ${user.firstName} ${user.lastName}${reason ? ` - Motivo: ${reason}` : ''}`,
        userId: requestUser.id,
        entityType: "user",
        entityId: user.id,
        timestamp: new Date()
      });

      res.json({ 
        user: { ...updatedUser, password: undefined },
        message: "Usuário revertido para status pendente com sucesso"
      });
    } catch (err) {
      console.error("Error reverting user approval:", err);
      res.status(500).json({ message: "Erro interno do servidor" });
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
      if (requestUser.id !== user.id && requestUser.role !== 'admin' && requestUser.role !== 'instructor') {
        return res.status(403).json({ message: "Forbidden" });
      }

      // If user is a student, also fetch student data
      let studentData = null;
      if (user.role === 'student') {
        try {
          const student = await storage.getStudentByUserId(user.id);
          if (student) {
            studentData = student;
          }
        } catch (error) {
          console.warn('Failed to fetch student data:', error);
        }
      }

      res.json({ 
        ...user, 
        password: undefined,
        student: studentData
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = Number(id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow users to update their own profile or admins to update any profile
      const requestUser = (req as any).user;
      if (requestUser.id !== user.id && requestUser.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updateData = req.body;
      console.log('📝 Updating user data:', JSON.stringify(updateData, null, 2));

      // Separate user data from student data
      // Extract only fields that exist in the users table
      const userFields = {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        phone: updateData.phone,
        cpf: updateData.cpf,
        rg: updateData.rg,
        emergencyContact: updateData.emergencyContactName,
        emergencyPhone: updateData.emergencyContactPhone,
        birthDate: updateData.birthDate ? new Date(updateData.birthDate) : undefined,
        street: updateData.street,
        number: updateData.number,
        complement: updateData.complement,
        neighborhood: updateData.neighborhood,
        city: updateData.city,
        state: updateData.state,
        zipCode: updateData.zipCode,
      };

      // Remove undefined values
      const userUpdateData = Object.fromEntries(
        Object.entries(userFields).filter(([_, value]) => value !== undefined)
      );

      // Student specific fields
      const {
        beltLevel,
        lastPromotionDate,
        financialResponsibleName,
        financialResponsibleCpf,
        financialResponsibleEmail,
        financialResponsiblePhone,
        financialResponsibleRelation,
        paymentPlanId,
        medicalObservations,
        planObservations,
        preferredDueDate // Added preferredDueDate
      } = updateData;

      // Don't allow role changes unless admin
      if (userUpdateData.role && userUpdateData.role !== user.role && requestUser.role !== 'admin') {
        return res.status(403).json({ message: "Cannot change role" });
      }

      console.log('📤 User data to update:', JSON.stringify(userUpdateData, null, 2));

      // Update user data
      const updatedUser = await storage.updateUser(userId, userUpdateData);

      // Update student data if user is a student
      if (user.role === 'student') {
        const student = await storage.getStudentByUserId(userId);
        if (student) {
          const studentUpdateData: Record<string, any> = {};

          // Only update fields that are actually provided and exist in schema
          if (beltLevel !== undefined && beltLevel !== null) {
            studentUpdateData.beltLevel = beltLevel;
          }
          if (lastPromotionDate !== undefined) {
            studentUpdateData.lastPromotionDate = lastPromotionDate ? new Date(lastPromotionDate) : null;
          }
          if (financialResponsibleName !== undefined) {
            studentUpdateData.financialResponsibleName = financialResponsibleName;
          }
          if (financialResponsibleCpf !== undefined) {
            studentUpdateData.financialResponsibleCpf = financialResponsibleCpf;
          }
          if (financialResponsibleEmail !== undefined) {
            studentUpdateData.financialResponsibleEmail = financialResponsibleEmail;
          }
          if (financialResponsiblePhone !== undefined) {
            studentUpdateData.financialResponsiblePhone = financialResponsiblePhone;
          }
          if (financialResponsibleRelation !== undefined) {
            studentUpdateData.financialResponsibleRelation = financialResponsibleRelation;
          }
          if (paymentPlanId !== undefined && paymentPlanId !== null) {
            studentUpdateData.paymentPlanId = paymentPlanId;
          }
          if (medicalObservations !== undefined) {
            studentUpdateData.medicalObservations = medicalObservations;
          }
          if (planObservations !== undefined) {
            studentUpdateData.planObservations = planObservations;
          }
          if (preferredDueDate !== undefined) { // Update preferredDueDate
            studentUpdateData.preferredDueDate = preferredDueDate;
          }

          // Only update if there's data to update
          if (Object.keys(studentUpdateData).length > 0) {
            await storage.updateStudent(student.id, studentUpdateData);
            console.log('✅ Student data updated successfully:', Object.keys(studentUpdateData));
          } else {
            console.log('ℹ️ No student data to update');
          }
        }
      }

      // Log activity
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} updated user profile for ${user.firstName} ${user.lastName}`,
        entityType: 'user',
        entityId: user.id
      });

      res.json({ 
        user: { ...updatedUser!, password: undefined },
        message: "Dados atualizados com sucesso"
      });
    } catch (error) {
      console.error('❌ Error updating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Student Routes =====
  app.get("/api/students", isAuthenticated, async (req, res) => {
    try {
      console.log('🔍 Fetching students with users...');
      const students = await storage.getStudentsWithUsers();
      console.log('✅ Students found:', students.length);
      res.json({ students });
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/students", isAuthenticated, async (req, res) => {
    try {
      const studentData = req.body;
      console.log('📥 Received student data:', JSON.stringify(studentData, null, 2));

      // Validate required fields
      if (!studentData.firstName || !studentData.lastName || !studentData.email) {
        return res.status(400).json({ message: "Nome, sobrenome e email são obrigatórios" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(studentData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Generate username from email if not provided
      const username = studentData.username || studentData.email.split('@')[0].toLowerCase();

      // Create user without birthDate first to avoid timestamp issues
      const userData = {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        username: username,
        email: studentData.email,
        password: studentData.password || 'temporaryPassword123',
        role: "student" as const,
        active: true, // Active by default during registration
        phone: studentData.phone || null,
        cpf: studentData.cpf || null, // Add user's CPF
        rg: studentData.rg || null, // Add user's RG
        emergencyContact: studentData.emergencyContact || null,
        emergencyPhone: studentData.emergencyPhone || null, // Add emergency phone
        street: studentData.street || null,
        number: studentData.number || null,
        city: studentData.city || null,
        state: studentData.state || null,
        zipCode: studentData.zipCode || null,
        complement: studentData.complement || null,
        neighborhood: studentData.neighborhood || null,
        status: "active" as const,
        currentStreak: 0,
        longestStreak: 0,
        totalLogins: 0
      };

      const user = await storage.createUser(userData);

      // Update the user's birth date using direct SQL to avoid Drizzle timestamp issues  
      if (studentData.birthDate) {
        await db.execute(sql`
          UPDATE users SET birth_date = ${new Date(studentData.birthDate)} WHERE id = ${user.id}
        `);
      }

      // Student specific data - remove null timestamp fields to avoid Drizzle errors
      const studentInfo = insertStudentSchema.parse({
        userId: user.id,
        beltLevel: studentData.beltLevel || "white",
        stripes: studentData.stripes || 0,
        // Remove lastPromotionDate to use database default (NULL)
        attendanceRate: studentData.attendanceRate || 0,
        notes: studentData.notes || null,
        avatarColor: studentData.avatarColor || null,
        avatarStyle: studentData.avatarStyle || null,
        avatarImage: studentData.avatarImage || null,
        // Financial responsibility data - handle "self" vs "other" logic
        financialResponsibleName: studentData.financialResponsibleRelationship === "self" 
          ? `${studentData.firstName} ${studentData.lastName}` 
          : (studentData.financialResponsibleName || `${studentData.firstName} ${studentData.lastName}`),
        financialResponsibleEmail: studentData.financialResponsibleRelationship === "self" 
          ? studentData.email 
          : (studentData.financialResponsibleEmail || studentData.email),
        financialResponsiblePhone: studentData.financialResponsibleRelationship === "self" 
          ? studentData.phone 
          : (studentData.financialResponsiblePhone || studentData.phone),
        financialResponsibleCpf: studentData.financialResponsibleRelationship === "self" 
          ? studentData.cpf 
          : (studentData.financialResponsibleCpf || null),
        financialResponsibleRelation: studentData.financialResponsibleRelationship || "self",
        asaasCustomerId: null,
        paymentPlanId: studentData.paymentPlanId ? parseInt(studentData.paymentPlanId) : null,
        preferredDueDate: studentData.dueDate ? parseInt(studentData.dueDate) : 5
      });

      // Create student record
      const student = await storage.createStudent(studentInfo);

      // ASAAS integration will be done after user approval, not during registration

      // If a payment plan was selected, create the payment
      if (studentData.paymentPlanId) {
        const paymentPlan = await storage.getPaymentPlan(studentData.paymentPlanId);
        if (paymentPlan) {
          await storage.createStudentPayment({
            studentId: student.id,
            amount: paymentPlan.amount,
            planId: paymentPlan.id,
            dueDate: new Date(),
            status: "pending",
            notes: "Plano inicial vinculado no cadastro",
            paidDate: null
          });
        }
      }

      // Log the activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} criou um novo aluno: ${user.firstName} ${user.lastName}`,
        entityType: 'student',
        entityId: student.id,
        timestamp: new Date()
      });

      res.status(201).json({ 
        message: "Aluno criado com sucesso",
        student: student,
        user: { ...user, password: undefined }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Erro ao criar aluno:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Route to fetch student by user ID (must come BEFORE the generic /:id route)
  app.get("/api/students/by-user/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const student = await storage.getStudentByUserId(Number(userId));

      if (!student) {
        return res.status(404).json({ message: "Estudante não encontrado" });
      }

      // Only the student themselves or an admin/instructor can view student data
      const requestUser = (req as any).user;
      if (requestUser.id !== Number(userId) && 
          requestUser.role !== 'admin' && 
          requestUser.role !== 'instructor') {
        return res.status(403).json({ message: "Sem permissão para visualizar este aluno" });
      }

      res.json({ student });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Generic route to fetch student by ID
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

  // Route to update student's avatar
  app.put("/api/students/:id/avatar", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const student = await storage.getStudent(Number(id));

      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }

      // Only the student themselves or an admin/instructor can update the avatar
      const requestUser = (req as any).user;
      if (requestUser.id !== student.userId && 
          requestUser.role !== 'admin' && 
          requestUser.role !== 'instructor') {
        return res.status(403).json({ message: "Sem permissão para atualizar o avatar" });
      }

      const { avatarStyle, avatarColor, avatarImage } = req.body;

      const updatedStudent = await storage.updateStudent(student.id, { 
        avatarStyle, 
        avatarColor, 
        avatarImage 
      });

      // Log activity
      const user = await storage.getUser(student.userId);
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} atualizou o avatar de ${user?.firstName} ${user?.lastName}`,
        entityType: 'student',
        entityId: student.id
      });

      res.json({ student: updatedStudent });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Route to convert student to scholarship
  app.post("/api/students/:id/scholarship", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { scholarshipPlanId, reason } = req.body;

      const student = await storage.getStudent(Number(id));
      if (!student) {
        return res.status(404).json({ message: "Estudante não encontrado" });
      }

      // Verify if the scholarship plan exists
      const scholarshipPlan = await storage.getPaymentPlan(scholarshipPlanId);
      if (!scholarshipPlan || !scholarshipPlan.isScholarship) {
        return res.status(400).json({ message: "Plano de bolsista inválido" });
      }

      // Update student to scholarship
      const updatedStudent = await storage.updateStudent(Number(id), {
        isScholarship: true,
        scholarshipReason: reason || null
      });

      // Create a free payment for the scholarship student
      await storage.createStudentPayment({
        studentId: Number(id),
        planId: scholarshipPlanId,
        status: 'paid',
        dueDate: new Date(),
        paidDate: new Date(),
        amount: 0,
        notes: `Plano de bolsista: ${reason || 'Convertido pelo administrador'}`
      });

      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `Converteu estudante ID: ${id} para bolsista - Motivo: ${reason || 'Não especificado'}`,
        entityType: 'student',
        entityId: Number(id),
        timestamp: new Date()
      });

      res.json({ 
        message: "Estudante convertido para bolsista com sucesso",
        student: updatedStudent 
      });
    } catch (error) {
      console.error("Erro ao converter estudante para bolsista:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
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
      // Buscar todas as aulas em vez de apenas as de hoje para debug
      const allClasses = await storage.getClassesWithInstructors();

      // Para debug, vamos retornar todas as aulas
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      console.log(`Buscando aulas para hoje: ${today.toISOString().split('T')[0]}, dia da semana: ${dayOfWeek}`);
      console.log(`Total de aulas encontradas: ${allClasses.length}`);

      // Filtrar aulas para hoje (por enquanto incluindo todas as aulas ativas)
      const todaysClasses = allClasses.filter(classItem => {
        // Por enquanto, incluir todas as aulas ativas
        return classItem.isActive !== false;
      });

      console.log(`Aulas filtradas para hoje: ${todaysClasses.length}`);

      const classesWithAttendance = await Promise.all(
        todaysClasses.map(async (classItem) => {
          try {
            const attendances = await storage.getAttendanceByClass(classItem.id);
            const todayStr = today.toISOString().split('T')[0];

            // Contar presenças confirmadas para hoje
            const todayAttendanceCount = attendances.filter(attendance => {
              const attendanceDate = new Date(attendance.date).toISOString().split('T')[0];
              return attendanceDate === todayStr && attendance.status === 'present';
            }).length;

            return {
              ...classItem,
              attendanceCount: todayAttendanceCount,
              instructorName: classItem.instructor 
                ? `${classItem.instructor.firstName} ${classItem.instructor.lastName}`
                : 'Sem instrutor'
            };
          } catch (error) {
            console.error(`Erro ao buscar presença para aula ${classItem.id}:`, error);
            return {
              ...classItem,
              attendanceCount: 0,
              instructorName: classItem.instructor 
                ? `${classItem.instructor.firstName} ${classItem.instructor.lastName}`
                : 'Sem instrutor'
            };
          }
        })
      );

      console.log(`Retornando ${classesWithAttendance.length} aulas com dados de presença`);
      res.json({ classes: classesWithAttendance });
    } catch (error) {
      console.error("Erro na rota de aulas de hoje:", error);
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

  // Count attendance for a specific class on a specific date
  app.get("/api/attendance/count/:classId", isAuthenticated, async (req, res) => {
    try {
      const { classId } = req.params;
      const { date } = req.query;

      const targetDate = date ? new Date(date as string) : new Date();
      const dateStr = targetDate.toISOString().split('T')[0];

      const attendances = await storage.getAttendanceByClass(Number(classId));

      // Count attendances for the specific date and status 'present'
      const count = attendances.filter(attendance => {
        const attendanceDate = new Date(attendance.date).toISOString().split('T')[0];
        return attendanceDate === dateStr && attendance.status === 'present';
      }).length;

      res.json({ count, date: dateStr, classId: Number(classId) });
    } catch (error) {
      console.error("Error counting attendance:", error);
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

  // Route for students to confirm attendance with limit controls
  app.post("/api/attendance/confirm", isAuthenticated, async (req, res) => {
    try {
      const { classId, date } = req.body;
      const requestUser = (req as any).user;

      console.log("Tentativa de confirmação de presença:", { classId, userId: requestUser?.id, date });

      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }

      // Check if class exists
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Get student by logged user's ID
      const student = await storage.getStudentByUserId(requestUser.id);
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      // Ensure date is valid
      let classDate;
      try {
        classDate = date ? new Date(date) : new Date();
        // Check if date is valid
        if (isNaN(classDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (error) {
        console.error('Invalid date provided:', date);
        classDate = new Date(); // Use current date if provided date is invalid
      }

      const classDateStr = classDate.toISOString().split('T')[0];

      // Check class student limit
      if (classItem.maxStudents && classItem.maxStudents > 0) {
        const existingAttendances = await storage.getAttendanceByClass(classId, classDate);
        const confirmedCount = existingAttendances.filter(att => 
          new Date(att.date).toISOString().split('T')[0] === classDateStr &&
          att.status === 'present'
        ).length;

        if (confirmedCount >= classItem.maxStudents) {
          return res.status(400).json({ 
            message: "Esta aula já atingiu o limite máximo de alunos" 
          });
        }
      }

      // Check if attendance already exists for this date
      const existingAttendances = await storage.getAttendanceByClass(classId, classDate);
      const existingAttendance = existingAttendances.find(att => 
        att.studentId === student.id && 
        new Date(att.date).toISOString().split('T')[0] === classDateStr
      );

      if (existingAttendance) {
        return res.status(400).json({ message: "Presença já registrada para esta data" });
      }

      // Check limit for confirmations for this class
      const changes = await storage.getAttendanceChanges(student.id, classId, classDate);
      const confirmations = changes.filter(change => change.changeType === 'confirm');

      if (confirmations.length >= 2) {
        return res.status(400).json({ 
          message: "Você atingiu o limite de alterações. Fale com o Sensei." 
        });
      }

      // Create attendance record
      const attendanceData = {
        studentId: student.id,
        classId: classId,
        date: classDate,
        status: 'present' as const,
        checkedInBy: requestUser.id
      };

      const attendance = await storage.createAttendance(attendanceData);

      // Record the change in the control table
      await storage.createAttendanceChange({
        studentId: student.id,
        classId: classId,
        date: classDate,
        changeType: 'confirm'
      });

      // Log the activity
      await storage.createActivityLog({
        activity: `Aluno confirmou presença na aula: ${classItem.name}`,
        userId: requestUser.id,
        entityType: 'attendance',
        entityId: attendance.id,
        timestamp: new Date()
      });

      res.status(201).json({ attendance });
    } catch (error) {
      console.error("Erro ao confirmar presença:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Route to cancel attendance with limit controls
  app.delete("/api/attendance/cancel", isAuthenticated, async (req, res) => {
    try {
      const { classId, date } = req.body;
      const requestUser = (req as any).user;

      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }

      // Get student by logged user's ID
      const student = await storage.getStudentByUserId(requestUser.id);
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const classDate = date ? new Date(date) : new Date();
      const classDateStr = classDate.toISOString().split('T')[0];

      // Get existing attendance for the specified date
      const existingAttendances = await storage.getAttendanceByClass(classId, classDate);
      const existingAttendance = existingAttendances.find(att => 
        att.studentId === student.id && 
        new Date(att.date).toISOString().split('T')[0] === classDateStr
      );

      if (!existingAttendance) {
        return res.status(404).json({ message: "Nenhuma presença encontrada para esta data" });
      }

      // Check limit for cancellations for this class
      const changes = await storage.getAttendanceChanges(student.id, classId, classDate);
      const cancellations = changes.filter(change => change.changeType === 'cancel');

      if (cancellations.length >= 2) {
        return res.status(400).json({ 
          message: "Você atingiu o limite de alterações. Fale com o Sensei." 
        });
      }

      // Cancel attendance
      const success = await storage.deleteAttendance(existingAttendance.id);

      if (!success) {
        return res.status(400).json({ message: "Falha ao cancelar presença" });
      }

      // Record the change in the control table
      await storage.createAttendanceChange({
        studentId: student.id,
        classId: classId,
        date: classDate,
        changeType: 'cancel'
      });

      // Log the activity
      await storage.createActivityLog({
        activity: `Aluno cancelou presença na aula ID: ${classId}`,
        userId: requestUser.id,
        entityType: 'attendance',
        entityId: existingAttendance.id,
        timestamp: new Date()
      });

      res.json({ message: "Presença cancelada com sucesso" });
    } catch (error) {
      console.error("Erro ao cancelar presença:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Route to check attendance changes
  app.get("/api/attendance/changes/:studentId/:classId", isAuthenticated, async (req, res) => {
    try {
      const { studentId, classId } = req.params;
      const { date } = req.query;
      const requestUser = (req as any).user;

      if (!studentId || !classId) {
        return res.status(400).json({ message: "Student ID e Class ID são obrigatórios" });
      }

      // Verify permissions
      const student = await storage.getStudent(Number(studentId));
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Students can only see their own changes
      if (requestUser.role === 'student') {
        const studentUser = await storage.getUser(student.userId);
        if (!studentUser || studentUser.id !== requestUser.id) {
          return res.status(403).json({ 
            message: "Acesso negado: você só pode ver suas próprias informações" 
          });
        }
      }

      const queryDate = date ? new Date(date as string) : new Date();
      const changes = await storage.getAttendanceChanges(Number(studentId), Number(classId), queryDate);

      const confirmations = changes.filter(c => c.changeType === 'confirm').length;
      const cancellations = changes.filter(c => c.changeType === 'cancel').length;

      res.json({ 
        changes,
        summary: {
          confirmations,
          cancellations,
          remainingConfirmations: Math.max(0, 2 - confirmations),
          remainingCancellations: Math.max(0, 2 - cancellations)
        }
      });
    } catch (error) {
      console.error("Erro ao buscar alterações de presença:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== Payment Plan Routes =====
  app.get("/api/payment-plans", async (req, res) => {
    try {
      const plans = await storage.getPaymentPlans();
      res.json({ plans });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Route to fetch scholarship plans
  app.get("/api/payment-plans/scholarships", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const plans = await storage.getPaymentPlans();
      const scholarshipPlans = plans.filter(plan => plan.isScholarship);
      res.json({ plans: scholarshipPlans });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Route to create a scholarship plan
  app.post("/api/payment-plans/scholarship", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Nome do plano é obrigatório" });
      }

      const scholarshipPlan = await storage.createPaymentPlan({
        name: name,
        amount: 0, // Scholarship plans are free
        frequency: "monthly",
        description: description || "Plano de bolsista - gratuito",
        isScholarship: true
      });

      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `Criou plano de bolsista: ${scholarshipPlan.name}`,
        entityType: 'payment-plan',
        entityId: scholarshipPlan.id,
        timestamp: new Date()
      });

      res.status(201).json({ plan: scholarshipPlan });
    } catch (error) {
      console.error("Erro ao criar plano de bolsista:", error);
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

  app.put("/api/payment-plans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await storage.getPaymentPlan(Number(id));

      if (!plan) {
        return res.status(404).json({ message: "Plano de pagamento não encontrado" });
      }

      // Validate data
      const planData = req.body;
      const updatedPlan = await storage.updatePaymentPlan(plan.id, planData);

      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} atualizou o plano de pagamento: ${plan.name}`,
        entityType: 'payment-plan',
        entityId: plan.id
      });

      res.json({ plan: updatedPlan });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados de plano inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/payment-plans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await storage.getPaymentPlan(Number(id));

      if (!plan) {
        return res.status(404).json({ message: "Plano de pagamento não encontrado" });
      }

      // Check if any students are using this plan before deleting
      const payments = await storage.getStudentPaymentsByPlan(Number(id));
      if (payments && payments.length > 0) {
        return res.status(400).json({ 
          message: "Não é possível excluir um plano que está sendo utilizado por estudantes",
          studentsCount: payments.length
        });
      }

      const success = await storage.deletePaymentPlan(Number(id));

      if (!success) {
        return res.status(500).json({ message: "Falha ao excluir o plano de pagamento" });
      }

      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} excluiu o plano de pagamento: ${plan.name}`,
        entityType: 'payment-plan',
        entityId: Number(id)
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
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
      const overduePayments = await storage.getOverduePayments();

      // Separate scholars from delinquents
      const scholars = [];
      const delinquents = [];

      for (const payment of overduePayments) {
        if (payment.student?.isScholarship) {
          scholars.push(payment);
        } else {
          delinquents.push(payment);
        }
      }

      res.json({ 
        overdue: delinquents,
        scholars: scholars,
        total: overduePayments.length 
      });
    } catch (error) {
      console.error("Erro ao buscar inadimplentes:", error);
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

      const paymentData = { ...req.body };

      // Convert date strings to Date objects
      if (paymentData.dueDate && typeof paymentData.dueDate === 'string') {
        paymentData.dueDate = new Date(paymentData.dueDate);
      }
      if (paymentData.paidDate && typeof paymentData.paidDate === 'string') {
        paymentData.paidDate = new Date(paymentData.paidDate);
      }
      if (paymentData.overdueAt && typeof paymentData.overdueAt === 'string') {
        paymentData.overdueAt = new Date(paymentData.overdueAt);
      }

      const updatedPayment = await storage.updateStudentPayment(payment.id, paymentData);

      // Log activity with better error handling
      const requestUser = (req as any).user;
      try {
        const student = await storage.getStudent(payment.studentId);
        const user = student ? await storage.getUser(student.userId) : null;

        await storage.createActivityLog({
          userId: requestUser.id,
          activity: `${requestUser.firstName} ${requestUser.lastName} updated payment for ${user?.firstName || 'Unknown'} ${user?.lastName || 'User'}`,
          entityType: 'student-payment',
          entityId: payment.id
        });
      } catch (logError) {
        console.error("Error creating activity log:", logError);
        // Continue with the response even if logging fails
      }

      res.json({ payment: updatedPayment });
    } catch (error) {
      console.error("Error updating student payment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Route to mark payment as overdue and block access
  app.post("/api/student-payments/:id/mark-overdue", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getStudentPayment(Number(id));

      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      // Do not apply to scholarship students
      const student = await storage.getStudent(payment.studentId);
      if (student?.isScholarship) {
        return res.status(400).json({ 
          message: "Bolsistas não podem ser marcados como inadimplentes" 
        });
      }

      // Mark as overdue and deactivate the user
      await storage.updateStudentPayment(Number(id), {
        status: 'overdue',
        overdueAt: new Date()
      });

      // Deactivate the student user
      if (student) {
        await storage.updateUser(student.userId, { active: false });
      }

      // Log the activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `Marcou pagamento ID: ${id} como inadimplente e bloqueou acesso do estudante`,
        entityType: 'student-payment',
        entityId: Number(id),
        timestamp: new Date()
      });

      res.json({ message: "Estudante marcado como inadimplente e bloqueado" });
    } catch (error) {
      console.error("Erro ao marcar como inadimplente:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Route to reactivate student after payment
  app.post("/api/student-payments/:id/reactivate", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getStudentPayment(Number(id));

      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      // Mark as paid and reactivate the user
      await storage.updateStudentPayment(Number(id), {
        status: 'paid',
        paidDate: new Date(),
        overdueAt: null
      });

      // Reactivate the student user
      const student = await storage.getStudent(payment.studentId);
      if (student) {
        await storage.updateUser(student.userId, { active: true });
      }

      // Log the activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `Reativou estudante após pagamento ID: ${id}`,
        entityType: 'student-payment',
        entityId: Number(id),
        timestamp: new Date()
      });

      res.json({ message: "Estudante reativado com sucesso" });
    } catch (error) {
      console.error("Erro ao reativar estudante:", error);
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

  // Route for birthday dashboard
  app.get("/api/birthdays", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const { month } = req.query;

      const students = await storage.getStudentsWithUsers();
      const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

      // Filter students who have birthdays in the specified month
      const birthdayStudents = students.filter(student => {
        if (!student.user?.birthDate) return false;

        const birthDate = new Date(student.user.birthDate);
        return birthDate.getMonth() + 1 === currentMonth;
      }).map(student => ({
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        birthDate: student.user.birthDate,
        age: student.user.birthDate ? 
          new Date().getFullYear() - new Date(student.user.birthDate).getFullYear() : null,
        belt: student.belt || 'white',
        stripes: student.stripes || 0
      })).sort((a, b) => {
        const dateA = new Date(a.birthDate!).getDate();
        const dateB = new Date(b.birthDate!).getDate();
        return dateA - dateB;
      });

      res.json({ 
        birthdays: birthdayStudents,
        month: currentMonth,
        total: birthdayStudents.length
      });
    } catch (error) {
      console.error("Erro ao buscar aniversários:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== School Events Routes =====
  app.get("/api/school-events", isAuthenticated, async (req, res) => {
    try {
      const { activeOnly } = req.query;
      const events = await storage.getSchoolEvents(activeOnly === "true");
      res.json({ events });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/school-events/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getSchoolEvent(Number(id));

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json({ event });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/school-events", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const eventData = insertSchoolEventSchema.parse(req.body);
      const requestUser = (req as any).user;

      const event = await storage.createSchoolEvent({
        ...eventData,
        createdBy: requestUser.id
      });

      // Log activity
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} created a new school event: ${event.title}`,
        entityType: 'school-event',
        entityId: event.id
      });

      res.status(201).json({ event });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/school-events/:id", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getSchoolEvent(Number(id));

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const eventData = req.body;

      const updatedEvent = await storage.updateSchoolEvent(event.id, eventData);

      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} updated school event: ${event.title}`,
        entityType: 'school-event',
        entityId: event.id
      });

      res.json({ event: updatedEvent });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/school-events/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getSchoolEvent(Number(id));

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      await storage.deleteSchoolEvent(Number(id));

      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} deleted school event: ${event.title}`,
        entityType: 'school-event',
        entityId: event.id
      });

      res.json({ success: true });
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

  // ===== School Configuration Routes =====
  app.get("/api/school-config", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const config = await storage.getSchoolConfig();
      res.json({ config: config || {
        schoolName: "Academia de Jiu-Jitsu",
        congratsMessage: "🏆 Parabéns!\nVocê acaba de conquistar a sua {beltName}!\n\nQue Deus continue fortalecendo sua fé e determinação nessa jornada.\n\n\"Tudo posso naquele que me fortalece.\"\n(Filipenses 4:13)\n\nOSS!",
        logoUrl: null,
        address: null,
        phone: null,
        email: null,
        website: null
      }});
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Public School Info Route =====
  app.get("/api/school/public-info", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const config = await storage.getSchoolConfig();

      // Return only public information
      const publicInfo = {
        schoolName: config?.schoolName || "Academia de Jiu-Jitsu",
        address: config?.address || null,
        phone: config?.phone || null,
        email: config?.email || null,
        website: config?.website || null,
        logoUrl: config?.logoUrl || null
      };

      res.json(publicInfo);
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Public endpoint for belt levels (needed for onboarding)
  app.get("/api/public/belts", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');

      // Get all active belt levels
      const belts = await db
        .select({
          id: beltLevels.id,
          name: beltLevels.name,
          levelKey: beltLevels.levelKey,
          colorCode: beltLevels.colorCode,
          category: beltLevels.category,
          order: beltLevels.order,
          active: beltLevels.active
        })
        .from(beltLevels)
        .where(eq(beltLevels.active, true))
        .orderBy(beltLevels.order);

      res.json({ belts });
    } catch (error) {
      console.error('❌ Error fetching public belt levels:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to fetch belt levels" });
    }
  });

  // ===== Password Reset Routes =====

  // Forgot Password - Send reset email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          message: "E-mail é obrigatório" 
        });
      }

      // Always return success message to avoid email enumeration
      const successMessage = "Se o e-mail informado estiver cadastrado, enviaremos instruções para redefinir sua senha.";

      // Check if user exists
      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Don't reveal that email doesn't exist
        console.log(`⚠️ Password reset requested for non-existent email: ${email}`);
        return res.json({ message: successMessage });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store token in database
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Send reset email
      try {
        await emailService.sendPasswordResetEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          resetToken
        );

        console.log(`✅ Password reset email sent to: ${email}`);

        // Log activity
        await storage.createActivityLog({
          userId: user.id,
          activity: `Password reset requested for ${user.email}`,
          entityType: 'user',
          entityId: user.id,
          timestamp: new Date()
        });

      } catch (emailError) {
        console.error('❌ Failed to send reset email:', emailError);
        // Don't reveal email sending failure to user
      }

      res.json({ message: successMessage });

    } catch (error) {
      console.error('❌ Error in forgot-password route:', error);
      res.status(500).json({ 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Reset Password - Validate token and update password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          message: "Token, nova senha e confirmação são obrigatórios" 
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          message: "Nova senha e confirmação não coincidem" 
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ 
          message: "A nova senha deve ter pelo menos 8 caracteres" 
        });
      }

      // Find and validate token
      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.status(400).json({ 
          message: "Token inválido, expirado ou já utilizado" 
        });
      }

      // Get user
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(400).json({ 
          message: "Usuário não encontrado" 
        });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUser(user.id, { password: hashedPassword });

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(resetToken.id);

      // Log activity
      await storage.createActivityLog({
        userId: user.id,
        activity: `Password successfully reset for ${user.email}`,
        entityType: 'user',
        entityId: user.id,
        timestamp: new Date()
      });

      console.log(`✅ Password reset completed for user: ${user.email}`);

      res.json({ 
        message: "Senha atualizada com sucesso! Você já pode fazer login com sua nova senha." 
      });

    } catch (error) {
      console.error('❌ Error in reset-password route:', error);
      res.status(500).json({ 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Validate Reset Token (check if token is valid before showing reset form)
  app.get("/api/auth/validate-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ 
          valid: false, 
          message: "Token é obrigatório" 
        });
      }

      // Check if token is valid
      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.json({ 
          valid: false, 
          message: "Token inválido, expirado ou já utilizado" 
        });
      }

      // Get user info (without sensitive data)
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.json({ 
          valid: false, 
          message: "Usuário não encontrado" 
        });
      }

      res.json({ 
        valid: true,
        userEmail: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email for security
        userName: user.firstName
      });

    } catch (error) {
      console.error('❌ Error validating reset token:', error);
      res.status(500).json({ 
        valid: false,
        message: "Erro interno do servidor" 
      });
    }
  });

  app.patch("/api/school-config", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Ensure proper JSON response headers
      res.setHeader('Content-Type', 'application/json');

      // Clean and validate the data manually to avoid schema issues
      const cleanData: any = {};

      // School basic info
      if (req.body.schoolName !== undefined) cleanData.schoolName = String(req.body.schoolName || "");
      if (req.body.logoUrl !== undefined) {
        // Handle base64 images and URLs properly
        const logoValue = req.body.logoUrl;
        if (logoValue && (logoValue.startsWith('data:image/') || logoValue.startsWith('http') || logoValue.startsWith('/assets'))) {
          cleanData.logoUrl = String(logoValue);
        } else {
          cleanData.logoUrl = null;
        }
      }
      if (req.body.address !== undefined) cleanData.address = req.body.address ? String(req.body.address) : null;
      if (req.body.phone !== undefined) cleanData.phone = req.body.phone ? String(req.body.phone) : null;
      if (req.body.email !== undefined) cleanData.email = req.body.email ? String(req.body.email) : null;
      if (req.body.website !== undefined) cleanData.website = req.body.website ? String(req.body.website) : null;
      if (req.body.instagram !== undefined) cleanData.instagram = req.body.instagram ? String(req.body.instagram) : null;
      if (req.body.facebook !== undefined) cleanData.facebook = req.body.facebook ? String(req.body.facebook) : null;
      if (req.body.whatsapp !== undefined) cleanData.whatsapp = req.body.whatsapp ? String(req.body.whatsapp) : null;
      if (req.body.youtube !== undefined) cleanData.youtube = req.body.youtube ? String(req.body.youtube) : null;
      if (req.body.tiktok !== undefined) cleanData.tiktok = req.body.tiktok ? String(req.body.tiktok) : null;
      if (req.body.logoLightUrl !== undefined) cleanData.logoLightUrl = req.body.logoLightUrl ? String(req.body.logoLightUrl) : null;
      if (req.body.logoDarkUrl !== undefined) cleanData.logoDarkUrl = req.body.logoDarkUrl ? String(req.body.logoDarkUrl) : null;
      if (req.body.welcomeMessage !== undefined) cleanData.welcomeMessage = req.body.welcomeMessage ? String(req.body.welcomeMessage) : null;
      if (req.body.congratsMessage !== undefined) cleanData.congratsMessage = req.body.congratsMessage ? String(req.body.congratsMessage) : null;

      // ASAAS configuration
      if (req.body.asaasApiKey !== undefined) cleanData.asaasApiKey = req.body.asaasApiKey ? String(req.body.asaasApiKey) : null;
      if (req.body.asaasCustomerId !== undefined) cleanData.asaasCustomerId = req.body.asaasCustomerId ? String(req.body.asaasCustomerId) : null;
      if (req.body.planValue !== undefined) cleanData.planValue = Number(req.body.planValue) || 19990;
      if (req.body.planType !== undefined) cleanData.planType = String(req.body.planType || "monthly");
      if (req.body.active !== undefined) cleanData.active = Boolean(req.body.active);
      if (req.body.trialEndDate !== undefined) cleanData.trialEndDate = req.body.trialEndDate ? new Date(req.body.trialEndDate) : null;

      // Basic validation - only if schoolName is being updated
      if (cleanData.schoolName !== undefined && (!cleanData.schoolName || cleanData.schoolName.trim() === "")) {
        return res.status(400).json({ message: "Nome da escola é obrigatório" });
      }

      const updatedConfig = await storage.updateSchoolConfig(cleanData);

      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} atualizou as configurações da escola`,
        entityType: 'school-config',
        entityId: updatedConfig.id
      });

      res.json({ 
        success: true,
        message: "Configurações atualizadas com sucesso",
        config: updatedConfig 
      });
    } catch (error) {
      console.error("Error updating school config:", error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        success: false,
        message: "Erro ao salvar configurações",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // ===== Dashboard Customization Routes =====
  app.get("/api/dashboard-customization", isAuthenticated, async (req, res) => {
    try {
      const requestUser = (req as any).user;
      const customization = await storage.getDashboardCustomization(requestUser.id);

      if (!customization) {
        // Return default customization if none exists
        return res.json({
          layout: 'default',
          theme: 'light',
          widgetOrder: ['stats', 'notifications', 'attendance', 'events'],
          hiddenWidgets: [],
          showWelcomeMessage: true,
          compactMode: false,
          showQuickActions: true,
          backgroundColor: '#ffffff',
          accentColor: '#3b82f6',
        });
      }

      res.json(customization);
    } catch (error) {
      console.error("Error fetching dashboard customization:", error);
      res.status(500).json({ message: "Erro ao buscar personalização do dashboard" });
    }
  });

  app.post("/api/dashboard-customization", isAuthenticated, async (req, res) => {
    try {
      const requestUser = (req as any).user;
      const customizationData = insertDashboardCustomizationSchema.parse({
        ...req.body,
        userId: requestUser.id
      });

      const customization = await storage.createDashboardCustomization(customizationData);

      // Log activity
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} criou personalização do dashboard`,
        entityType: 'dashboard-customization',
        entityId: customization.id
      });

      res.status(201).json(customization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados de personalização inválidos", errors: error.errors });
      }
      console.error("Error creating dashboard customization:", error);
      res.status(500).json({ message: "Erro ao criar personalização do dashboard" });
    }
  });

  app.patch("/api/dashboard-customization", isAuthenticated, async (req, res) => {
    try {
      const requestUser = (req as any).user;
      const existingCustomization = await storage.getDashboardCustomization(requestUser.id);

      if (!existingCustomization) {
        return res.status(404).json({ message: "Personalização não encontrada" });
      }

      const updateData = {
        ...req.body,
        userId: requestUser.id
      };

      const updatedCustomization = await storage.updateDashboardCustomization(requestUser.id, updateData);

      // Log activity
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} atualizou personalização do dashboard`,
        entityType: 'dashboard-customization',
        entityId: updatedCustomization.id
      });

      res.json(updatedCustomization);
    } catch (error) {
      console.error("Error updating dashboard customization:", error);
      res.status(500).json({ message: "Erro ao atualizar personalização do dashboard" });
    }
  });

  // ===== Risk Management Routes =====
  app.get("/api/students/at-risk", isAuthenticated, async (req, res) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 60;
      const studentsAtRisk: any[] = [];

      // Get all students with their attendance data
      const students = await storage.getStudents();

      if (!students || students.length === 0) {
        return res.json({ students: [] });
      }

      for (const student of students) {
        try {
          // Get user data for this student
          const studentUser = await storage.getUser(student.userId);
          if (!studentUser) {
            console.warn(`Student ${student.id} has no user data, skipping`);
            continue;
          }

          // Calculate attendance rate for this student
          const studentAttendances = await storage.getAttendanceByStudent(student.id);
          const totalClasses = await storage.getClasses();

          const attendanceRate = totalClasses.length > 0 ? 
            Math.round((studentAttendances.length / totalClasses.length) * 100) : 0;

          // Calculate days since last attendance
          const lastAttendance = studentAttendances.length > 0 ?
            studentAttendances.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;

          const daysSinceLastAttendance = lastAttendance ? 
            Math.floor((Date.now() - new Date(lastAttendance.date).getTime()) / (1000 * 60 * 60 * 24)) : 999;

          // Determine risk level
          let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
          if (attendanceRate < 30 || daysSinceLastAttendance > 21) {
            riskLevel = 'critical';
          } else if (attendanceRate < 50 || daysSinceLastAttendance > 14) {
            riskLevel = 'high';
          } else if (attendanceRate < threshold || daysSinceLastAttendance > 7) {
            riskLevel = 'medium';
          }

          // Only include students at risk
          if (attendanceRate < threshold || daysSinceLastAttendance > 7) {
            studentsAtRisk.push({
              id: student.id,
              user: {
                id: studentUser.id,
                firstName: studentUser.firstName || 'Unknown',
                lastName: studentUser.lastName || '',
                email: studentUser.email || '',
                phone: studentUser.phone || '',
                emergencyContact: studentUser.emergencyContact || ''
              },
              beltLevel: student.beltLevel,
              stripes: student.stripes,
              notes: student.notes || '',
              attendanceRate,
              lastAttendance: lastAttendance ? lastAttendance.date : null,
              daysSinceLastAttendance,
              riskLevel,
              totalClasses: totalClasses.length,
              attendedClasses: studentAttendances.length
            });
          }
        } catch (studentError) {
          console.error(`Error processing student ${student.id}:`, studentError);
          // Continue processing other students
        }
      }

      // Sort by risk level and attendance rate
      studentsAtRisk.sort((a, b) => {
        const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        }
        return a.attendanceRate - b.attendanceRate;
      });

      res.json({ students: studentsAtRisk });
    } catch (error) {
      console.error("Erro ao buscar alunos em risco:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update student notes/observations
  app.put("/api/students/:id/notes", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      if (!notes || typeof notes !== 'string') {
        return res.status(400).json({ message: "Observação é obrigatória" });
      }

      const updated = await storage.updateStudent(Number(id), { notes });

      if (!updated) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }

      // Log the action
      const user = (req as any).user;
      if (user) {
        await storage.createActivityLog({
          userId: user.id,
          activity: `${user.firstName} ${user.lastName} adicionou observação para aluno em risco`,
          entityType: 'student',
          entityId: Number(id),
          timestamp: new Date()
        });
      }

      res.json({ student: updated });
    } catch (error) {
      console.error("Erro ao atualizar observações do aluno:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/students/risk-actions", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const actionData = {
        studentId: req.body.studentId,
        actionType: req.body.actionType,
        notes: req.body.notes || null,
        scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : null,
        createdBy: user.id
      };

      // Log the action
      await storage.createActivityLog({
        userId: user.id,
        activity: `${user.firstName} ${user.lastName} registrou ação de retenção: ${actionData.actionType}`,
        entityType: 'risk_action',
        entityId: actionData.studentId,
        timestamp: new Date()
      });

      res.status(201).json({ action: actionData });
    } catch (error) {
      console.error("Erro ao criar ação de risco:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/risk-settings", isAuthenticated, async (req, res) => {
    try {
      const settings = { 
        frequencyThreshold: 60, 
        daysThreshold: 7, 
        autoAlerts: true 
      };
      res.json({ settings });
    } catch (error) {
      console.error("Erro ao buscar configurações de risco:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== ASAAS Integration Routes =====

  // Webhook to receive notifications from ASAAS
  app.post("/webhooks/asaas", async (req, res) => {
    try {
      console.log('🔔 ASAAS Webhook received:', req.body);

      const event = req.body;

      // Validate if it's a valid event
      if (!event || !event.event || !event.payment) {
        return res.status(400).json({ message: "Invalid webhook payload" });
      }

      const { payment } = event;

      // Find the payment by ASAAS ID
      const schoolPayment = await storage.getSchoolPaymentByAsaasId(payment.id);
      if (!schoolPayment) {
        console.log(`⚠️ Payment not found for ASAAS ID: ${payment.id}`);
        return res.status(404).json({ message: "Payment not found" });
      }

      // Process different event types
      let newStatus = 'pending';
      let paidAt: Date | null = null;

      switch (event.event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          newStatus = 'paid';
          paidAt = new Date(payment.paymentDate || payment.clientPaymentDate);
          break;
        case 'PAYMENT_OVERDUE':
          newStatus = 'overdue';
          break;
        case 'PAYMENT_DELETED':
        case 'PAYMENT_CANCELLED':
          newStatus = 'cancelled';
          break;
        default:
          console.log(`🤷 Unknown event type: ${event.event}`);
          break;
      }

      // Update payment status
      const updatedPayment = await storage.updateSchoolPayment(schoolPayment.id, {
        status: newStatus as any,
        paidAt
      });

      // If paid, reactivate the school
      if (newStatus === 'paid') {
        await storage.updateSchoolConfig({
          active: true
        });
        console.log('✅ School reactivated after payment');
      }

      // If overdue for more than 10 days, block the school
      if (newStatus === 'overdue') {
        const dueDate = new Date(schoolPayment.dueDate);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 10) {
          await storage.updateSchoolConfig({
            active: false
          });
          console.log('🚫 School blocked due to overdue payment > 10 days');
        }
      }

      console.log(`✅ Payment ${payment.id} updated to status: ${newStatus}`);
      res.json({ success: true, payment: updatedPayment });

    } catch (error) {
      console.error('❌ Error processing ASAAS webhook:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get school payments
  app.get("/api/school-payments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const config = await storage.getSchoolConfig();
      if (!config) {
        return res.status(404).json({ message: "School config not found" });
      }

      const payments = await storage.getSchoolPaymentsByTenant(config.id);
      res.json({ payments });
    } catch (error) {
      console.error("Error fetching school payments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create manual payment
  app.post("/api/school-payments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const config = await storage.getSchoolConfig();
      if (!config) {
        return res.status(404).json({ message: "School config not found" });
      }

      const paymentData = insertSchoolPaymentSchema.parse({
        ...req.body,
        tenantId: config.id
      });

      const payment = await storage.createSchoolPayment(paymentData);

      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `Criou pagamento manual da escola - Valor: R$ ${(payment.value / 100).toFixed(2)}`,
        entityType: 'school-payment',
        entityId: payment.id
      });

      res.status(201).json({ payment });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      console.error("Error creating school payment:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== Login Streak Tracking Routes =====

  // Get user's streak statistics
  app.get("/api/streak/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getLoginStreakStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching streak stats:', error);
      res.status(500).json({ error: 'Failed to fetch streak statistics' });
    }
  });

  // Get user achievements
  app.get("/api/streak/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const achievements = await storage.getStreakAchievements(userId);
      res.json({ achievements });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ error: 'Failed to fetch achievements' });
    }
  });

  // Get unread achievements  
  app.get("/api/streak/achievements/unread", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const unreadAchievements = await storage.getUnreadAchievements(userId);
      res.json({ achievements: unreadAchievements });
    } catch (error) {
      console.error('Error fetching unread achievements:', error);
      res.status(500).json({ error: 'Failed to fetch unread achievements' });
    }
  });

  // Mark achievement as read
  app.post("/api/streak/achievements/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const achievementId = parseInt(req.params.id);
      const success = await storage.markAchievementAsRead(achievementId);

      if (success) {
        res.json({ message: 'Achievement marked as read' });
      } else {
        res.status(404).json({ error: 'Achievement not found' });
      }
    } catch (error) {
      console.error('Error marking achievement as read:', error);
      res.status(500).json({ error: 'Failed to mark achievement as read' });
    }
  });

  // Get daily login records
  app.get("/api/streak/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days as string) || 30;
      const records = await storage.getDailyLoginRecords(userId, days);
      res.json({ records });
    } catch (error) {
      console.error('Error fetching login history:', error);
      res.status(500).json({ error: 'Failed to fetch login history' });
    }
  });

  // =====Student Financial Panel Routes=====
  // Endpoint to fetch logged-in student's financial data
  app.get("/api/student/financial", isAuthenticated, async (req, res) => {
    try {
      const requestUser = (req as any).user;

      // Only students can access this endpoint
      if (requestUser.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Fetch student data
      const student = await storage.getStudentByUserId(requestUser.id);
      if (!student) {
        return res.status(404).json({ error: "Student profile not found" });
      }

      // Check if the user is the financial responsible
      const isFinancialResponsible = student.financialResponsibleCpf === requestUser.cpf;

      if (!isFinancialResponsible) {
        return res.json({
          isFinancialResponsible: false,
          message: "Você não é o responsável financeiro"
        });
      }

      // If financial responsible, fetch payment data
      let asaasData = null;
      let localPayments = [];

      try {
        // Fetch ASAAS configuration
        const config = await storage.getSchoolConfig();
        if (config?.asaasApiKey && student.asaasCustomerId) {
          const asaasService = new AsaasService(config.asaasApiKey, true);

          // Fetch invoices from ASAAS for the customer
          const invoices = await asaasService.getCustomerInvoices(student.asaasCustomerId);
          asaasData = {
            invoices,
            customerId: student.asaasCustomerId
          };
        }

        // Fetch local payments as a fallback
        const studentPayments = await storage.getStudentPaymentsByStudent(student.id);
        localPayments = studentPayments;

      } catch (error) {
        console.error('Error fetching financial data:', error);
        // Continue even with ASAAS error, use local data
      }

      res.json({
        isFinancialResponsible: true,
        student: {
          id: student.id,
          name: `${requestUser.firstName} ${requestUser.lastName}`,
          financialResponsibleCpf: student.financialResponsibleCpf
        },
        asaasData,
        localPayments
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Endpoint to check if student is financial responsible and fetch data (by ID)
  app.get("/api/student/financial/:studentId", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const userId = req.user?.id;

      // Fetch student data to validate access
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Estudante não encontrado" });
      }

      // Check if logged-in user has permission to view financial data
      if (req.user?.role === 'student' && student.userId !== req.user.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Check if student has CPF as financial responsible
      const isFinancialResponsible = student.financialResponsibleCpf && 
        student.financialResponsibleRelation === 'self';

      if (!isFinancialResponsible) {
        return res.json({ 
          isFinancialResponsible: false,
          message: "Este aluno não é responsável financeiro"
        });
      }

      // Fetch ASAAS financial data if available
      let asaasData = null;
      if (student.asaasCustomerId) {
        try {
          // Simulate ASAAS data for demonstration
          asaasData = {
            invoices: [],
            customerId: student.asaasCustomerId
          };
        } catch (error) {
          console.warn("Error fetching ASAAS data:", error);
        }
      }

      // Fetch student's local payments
      const studentPayments = await storage.getStudentPaymentsByStudent(studentId);

      res.json({
        isFinancialResponsible: true,
        student: {
          id: student.id,
          name: `${student.userId}`, // Name will be fetched from user data
          financialResponsibleCpf: student.financialResponsibleCpf,
        },
        asaasData,
        localPayments: studentPayments
      });

    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // =====Student Attendance History Routes=====
  // Endpoint to fetch logged-in student's attendance history
  app.get("/api/student/attendance-history", isAuthenticated, async (req, res) => {
    try {
      const requestUser = (req as any).user;
      const { month, year } = req.query;

      // Only students can access this endpoint
      if (requestUser.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const student = await storage.getStudentByUserId(requestUser.id);
      if (!student) {
        return res.status(404).json({ error: "Student profile not found" });
      }

      // Fetch all attendance records for the student
      const attendances = await storage.getAttendanceByStudent(student.id);

      // Filter by month/year if provided
      let filteredAttendances = attendances;
      if (month && year) {
        const targetMonth = parseInt(month as string);
        const targetYear = parseInt(year as string);

        filteredAttendances = attendances.filter(att => {
          const attDate = new Date(att.date);
          return attDate.getMonth() + 1 === targetMonth && attDate.getFullYear() === targetYear;
        });
      }

      // Fetch class details for each attendance
      const attendanceWithDetails = await Promise.all(
        filteredAttendances.map(async (attendance) => {
          const classData = await storage.getClass(attendance.classId);
          return {
            id: attendance.id,
            date: attendance.date,
            status: attendance.status,
            class: classData ? {
              id: classData.id,
              name: classData.name,
              startTime: classData.startTime,
              instructorId: classData.instructorId
            } : null
          };
        })
      );

      // Calculate period statistics
      const totalClasses = attendanceWithDetails.length;
      const presentCount = attendanceWithDetails.filter(att => att.status === 'present').length;
      const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

      res.json({
        attendances: attendanceWithDetails,
        statistics: {
          totalClasses,
          presentCount,
          absentCount: totalClasses - presentCount,
          attendanceRate
        }
      });

    } catch (error) {
      console.error('Error fetching attendance history:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Endpoint to fetch student attendance history (by ID for admins)
  app.get("/api/student/attendance-history/:studentId", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const userId = req.user?.id;
      const { month, year } = req.query;

      // Fetch student data to validate access
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Estudante não encontrado" });
      }

      // Check permissions - students can only view their own data
      if (req.user?.role === 'student' && student.userId !== req.user.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Fetch all attendance records for the student
      const attendances = await storage.getAttendanceByStudent(studentId);

      // Filter by month/year if provided
      let filteredAttendances = attendances;
      if (month && year) {
        const targetMonth = parseInt(month as string);
        const targetYear = parseInt(year as string);

        filteredAttendances = attendances.filter(att => {
          const attDate = new Date(att.date);
          return attDate.getMonth() + 1 === targetMonth && attDate.getFullYear() === targetYear;
        });
      }

      // Fetch class details for each attendance
      const attendanceWithDetails = await Promise.all(
        filteredAttendances.map(async (attendance) => {
          const classData = await storage.getClass(attendance.classId);
          return {
            id: attendance.id,
            date: attendance.date,
            status: attendance.status,
            class: classData ? {
              id: classData.id,
              name: classData.name,
              startTime: classData.startTime,
              instructorId: classData.instructorId
            } : null
          };
        })
      );

      // Calculate period statistics
      const totalClasses = attendanceWithDetails.length;
      const presentCount = attendanceWithDetails.filter(att => att.status === 'present').length;
      const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

      res.json({
        attendances: attendanceWithDetails,
        stats: {
          totalClasses,
          presentCount,
          absentCount: totalClasses - presentCount,
          attendanceRate
        },
        period: month && year ? { month: parseInt(month as string), year: parseInt(year as string) } : null
      });

    } catch (error) {
      console.error('Erro ao buscar histórico de presenças:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // =====Get Students Who Confirmed Attendance for Class=====
  app.get("/api/classes/:classId/confirmed-students", isAuthenticated, async (req, res) => {
    try {
      const { classId } = req.params;
      const classIdNumber = parseInt(classId);

      if (isNaN(classIdNumber)) {
        return res.status(400).json({ error: 'Invalid class ID' });
      }

      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Get all attendance records with details
      const attendances = await storage.getAttendanceWithDetails();
      const todayConfirmedAttendances = attendances.filter(att => {
        const attDate = new Date(att.attendance.date);
        return att.attendance.classId === classIdNumber && 
               attDate >= startOfDay && 
               attDate < endOfDay &&
               att.attendance.status === 'present';
      });

      // Get student details for each confirmed attendance
      const confirmedStudents = await Promise.all(
        todayConfirmedAttendances.map(async (attRecord) => {
          if (attRecord.student && attRecord.user) {
            return {
              id: attRecord.student.id,
              userId: attRecord.user.id,
              name: `${attRecord.user.firstName} ${attRecord.user.lastName}`,
              initials: `${attRecord.user.firstName.charAt(0)}${attRecord.user.lastName.charAt(0)}`.toUpperCase(),
              beltLevel: attRecord.student.beltLevel,
              phone: attRecord.user.phone,
              email: attRecord.user.email,
              confirmationTime: attRecord.attendance.date,
              attendanceId: attRecord.attendance.id,
              alreadyMarked: false // Will be updated if already marked present by instructor
            };
          }
          return null;
        })
      );

      // Filter out null values and get instructor-marked attendance to check status
      const validStudents = confirmedStudents.filter(s => s !== null);

      // Check if instructor has already marked attendance for any of these students
      const instructorAttendances = attendances.filter(att => {
        const attDate = new Date(att.attendance.date);
        return att.attendance.classId === classIdNumber && 
               attDate >= startOfDay && 
               attDate < endOfDay &&
               att.attendance.checkedInBy !== att.attendance.studentId; // Marked by instructor, not self-confirmed
      });

      // Update student status based on instructor attendance
      validStudents.forEach(student => {
        const instructorMarked = instructorAttendances.find(att => att.attendance.studentId === student.id);
        if (instructorMarked) {
          student.alreadyMarked = true;
          student.instructorStatus = instructorMarked.attendance.status;
        }
      });

      console.log(`Found ${validStudents.length} students who confirmed attendance for class ${classIdNumber}`);

      res.json({
        classId: classIdNumber,
        confirmedStudents: validStudents,
        totalConfirmed: validStudents.length
      });

    } catch (error) {
      console.error('Error fetching confirmed students:', error);
      res.status(500).json({ error: 'Failed to fetch confirmed students' });
    }
  });

  // ===== ASAAS Integration Routes =====

  // Approve student and create ASAAS charge
  app.post("/api/admin/student/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      if (isNaN(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }

      // Use static AsaasService import
      const asaasService = new AsaasService();

      // Get student and user data
      const student = await storage.getStudentByUserId(studentId);
      const user = await storage.getUser(studentId);

      if (!student || !user) {
        return res.status(404).json({ error: 'Student not found' });
      }

      if (user.status === 'active') {
        return res.status(400).json({ error: 'Student already approved' });
      }

      // Check if financial responsible has necessary data
      if (!student.financialResponsibleCpf || !student.financialResponsibleName) {
        return res.status(400).json({ 
          error: 'Incomplete financial responsible data. CPF and name are mandatory.' 
        });
      }

      // Check if ASAAS is configured
      const isAsaasConfigured = await asaasService.isConfigured();
      if (!isAsaasConfigured) {
        return res.status(400).json({ 
          error: 'ASAAS integration not configured. Please configure the API Key in school settings.' 
        });
      }

      // Customer data for ASAAS
      const customerData = {
        name: student.financialResponsibleName,
        cpfCnpj: student.financialResponsibleCpf.replace(/\D/g, ''), // Remove formatting
        email: student.financialResponsibleEmail || user.email,
        mobilePhone: student.financialResponsiblePhone || user.phone,
        // Address if available
        postalCode: user.zipCode?.replace(/\D/g, ''),
        addressNumber: user.number,
        addressComplement: user.complement
      };

      // Create or find customer in ASAAS
      const asaasCustomer = await asaasService.createOrGetCustomer(customerData);

      // Update student with asaasCustomerId
      await storage.updateStudent(student.id, {
        asaasCustomerId: asaasCustomer.id
      });

      // Get payment plan
      const paymentPlan = student.paymentPlanId ? 
        await storage.getPaymentPlan(student.paymentPlanId) : 
        await storage.getPaymentPlans().then(plans => plans[0]); // First available plan

      if (!paymentPlan) {
        return res.status(400).json({ error: 'No payment plan found' });
      }

      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(student.preferredDueDate || 5); // Preferred day or day 5
      if (dueDate < new Date()) {
        dueDate.setMonth(dueDate.getMonth() + 1); // Next month if already passed
      }

      // Create payment in ASAAS
      const paymentData = {
        customer: asaasCustomer.id,
        billingType: 'BOLETO' as const,
        value: paymentPlan.amount / 100, // Convert cents to reais
        dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
        description: `Mensalidade - ${user.firstName} ${user.lastName}`,
        externalReference: `student_${student.id}_${new Date().getTime()}`
      };

      const asaasPayment = await asaasService.createPayment(paymentData);

      // Create accounts receivable in the system
      const contaReceber = await storage.createContaReceber({
        studentId: student.id,
        asaasPaymentId: asaasPayment.id,
        asaasCustomerId: asaasCustomer.id,
        status: asaasPayment.status,
        billingType: paymentData.billingType,
        value: paymentPlan.amount, // In cents
        netValue: asaasPayment.netValue ? Math.round(asaasPayment.netValue * 100) : null,
        dueDate: dueDate,
        description: paymentData.description,
        externalReference: paymentData.externalReference,
        invoiceUrl: asaasPayment.invoiceUrl,
        bankSlipUrl: asaasPayment.bankSlipUrl,
        pixQrCode: asaasPayment.pixQrCode,
        pixCopyAndPaste: asaasPayment.pixCopyAndPaste
      });

      // Approve student
      await storage.updateUser(studentId, { status: 'active' });

      // Log activity
      const requestUser = (req as any).user;
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} approved student ${user.firstName} ${user.lastName} and created ASAAS charge`,
        entityType: 'student',
        entityId: student.id
      });

      res.json({
        success: true,
        message: 'Student approved and charge created successfully',
        student: { ...user, status: 'active' },
        payment: {
          id: contaReceber.id,
          asaasPaymentId: asaasPayment.id,
          value: paymentPlan.amount,
          dueDate: dueDate,
          bankSlipUrl: asaasPayment.bankSlipUrl,
          invoiceUrl: asaasPayment.invoiceUrl
        }
      });

    } catch (error) {
      console.error('Error approving student:', error);
      res.status(500).json({
        error: 'Error approving student and creating charge',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get student's accounts receivable
  app.get("/api/student/:id/payments", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const studentUserId = parseInt(id);
      const requestUser = (req as any).user;

      // Check if it's the student themselves or an admin/instructor
      if (requestUser.role === 'student' && requestUser.id !== studentUserId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const student = await storage.getStudentByUserId(studentUserId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const payments = await storage.getContasReceberByStudentId(student.id);
      res.json({ payments });

    } catch (error) {
      console.error('Error fetching student payments:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  });

  // ASAAS webhook to update payment statuses
  app.post("/api/webhook/asaas", async (req, res) => {
    try {
      const { event, payment } = req.body;

      if (!payment?.id) {
        return res.status(400).json({ error: 'Invalid webhook data' });
      }

      // Find accounts receivable by ASAAS ID
      const contaReceber = await storage.getContaReceberByAsaasId(payment.id);

      if (!contaReceber) {
        console.log('Payment not found in system:', payment.id);
        return res.status(200).json({ message: 'Payment not found, ignoring' });
      }

      // Update status based on the event
      const updateData: any = {
        status: payment.status,
        lastWebhookReceived: new Date(),
        webhookEvents: [...(contaReceber.webhookEvents || []), event]
      };

      if (event === 'PAYMENT_RECEIVED' && payment.receivedDate) {
        updateData.receivedDate = new Date(payment.receivedDate);
        updateData.confirmedDate = new Date();
      }

      if (event === 'PAYMENT_OVERDUE') {
        updateData.overdueDate = new Date();
      }

      await storage.updateContaReceber(contaReceber.id, updateData);

      console.log(`Webhook processed: ${event} for payment ${payment.id}`);
      res.status(200).json({ message: 'Webhook processed successfully' });

    } catch (error) {
      console.error('Error processing ASAAS webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });

  // ===== Student Payment Routes =====

  // Get student payments by user ID
  app.get("/api/student/:userId/payments", isAuthenticated, isSelfOrStaff, async (req, res) => {
    try {
      const { userId } = req.params;

      // Get student by user ID
      const student = await storage.getStudentByUserId(Number(userId));
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Get all receivables for this student
      const receivables = await storage.getContasReceberByStudentId(student.id);

      // Format payments for the frontend
      const payments = receivables.map(receivable => ({
        id: receivable.id,
        asaasPaymentId: receivable.asaasPaymentId,
        status: receivable.status,
        billingType: receivable.billingType || 'BOLETO',
        value: receivable.value,
        netValue: receivable.netValue,
        dueDate: receivable.dueDate,
        description: receivable.description,
        invoiceUrl: receivable.invoiceUrl,
        bankSlipUrl: receivable.bankSlipUrl,
        pixQrCode: receivable.pixQrCode,
        pixCopyAndPaste: receivable.pixCopyAndPaste,
        confirmedDate: receivable.confirmedDate,
        receivedDate: receivable.receivedDate,
        overdueDate: receivable.overdueDate,
        createdAt: receivable.createdAt
      }));

      res.json({ payments });
    } catch (error) {
      console.error("Error fetching student payments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Public student registration endpoint (for onboarding)
  app.post("/api/register-student", async (req, res) => {
    try {
      const studentData = req.body;
      console.log('📥 Received student data:', JSON.stringify(studentData, null, 2));

      // Validate required fields
      if (!studentData.firstName || !studentData.lastName || !studentData.email) {
        return res.status(400).json({ message: "Nome, sobrenome e email são obrigatórios" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(studentData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Generate username from email if not provided
      const username = studentData.username || studentData.email.split('@')[0].toLowerCase();

      // Create user without birthDate first to avoid timestamp issues
      const userData = {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        username: username,
        email: studentData.email,
        password: studentData.password || 'temporaryPassword123',
        role: "student" as const,
        active: false, // Pending approval
        phone: studentData.phone || null,
        cpf: studentData.cpf || null, // Add user's CPF
        rg: studentData.rg || null, // Add user's RG
        emergencyContact: studentData.emergencyContact || null,
        emergencyPhone: studentData.emergencyPhone || null, // Add emergency phone
        street: studentData.street || null,
        number: studentData.number || null,
        city: studentData.city || null,
        state: studentData.state || null,
        zipCode: studentData.zipCode || null,
        complement: studentData.complement || null,
        neighborhood: studentData.neighborhood || null,
        status: "pending" as const,
        currentStreak: 0,
        longestStreak: 0,
        totalLogins: 0
      };

      const user = await storage.createUser(userData);

      // Update the user's birth date using direct SQL to avoid Drizzle timestamp issues  
      if (studentData.birthDate) {
        await db.execute(sql`
          UPDATE users SET birth_date = ${new Date(studentData.birthDate)} WHERE id = ${user.id}
        `);
      }

      // Student specific data - remove null timestamp fields to avoid Drizzle errors
      const studentInfo = insertStudentSchema.parse({
        userId: user.id,
        beltLevel: studentData.beltLevel || "white",
        stripes: studentData.stripes || 0,
        // Remove lastPromotionDate to use database default (NULL)
        attendanceRate: studentData.attendanceRate || 0,
        notes: studentData.notes || null,
        avatarColor: studentData.avatarColor || null,
        avatarStyle: studentData.avatarStyle || null,
        avatarImage: studentData.avatarImage || null,
        // Financial responsibility data - handle "self" vs "other" logic
        financialResponsibleName: studentData.financialResponsibleRelationship === "self" 
          ? `${studentData.firstName} ${studentData.lastName}` 
          : (studentData.financialResponsibleName || `${studentData.firstName} ${studentData.lastName}`),
        financialResponsibleEmail: studentData.financialResponsibleRelationship === "self" 
          ? studentData.email 
          : (studentData.financialResponsibleEmail || studentData.email),
        financialResponsiblePhone: studentData.financialResponsibleRelationship === "self" 
          ? studentData.phone 
          : (studentData.financialResponsiblePhone || studentData.phone),
        financialResponsibleCpf: studentData.financialResponsibleRelationship === "self" 
          ? studentData.cpf 
          : (studentData.financialResponsibleCpf || null),
        financialResponsibleRelation: studentData.financialResponsibleRelationship || "self",
        asaasCustomerId: null,
        paymentPlanId: studentData.paymentPlanId ? parseInt(studentData.paymentPlanId) : null,
        preferredDueDate: studentData.dueDate ? parseInt(studentData.dueDate) : 5
      });

      // Create student record
      const student = await storage.createStudent(studentInfo);

      console.log('✅ Student registration completed:', user.firstName, user.lastName, '- Pending approval');

      res.json({ 
        success: true,
        message: "Cadastro realizado com sucesso! Sua solicitação está aguardando aprovação.",
        student: {
          id: student.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          status: "pending"
        }
      });
    } catch (error) {
      console.error("❌ Error in student registration:", error);
      console.error("❌ Full error details:", JSON.stringify(error, null, 2));
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Batch approval endpoint
  app.post('/api/users/batch-approve', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Lista de IDs de usuários é obrigatória" });
      }

      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[],
        userResults: [] as Array<{
          userId: number,
          userName: string,
          status: 'success' | 'error',
          message: string,
          asaasError?: string
        }>
      };

      // Process each user approval
      for (const userId of userIds) {
        try {
          // Get user and student data
          const user = await storage.getUser(userId);
          if (!user || user.active) {
            const errorMsg = `não encontrado ou já ativo`;
            results.errors.push(`Usuário ${userId}: ${errorMsg}`);
            results.userResults.push({
              userId,
              userName: user ? `${user.firstName} ${user.lastName}` : 'Usuário não encontrado',
              status: 'error',
              message: errorMsg
            });
            results.failed++;
            continue;
          }

          const student = await storage.getStudentByUserId(userId);
          if (!student || !student.paymentPlanId) {
            const errorMsg = `dados do aluno ou plano de pagamento não encontrados`;
            results.errors.push(`Usuário ${userId}: ${errorMsg}`);
            results.userResults.push({
              userId,
              userName: `${user.firstName} ${user.lastName}`,
              status: 'error',
              message: errorMsg
            });
            results.failed++;
            continue;
          }

          // Don't activate user immediately - wait for ASAAS confirmation
          let asaasError: string | null = null;
          let asaasSuccess = false;

          // Get payment plan
          const plan = await storage.getPaymentPlan(student.paymentPlanId);
          if (plan) {
            // Try ASAAS integration
            if (student.financialResponsibleName && student.financialResponsibleEmail) {
              try {
                const asaasService = new AsaasService();

                console.log(`🎯 ARKAIDEV: Processando aluno com verificação anti-duplicata: ${user.firstName} ${user.lastName}`);

                // Prepare student data for ASAAS with responsavel data
                const alunoData = {
                  ...student,
                  first_name: user.firstName,
                  last_name: user.lastName,
                  user_id: user.id,
                  street: user.street,
                  number: user.number,
                  complement: user.complement,
                  neighborhood: user.neighborhood,
                  zipCode: user.zipCode,
                  preferredDueDate: student.preferredDueDate || 5, // Include preferred due date
                  responsavel: {
                    nome: student.financialResponsibleName,
                    name: student.financialResponsibleName,
                    email: student.financialResponsibleEmail,
                    telefone: student.financialResponsiblePhone,
                    phone: student.financialResponsiblePhone,
                    cpf: student.financialResponsibleCpf,
                    endereco: user.street,
                    address: user.street,
                    numero: user.number,
                    addressNumber: user.number,
                    complemento: user.complement,
                    complement: user.complement,
                    cep: user.zipCode,
                    cidade: user.city || '',
                    city: user.city || ''
                  }
                };

                // 🎯 Use new ARKAIDEV function: Create or Sync cobrança (anti-duplicate)
                console.log(`🔍 Verificando/criando cliente e cobrança ASAAS (anti-duplicata)...`);
                const payment = await asaasService.createOrSyncCobranca(alunoData, plan);
                console.log(`✅ Processo concluído - Payment ID: ${payment.id}, Customer: ${payment.customer}`);

                // Update student with ASAAS customer ID if not already set
                if (!student.asaasCustomerId && payment.customer) {
                  await storage.updateStudent(student.id, { asaasCustomerId: payment.customer });
                }

                console.log(`✅ ASAAS payment created: ${payment.id}`);

                // Check if payment already exists in database before saving
                const existingPayment = await storage.getContaReceberByAsaasId(payment.id);
                if (!existingPayment) {
                  // Save payment to database only if it doesn't exist
                  await storage.createContaReceber({
                    studentId: student.id,
                    asaasPaymentId: payment.id,
                    asaasCustomerId: payment.customer,
                  status: payment.status,
                  billingType: payment.billingType as 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER',
                  value: Math.round(payment.value * 100), // Convert back to cents
                  netValue: payment.netValue ? Math.round(payment.netValue * 100) : null,
                  dueDate: new Date(payment.dueDate),
                  description: payment.description || '',
                  externalReference: payment.externalReference || null,
                  invoiceUrl: payment.invoiceUrl || null,
                  bankSlipUrl: payment.bankSlipUrl || null,
                  pixQrCode: payment.pixQrCode || null,
                  pixCopyAndPaste: payment.pixCopyAndPaste || null
                  });
                  console.log(`💾 Novo pagamento salvo no banco: ${payment.id}`);
                } else {
                  console.log(`⏭️ Pagamento já existe no banco, pulando: ${payment.id}`);
                }
                asaasSuccess = true;
              } catch (error) {
                console.error(`❌ ASAAS error for user ${userId}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na integração ASAAS';
                asaasError = errorMessage;

                // Extract specific ASAAS error message
                if (errorMessage.includes('O CPF/CNPJ informado é inválido')) {
                  asaasError = 'O CPF/CNPJ informado é inválido';
                } else if (errorMessage.includes('Email já cadastrado')) {
                  asaasError = 'Email já cadastrado no ASAAS';
                } else if (errorMessage.includes('Telefone inválido')) {
                  asaasError = 'Número de telefone inválido';
                } else if (errorMessage.includes('CEP inválido')) {
                  asaasError = 'CEP inválido';
                }
              }
            }
          }

          // Don't activate user immediately - keep them pending with status info
          if (asaasSuccess) {
            // User stays pending but marked as successfully processed
            results.userResults.push({
              userId,
              userName: `${user.firstName} ${user.lastName}`,
              status: 'success',
              message: 'Processado com sucesso - integração ASAAS completa. Aguardando confirmação final.'
            });
            results.successful++;
          } else if (asaasError) {
            // User stays pending with error status
            results.userResults.push({
              userId,
              userName: `${user.firstName} ${user.lastName}`,
              status: 'error',
              message: 'Erro na integração ASAAS - dados precisam ser corrigidos',
              asaasError: asaasError
            });
            results.errors.push(`Usuário ${userId}: ${asaasError}`);
            results.failed++;
          } else {
            // User approved but no ASAAS integration attempted - activate directly
            const updatedUser = await storage.updateUser(userId, { 
              active: true, 
              status: 'active' 
            });

            if (!updatedUser) {
              const errorMsg = 'erro ao ativar usuário';
              results.errors.push(`Usuário ${userId}: ${errorMsg}`);
              results.userResults.push({
                userId,
                userName: `${user.firstName} ${user.lastName}`,
                status: 'error',
                message: errorMsg
              });
              results.failed++;
              continue;
            }

            results.userResults.push({
              userId,
              userName: `${user.firstName} ${user.lastName}`,
              status: 'success',
              message: 'Aprovado com sucesso (sem integração ASAAS)'
            });
            results.successful++;
          }
        } catch (error) {
          console.error(`❌ Error in batch approval for user ${userId}:`, error);
          const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
          results.errors.push(`Usuário ${userId}: ${errorMsg}`);

          // Try to get user name for error reporting
          let userName = 'Usuário desconhecido';
          try {
            const user = await storage.getUser(userId);
            if (user) {
              userName = `${user.firstName} ${user.lastName}`;
            }
          } catch (e) {
            // Ignore error getting user name
          }

          results.userResults.push({
            userId,
            userName,
            status: 'error',
            message: errorMsg
          });
          results.failed++;
        }
      }

      res.json({
        message: `Aprovação em lote concluída: ${results.successful} sucessos, ${results.failed} falhas`,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        userResults: results.userResults
      });
    } catch (err) {
      console.error("Error in batch approval:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // =====ASAAS Integration Routes=====
  // Test ASAAS connection using school config API Key
  app.post('/api/asaas/test-connection', isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log('🧪 Testing ASAAS connection...');

      // Get API Key from school config
      const config = await storage.getSchoolConfig();
      if (!config?.asaasApiKey) {
        return res.status(400).json({
          success: false,
          message: 'API Key ASAAS não configurada. Configure nas configurações da escola.'
        });
      }

      // Test connection with real API Key
      const asaasService = new AsaasService(config.asaasApiKey);
      const result = await asaasService.testConnection();

      if (!result.success) {
        console.error("❌ ASAAS Connection Test Failed:", result);
        return res.status(200).json({
          success: false,
          message: result.message,
          environment: result.environment,
          baseURL: result.baseURL,
          status: result.status || null,
          errors: result.errors || null,
          hint: "Se sua chave começar com algo como '_hmlg' use ASAAS_ENV=sandbox (URL sandbox). Chaves de produção pedem ASAAS_ENV=production (URL prod).",
        });
      }

      return res.json({
        success: true,
        message: "Conexão ASAAS OK",
        environment: result.environment,
        baseURL: result.baseURL,
        sampleCount: result.total,
      });
    } catch (error: any) {
      console.error('❌ Error testing ASAAS connection:', error);
      res.status(500).json({
        success: false,
        message: `Erro ao testar conexão: ${error.message}`
      });
    }
  });

  // Sync students from ASAAS customers
  app.post('/api/asaas/sync-customers', isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log('🔄 Syncing customers from ASAAS...');

      // Get API Key from school config
      const config = await storage.getSchoolConfig();
      if (!config?.asaasApiKey) {
        return res.status(400).json({
          success: false,
          message: 'API Key ASAAS não configurada'
        });
      }

      const asaasService = new AsaasService(config.asaasApiKey);

      // Get all customers from ASAAS
      const customersResponse = await asaasService.getCustomers(100);
      const customers = customersResponse.data || [];

      let syncedCount = 0;
      let errors = [];

      for (const customer of customers) {
        try {
          // Check if student already exists by email
          const existingUserByEmail = await storage.getUserByEmail(customer.email);

          if (existingUserByEmail) {
            console.log(`📝 Customer ${customer.name} already exists, skipping...`);
            continue;
          }

          // Create new user and student from ASAAS customer
          const userData = {
            firstName: customer.name.split(' ')[0] || 'Cliente',
            lastName: customer.name.split(' ').slice(1).join(' ') || 'ASAAS',
            username: customer.email,
            email: customer.email,
            password: 'temp123456', // Temporary password
            role: 'student' as const,
            phone: customer.mobilePhone || customer.phone,
            cpf: customer.cpfCnpj,
            active: false, // Requires admin approval
            status: 'pending'
          };

          const newUser = await storage.createUser(userData);

          // Create student record
          const studentData = {
            userId: newUser.id,
            beltLevel: 'white' as const,
            financialResponsibleName: customer.name,
            financialResponsibleEmail: customer.email,
            financialResponsiblePhone: customer.mobilePhone || customer.phone,
            financialResponsibleCpf: customer.cpfCnpj,
            asaasCustomerId: customer.id
          };

          await storage.createStudent(studentData);
          syncedCount++;
          console.log(`✅ Synced customer: ${customer.name} -> Student ID: ${newUser.id}`);

        } catch (studentError: any) {
          console.error(`❌ Error syncing customer ${customer.name}:`, studentError);
          errors.push(`${customer.name}: ${studentError.message}`);
        }
      }

      res.json({
        success: true,
        message: `Sincronização concluída. ${syncedCount} alunos importados do ASAAS.`,
        syncedCount,
        totalCustomers: customers.length,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error: any) {
      const status = error?.response?.status;
      const code = error?.response?.data?.errors?.[0]?.code;
      const description = error?.response?.data?.errors?.[0]?.description;

      console.error('❌ Error syncing ASAAS customers:', error);

      // Return more helpful message for environment errors
      if (status === 401 && code === 'invalid_environment') {
        return res.status(502).json({
          success: false,
          message: 'Chave de API ASAAS incompatível com o ambiente. Ajuste ASAAS_ENV (sandbox/production) OU use a chave correta para o ambiente atual.',
          detail: description || null,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao sincronizar clientes do ASAAS.',
        detail: description || error?.message || null,
      });
    }
  });

  // =====Financial Panel Routes=====
  // Get ASAAS payments and metrics
  app.get("/api/financial/payments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Try to get API Key from school config first
      const config = await storage.getSchoolConfig();
      const asaasService = config?.asaasApiKey 
        ? new AsaasPaymentsService(config.asaasApiKey, false)
        : new AsaasPaymentsService();
      const limit = parseInt(req.query.limit as string) || 100;

      console.log('🔄 Fetching ASAAS payments for financial panel...');

      // Get payments with customer data
      const paymentsWithCustomers = await asaasService.getPaymentsWithCustomers(limit);

      // Calculate metrics
      const payments = paymentsWithCustomers.map(p => ({
        id: p.id,
        customer: p.customer,
        customerName: p.customerData?.name || 'Cliente não encontrado',
        customerEmail: p.customerData?.email || '',
        value: p.value,
        status: p.status,
        dueDate: p.dueDate,
        description: p.description,
        invoiceUrl: p.invoiceUrl,
        paymentLink: p.paymentLink,
        dateCreated: p.dateCreated,
        paymentDate: p.paymentDate,
        clientPaymentDate: p.clientPaymentDate,
        externalReference: p.externalReference,
      }));

      const metrics = asaasService.calculateMetrics(paymentsWithCustomers);

      console.log(`✅ Financial data fetched: ${payments.length} payments, metrics calculated`);

      res.json({
        payments,
        metrics,
        totalCount: payments.length
      });

    } catch (error: any) {
      console.error('❌ Error fetching financial data:', error);

      // Return mock data in case of API failure for development
      const mockData = {
        payments: [
          {
            id: 'mock_1',
            customer: 'cus_mock_1',
            customerName: 'João da Silva',
            customerEmail: 'joao@email.com',
            value: 199.90,
            status: 'RECEIVED',
            dueDate: '2025-08-01',
            description: 'Mensalidade - Agosto',
            invoiceUrl: null,
            paymentLink: null,
            dateCreated: '2025-08-01',
            paymentDate: '2025-08-01',
            clientPaymentDate: null,
            externalReference: 'COBRANCA_ALUNO_1',
          },
          {
            id: 'mock_2',
            customer: 'cus_mock_2',
            customerName: 'Maria Santos',
            customerEmail: 'maria@email.com',
            value: 199.90,
            status: 'PENDING',
            dueDate: '2025-08-15',
            description: 'Mensalidade - Agosto',
            invoiceUrl: 'https://asaas.com/invoice/mock',
            paymentLink: 'https://asaas.com/payment/mock',
            dateCreated: '2025-08-01',
            paymentDate: null,
            clientPaymentDate: null,
            externalReference: 'COBRANCA_ALUNO_2',
          },
          {
            id: 'mock_3',
            customer: 'cus_mock_3',
            customerName: 'Carlos Oliveira',
            customerEmail: 'carlos@email.com',
            value: 199.90,
            status: 'OVERDUE',
            dueDate: '2025-07-15',
            description: 'Mensalidade - Julho',
            invoiceUrl: 'https://asaas.com/invoice/mock3',
            paymentLink: 'https://asaas.com/payment/mock3',
            dateCreated: '2025-07-01',
            paymentDate: null,
            clientPaymentDate: null,
            externalReference: 'COBRANCA_ALUNO_3',
          }
        ],
        metrics: {
          receivedThisMonth: 199.90,
          pendingValue: 199.90,
          overdueCount: 1,
          defaultRate: 33.33,
          totalPaymentsThisMonth: 3,
          nextDueDate: new Date('2025-08-15'),
          totalReceived: 199.90,
          totalPending: 199.90,
          totalOverdue: 199.90,
        },
        totalCount: 3
      };

      // Add new fields to mock data
      mockData.metrics.averageTicket = mockData.metrics.receivedThisMonth / Math.max(1, mockData.metrics.totalPaymentsThisMonth);
      mockData.metrics.revenueVariation = 12.5; // Mock 12.5% increase
      mockData.metrics.previousMonthRevenue = mockData.metrics.receivedThisMonth * 0.89; // Mock previous month
      mockData.metrics.payingStudentsCount = Math.floor(mockData.metrics.totalPaymentsThisMonth * 0.8);

      console.log('⚠️ Using mock financial data due to API error');
      res.json(mockData);
    }
  });

  // Refresh financial data (force reload from ASAAS)
  app.post("/api/financial/refresh", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const asaasService = new AsaasPaymentsService();

      console.log('🔄 Force refreshing ASAAS financial data...');

      const paymentsWithCustomers = await asaasService.getPaymentsWithCustomers(100);
      const metrics = asaasService.calculateMetrics(paymentsWithCustomers);

      res.json({
        success: true,
        message: 'Dados financeiros atualizados com sucesso',
        paymentsCount: paymentsWithCustomers.length,
        metrics
      });

    } catch (error: any) {
      console.error('❌ Error refreshing financial data:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar dados financeiros',
        error: error.message
      });
    }
  });

  // =====ARKAIDEV Enhancement: Manual ASAAS Sync Routes=====

  // Sync student with ASAAS (manual resync in case of lost link)
  app.post("/api/students/:id/sync-asaas", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const asaasService = new AsaasService();

      console.log(`🔄 Manual ASAAS sync requested for student ID: ${id}`);

      // Get student and user data
      const student = await storage.getStudent(Number(id));
      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }

      const user = await storage.getUser(student.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (!student.financialResponsibleCpf && !student.financialResponsibleEmail) {
        return res.status(400).json({ 
          message: "CPF ou e-mail do responsável financeiro é necessário para sincronização" 
        });
      }

      // Try to sync existing ASAAS data
      const cpfOrEmail = student.financialResponsibleCpf || student.financialResponsibleEmail;
      const syncResult = await asaasService.syncExistingAsaasData(
        (cpfOrEmail as string) // Ensure it's treated as a string
      );

      if (!syncResult.customer) {
        return res.json({
          success: false,
          message: "Nenhum cliente encontrado no ASAAS com esses dados",
          customer: null,
          payments: []
        });
      }

      // Update student with found customer ID
      await storage.updateStudent(student.id, { 
        asaasCustomerId: syncResult.customer.id 
      });

      // Save or update payments found
      let savedPayments = 0;
      for (const payment of syncResult.payments) {
        try {
          // Check if payment already exists
          const existingPayment = await storage.getContaReceberByAsaasId(payment.id);
          if (!existingPayment) {
            await storage.createContaReceber({
              studentId: student.id,
              asaasPaymentId: payment.id,
              asaasCustomerId: syncResult.customer.id,
              status: payment.status,
              billingType: payment.billingType as 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER',
              value: Math.round(payment.value * 100),
              netValue: payment.netValue ? Math.round(payment.netValue * 100) : null,
              dueDate: new Date(payment.dueDate),
              description: payment.description || '',
              externalReference: payment.externalReference || null,
              invoiceUrl: payment.invoiceUrl || null,
              bankSlipUrl: payment.bankSlipUrl || null,
              pixQrCode: payment.pixQrCode || null,
              pixCopyAndPaste: payment.pixCopyAndPaste || null
            });
            savedPayments++;
          }
        } catch (error) {
          console.error(`Erro ao salvar pagamento ${payment.id}:`, error);
        }
      }

      console.log(`✅ Sincronização concluída: Cliente ${syncResult.customer.id}, ${savedPayments} novos pagamentos salvos`);

      res.json({
        success: true,
        message: `Sincronização concluída com sucesso`,
        customer: syncResult.customer,
        payments: syncResult.payments,
        savedPayments
      });

    } catch (error: any) {
      console.error('❌ Erro na sincronização manual:', error);
      res.status(500).json({
        success: false,
        message: `Erro na sincronização: ${error.message}`
      });
    }
  });

  // Check if customer exists in ASAAS (verification endpoint)
  app.get("/api/asaas/check-customer", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { cpf, email } = req.query;

      if (!cpf && !email) {
        return res.status(400).json({ 
          message: "CPF ou e-mail é obrigatório" 
        });
      }

      const asaasService = new AsaasService();

      console.log(`🔍 Verificando cliente ASAAS - CPF: ${cpf}, Email: ${email}`);

      const syncResult = await asaasService.syncExistingAsaasData(
        (cpf as string) || (email as string) // Ensure it's treated as a string
      );

      res.json({
        exists: !!syncResult.customer,
        customer: syncResult.customer,
        payments: syncResult.payments,
        paymentsCount: syncResult.payments.length
      });

    } catch (error: any) {
      console.error('❌ Erro na verificação do cliente:', error);
      res.status(500).json({
        message: `Erro na verificação: ${error.message}`
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}