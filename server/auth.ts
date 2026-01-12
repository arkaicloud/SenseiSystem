import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User as SchemaUser, userRoleEnum } from "@shared/schema";

// Add User type to Express' User interface
declare global {
  namespace Express {
    interface User extends SchemaUser {}
  }
}



// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Helper function to compare passwords
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
};

// Middleware to check if user is instructor/professor
export const isInstructor = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && (req.user.role === "instructor" || req.user.role === "admin")) {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Instructor access required" });
};

// Middleware to check if user is the same as requested user or admin/instructor
export const isSelfOrStaff = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    if (
      req.user.role === "admin" || 
      req.user.role === "instructor" || 
      req.user.id === parseInt(req.params.id)
    ) {
      return next();
    }
  }
  res.status(403).json({ message: "Acesso negado. Você não tem permissão para acessar este recurso." });

};

export function setupAuth(app: Express) {
  // Setup session middleware
  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "senseisystem-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
    }
  };

  // Use memory store for development
  app.use(session(sessionOptions));
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email", // Use email for authentication
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: "Email ou senha incorretos" });
          }
          
          if (!(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Email ou senha incorretos" });
          }
          
          // Auto-approve admin users if they are pending
          if (user.role === 'admin' && (user.status === 'pending' || !user.active)) {
            try {
              await storage.updateUser(user.id, { 
                status: 'active', 
                active: true 
              });
              user.status = 'active';
              user.active = true;
              console.log(`✅ Admin user auto-approved: ${user.email}`);
            } catch (error) {
              console.error('❌ Failed to auto-approve admin:', error);
            }
          }
          
          // Check user status for access control
          if (user.status === 'inactive' || user.status === 'blocked') {
            return done(null, false, { message: "Conta inativa. Entre em contato com a administração." });
          }
          
          // Allow pending users to login, but they'll be redirected to awaiting approval page
          if (user.status === 'pending') {
            user.isPending = true; // Flag to handle in frontend
          }
          
          // For students with pending status, allow login but flag for redirection
          if (user.role === 'student' && user.status === 'pending') {
            const student = await storage.getStudentByUserId(user.id);
            if (student) {
              const studentPayments = await storage.getStudentPaymentsByStudent(student.id);
              if (studentPayments.length === 0) {
                // Allow login but set status as pending for frontend handling
                user.isPending = true;
              }
            }
          }


          
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Register authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Generate username from email if not provided
      if (!req.body.username) {
        req.body.username = req.body.email.split('@')[0].toLowerCase();
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already in use" });
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);

      // Preparar os dados do usuário - SECURITY: Force all registrations to be students
      const userData = {
        ...req.body,
        role: "student", // Force all public registrations to be students
        password: hashedPassword,
        active: false, // All public registrations require approval
        status: "pending", // All public registrations are pending approval
      };
      
      // Tratar o campo birthDate: converter de string para data, se existir
      if (userData.birthDate) {
        try {
          userData.birthDate = new Date(userData.birthDate);
        } catch (e) {
          userData.birthDate = null; // Se a conversão falhar, definir como null
        }
      }
      
      // Criar o usuário
      const user = await storage.createUser(userData);

      // For student role, also create a student record
      if (user.role === "student") {
        await storage.createStudent({
          userId: user.id,
          beltLevel: req.body.beltLevel || "white",
          stripes: req.body.stripes || 0,
          lastPromotionDate: new Date(),
          attendanceRate: 0,
          notes: "New student registration"
        });
      }

      // Create activity log for new registration
      await storage.createActivityLog({
        activity: `New user registered: ${user.firstName} ${user.lastName} (${user.role})`,
        userId: user.id,
        entityType: "user",
        entityId: user.id,
        timestamp: new Date()
      });

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ 
        user: userWithoutPassword,
        message: "Registration successful. Your account is pending approval."
      });
    } catch (err) {
      next(err);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    console.log('📧 Login attempt for:', req.body.email);
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error('🔥 Authentication error:', err);
        return next(err);
      }
      
      if (!user) {
        console.log('❌ Authentication failed:', info?.message || "No user found");
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      
      console.log('✅ User authenticated:', user.email);
      
      req.login(user, async (err: any) => {
        if (err) {
          console.error('🔥 Session creation error:', err);
          return next(err);
        }
        
        try {
          // Create activity log for login
          await storage.createActivityLog({
            activity: `User logged in: ${user.firstName} ${user.lastName}`,
            userId: user.id,
            entityType: "user",
            entityId: user.id,
            timestamp: new Date()
          });
          
          console.log('📝 Activity log created for login');
          
          // Update login streak
          try {
            await storage.updateLoginStreak(user.id);
            console.log('🔥 Login streak updated for user:', user.id);
          } catch (streakError) {
            console.error('⚠️ Failed to update login streak:', streakError);
            // Don't fail the login for streak tracking failures
          }
        } catch (logError) {
          console.error('⚠️ Failed to create activity log:', logError);
          // Don't fail the login for activity log failures
        }
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        console.log('🎉 Login successful for:', user.email);
        return res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    if (req.user) {
      const userId = req.user.id;
      const userName = `${req.user.firstName} ${req.user.lastName}`;
      
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        
        // Create activity log for logout
        storage.createActivityLog({
          activity: `User logged out: ${userName}`,
          userId: userId,
          entityType: "user",
          entityId: userId,
          timestamp: new Date()
        });
        
        req.session.destroy((err) => {
          if (err) {
            return res.status(500).json({ message: "Session destruction failed" });
          }
          res.json({ message: "Logged out successfully" });
        });
      });
    } else {
      res.json({ message: "No user to log out" });
    }
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const { password, ...userWithoutPassword } = req.user;
      return res.json({ user: userWithoutPassword });
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  // Activate user (admin/instructor only)
  app.patch("/api/users/:id/activate", isInstructor, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, { active: true });
      
      // Create activity log for account activation
      await storage.createActivityLog({
        activity: `User account activated: ${user.firstName} ${user.lastName}`,
        userId: req.user?.id, // Admin/instructor who performed the action
        entityType: "user",
        entityId: userId,
        timestamp: new Date()
      });
      
      res.json({ 
        user: updatedUser,
        message: "User account activated successfully"
      });
    } catch (err) {
      next(err);
    }
  });
  
  // Initialize default admin user if it doesn't exist
  initializeDefaultAdmin();
}

