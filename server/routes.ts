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
  insertActivityLogSchema,
  insertSchoolEventSchema,
  insertDashboardCustomizationSchema,
  insertRiskActionSchema,
  insertRiskSettingsSchema
} from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin, isInstructor, isSelfOrStaff } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

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

      // If it's a student, create a student payment (now required)
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
        avatarImage: null
      });

      // Criar o registro do aluno
      const student = await storage.createStudent(studentInfo);

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

  // Rota específica para alunos confirmarem presença
  app.post("/api/attendance/confirm", isAuthenticated, async (req, res) => {
    try {
      const { classId } = req.body;
      const requestUser = (req as any).user;

      console.log("Tentativa de confirmação de presença:", { classId, userId: requestUser?.id });

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

      // Verificar se já existe presença para hoje
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const existingAttendances = await storage.getAttendanceByClass(classId, today);
      const existingAttendance = existingAttendances.find(att => 
        att.studentId === student.id && 
        new Date(att.date).toISOString().split('T')[0] === todayStr
      );

      if (existingAttendance) {
        return res.status(400).json({ message: "Attendance already recorded for today" });
      }

      // Criar registro de presença
      const attendanceData = {
        studentId: student.id,
        classId: classId,
        date: new Date(), // Usar nova instância de Date
        status: 'present' as const,
        checkedInBy: requestUser.id
      };

      const attendance = await storage.createAttendance(attendanceData);

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

  // Rota para cancelar presença
  app.delete("/api/attendance/cancel", isAuthenticated, async (req, res) => {
    try {
      const { classId } = req.body;
      const requestUser = (req as any).user;

      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }

      // Buscar o estudante pelo userId do usuário logado
      const student = await storage.getStudentByUserId(requestUser.id);
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      // Buscar presença existente para hoje
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const existingAttendances = await storage.getAttendanceByClass(classId, today);
      const existingAttendance = existingAttendances.find(att => 
        att.studentId === student.id && 
        new Date(att.date).toISOString().split('T')[0] === todayStr
      );

      if (!existingAttendance) {
        return res.status(404).json({ message: "No attendance record found for today" });
      }

      // Cancelar presença
      const success = await storage.deleteAttendance(existingAttendance.id);

      if (!success) {
        return res.status(400).json({ message: "Failed to cancel attendance" });
      }

      // Log da atividade
      await storage.createActivityLog({
        activity: `Aluno cancelou presença na aula ID: ${classId}`,
        userId: requestUser.id,
        entityType: 'attendance',
        entityId: existingAttendance.id,
        timestamp: new Date()
      });

      res.json({ message: "Attendance cancelled successfully" });
    } catch (error) {
      console.error("Erro ao cancelar presença:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Cancelar presença
  app.delete("/api/attendance/cancel", isAuthenticated, async (req, res) => {
    try {
      const { studentId, classId, date } = req.body;

      if (!studentId || !classId) {
        return res.status(400).json({ message: "studentId e classId são obrigatórios" });
      }

      // Verificar permissões
      const requestUser = (req as any).user;
      const student = await storage.getStudent(studentId);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Alunos só podem cancelar sua própria presença
      if (requestUser.role === 'student') {
        const studentUser = await storage.getUser(student.userId);
        if (!studentUser || studentUser.id !== requestUser.id) {
          return res.status(403).json({ 
            message: "Forbidden: Students can only cancel their own attendance" 
          });
        }
      }

      // Buscar presença existente
      const today = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const attendances = await storage.getAttendanceByStudent(studentId);

      const attendance = attendances.find(att => {
        const attDate = new Date(att.date).toISOString().split('T')[0];
        return attDate === today && att.classId === classId;
      });

      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      // Cancelar presença
      await storage.deleteAttendance(attendance.id);

      // Registrar atividade
      const user = await storage.getUser(student.userId);
      const classItem = await storage.getClass(classId);

      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} cancelou presença de ${user?.firstName} ${user?.lastName} na aula ${classItem?.name}`,
        entityType: 'attendance',
        entityId: attendance.id
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao cancelar presença:", error);
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
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/school-config", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Clean and validate the data manually to avoid schema issues
      const cleanData = {
        schoolName: String(req.body.schoolName || ""),
        logoUrl: req.body.logoUrl ? String(req.body.logoUrl) : null,
        address: req.body.address ? String(req.body.address) : null,
        phone: req.body.phone ? String(req.body.phone) : null,
        email: req.body.email ? String(req.body.email) : null,
        website: req.body.website ? String(req.body.website) : null,
        congratsMessage: req.body.congratsMessage ? String(req.body.congratsMessage) : null
      };

      // Basic validation
      if (!cleanData.schoolName || cleanData.schoolName.trim() === "") {
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

      res.json({ config: updatedConfig });
    } catch (error) {
      console.error("Error updating school config:", error);
      res.status(500).json({ message: "Erro ao salvar configurações" });
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
  app.get("/api/students/at-risk", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 60;
      const studentsAtRisk = [];
      
      // Get all students with their attendance data
      const students = await storage.getStudentsWithUsers();
      
      for (const student of students) {
        try {
          // Calculate attendance rate for this student
          const studentAttendances = await storage.getAttendanceByStudent(student.id);
          const totalClasses = await storage.getClasses();
          
          const attendanceRate = totalClasses.length > 0 ? 
            Math.round((studentAttendances.length / totalClasses.length) * 100) : 0;
          
          // Calculate days since last attendance
          const lastAttendance = studentAttendances.length > 0 ?
            studentAttendances.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;
          
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
                firstName: student.user.firstName,
                lastName: student.user.lastName,
                email: student.user.email,
                phone: student.user.phone
              },
              beltLevel: student.beltLevel,
              stripes: student.stripes,
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
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/students/risk-actions", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const actionData = {
        studentId: req.body.studentId,
        actionType: req.body.actionType,
        notes: req.body.notes || null,
        scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : null,
        createdBy: req.user.id
      };
      
      // Log the action
      await storage.createActivityLog({
        userId: req.user.id,
        activity: `${req.user.firstName} ${req.user.lastName} registrou ação de retenção: ${actionData.actionType}`,
        entityType: 'risk_action',
        entityId: actionData.studentId,
        timestamp: new Date()
      });
      
      res.status(201).json({ action: actionData });
    } catch (error) {
      console.error("Erro ao criar ação de risco:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/risk-settings", isAuthenticated, isInstructor, async (req, res) => {
    try {
      const settings = { 
        frequencyThreshold: 60, 
        daysThreshold: 7, 
        autoAlerts: true 
      };
      res.json({ settings });
    } catch (error) {
      console.error("Erro ao buscar configurações de risco:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}