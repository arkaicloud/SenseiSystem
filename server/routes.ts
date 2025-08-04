import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users, students } from "@shared/schema";
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
  insertSchoolPaymentSchema
} from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin, isInstructor, isSelfOrStaff } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

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

  // =====Student Profile Route=====
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

  // =====Student Current Month Attendance Route=====
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
      
      const attendanceCount = await storage.getStudentAttendanceCount(student.id, firstDay, lastDay);
      
      res.json({ count: attendanceCount });
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      res.status(500).json({ error: 'Failed to fetch student attendance' });
    }
  });

  // =====Class Attendance Confirmation Route=====
  app.post("/api/classes/:classId/confirm-attendance", isAuthenticated, async (req, res) => {
    try {
      const { classId } = req.params;
      const { studentId } = req.body;
      
      const classIdNumber = parseInt(classId);
      const studentIdNumber = parseInt(studentId);
      
      if (isNaN(classIdNumber) || isNaN(studentIdNumber)) {
        return res.status(400).json({ error: 'Invalid class or student ID' });
      }
      
      // Check if student exists
      const student = await storage.getStudentByUserId(studentIdNumber);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // Check if class exists
      const classSession = await storage.getClass(classIdNumber);
      if (!classSession) {
        return res.status(404).json({ error: 'Class not found' });
      }
      
      // Create attendance record
      const attendanceData = {
        studentId: student.id,
        classId: classIdNumber,
        date: new Date().toISOString(),
        status: 'confirmed' as const,
        checkedInAt: new Date()
      };
      
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

  // =====Stats/Dashboard Routes=====
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

  // Confirmar presença do aluno
  app.post("/api/attendance/confirm", isAuthenticated, async (req, res) => {
    try {
      const { classId, date, status = 'present' } = req.body;
      const userId = req.user!.id;

      // Buscar o estudante pelo userId
      const student = await storage.getStudentByUserId(userId);
      if (!student) {
        return res.status(404).json({ message: "Registro de estudante não encontrado" });
      }

      // Verificar se a aula existe
      const classExists = await storage.getClass(classId);
      if (!classExists) {
        return res.status(404).json({ message: "Aula não encontrada" });
      }

      // Verificar se já existe uma confirmação para hoje
      const today = new Date(date);
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const existingAttendance = await storage.getAttendanceByClass(classId, startOfDay);
      const userAttendance = existingAttendance.find(att => att.studentId === student.id);

      if (userAttendance && userAttendance.status === 'present') {
        return res.status(400).json({ message: "Presença já confirmada para esta aula hoje" });
      }

      // Criar nova confirmação de presença
      const attendance = await storage.createAttendance({
        studentId: student.id,
        classId: classId,
        date: today,
        status: status,
        checkedInBy: userId
      });

      // Log da atividade
      await storage.createActivityLog({
        userId: userId,
        activity: `Confirmou presença na aula "${classExists.name}"`,
        entityType: 'attendance',
        entityId: attendance.id,
        timestamp: new Date()
      });

      res.status(201).json({ 
        message: "Presença confirmada com sucesso",
        attendance 
      });
    } catch (error) {
      console.error("Erro ao confirmar presença:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

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
      res.json({ users: pendingUsers.map(u => ({ ...u, password: undefined })) });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Approve user mutation
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
                const config = await storage.getSchoolConfig();
                if (config?.asaasApiKey) {
                  const { AsaasService } = await import("./services/asaasService");
                  const asaasService = new AsaasService(config.asaasApiKey, true); // Use sandbox

                  console.log('🔄 Creating ASAAS customer for approved student:', user.firstName, user.lastName);
                  
                  // Create ASAAS customer
                  const asaasCustomer = await asaasService.createCustomer({
                    name: student.financialResponsibleName,
                    email: student.financialResponsibleEmail,
                    cpfCnpj: student.financialResponsibleCpf?.replace(/\D/g, ''), // Remove formatting
                    phone: student.financialResponsiblePhone?.replace(/\D/g, ''), // Remove formatting
                    externalReference: `student_${student.id}` // Link to our student
                  });

                  console.log('✅ ASAAS customer created:', asaasCustomer.id);

                  // Update student with ASAAS customer ID
                  await storage.updateStudent(student.id, { asaasCustomerId: asaasCustomer.id });

                  // Create subscription if payment plan and due date are available
                  if (student.preferredDueDate) {
                    console.log('🔄 Creating ASAAS subscription for approved student:', user.firstName, user.lastName);
                    
                    // Calculate next due date based on preferred day
                    const selectedDay = student.preferredDueDate;
                    const nextDueDate = new Date(today.getFullYear(), today.getMonth(), selectedDay);
                    
                    // If the selected day has passed this month, move to next month
                    if (nextDueDate <= today) {
                      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                    }

                    const subscription = await asaasService.createSubscription({
                      customer: asaasCustomer.id,
                      billingType: "BOLETO",
                      value: plan.amount / 100, // Convert from cents to reais
                      nextDueDate: nextDueDate.toISOString().split('T')[0], // YYYY-MM-DD format
                      cycle: "MONTHLY",
                      description: `Mensalidade - ${plan.name} - ${user.firstName} ${user.lastName}`,
                      externalReference: `student_${student.id}_plan_${plan.id}`
                    });

                    console.log('✅ ASAAS subscription created:', subscription.id);

                    // Update student with ASAAS subscription ID
                    await storage.updateStudent(student.id, { asaasSubscriptionId: subscription.id });
                  }
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

  app.post("/api/students", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const studentData = req.body;

      // Validar dados do usuário primeiro
      const userData = insertUserSchema.parse({
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        username: studentData.username,
        email: studentData.email,
        password: studentData.password || 'temporaryPassword123',
        role: "student",
        active: true,
        phone: studentData.phone || null,
        emergencyContact: studentData.emergencyContact || null,
        street: studentData.street || null,
        city: studentData.city || null,
        state: studentData.state || null,
        zipCode: studentData.zipCode || null,
        complement: studentData.complement || null,
        joinDate: new Date()
      });

      // Criar o usuário primeiro
      const user = await storage.createUser(userData);

      // Dados específicos do aluno
      const studentInfo = insertStudentSchema.parse({
        userId: user.id,
        beltLevel: studentData.beltLevel || "white",
        stripes: studentData.stripes || 0,
        lastPromotionDate: null,
        attendanceRate: null,
        notes: studentData.notes || null,
        avatarColor: null,
        avatarStyle: null,
        avatarImage: null,
        // Financial responsibility data
        financialResponsibleName: studentData.financialResponsibleName || null,
        financialResponsibleEmail: studentData.financialResponsibleEmail || null,
        financialResponsiblePhone: studentData.financialResponsiblePhone || null,
        financialResponsibleCpf: studentData.financialResponsibleCpf || null,
        financialResponsibleRelationship: studentData.financialResponsibleRelationship || null,
        asaasCustomerId: null, // Will be filled after ASAAS customer creation
        paymentPlanId: studentData.paymentPlanId ? parseInt(studentData.paymentPlanId) : null,
        preferredDueDate: studentData.dueDate ? parseInt(studentData.dueDate) : 5
      });

      // Criar o registro do aluno
      const student = await storage.createStudent(studentInfo);

      // ASAAS integration will be done after user approval, not during registration

      // Se um plano de pagamento foi selecionado, criar o pagamento
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

      // Log da atividade
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

  // Rota para buscar o estudante pelo ID do usuário (precisa vir ANTES da rota genérica /:id)
  app.get("/api/students/by-user/:userId", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const student = await storage.getStudentByUserId(Number(userId));

      if (!student) {
        return res.status(404).json({ message: "Estudante não encontrado" });
      }

      // Apenas o próprio aluno ou um admin/instrutor pode ver os dados do aluno
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

  // Rota genérica para buscar estudante por ID
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

  // Rota específica para atualizar o avatar do aluno
  app.put("/api/students/:id/avatar", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const student = await storage.getStudent(Number(id));

      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }

      // Apenas o próprio aluno ou um admin/instrutor pode atualizar o avatar
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

      // Log de atividade
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

  // Rota para converter estudante em bolsista
  app.post("/api/students/:id/scholarship", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { scholarshipPlanId, reason } = req.body;

      const student = await storage.getStudent(Number(id));
      if (!student) {
        return res.status(404).json({ message: "Estudante não encontrado" });
      }

      // Verificar se o plano de bolsista existe
      const scholarshipPlan = await storage.getPaymentPlan(scholarshipPlanId);
      if (!scholarshipPlan || !scholarshipPlan.isScholarship) {
        return res.status(400).json({ message: "Plano de bolsista inválido" });
      }

      // Atualizar estudante para bolsista
      const updatedStudent = await storage.updateStudent(Number(id), {
        isScholarship: true,
        scholarshipReason: reason || null
      });

      // Criar um pagamento gratuito para o bolsista
      await storage.createStudentPayment({
        studentId: Number(id),
        planId: scholarshipPlanId,
        status: 'paid',
        dueDate: new Date(),
        paidDate: new Date(),
        amount: 0,
        notes: `Plano de bolsista: ${reason || 'Convertido pelo administrador'}`
      });

      // Log da atividade
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
      
      // Filtrar aulas para hoje (por enquanto retornando todas para debug)
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

  // Rota específica para alunos confirmarem presença com controle de limites
  app.post("/api/attendance/confirm", isAuthenticated, async (req, res) => {
    try {
      const { classId, date } = req.body;
      const requestUser = (req as any).user;

      console.log("Tentativa de confirmação de presença:", { classId, userId: requestUser?.id, date });

      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }

      // Verificar se a aula existe
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Buscar o estudante pelo userId do usuário logado
      const student = await storage.getStudentByUserId(requestUser.id);
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const classDate = date ? new Date(date) : new Date();
      const classDateStr = classDate.toISOString().split('T')[0];

      // Verificar limite de alunos por aula
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

      // Verificar se já existe presença para esta data
      const existingAttendances = await storage.getAttendanceByClass(classId, classDate);
      const existingAttendance = existingAttendances.find(att => 
        att.studentId === student.id && 
        new Date(att.date).toISOString().split('T')[0] === classDateStr
      );

      if (existingAttendance) {
        return res.status(400).json({ message: "Presença já registrada para esta data" });
      }

      // Verificar limite de confirmações para esta aula
      const changes = await storage.getAttendanceChanges(student.id, classId, classDate);
      const confirmations = changes.filter(change => change.changeType === 'confirm');
      
      if (confirmations.length >= 2) {
        return res.status(400).json({ 
          message: "Você atingiu o limite de alterações. Fale com o Sensei." 
        });
      }

      // Criar registro de presença
      const attendanceData = {
        studentId: student.id,
        classId: classId,
        date: classDate,
        status: 'present' as const,
        checkedInBy: requestUser.id
      };

      const attendance = await storage.createAttendance(attendanceData);

      // Registrar a mudança na tabela de controle
      await storage.createAttendanceChange({
        studentId: student.id,
        classId: classId,
        date: classDate,
        changeType: 'confirm'
      });

      // Log da atividade
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

  // Rota para cancelar presença com controle de limites
  app.delete("/api/attendance/cancel", isAuthenticated, async (req, res) => {
    try {
      const { classId, date } = req.body;
      const requestUser = (req as any).user;

      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }

      // Buscar o estudante pelo userId do usuário logado
      const student = await storage.getStudentByUserId(requestUser.id);
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const classDate = date ? new Date(date) : new Date();
      const classDateStr = classDate.toISOString().split('T')[0];

      // Buscar presença existente para a data especificada
      const existingAttendances = await storage.getAttendanceByClass(classId, classDate);
      const existingAttendance = existingAttendances.find(att => 
        att.studentId === student.id && 
        new Date(att.date).toISOString().split('T')[0] === classDateStr
      );

      if (!existingAttendance) {
        return res.status(404).json({ message: "Nenhuma presença encontrada para esta data" });
      }

      // Verificar limite de cancelamentos para esta aula
      const changes = await storage.getAttendanceChanges(student.id, classId, classDate);
      const cancellations = changes.filter(change => change.changeType === 'cancel');
      
      if (cancellations.length >= 2) {
        return res.status(400).json({ 
          message: "Você atingiu o limite de alterações. Fale com o Sensei." 
        });
      }

      // Cancelar presença
      const success = await storage.deleteAttendance(existingAttendance.id);

      if (!success) {
        return res.status(400).json({ message: "Falha ao cancelar presença" });
      }

      // Registrar a mudança na tabela de controle
      await storage.createAttendanceChange({
        studentId: student.id,
        classId: classId,
        date: classDate,
        changeType: 'cancel'
      });

      // Log da atividade
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



  // Rota para verificar alterações de presença
  app.get("/api/attendance/changes/:studentId/:classId", isAuthenticated, async (req, res) => {
    try {
      const { studentId, classId } = req.params;
      const { date } = req.query;
      const requestUser = (req as any).user;

      if (!studentId || !classId) {
        return res.status(400).json({ message: "Student ID e Class ID são obrigatórios" });
      }

      // Verificar permissões
      const student = await storage.getStudent(Number(studentId));
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Alunos só podem ver suas próprias alterações
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

  // Rota específica para buscar planos de bolsistas
  app.get("/api/payment-plans/scholarships", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const plans = await storage.getPaymentPlans();
      const scholarshipPlans = plans.filter(plan => plan.isScholarship);
      res.json({ plans: scholarshipPlans });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Rota para criar plano de bolsista
  app.post("/api/payment-plans/scholarship", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Nome do plano é obrigatório" });
      }

      const scholarshipPlan = await storage.createPaymentPlan({
        name: name,
        amount: 0, // Planos de bolsista são gratuitos
        frequency: "monthly",
        description: description || "Plano de bolsista - gratuito",
        isScholarship: true
      });

      // Log da atividade
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

      // Validar dados
      const planData = req.body;
      const updatedPlan = await storage.updatePaymentPlan(plan.id, planData);

      // Registrar atividade
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

      // Verificar se há alunos utilizando esse plano antes de excluí-lo
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

      // Registrar atividade
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
      
      // Separar bolsistas dos inadimplentes
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

  // Rota para marcar pagamento como inadimplente e bloquear acesso
  app.post("/api/student-payments/:id/mark-overdue", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getStudentPayment(Number(id));

      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      // Não aplicar a estudantes bolsistas
      const student = await storage.getStudent(payment.studentId);
      if (student?.isScholarship) {
        return res.status(400).json({ 
          message: "Bolsistas não podem ser marcados como inadimplentes" 
        });
      }

      // Marcar como inadimplente e desativar o usuário
      await storage.updateStudentPayment(Number(id), {
        status: 'overdue',
        overdueAt: new Date()
      });

      // Desativar o usuário do estudante
      if (student) {
        await storage.updateUser(student.userId, { active: false });
      }

      // Log da atividade
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

  // Rota para reativar estudante após pagamento
  app.post("/api/student-payments/:id/reactivate", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getStudentPayment(Number(id));

      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      // Marcar como pago e reativar o usuário
      await storage.updateStudentPayment(Number(id), {
        status: 'paid',
        paidDate: new Date(),
        overdueAt: null
      });

      // Reativar o usuário do estudante
      const student = await storage.getStudent(payment.studentId);
      if (student) {
        await storage.updateUser(student.userId, { active: true });
      }

      // Log da atividade
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

  // Rota para dashboard de aniversários
  app.get("/api/birthdays", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const { month } = req.query;
      
      const students = await storage.getStudentsWithUsers();
      const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
      
      // Filtrar estudantes que fazem aniversário no mês especificado
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
          // Skip if student doesn't have user data
          if (!student.user) {
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
                id: student.user.id,
                firstName: student.user.firstName || 'Unknown',
                lastName: student.user.lastName || '',
                email: student.user.email || '',
                phone: student.user.phone || '',
                emergencyContact: student.user.emergencyContact || ''
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
  
  // Webhook para receber notificações do ASAAS
  app.post("/webhooks/asaas", async (req, res) => {
    try {
      console.log('🔔 ASAAS Webhook received:', req.body);
      
      const event = req.body;
      
      // Validar se é um evento válido
      if (!event || !event.event || !event.payment) {
        return res.status(400).json({ message: "Invalid webhook payload" });
      }

      const { payment } = event;
      
      // Buscar o pagamento pelo ID do ASAAS
      const schoolPayment = await storage.getSchoolPaymentByAsaasId(payment.id);
      if (!schoolPayment) {
        console.log(`⚠️ Payment not found for ASAAS ID: ${payment.id}`);
        return res.status(404).json({ message: "Payment not found" });
      }

      // Processar diferentes tipos de eventos
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

      // Atualizar status do pagamento
      const updatedPayment = await storage.updateSchoolPayment(schoolPayment.id, {
        status: newStatus as any,
        paidAt
      });

      // Se foi pago, reativar a escola
      if (newStatus === 'paid') {
        await storage.updateSchoolConfig({
          active: true
        });
        console.log('✅ School reactivated after payment');
      }

      // Se está em atraso há mais de 10 dias, bloquear a escola
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

  // Obter pagamentos da escola
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

  // Criar pagamento manual
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

  // Testar conexão com ASAAS
  app.post("/api/asaas/test-connection", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const config = await storage.getSchoolConfig();
      if (!config?.asaasApiKey) {
        return res.status(400).json({ 
          success: false, 
          message: "API Key do ASAAS não configurada" 
        });
      }

      const { AsaasService } = await import("./services/asaasService");
      const asaasService = new AsaasService(config.asaasApiKey, true); // Use sandbox
      const result = await asaasService.testConnection();

      res.json(result);
    } catch (error) {
      console.error("Error testing ASAAS connection:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
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
  // Endpoint para verificar se aluno é responsável financeiro e buscar dados
  app.get("/api/student/financial/:studentId", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const userId = req.user?.id;
      
      // Buscar dados do estudante
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Estudante não encontrado" });
      }
      
      // Verificar se o usuário logado tem permissão para ver os dados financeiros
      if (req.user?.role === 'student' && student.userId !== userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      // Verificar se o estudante tem CPF como responsável financeiro
      const isFinancialResponsible = student.financialResponsibleCpf && 
        student.financialResponsibleRelationship === 'self';
      
      if (!isFinancialResponsible) {
        return res.json({ 
          isFinancialResponsible: false,
          message: "Este aluno não é responsável financeiro"
        });
      }
      
      // Buscar dados financeiros do ASAAS se disponível
      let asaasData = null;
      if (student.asaasCustomerId) {
        try {
          // Simular dados do ASAAS para demonstração
          asaasData = {
            invoices: [],
            customerId: student.asaasCustomerId
          };
        } catch (error) {
          console.warn("Erro ao buscar dados do ASAAS:", error);
        }
      }
      
      // Buscar pagamentos locais do estudante
      const studentPayments = await storage.getStudentPaymentsByStudent(studentId);
      
      res.json({
        isFinancialResponsible: true,
        student: {
          id: student.id,
          name: `${student.userId}`, // We'll get the name from user data
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
  // Endpoint para buscar histórico de presenças do aluno
  app.get("/api/student/attendance-history/:studentId", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const userId = req.user?.id;
      const { month, year } = req.query;
      
      // Buscar dados do estudante para validar acesso
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Estudante não encontrado" });
      }
      
      // Verificar permissões
      if (req.user?.role === 'student' && student.userId !== userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      // Buscar todas as presenças do aluno
      const attendances = await storage.getAttendanceByStudent(studentId);
      
      // Filtrar por mês/ano se fornecido
      let filteredAttendances = attendances;
      if (month && year) {
        const targetMonth = parseInt(month as string);
        const targetYear = parseInt(year as string);
        
        filteredAttendances = attendances.filter(att => {
          const attDate = new Date(att.date);
          return attDate.getMonth() + 1 === targetMonth && attDate.getFullYear() === targetYear;
        });
      }
      
      // Buscar detalhes das aulas para cada presença
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
      
      // Calcular estatísticas do período
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

  const httpServer = createServer(app);
  return httpServer;
}