// Function to create default admin user
export async function initializeDefaultAdmin() {
  try {
    // Test database connection first
    if (storage.testDatabaseConnection) {
      const connectionTest = await storage.testDatabaseConnection();
      if (!connectionTest) {
        throw new Error("Failed to connect to database");
      }
    }

    // Create admin user
    const existingAdmin = await storage.getUserByEmail("adm@senseisystem.com.br");
    const existingAdminUsername = await storage.getUserByUsername("admin");
    
    if (!existingAdmin && !existingAdminUsername) {
      const hashedPassword = await hashPassword("12345678");
      
      await storage.createUser({
        firstName: "Administrador",
        lastName: "Sistema",
        username: "admin",
        email: "adm@senseisystem.com.br",
        password: hashedPassword,
        role: "admin",
        active: true,
        status: "active",
        phone: null,
        emergencyContact: null,
        joinDate: new Date(),
      });
      
      console.log("Admin user created: admin (adm@senseisystem.com.br)");
    }

    // Create HUIOS BJJ admin user
    const existingHuiosAdmin = await storage.getUserByEmail("huiosbjj@senseisystem.com.br");
    const existingHuiosUsername = await storage.getUserByUsername("huiosbjj");
    
    if (!existingHuiosAdmin && !existingHuiosUsername) {
      const hashedPassword = await hashPassword("Huios2026@BJJ");
      
      await storage.createUser({
        firstName: "HUIOS",
        lastName: "BJJ Admin",
        username: "huiosbjj",
        email: "huiosbjj@senseisystem.com.br",
        password: hashedPassword,
        role: "admin",
        active: true,
        status: "active",
        phone: null,
        emergencyContact: null,
        joinDate: new Date(),
      });
      
      console.log("HUIOS BJJ admin user created: huiosbjj (huiosbjj@senseisystem.com.br)");
    }

    // Create student user
    const existingStudent = await storage.getUserByEmail("aluno@senseisystem.com.br");
    const existingStudentUsername = await storage.getUserByUsername("aluno");
    
    if (!existingStudent && !existingStudentUsername) {
      const hashedPassword = await hashPassword("12345678");
      
      const studentUser = await storage.createUser({
        firstName: "Aluno",
        lastName: "Teste",
        username: "aluno",
        email: "aluno@senseisystem.com.br",
        password: hashedPassword,
        role: "student",
        active: true,
        phone: null,
        emergencyContact: null,
        joinDate: new Date(),
      });

      // Create student profile
      const student = await storage.createStudent({
        userId: studentUser.id,
        beltLevel: "white",
        stripes: 0,
        lastPromotionDate: new Date(),
        attendanceRate: 0,
        notes: "Usuário de teste criado automaticamente"
      });

      // Create a default payment plan if none exists
      try {
        const existingPlans = await storage.getPaymentPlans();
        let defaultPlan = existingPlans.find(p => p.name === "Plano Básico");
        
        if (!defaultPlan) {
          defaultPlan = await storage.createPaymentPlan({
            name: "Plano Básico",
            description: "Plano básico para usuários de teste",
            amount: 10000, // em centavos
            durationDays: 30,
            active: true
          });
        }

        // Create student payment record
        await storage.createStudentPayment({
          studentId: student.id,
          planId: defaultPlan.id,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: "paid",
          amount: defaultPlan.amount,
          notes: "Plano de teste criado automaticamente"
        });
        
        console.log("Default payment plan assigned to student user");
      } catch (planError) {
        console.error("Failed to create payment plan for student:", planError);
      }
      
      console.log("Student user created: aluno (aluno@senseisystem.com.br)");
    }
  } catch (err) {
    console.error("Error creating default users:", err);
  }
}