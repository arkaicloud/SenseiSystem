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
  insertSchoolEventSchema
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

  // Approve user registration
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
      
      // Activate the user
      const updatedUser = await storage.updateUser(user.id, { active: true });
      
      // If it's a student and a plan was provided, create a student payment
      if (user.role === 'student' && planId) {
        const student = await storage.getStudentByUserId(user.id);
        if (student) {
          const plan = await storage.getPaymentPlan(planId);
          if (plan) {
            // Create initial payment record
            const today = new Date();
            const dueDate = new Date(today);
            dueDate.setMonth(dueDate.getMonth() + (plan.billingCycle === 'monthly' ? 1 : 12));

            await storage.createStudentPayment({
              studentId: student.id,
              planId: plan.id,
              amount: plan.price,
              dueDate: dueDate,
              status: 'pending'
            });
          }
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

  app.post("/api/attendance", isAuthenticated, async (req, res) => {
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
      
      // Verificar permissões:
      // 1. Instrutores e admins podem registrar presença para qualquer aluno
      // 2. Alunos só podem registrar presença para si mesmos
      const requestUser = (req as any).user;
      
      if (requestUser.role === 'student') {
        // Verificar se o aluno está tentando registrar presença para si mesmo
        const studentUser = await storage.getUser(student.userId);
        if (!studentUser || studentUser.id !== requestUser.id) {
          return res.status(403).json({ 
            message: "Forbidden: Students can only register attendance for themselves" 
          });
        }
      }
      
      // Verificar se já existe uma presença para esta aula e aluno na mesma data
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const existingAttendances = await storage.getAttendanceByStudent(student.id);
      const alreadyRegistered = existingAttendances.some(att => {
        const attDate = new Date(att.date).toISOString().split('T')[0];
        return attDate === today && att.classId === attendanceData.classId;
      });
      
      if (alreadyRegistered) {
        return res.status(400).json({ 
          message: "Presença já registrada para esta aula hoje" 
        });
      }
      
      const attendance = await storage.createAttendance(attendanceData);
      
      // Log activity
      const user = await storage.getUser(student.userId);
      await storage.createActivityLog({
        userId: requestUser.id,
        activity: `${requestUser.firstName} ${requestUser.lastName} confirmou presença para ${user?.firstName} ${user?.lastName} na aula ${classItem.name}`,
        entityType: 'attendance',
        entityId: attendance.id
      });
      
      res.status(201).json({ attendance });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      console.error("Erro ao registrar presença:", error);
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

  const httpServer = createServer(app);
  return httpServer;
}
